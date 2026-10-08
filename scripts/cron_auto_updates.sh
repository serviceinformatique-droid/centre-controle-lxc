#!/usr/bin/env bash
# Tâche planifiée automatique pour vérifier l'espace disque et les mises à jour Debian
LOG_FILE="/var/log/auto_lxc_updates.log"
CONFIG_FILE="/opt/centre-controle/config/containers.json"

echo "=== Début vérification maintenance [$(date)] ===" >> $LOG_FILE

CONTAINERS=$(jq -c '.[]' $CONFIG_FILE)

for row in $CONTAINERS; do
    NAME=$(echo $row | jq -r '.name')
    IP=$(echo $row | jq -r '.ip')
    
    echo "Contrôle de $NAME ($IP)..." >> $LOG_FILE
    
    # Vérification si SSH répond
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 root@$IP "exit" 2>/dev/null; then
        # 1. Vérification des mises à jour Debian en attente
        UPDATES=$(ssh root@$IP "apt-get update -qq && apt-get -s upgrade | grep -P '^\d+ upgraded' | cut -d' ' -f1")
        if [ "$UPDATES" != "" ] && [ "$UPDATES" -gt 0 ]; then
            echo "-> $UPDATES mise(s) à jour détectée(s) sur $NAME. Lancement procédure..." >> $LOG_FILE
            
            # Message de maintenance
            /opt/centre-controle/scripts/maintenance_manager.sh "$IP" enable "Mise à jour de sécurité automatique en cours. Retour imminent."
            
            # Mise à jour debian
            /opt/centre-controle/scripts/maintenance_manager.sh "$IP" update >> $LOG_FILE 2>&1
            
            # Fin de maintenance
            /opt/centre-controle/scripts/maintenance_manager.sh "$IP" disable
            echo "-> Mises à jour terminées avec succès sur $NAME." >> $LOG_FILE
        else
            echo "-> Système à jour sur $NAME." >> $LOG_FILE
        fi
    else
        echo "-> Impossible de joindre $NAME ($IP)." >> $LOG_FILE
    fi
done
echo "=== Fin vérification maintenance [$(date)] ===" >> $LOG_FILE
