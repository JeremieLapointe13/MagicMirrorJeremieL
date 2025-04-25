#!/usr/bin/env python3
import RPi.GPIO as GPIO
import time
import os
import subprocess

# Configuration
PIR_PIN = 4
DELAY = 30  # secondes
SCREEN_ON = True

# Configuration GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIR_PIN, GPIO.IN)

def control_monitor(turn_on):
    """Contrôle l'écran avec xset (économiseur d'écran)"""
    try:
        if turn_on:
            os.system("DISPLAY=:0 xset s reset")  # Réinitialiser l'économiseur d'écran
            os.system("DISPLAY=:0 xset s off")   # Désactiver l'économiseur d'écran
            print("Écran allumé via xset")
        else:
            os.system("DISPLAY=:0 xset s activate")  # Activer l'économiseur d'écran immédiatement
            print("Écran éteint via xset")
        return True
    except Exception as e:
        print(f"Erreur lors du contrôle de l'écran: {e}")
        return False

def main():
    global SCREEN_ON
    print("Script de contrôle PIR avec xset démarré")
    
    # Configurer l'économiseur d'écran pour qu'il soit noir
    os.system("DISPLAY=:0 xset s blank")
    
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
