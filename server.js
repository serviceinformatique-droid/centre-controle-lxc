const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SÉCURITÉ & PERFORMANCE : 0% CACHE BROWSER & COMPATIBLE IFRAME (Aucun blocage)
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', "frame-ancestors * 'self'");
    next();
});

app.use(express.static(path.join(__dirname, 'public'), { etag: false, maxAge: 0 }));

const getContainers = () => {
    try {
        const raw = fs.readFileSync('/opt/centre-controle/config/containers.json');
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
};

// API: Liste des conteneurs
app.get('/api/containers', (req, res) => {
    res.json(getContainers());
});

// API: Santé du conteneur (Disque, RAM, CPU, Mises à jour Debian)
app.get('/api/health/:ip', (req, res) => {
    const ip = req.params.ip;
    const cmd = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 root@${ip} "
        DISK=\\$(df -h / | awk 'NR==2 {print \\$5, \\$4, \\$2}');
        MEM=\\$(free -m | awk 'NR==2 {printf \\\"%.0f %d %d\\\", (\\$3/\\$2)*100, (\\$2-\\$3), \\$2}');
        LOAD=\\$(cat /proc/loadavg | awk '{print \\$1}');
        CORES=\\$(nproc);
        UPTIME=\\$(uptime -p | sed 's/up //');
        UPDATES=\\$(apt-get -s upgrade 2>/dev/null | grep -P '^\\\\d+ upgraded' | cut -d' ' -f1 || echo '0');
        MAINT=\\$([ -f /var/www/html/.maintenance_active ] && echo '1' || echo '0');
        echo \\\"\\$DISK|\\$MEM|\\$LOAD|\\$CORES|\\$UPTIME|\\$UPDATES|\\$MAINT\\\"
    " 2>/dev/null`;

    exec(cmd, (error, stdout) => {
        if (error || !stdout.trim()) {
            return res.json({
                online: false,
                disk: { percent: '0%', free: '0 Go', total: '0 Go' },
                memory: { percent: '0%', free: '0 Mo', total: '0 Mo' },
                cpu: { load: '0.00', cores: '1' },
                uptime: 'Inaccessible',
                updates: 0,
                maintenance: false
            });
        }

        const parts = stdout.trim().split('|');
        const diskParts = (parts[0] || '0% 0G 0G').split(' ');
        const memParts = (parts[1] || '0 0 0').split(' ');

        res.json({
            online: true,
            disk: { percent: diskParts[0], free: diskParts[1], total: diskParts[2] },
            memory: { percent: memParts[0] + '%', free: memParts[1] + ' Mo', total: memParts[2] + ' Mo' },
            cpu: { load: parts[2] || '0.00', cores: parts[3] || '1' },
            uptime: parts[4] || 'N/A',
            updates: parseInt(parts[5] || '0', 10),
            maintenance: parts[6] === '1'
        });
    });
});

// API: Action Maintenance
app.post('/api/maintenance', (req, res) => {
    const { ip, action, message } = req.body;
    if (!ip || !action) return res.status(400).json({ error: 'Paramètres manquants' });

    const safeMsg = (message || "Mise à jour du serveur en cours, le site revient dans quelques minutes.").replace(/"/g, '\\"');
    exec(`/opt/centre-controle/scripts/maintenance_manager.sh "${ip}" "${action}" "${safeMsg}"`, (err, stdout) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, output: stdout });
    });
});

// API: Reboot / Relance conteneur ou site
app.post('/api/action', (req, res) => {
    const { ip, type } = req.body;
    let cmd = '';
    if (type === 'restart_web') {
        cmd = `ssh root@${ip} "systemctl restart nginx || systemctl restart apache2 || docker restart \\$(docker ps -q) 2>/dev/null || true"`;
    } else if (type === 'reboot') {
        cmd = `ssh root@${ip} "reboot"`;
    }

    exec(cmd, (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Centre de contrôle prêt sur http://0.0.0.0:${PORT}`);
});
