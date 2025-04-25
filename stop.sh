#!/bin/bash
# Arrêter MagicMirror
cd ~/MagicMirror
# Utiliser pkill pour arrêter le processus MagicMirror
pkill -f "electron.*js/electron.js"

# Arrêter le script PIR et LEDs
echo "Arrêt du script PIR et LEDs..."
if [ -f /tmp/pir_pid.txt ]; then
    PIR_LED_PID=$(cat /tmp/pir_pid.txt)
    sudo kill $PIR_LED_PID 2>/dev/null
    rm /tmp/pir_pid.txt 2>/dev/null
fi
sudo pkill -f "python3 scripts/pir_led_control.py" 2>/dev/null

# Arrêter le proxy RSS
echo "Arrêt du proxy RSS..."
if [ -f /tmp/rss_proxy_pid.txt ]; then
    RSS_PROXY_PID=$(cat /tmp/rss_proxy_pid.txt)
    kill $RSS_PROXY_PID 2>/dev/null
    rm /tmp/rss_proxy_pid.txt 2>/dev/null
fi
pkill -f "node rss-proxy.js" 2>/dev/null

echo "MagicMirror arrêté"
