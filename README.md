MagicMirror de la Rivière-du-Loup
Afficher l'image
MagicMirror de la Rivière-du-Loup est une installation personnalisée basée sur la plateforme MagicMirror² avec des fonctionnalités étendues pour le contrôle à distance via mobile et l'intégration de capteurs IoT. Ce projet combine un Raspberry Pi, des capteurs externes et une application mobile Android dédiée pour offrir une expérience de miroir intelligent complète.
Caractéristiques

Affichage d'informations essentielles : météo, calendrier, nouvelles locales de Radio-Canada et horloge
Détection de mouvement : capteur PIR pour l'activation automatique de l'écran
Contrôle à distance : application mobile Android dédiée
Éclairage ambiant : bandes LED NeoPixel intégrées
Surveillance de la température : monitoring de la température système
Communication IoT : communication via MQTT pour une intégration sans faille
Économie d'énergie : mise en veille automatique de l'écran

Composants matériels

Raspberry Pi 4
Écran LCD
Cadre de miroir avec miroir sans tain
Capteur PIR pour la détection de mouvement
Bandes LED NeoPixel pour l'éclairage ambiant
Bouton physique pour le contrôle manuel

Configuration logicielle

MagicMirror² : plateforme de base
MMM-OpenMeteo : module météo personnalisé
MMM-PIR-Simple : module pour la gestion du capteur de mouvement
MMM-MQTTPublisher : module pour la communication MQTT
Application mobile Android : contrôle à distance et monitoring

Modules personnalisés
MMM-MQTTPublisher
Ce module collecte les données du système Raspberry Pi et les publie sur un broker MQTT pour que l'application mobile puisse les recevoir en temps réel :

Température du système
État du capteur de mouvement
État de l'écran (allumé/éteint)

MMM-PIR-Simple
Gère l'activation et la désactivation automatique de l'écran en fonction de la détection de présence :

Allume l'écran quand une présence est détectée
Éteint l'écran après une période d'inactivité configurable
Communique avec le module MQTT pour partager son état

MMM-OpenMeteo
Affiche les prévisions météo spécifiquement configurées pour la région de Rivière-du-Loup avec une UI optimisée.
Application mobile
Une application Android native a été développée pour :

Consulter l'état du système
Contrôler l'allumage/extinction de l'écran
Régler la luminosité
Changer le mode d'affichage (automatique, toujours allumé, veille)
Surveiller la température du système
Visualiser la dernière utilisation

Afficher l'image
Installation et configuration
Prérequis

Raspberry Pi avec Raspberry Pi OS
MagicMirror² installé
Broker MQTT (configuration par défaut sur mirrormqtt.jeremielapointe.ca)
Connexion internet
Capteur PIR connecté aux GPIO du Raspberry Pi

Installation

Clonez ce dépôt dans votre dossier modules MagicMirror :
bashcd ~/MagicMirror/modules
git clone https://github.com/username/magicmirror-riviere-du-loup.git

Installez les dépendances nécessaires :
bashcd ~/MagicMirror
npm install mqtt python3-rpi.gpio

Configurez les scripts de démarrage automatique :
bashchmod +x ~/MagicMirror/start.sh
chmod +x ~/MagicMirror/stop.sh

Activez le script Python pour le contrôle du PIR et des LEDs :
bashsudo pip3 install rpi_ws281x adafruit-circuitpython-neopixel


Démarrage
Pour démarrer le système complet (MagicMirror + scripts PIR et RSS) :
bash~/MagicMirror/start.sh
Pour arrêter le système :
bash~/MagicMirror/stop.sh
Configuration MQTT
Le système utilise MQTT pour la communication entre le Raspberry Pi et l'application mobile :

Serveur MQTT : mirrormqtt.jeremielapointe.ca
Port : 8883 (SSL)
Topics :

serial/temperature : température du système
serial/etatpir : état du capteur de mouvement



Application mobile
L'application Android native est disponible dans le dossier android-app/.
Pour l'installer :

Activez l'installation d'applications depuis des sources inconnues
Téléchargez le fichier APK
Installez l'application
Connectez-vous avec vos identifiants

Personnalisation
Ce projet a été configuré spécifiquement pour Rivière-du-Loup, Québec, mais peut être adapté à d'autres localisations en modifiant les paramètres suivants dans le fichier config.js :
javascript// Coordonnées géographiques pour la météo
location: {
    lat: 47.8266,
    lng: -69.5348,
}
Dépannage

L'écran ne s'allume pas : Vérifiez les connexions du capteur PIR et le fichier de statut dans /tmp/pir_status.json
Pas de données MQTT : Vérifiez la connexion au broker et les identifiants dans la configuration
Application mobile ne se connecte pas : Assurez-vous que le serveur MQTT est accessible et que les identifiants sont corrects

Licence
Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.
Remerciements

L'équipe de MagicMirror² pour la plateforme de base
La communauté MagicMirror pour les modules et idées
Michael Teeuw pour le concept original
Tous les contributeurs qui ont rendu ce projet possible


Développé avec ❤️ à Rivière-du-Loup, Québec.