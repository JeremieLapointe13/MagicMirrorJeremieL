Module.register("MMM-OpenMeteo", {
    defaults: {
        latitude: 47.8266,        // Latitude de Rivière-du-Loup
        longitude: -69.5348,      // Longitude de Rivière-du-Loup
        updateInterval: 30 * 60 * 1000, // 30 minutes
        showCurrent: true,
        showForecast: true,
        showWindInfo: true,
        forecastDays: 5,
        language: "fr"
    },

    getStyles: function() {
        return ["font-awesome.css", "MMM-OpenMeteo.css"];
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.weatherData = null;
        this.loaded = false;
        this.scheduleUpdate();
    },

    getDom: function() {
        var wrapper = document.createElement("div");
        
        if (!this.loaded) {
            wrapper.innerHTML = "Chargement de la météo...";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (!this.weatherData) {
            wrapper.innerHTML = "Aucune donnée météo disponible";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        var mainContainer = document.createElement("div");
        mainContainer.className = "weather-container";

        // Météo actuelle
        if (this.config.showCurrent && this.weatherData.current) {
            var currentWeather = document.createElement("div");
            currentWeather.className = "current-weather";

            // Température actuelle
            var tempDiv = document.createElement("div");
            tempDiv.className = "temperature large light";
            tempDiv.innerHTML = Math.round(this.weatherData.current.temperature_2m) + "°C";
            currentWeather.appendChild(tempDiv);

            // Description météo
            var weatherCode = this.weatherData.current.weather_code;
            var descDiv = document.createElement("div");
            descDiv.className = "description small bright";
            descDiv.innerHTML = this.getWeatherDescription(weatherCode);
            currentWeather.appendChild(descDiv);

            // Informations supplémentaires
            var detailsDiv = document.createElement("div");
            detailsDiv.className = "details-container small";

            // Température ressentie
            if (this.weatherData.current.apparent_temperature !== undefined) {
                var feelsLikeDiv = document.createElement("div");
                feelsLikeDiv.className = "details-row";
                feelsLikeDiv.innerHTML = "Ressenti: " + Math.round(this.weatherData.current.apparent_temperature) + "°C";
                detailsDiv.appendChild(feelsLikeDiv);
            }

            // Humidité
            if (this.weatherData.current.relative_humidity_2m !== undefined) {
                var humidityDiv = document.createElement("div");
                humidityDiv.className = "details-row";
                humidityDiv.innerHTML = "Humidité: " + this.weatherData.current.relative_humidity_2m + "%";
                detailsDiv.appendChild(humidityDiv);
            }

            // Vent
            if (this.config.showWindInfo && this.weatherData.current.wind_speed_10m !== undefined) {
                var windDiv = document.createElement("div");
                windDiv.className = "details-row";
                var windDirection = this.getWindDirection(this.weatherData.current.wind_direction_10m);
                windDiv.innerHTML = "Vent: " + Math.round(this.weatherData.current.wind_speed_10m) + " km/h " + windDirection;
                detailsDiv.appendChild(windDiv);
            }

            currentWeather.appendChild(detailsDiv);
            mainContainer.appendChild(currentWeather);
        }

        // Prévisions
        if (this.config.showForecast && this.weatherData.daily) {
            var forecastContainer = document.createElement("div");
            forecastContainer.className = "forecast-container";

            var forecastTable = document.createElement("table");
            forecastTable.className = "forecast-table";

            // En-têtes (jours)
            var headerRow = document.createElement("tr");
            for (var i = 0; i < this.config.forecastDays; i++) {
                if (this.weatherData.daily.time[i]) {
                    var dayCell = document.createElement("td");
                    dayCell.className = "day";
                    var date = new Date(this.weatherData.daily.time[i]);
                    dayCell.innerHTML = this.getDayName(date.getDay());
                    headerRow.appendChild(dayCell);
                }
            }
            forecastTable.appendChild(headerRow);

            // Températures max
            var maxRow = document.createElement("tr");
            for (var i = 0; i < this.config.forecastDays; i++) {
                if (this.weatherData.daily.temperature_2m_max[i] !== undefined) {
                    var maxCell = document.createElement("td");
                    maxCell.className = "bright max-temp";
                    maxCell.innerHTML = Math.round(this.weatherData.daily.temperature_2m_max[i]) + "°";
                    maxRow.appendChild(maxCell);
                }
            }
            forecastTable.appendChild(maxRow);

            // Températures min
            var minRow = document.createElement("tr");
            for (var i = 0; i < this.config.forecastDays; i++) {
                if (this.weatherData.daily.temperature_2m_min[i] !== undefined) {
                    var minCell = document.createElement("td");
                    minCell.className = "min-temp";
                    minCell.innerHTML = Math.round(this.weatherData.daily.temperature_2m_min[i]) + "°";
                    minRow.appendChild(minCell);
                }
            }
            forecastTable.appendChild(minRow);

            // Précipitations
            var precipRow = document.createElement("tr");
            for (var i = 0; i < this.config.forecastDays; i++) {
                if (this.weatherData.daily.precipitation_sum[i] !== undefined) {
                    var precipCell = document.createElement("td");
                    precipCell.className = "precip";
                    precipCell.innerHTML = this.weatherData.daily.precipitation_sum[i] > 0 ? 
                        this.weatherData.daily.precipitation_sum[i] + " mm" : "";
                    precipRow.appendChild(precipCell);
                }
            }
            forecastTable.appendChild(precipRow);

            forecastContainer.appendChild(forecastTable);
            mainContainer.appendChild(forecastContainer);
        }

        wrapper.appendChild(mainContainer);
        return wrapper;
    },

    scheduleUpdate: function() {
        var self = this;
        setInterval(function() {
            self.getWeatherData();
        }, this.config.updateInterval);
        self.getWeatherData();
    },

    getWeatherData: function() {
        var self = this;
        var url = "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + this.config.latitude +
            "&longitude=" + this.config.longitude +
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m" +
            "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset" +
            "&timezone=auto" +
            "&forecast_days=" + this.config.forecastDays;

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    self.processWeatherData(JSON.parse(this.response));
                } else {
                    Log.error(self.name + ": Could not load weather data.");
                }
            }
        };
        xhr.send();
    },

    processWeatherData: function(data) {
        this.weatherData = data;
        this.loaded = true;
        this.updateDom();
    },

    getWeatherDescription: function(code) {
        const descriptions = {
            0: "Ciel dégagé",
            1: "Majoritairement dégagé",
            2: "Partiellement nuageux",
            3: "Couvert",
            45: "Brouillard",
            48: "Brouillard givrant",
            51: "Bruine légère",
            53: "Bruine modérée",
            55: "Bruine dense",
            56: "Bruine verglaçante légère",
            57: "Bruine verglaçante dense",
            61: "Pluie légère",
            63: "Pluie modérée",
            65: "Pluie forte",
            66: "Pluie verglaçante légère",
            67: "Pluie verglaçante forte",
            71: "Neige légère",
            73: "Neige modérée",
            75: "Neige abondante",
            77: "Neige en grains",
            80: "Averses de pluie légères",
            81: "Averses de pluie modérées",
            82: "Averses de pluie violentes",
            85: "Averses de neige légères",
            86: "Averses de neige abondantes",
            95: "Orage",
            96: "Orage avec grêle légère",
            99: "Orage avec grêle forte"
        };
        
        return descriptions[code] || "Météo inconnue";
    },

    getWindDirection: function(degrees) {
        if (degrees === undefined) return "";
        
        const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    },

    getDayName: function(day) {
        const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        return days[day];
    }
});
