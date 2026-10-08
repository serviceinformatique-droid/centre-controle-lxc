#!/usr/bin/env bash
# $1 = target (IP or hostname)
# $2 = action (enable|disable|status|update)
# $3 = message (optional)

TARGET=$1
ACTION=$2
MSG=${3:-"Mise à jour du serveur en cours, le site revient dans quelques minutes."}

SSH_CMD="ssh -o StrictHostKeyChecking=no -o ConnectTimeout=4 root@$TARGET"

case "$ACTION" in
  enable)
    echo "Activation de la maintenance sur $TARGET..."
    $SSH_CMD "cat << 'MAINT_HTML' > /var/www/html/maintenance.html
<!DOCTYPE html>
<html lang='fr'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <meta http-equiv='refresh' content='30'>
  <title>Maintenance en cours</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 500px; width: 90%; border: 1px solid #e2e8f0; }
    h1 { color: #d97706; font-size: 1.5rem; margin-bottom: 1rem; }
    p { line-height: 1.6; color: #475569; }
    .loader { margin: 1.5rem auto; border: 4px solid #f3f3f3; border-top: 4px solid #d97706; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class='card'>
    <div class='loader'></div>
    <h1>Maintenance du serveur</h1>
    <p>$MSG</p>
  </div>
</body>
</html>
MAINT_HTML
    mv /var/www/html/index.html /var/www/html/index.html.bak 2>/dev/null || true
    cp /var/www/html/maintenance.html /var/www/html/index.html
    touch /var/www/html/.maintenance_active
    "
    ;;

  disable)
    echo "Désactivation de la maintenance sur $TARGET..."
    $SSH_CMD "
    if [ -f /var/www/html/index.html.bak ]; then
      mv /var/www/html/index.html.bak /var/www/html/index.html
    fi
    rm -f /var/www/html/maintenance.html /var/www/html/.maintenance_active
    "
    ;;

  status)
    IS_MAINT=$($SSH_CMD "[ -f /var/www/html/.maintenance_active ] && echo 'active' || echo 'inactive'")
    echo "$IS_MAINT"
    ;;

  update)
    echo "Lancement de la mise à jour complète sur $TARGET..."
    $SSH_CMD "DEBIAN_FRONTEND=noninteractive apt-get update && DEBIAN_FRONTEND=noninteractive apt-get dist-upgrade -y && apt-get autoremove -y"
    ;;
esac
