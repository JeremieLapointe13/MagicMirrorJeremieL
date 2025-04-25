#!/usr/bin/env python3
import RPi.GPIO as GPIO
import time
import requests
import json

# Configuration
PIR_PIN = 4
DELAY = 30  # secondes
MIRROR_URL = "http://localhost:8080/api"
SCREEN_ON = True

# Configuration GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIR_PIN, GPIO.IN)

def control_monitor(turn_on):
    """Contrôle l'écran via l'API MMM-Remote-Control"""
    try:
        if turn_on:
            requests.get(f"{MIRROR_URL}/monitoron")
            print("Écran allumé via API")
        else:
            requests.get(f"{MIRROR_URL}/monitoroff")
            print("Écran éteint via API")
        return True
    except Exception as e:
        print(f"Erreur lors du contrôle de l'écran: {e}")
        return False

def main():
    global SCREEN_ON
    print("Script de contrôle PIR avec MMM-Remote-Control démarré")
    
    try:
        last_motion = time.time()
        
        while True:
            # Vérifier le mouvement
            if GPIO.input(PIR_PIN):
                print("Mouvement détecté")
                last_motion = time.time()
                
                if not SCREEN_ON:
                    success = control_monitor(True)
                    if success:
                        SCREEN_ON = True
            
            # Vérifier le délai d'inactivité
            current_time = time.time()
            elapsed = current_time - last_motion
            
            if SCREEN_ON and elapsed > DELAY:
                print(f"Aucun mouvement depuis {DELAY} secondes.")
                success = control_monitor(False)
                if success:
                    SCREEN_ON = False
            
            # Attendre un peu pour économiser le CPU
            time.sleep(1)
    
    except KeyboardInterrupt:
        print("Programme arrêté")
    finally:
        GPIO.cleanup()
        # S'assurer que l'écran est allumé à la sortie
        control_monitor(True)

if __name__ == "__main__":
    main()
