#!/usr/bin/env bash
# Script de commit et push automatique vers GitHub
# Nom d'utilisateur : serviceinformatique-droid

REPO_URL=$1

if [ -z "$REPO_URL" ]; then
    echo "Usage: $0 <URL_DU_DEPOT_GITHUB_AVEC_TOKEN>"
    echo "Exemple: $0 https://ghp_TOKEN@github.com/serviceinformatique-droid/centre-controle-lxc.git"
    exit 1
fi

cd /opt/centre-controle
git config --global user.name "serviceinformatique-droid"
git config --global user.email "serviceinformatique-droid@users.noreply.github.com"

if [ ! -d .git ]; then
    git init
    git branch -M main
fi

# Copier également le readme dans le projet
cp /opt/readame/README.md ./README.md

git add .
git commit -m "Déploiement complet Centre de Contrôle LXC Proxmox Debian 12"
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git push -u origin main --force

echo "=== Projet poussé avec succès sur GitHub pour serviceinformatique-droid ! ==="
