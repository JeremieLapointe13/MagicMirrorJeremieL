/* Magic Mirror
 * Module: MMM-PIR-Simple
 * Communique avec un script Python externe pour le contrôle PIR
 */

Module.register("MMM-PIR-Simple", {
    defaults: {
        checkInterval: 1, // en secondes
        powerSavingDelay: 30 // en secondes
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.screenOn = true;
        this.statusFile = "/tmp/pir_status.json";
        this.startCheckingPirStatus();
    },

    startCheckingPirStatus: function() {
        const self = this;
        this.checkTimer = setInterval(function() {
            self.readPirStatus();
        }, this.config.checkInterval * 1000);
    },

    readPirStatus: function() {
        const self = this;
        this.sendSocketNotification("READ_PIR_STATUS", this.statusFile);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "PIR_STATUS") {
            if (payload && payload.status) {
                const status = payload.status;
                this.processPirStatus(status);
            }
        }
    },

    processPirStatus: function(status) {
        // Si le statut indique mouvement détecté et l'écran est éteint
        if (status.motion_detected && !this.screenOn) {
            Log.info("Motion detected - turning screen on");
            this.screenOn = true;
            this.showScreen();
        }
        // Si le statut indique pas de mouvement et l'écran est allumé
        else if (!status.motion_detected && this.screenOn) {
            const elapsed = Math.floor(Date.now() / 1000 - status.last_motion_time);
            if (elapsed > this.config.powerSavingDelay) {
                Log.info("No motion detected for " + elapsed + " seconds - turning screen off");
                this.screenOn = false;
                this.hideScreen();
            }
        }
    },

    showScreen: function() {
        // Afficher tous les modules
        MM.getModules().exceptModule(this).enumerate(function(module) {
            module.show(1000, function() {}, {force: true});
        });
        
        // Supprimer l'overlay noir s'il existe
        var overlay = document.getElementById("pir-overlay");
        if (overlay) {
            document.body.removeChild(overlay);
        }
        
        // Informer les autres modules
        this.sendNotification("USER_PRESENCE", true);
    },

    hideScreen: function() {
        // Masquer tous les modules sauf celui-ci
        MM.getModules().exceptModule(this).enumerate(function(module) {
            module.hide(1000, function() {}, {force: true});
        });
        
        // Créer un overlay noir
        var overlay = document.createElement("div");
        overlay.id = "pir-overlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "black";
        overlay.style.zIndex = "9999";
        document.body.appendChild(overlay);
        
        // Informer les autres modules
        this.sendNotification("USER_PRESENCE", false);
    },

    getDom: function() {
        // Module invisible
        var wrapper = document.createElement("div");
        wrapper.style.display = "none";
        return wrapper;
    }
});
