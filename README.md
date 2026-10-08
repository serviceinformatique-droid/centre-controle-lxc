# Documentation Technique Complète — Centre de Contrôle Multi-LXC Proxmox

## 1. Vue d'ensemble du Projet
Système d'orchestration, de supervision et de maintenance automatisée pour conteneurs LXC Debian 12 hébergés sur Proxmox VE. 
Ce projet permet de surveiller la santé des conteneurs, de basculer une page de maintenance en temps réel et de planifier les mises à jour Debian nocturnes sans interruption imprévue.

- **Compte GitHub :** `serviceinformatique-droid`
- **Serveur Supervision :** Conteneur LXC Debian 12 (`supervision`)
- **Port d'écoute web :** `3000`
- **Politique de cache :** 0 % de cache navigateur (en-têtes HTTP `no-store, no-cache, must-revalidate, max-age=0`).
- **Support Iframe :** 100 % débloqué via la directive CSP `frame-ancestors *`.
- **Compatibilité mobile :** 100 % responsive sans dépendance externe (CSS natif).

---

## 2. Cartographie des Conteneurs LXC Déployés

| CT ID | Nom du Conteneur | Adresse IP Réelle | Rôle applicatif | Répertoire Web |
|:---:|:---|:---:|:---|:---:|
| **105** | `portail-sante` | `192.168.96.23` | Portail Santé | `/var/www/html` |
| **108** | `Fiches-inscriptions-docuseal` | `192.168.96.58` | DocuSeal / Inscriptions | `/var/www/html` |
| **109** | `Gestion-inscriptions-profs` | `192.168.96.78` | Inscriptions Professeurs | `/var/www/html` |
| **111** | `fiche-sanitaire-claude` | `192.168.96.52` | Fiches Sanitaires | `/var/www/html` |
| **113** | `fiche-infirmerie-studio` | `192.168.96.106` | Infirmerie Studio | `/var/www/html` |

---

## 3. Clé SSH Utilisée pour la Supervision
- **Type :** `ED25519`
- **Clé publique :**
  ```text
  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPdWLxjVIzwqlpIS+/gfm311aDN9zCXA5HjPeVXmApQK root@supervision
