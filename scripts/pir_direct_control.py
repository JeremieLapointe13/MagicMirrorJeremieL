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
    """Contrôle l'écran directement via des commandes shell"""
    try:
        if turn_on:
            # Essayer plusieurs méthodes pour allumer l'écran
            methods = [
                "vcgencmd display_power 1",
                "DISPLAY=:0 xset dpms force on",
                "echo 0 | sudo tee /sys/class/backlight/*/bl_power"
            ]
            for cmd in methods:
                try:
                    subprocess.run(cmd, shell=True, check=False)
                except:
                    pass
            print("Écran allumé")
        else:
            # Essayer plusieurs méthodes pour éteindre l'écran
            methods = [
                "vcgencmd display_power 0",
                "DISPLAY=:0 xset dpms force off",
                "echo 1 | sudo tee /sys/class/backlight/*/bl_power"
            ]
            for cmd in methods:
                try:
                    subprocess.run(cmd, shell=True, check=False)
                except:
                    pass
            print("Écran éteint")
        return True
    except Exception as e:
        print(f"Erreur lors du contrôle de l'écran: {e}")
        return False

def main():
    global SCREEN_ON
    print("Script de contrôle PIR direct démarré")
    
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
