#!/usr/bin/env bash
TARGET="$1"
ACTION="$2"
MSG="${3:-Mise à jour du serveur en cours, le site revient dans quelques minutes.}"

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes -o ConnectTimeout=5"

if [ -z "$TARGET" ] || [ -z "$ACTION" ]; then
    echo "Usage: $0 <IP> <enable|disable|status|update> [MESSAGE]"
    exit 1
fi

case "$ACTION" in
  enable)
    echo "Préparation de la page de maintenance..."
    TMP_FILE="/tmp/maint_${TARGET}.html"
    sed "s|{{MESSAGE}}|$MSG|g" /opt/centre-controle/templates/maintenance.html > "$TMP_FILE"

    echo "Envoi vers $TARGET..."
    ssh $SSH_OPTS root@"$TARGET" "mkdir -p /var/www/html"
    scp $SSH_OPTS "$TMP_FILE" root@"$TARGET":/var/www/html/maintenance.html
    rm -f "$TMP_FILE"

    ssh $SSH_OPTS root@"$TARGET" '
      if [ -f /var/www/html/index.html ] && [ ! -f /var/www/html/index.html.bak ]; then
          mv /var/www/html/index.html /var/www/html/index.html.bak
      fi
      if [ -f /var/www/html/index.php ] && [ ! -f /var/www/html/index.php.bak ]; then
          mv /var/www/html/index.php /var/www/html/index.php.bak
      fi
      cp /var/www/html/maintenance.html /var/www/html/index.html
      touch /var/www/html/.maintenance_active
    '
    echo "Maintenance activée avec succès sur $TARGET"
    ;;

  disable)
    echo "Restauration du site normal sur $TARGET..."
    ssh $SSH_OPTS root@"$TARGET" '
      if [ -f /var/www/html/index.html.bak ]; then
          mv -f /var/www/html/index.html.bak /var/www/html/index.html
      elif [ -f /var/www/html/index.php.bak ]; then
          mv -f /var/www/html/index.php.bak /var/www/html/index.php
          rm -f /var/www/html/index.html
      fi
      rm -f /var/www/html/maintenance.html /var/www/html/.maintenance_active
    '
    echo "Maintenance désactivée avec succès sur $TARGET"
    ;;

  status)
    ssh $SSH_OPTS root@"$TARGET" '[ -f /var/www/html/.maintenance_active ] && echo "active" || echo "inactive"'
    ;;

  update)
    echo "Mise à jour Debian sur $TARGET..."
    ssh $SSH_OPTS root@"$TARGET" "DEBIAN_FRONTEND=noninteractive apt-get update && DEBIAN_FRONTEND=noninteractive apt-get dist-upgrade -y && apt-get autoremove -y"
    ;;
esac
