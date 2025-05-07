#!/usr/bin/env python3
import RPi.GPIO as GPIO
import time
import json
import os
import board
import neopixel

# Configuration des broches
PIR_PIN = 4          # Capteur PIR sur GPIO4
BUTTON_PIN = 17      # Bouton sur GPIO17
PIXEL_PIN_1 = board.D18  # Première bande LEDs NeoPixel sur GPIO18
PIXEL_PIN_2 = board.D21  # Deuxième bande LEDs NeoPixel sur GPIO22
NUM_PIXELS = 16       # Nombre de LEDs par bande

# Configuration pour l'interface avec MagicMirror
DELAY = 10           # Délai avant mise en veille (secondes)
STATUS_FILE = "/tmp/pir_status.json"

# Configuration du GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIR_PIN, GPIO.IN)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# Configuration des LEDs NeoPixel
pixels_1 = neopixel.NeoPixel(
    PIXEL_PIN_1,
    NUM_PIXELS,
    brightness=0.5,  # Luminosité à 50%
    auto_write=False,  # Désactivé pour synchroniser les deux bandes
    pixel_order=neopixel.GRB
)

pixels_2 = neopixel.NeoPixel(
    PIXEL_PIN_2,
    NUM_PIXELS,
    brightness=0.5,  # Luminosité à 50%
    auto_write=False,  # Désactivé pour synchroniser les deux bandes
    pixel_order=neopixel.GRB
)

# Couleur par défaut (blanc)
DEFAULT_COLOR = (255, 255, 255)
# Délai pour les animations (en secondes)
ANIMATION_DELAY = 0.05

def animate_on():
    """Animation progressive d'allumage des LEDs."""
    for i in range(NUM_PIXELS):
        pixels_1[i] = DEFAULT_COLOR
        pixels_2[i] = DEFAULT_COLOR
        pixels_1.show()
        pixels_2.show()
        time.sleep(ANIMATION_DELAY)

def animate_off():
    """Animation progressive d'extinction des LEDs (en sens inverse)."""
    for i in range(NUM_PIXELS-1, -1, -1):
        pixels_1[i] = (0, 0, 0)
        pixels_2[i] = (0, 0, 0)
        pixels_1.show()
        pixels_2.show()
        time.sleep(ANIMATION_DELAY)

def turn_on_leds():
    """Allume toutes les LEDs avec animation."""
    animate_on()

def turn_off_leds():
    """Éteint toutes les LEDs avec animation."""
    animate_off()

def turn_on_leds_instant():
    """Allume toutes les LEDs instantanément sans animation."""
    pixels_1.fill(DEFAULT_COLOR)
    pixels_2.fill(DEFAULT_COLOR)
    pixels_1.show()
    pixels_2.show()

def turn_off_leds_instant():
    """Éteint toutes les LEDs instantanément sans animation."""
    pixels_1.fill((0, 0, 0))
    pixels_2.fill((0, 0, 0))
    pixels_1.show()
    pixels_2.show()

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
    print("Script de contrôle PIR et LEDs démarré")

    last_motion_time = time.time()
    motion_detected = False
    led_enabled = True  # État d'activation des LEDs par l'utilisateur
    last_button_press = 0
    debounce_time = 0.2  # 200 ms

    # Écrire le statut initial
    write_status(motion_detected, last_motion_time)

    # S'assurer que les LEDs sont éteintes au démarrage
    turn_off_leds_instant()

    try:
        while True:
            current_time = time.time()

            # Vérifier le bouton pour activer/désactiver les LEDs manuellement
            if GPIO.input(BUTTON_PIN) == GPIO.LOW:
                if current_time - last_button_press > debounce_time:
                    led_enabled = not led_enabled
                    print(f"LEDs {'activées' if led_enabled else 'désactivées'} manuellement")

                    # Si les LEDs sont désactivées, les éteindre immédiatement
                    if not led_enabled:
                        turn_off_leds()
                    # Si les LEDs sont activées et qu'il y a eu du mouvement récemment, les allumer
                    elif motion_detected:
                        turn_on_leds()

                    last_button_press = current_time

                    # Attendre que le bouton soit relâché
                    while GPIO.input(BUTTON_PIN) == GPIO.LOW:
                        time.sleep(0.01)

            # Vérifier le mouvement
            current_value = GPIO.input(PIR_PIN)

            if current_value == 1:
                # Mouvement détecté
                last_motion_time = current_time

                if not motion_detected:
                    print("Mouvement détecté")
                    motion_detected = True
                    write_status(motion_detected, last_motion_time)

                    # Allumer les LEDs si elles sont activées
                    if led_enabled:
                        turn_on_leds()

            # Vérifier si le délai d'inactivité est dépassé
            elapsed = current_time - last_motion_time

            if motion_detected and elapsed > DELAY:
                print(f"Aucun mouvement depuis {DELAY} secondes")
                motion_detected = False
                write_status(motion_detected, last_motion_time)

                # Éteindre les LEDs
                turn_off_leds()

            # Pause pour économiser le CPU
            time.sleep(0.05)

    except KeyboardInterrupt:
        print("Programme arrêté")
    finally:
        GPIO.cleanup()
        turn_off_leds_instant()
        print("GPIO nettoyé, LEDs éteintes")

if __name__ == "__main__":
    main()
