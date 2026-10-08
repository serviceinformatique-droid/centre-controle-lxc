let containers = [];
let currentContainer = null;

async function init() {
    try {
        const res = await fetch('/api/containers', { cache: 'no-store' });
        containers = await res.json();
        renderLxcButtons();
        if (containers.length > 0) {
            selectContainer(containers[0]);
        }
    } catch (e) {
        console.error("Erreur de chargement", e);
    }
}

function renderLxcButtons() {
    const box = document.getElementById('lxc-buttons');
    box.innerHTML = '';
    containers.forEach((c) => {
        const btn = document.createElement('button');
        btn.className = `lxc-btn ${currentContainer && currentContainer.id === c.id ? 'active' : ''}`;
        btn.innerText = `${c.id} - ${c.name}`;
        btn.onclick = () => selectContainer(c);
        box.appendChild(btn);
    });
}

function selectContainer(c) {
    currentContainer = c;
    document.getElementById('current-lxc-name').innerText = `${c.id} (${c.name})`;
    renderLxcButtons();
    loadHealthData();
}

async function loadHealthData() {
    if (!currentContainer) return;
    try {
        const res = await fetch(`/api/health/${currentContainer.ip}`, { cache: 'no-store' });
        const data = await res.json();

        // Maintenance status
        const maintBadge = document.getElementById('maint-status-badge');
        if (data.maintenance) {
            maintBadge.innerText = "site en maintenance";
            maintBadge.className = "badge-status orange";
        } else {
            maintBadge.innerText = "site ouvert";
            maintBadge.className = "badge-status green";
        }

        // Metrics
        document.getElementById('disk-info').innerText = `${data.disk.percent} utilisé — ${data.disk.free} libres sur ${data.disk.total}`;
        document.getElementById('disk-bar').style.width = data.disk.percent;

        document.getElementById('mem-info').innerText = `${data.memory.percent} utilisée — ${data.memory.free} libres sur ${data.memory.total}`;
        document.getElementById('mem-bar').style.width = data.memory.percent;

        document.getElementById('cpu-info').innerText = `charge ${data.cpu.load} pour ${data.cpu.cores} cœur(s)`;
        document.getElementById('uptime-info').innerText = data.uptime;

        document.getElementById('update-count-text').innerText = `Debian : ${data.updates} mise(s) à jour en attente.`;
    } catch (err) {
        console.error(err);
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

async function setMaintenance(type) {
    if (!currentContainer) return;
    const msg = document.getElementById('maint-message').value;
    await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: currentContainer.ip, action: 'enable', message: msg, type })
    });
    loadHealthData();
}

async function disableMaintenance() {
    if (!currentContainer) return;
    await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: currentContainer.ip, action: 'disable' })
    });
    loadHealthData();
}

async function runSystemUpdate() {
    if (!currentContainer) return;
    const logBox = document.getElementById('update-terminal');
    logBox.style.display = 'block';
    logBox.innerText = `[INFO] Lancement de la mise à jour complète sur ${currentContainer.name}...`;

    await setMaintenance('unlimited');
    
    const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: currentContainer.ip, action: 'update' })
    });
    const result = await res.json();
    logBox.innerText += "\n" + (result.output || "Mise à jour terminée avec succès.");

    await disableMaintenance();
    loadHealthData();
}

async function triggerAction(type) {
    if (!currentContainer) return;
    if (confirm("Confirmer l'opération ?")) {
        await fetch('/api/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: currentContainer.ip, type })
        });
        alert("Commande envoyée !");
        setTimeout(loadHealthData, 4000);
    }
}

// Auto-rafraîchissement toutes les 30 secondes
setInterval(loadHealthData, 30000);
window.onload = init;
