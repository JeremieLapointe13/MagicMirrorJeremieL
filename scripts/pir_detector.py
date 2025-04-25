#!/usr/bin/env python3
import RPi.GPIO as GPIO
import time
import json
import os

# Configuration
PIR_PIN = 4
DELAY = 30  # secondes
STATUS_FILE = "/tmp/pir_status.json"

# Configuration GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIR_PIN, GPIO.IN)

def write_status(motion_detected, last_motion_time):
    """Écrire le statut dans un fichier pour que MagicMirror puisse le lire"""
    status = {
        "motion_detected": motion_detected,
        "last_motion_time": last_motion_time,
        "timestamp": time.time()
    }
    with open(STATUS_FILE, 'w') as f:
        json.dump(status, f)

def main():
    print("Script de détection PIR démarré")
    
    last_motion_time = time.time()
    motion_detected = False
    
    # Écrire le statut initial
    write_status(motion_detected, last_motion_time)
    
    try:
        while True:
            # Vérifier le mouvement
            current_value = GPIO.input(PIR_PIN)
            
            if current_value == 1:
                # Mouvement détecté
                print("Mouvement détecté")
                last_motion_time = time.time()
                if not motion_detected:
                    motion_detected = True
                    write_status(motion_detected, last_motion_time)
            
            # Vérifier si le délai d'inactivité est dépassé
            current_time = time.time()
            elapsed = current_time - last_motion_time
            
            if motion_detected and elapsed > DELAY:
                print(f"Aucun mouvement depuis {DELAY} secondes")
                motion_detected = False
                write_status(motion_detected, last_motion_time)
            
            # Pause pour économiser le CPU
            time.sleep(0.5)
    
    except KeyboardInterrupt:
        print("Programme arrêté")
    finally:
        GPIO.cleanup()
        print("GPIO nettoyé")

if __name__ == "__main__":
    main()
