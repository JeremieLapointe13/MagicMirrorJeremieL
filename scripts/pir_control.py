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

def turn_display(state):
    """Contrôle l'affichage HDMI"""
    if state:
        # Rediriger la sortie vers /dev/null pour éviter l'affichage
        subprocess.run(["vcgencmd", "display_power", "1"], stdout=subprocess.DEVNULL)
        print("Écran allumé")
    else:
        # Rediriger la sortie vers /dev/null pour éviter l'affichage
        subprocess.run(["vcgencmd", "display_power", "0"], stdout=subprocess.DEVNULL)
        print("Écran éteint")

def main():
    global SCREEN_ON
    print("Script de contrôle PIR démarré")
    
    try:
        last_motion = time.time()
        
        while True:
            # Vérifier le mouvement
            if GPIO.input(PIR_PIN):
                print("Mouvement détecté")
                last_motion = time.time()
                
                if not SCREEN_ON:
                    turn_display(True)
                    SCREEN_ON = True
            
            # Vérifier le délai d'inactivité
            current_time = time.time()
            elapsed = current_time - last_motion
            
            if SCREEN_ON and elapsed > DELAY:
                print(f"Aucun mouvement depuis {DELAY} secondes. Extinction de l'écran.")
                turn_display(False)
                SCREEN_ON = False
            
            # Attendre un peu pour économiser le CPU
            time.sleep(1)
    
    except KeyboardInterrupt:
        print("Programme arrêté")
    finally:
        GPIO.cleanup()
        turn_display(True)  # S'assurer que l'écran est allumé à la sortie

if __name__ == "__main__":
    main()
