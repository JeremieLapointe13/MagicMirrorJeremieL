#!/bin/bash

# Configuration
PIR_PIN=4      # GPIO4
DELAY=30       # Délai avant extinction (secondes)
SCREEN_ON=1    # État initial de l'écran (1=allumé)

# Fonction pour allumer l'écran
turn_on_screen() {
    if [ "$SCREEN_ON" -eq 0 ]; then
        echo "Écran allumé"
        vcgencmd display_power 1
        SCREEN_ON=1
    fi
}

# Fonction pour éteindre l'écran
turn_off_screen() {
    if [ "$SCREEN_ON" -eq 1 ]; then
        echo "Écran éteint"
        vcgencmd display_power 0
        SCREEN_ON=0
    fi
}

# Nettoyage à la sortie
cleanup() {
    echo "Nettoyage..."
    turn_on_screen
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Contrôle d'écran démarré"

# Utiliser le script Python pour la détection de mouvement
cat > ~/MagicMirror/scripts/pir_detector.py << 'PYEOF'
#!/usr/bin/env python3
import RPi.GPIO as GPIO
import time

PIR_PIN = 4  # GPIO4

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIR_PIN, GPIO.IN)

try:
    print("PIR ready")
    while True:
        if GPIO.input(PIR_PIN):
            print("MOTION")
        time.sleep(1)
except KeyboardInterrupt:
    print("Cleaning up")
    GPIO.cleanup()
PYEOF

chmod +x ~/MagicMirror/scripts/pir_detector.py

# Démarrer le détecteur de mouvement
python3 ~/MagicMirror/scripts/pir_detector.py | while read line; do
    if [ "$line" = "MOTION" ]; then
        echo "Mouvement détecté"
        turn_on_screen
        LAST_MOTION=$(date +%s)
    else
        # Vérifier si le délai d'inactivité est dépassé
        CURRENT_TIME=$(date +%s)
        if [ -n "$LAST_MOTION" ]; then
            ELAPSED=$((CURRENT_TIME - LAST_MOTION))
            if [ $ELAPSED -gt $DELAY ]; then
                turn_off_screen
            fi
        else
            # Initialiser LAST_MOTION si non défini
            LAST_MOTION=$(date +%s)
        fi
    fi
    sleep 1
done
