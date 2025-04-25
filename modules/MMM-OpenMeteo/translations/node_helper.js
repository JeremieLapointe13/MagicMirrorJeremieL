const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Module helper started: " + this.name);
    },
    
    socketNotificationReceived: function(notification, payload) {
        if (notification === "GET_OPENMETEO_DATA") {
            this.getWeatherData(payload);
        }
    },
    
    getWeatherData: function(config) {
        const self = this;
        const lat = config.latitude;
        const lon = config.longitude;
        
        // Construire l'URL pour l'API Open-Meteo
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset&timezone=auto&forecast_days=${config.forecastDays}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                self.sendSocketNotification("OPENMETEO_DATA", data);
            })
            .catch(error => {
                console.error("Error fetching Open-Meteo data:", error);
            });
    }
});
