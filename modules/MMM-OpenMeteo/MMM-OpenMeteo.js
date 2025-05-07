Module.register("MMM-OpenMeteo", {
    defaults: {
        latitude: 47.8266,        // Latitude de Rivière-du-Loup
        longitude: -69.5348,      // Longitude de Rivière-du-Loup
        updateInterval: 30 * 60 * 1000, // 30 minutes
        showCurrent: true,
        showForecast: true,
        showWindInfo: false,      // Désactivé
        showSunTimes: false,      // Désactivé
        showUVIndex: false,       // Désactivé
        showPrecipitation: false, // Désactivé
        forecastDays: 4,          // 4 jours au total (aujourd'hui + 3)
        language: "fr",
        units: "metric",
        colored: true,
        animateIcons: true
    },

    getStyles: function() {
        return ["font-awesome.css", "weather-icons.css", "MMM-OpenMeteo.css"];
    },

    getTranslations: function() {
        return {
            en: "translations/en.json",
            fr: "translations/fr.json"
        };
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.weatherData = null;
        this.loaded = false;
        this.scheduleUpdate();
    },

    getDom: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "MMM-OpenMeteo";

        if (!this.loaded) {
            wrapper.innerHTML = this.translate("LOADING");
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

        // Météo actuelle - version ultra-minimaliste
        if (this.config.showCurrent && this.weatherData.current) {
            var currentWeather = document.createElement("div");
            currentWeather.className = "current-weather fade-in";

            // Bloc principal: icône et température côte à côte
            var weatherCode = this.weatherData.current.weather_code;
            var iconClass = this.getWeatherIconClass(weatherCode, this.isDayTime());
            
            var mainWeatherInfo = document.createElement("div");
            mainWeatherInfo.className = "main-weather-info";
            
            // Icône météo
            var iconDiv = document.createElement("span");
            iconDiv.className = "current-icon bright";
            iconDiv.innerHTML = '<i class="' + iconClass + '"></i>';
            mainWeatherInfo.appendChild(iconDiv);

            // Température actuelle
            var tempDiv = document.createElement("span");
            tempDiv.className = "temperature bright";
            tempDiv.innerHTML = Math.round(this.weatherData.current.temperature_2m) + "°";
            mainWeatherInfo.appendChild(tempDiv);
            
            currentWeather.appendChild(mainWeatherInfo);

            // Description météo
            var descDiv = document.createElement("div");
            descDiv.className = "description normal";
            descDiv.innerHTML = this.getWeatherDescription(weatherCode);
            currentWeather.appendChild(descDiv);

            // Température ressentie
            if (this.weatherData.current.apparent_temperature !== undefined) {
                var feelsLikeDiv = document.createElement("div");
                feelsLikeDiv.className = "feels-like";
                feelsLikeDiv.innerHTML = "Ressenti: " +
                    Math.round(this.weatherData.current.apparent_temperature) + "°";
                currentWeather.appendChild(feelsLikeDiv);
            }

            mainContainer.appendChild(currentWeather);
        }

        // Prévisions - 4 jours (aujourd'hui + 3 autres)
        if (this.config.showForecast && this.weatherData.daily) {
            var forecastContainer = document.createElement("div");
            forecastContainer.className = "forecast-container fade-in";

            var forecastTable = document.createElement("table");
            forecastTable.className = "forecast-table";

            // Nous voulons 4 jours au total (aujourd'hui + 3 autres jours)
            var daysToShow = 4;

            // En-têtes (jours)
            var headerRow = document.createElement("tr");
            for (var i = 0; i < daysToShow; i++) {
                if (this.weatherData.daily.time[i]) {
                    var dayCell = document.createElement("td");
                    dayCell.className = "day";
                    var date = new Date(this.weatherData.daily.time[i]);
                    // Pour aujourd'hui, afficher "AUJ" au lieu du jour
                    var dayName = (i === 0) ? "AUJ" : this.getDayName(date.getDay());
                    dayCell.innerHTML = dayName;
                    headerRow.appendChild(dayCell);
                }
            }
            forecastTable.appendChild(headerRow);

            // Icônes météo
            var iconRow = document.createElement("tr");
            for (var i = 0; i < daysToShow; i++) {
                if (this.weatherData.daily.weather_code && this.weatherData.daily.weather_code[i] !== undefined) {
                    var iconCell = document.createElement("td");
                    iconCell.className = "forecast-icon";
                    var weatherCode = this.weatherData.daily.weather_code[i];
                    var iconClass = this.getWeatherIconClass(weatherCode, true);
                    iconCell.innerHTML = '<i class="' + iconClass + '"></i>';
                    iconRow.appendChild(iconCell);
                }
            }
            forecastTable.appendChild(iconRow);

            // Températures max/min
            var tempRow = document.createElement("tr");
            for (var i = 0; i < daysToShow; i++) {
                if (this.weatherData.daily.temperature_2m_max[i] !== undefined) {
                    var tempCell = document.createElement("td");
                    var maxTemp = Math.round(this.weatherData.daily.temperature_2m_max[i]);
                    var minTemp = Math.round(this.weatherData.daily.temperature_2m_min[i]);
                    tempCell.innerHTML = 
                        '<span class="max-temp">' + maxTemp + '°</span>' +
                        '<span class="temp-separator">/</span>' +
                        '<span class="min-temp">' + minTemp + '°</span>';
                    tempRow.appendChild(tempCell);
                }
            }
            forecastTable.appendChild(tempRow);

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

    getWeatherIconClass: function(code, isDay) {
        // Mappages des codes météo WMO aux classes d'icônes weather-icons
        const iconMappings = {
            0: isDay ? "wi wi-day-sunny" : "wi wi-night-clear",
            1: isDay ? "wi wi-day-sunny-overcast" : "wi wi-night-alt-partly-cloudy",
            2: isDay ? "wi wi-day-cloudy" : "wi wi-night-alt-cloudy",
            3: "wi wi-cloudy",
            45: "wi wi-fog",
            48: "wi wi-fog",
            51: isDay ? "wi wi-day-sprinkle" : "wi wi-night-alt-sprinkle",
            53: isDay ? "wi wi-day-sprinkle" : "wi wi-night-alt-sprinkle",
            55: isDay ? "wi wi-day-rain" : "wi wi-night-alt-rain",
            56: isDay ? "wi wi-day-sleet" : "wi wi-night-alt-sleet",
            57: isDay ? "wi wi-day-sleet" : "wi wi-night-alt-sleet",
            61: isDay ? "wi wi-day-rain" : "wi wi-night-alt-rain",
            63: isDay ? "wi wi-day-rain" : "wi wi-night-alt-rain",
            65: isDay ? "wi wi-day-rain" : "wi wi-night-alt-rain",
            66: isDay ? "wi wi-day-sleet" : "wi wi-night-alt-sleet",
            67: isDay ? "wi wi-day-sleet" : "wi wi-night-alt-sleet",
            71: isDay ? "wi wi-day-snow" : "wi wi-night-alt-snow",
            73: isDay ? "wi wi-day-snow" : "wi wi-night-alt-snow",
            75: isDay ? "wi wi-day-snow" : "wi wi-night-alt-snow",
            77: isDay ? "wi wi-day-snow" : "wi wi-night-alt-snow",
            80: isDay ? "wi wi-day-showers" : "wi wi-night-alt-showers",
            81: isDay ? "wi wi-day-showers" : "wi wi-night-alt-showers",
            82: isDay ? "wi wi-day-rain" : "wi wi-night-alt-rain",
            85: isDay ? "wi wi-day-snow" : "wi wi-night-alt-snow",
            86: isDay ? "wi wi-day-snow" : "wi wi-night-alt-snow",
            95: isDay ? "wi wi-day-thunderstorm" : "wi wi-night-alt-thunderstorm",
            96: isDay ? "wi wi-day-thunderstorm" : "wi wi-night-alt-thunderstorm",
            99: isDay ? "wi wi-day-thunderstorm" : "wi wi-night-alt-thunderstorm"
        };

        return iconMappings[code] || (isDay ? "wi wi-day-cloudy" : "wi wi-night-alt-cloudy");
    },

    getWindIcon: function(degrees) {
        return '<i class="wi wi-wind towards-' + Math.round(degrees) + '-deg"></i>';
    },

    isDayTime: function() {
        if (!this.weatherData || !this.weatherData.daily ||
            !this.weatherData.daily.sunrise || !this.weatherData.daily.sunset) {
            return true; // Par défaut, considérer qu'il fait jour
        }

        const now = new Date();
        const sunrise = new Date(this.weatherData.daily.sunrise[0]);
        const sunset = new Date(this.weatherData.daily.sunset[0]);

        return now >= sunrise && now <= sunset;
    },

    getDayName: function(day) {
        const days = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
        return days[day];
    },

    formatTime: function(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        return hours + ":" + (minutes < 10 ? "0" + minutes : minutes);
    }
});
