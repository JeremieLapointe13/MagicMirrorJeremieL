#!/bin/bash
# Démarrer le script Python de contrôle PIR et LEDs en arrière-plan
cd ~/MagicMirror
sudo python3 scripts/pir_led_control.py &
PIR_LED_PID=$!
# Enregistrer le PID pour pouvoir l'arrêter plus tard
echo $PIR_LED_PID > /tmp/pir_pid.txt

# Démarrer le proxy RSS en arrière-plan
echo "Démarrage du proxy RSS..."
node rss-proxy.js > logs/rss-proxy.log 2>&1 &
RSS_PROXY_PID=$!
# Enregistrer le PID pour pouvoir l'arrêter plus tard
echo $RSS_PROXY_PID > /tmp/rss_proxy_pid.txt

# Fonction pour nettoyer à la sortie
cleanup() {
    echo "Arrêt du script PIR et LEDs..."
    if [ -f /tmp/pir_pid.txt ]; then
        PIR_LED_PID=$(cat /tmp/pir_pid.txt)
        sudo kill $PIR_LED_PID 2>/dev/null
        sudo pkill -f "python3 scripts/pir_led_control.py" 2>/dev/null
        rm /tmp/pir_pid.txt
    fi
    
    echo "Arrêt du proxy RSS..."
    if [ -f /tmp/rss_proxy_pid.txt ]; then
        RSS_PROXY_PID=$(cat /tmp/rss_proxy_pid.txt)
        kill $RSS_PROXY_PID 2>/dev/null
        pkill -f "node rss-proxy.js" 2>/dev/null
        rm /tmp/rss_proxy_pid.txt
    fi
    
    exit 0
}

# Intercepter CTRL+C et autres signaux de sortie
trap cleanup SIGINT SIGTERM EXIT

# Démarrer MagicMirror
npm start

# Cette partie sera exécutée après la sortie de MagicMirror
cleanup
