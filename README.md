# Centre de Contrôle Multi-LXC Proxmox (Debian 12)

## Description
Système de gestion, supervision et orchestration de la maintenance pour conteneurs LXC Proxmox Debian 12.

- **Utilisateur GitHub :** `serviceinformatique-droid`
- **Serveur de supervision :** LXC Debian 12 (IP : `192.168.96.136`, port `3000`)
- **Politique de cache :** 0 % (en-têtes HTTP `no-store, no-cache, must-revalidate, max-age=0`)
- **Support Iframe :** 100 % opérationnel (`Content-Security-Policy: frame-ancestors *`)

## Conteneurs Gérés
| ID | Nom | Adresse IP |
|---|---|---|
| 105 | portail-sante | 192.168.96.23 |
| 108 | Fiches-inscriptions-docuseal | 192.168.96.58 |
| 109 | Gestion-inscriptions-profs | 192.168.96.78 |
| 111 | fiche-sanitaire-claude | 192.168.96.52 |
| 113 | fiche-infirmerie-studio | 192.168.96.106 |

## Fonctionnalités
1. **Santé en direct :** Espace disque, RAM, charge processeur, uptime et mises à jour Debian en attente.
2. **Maintenance instantanée :** Bascule automatique vers une page stylisée `maintenance.html` sans couper les fichiers d'origine.
3. **Mises à jour système :** Lancement des mises à jour Debian `apt-get dist-upgrade` avec activation et désactivation automatique de la page de maintenance.
4. **Tâche nocturne Cron :** Audit et mise à jour quotidienne à 03h00 du matin.
