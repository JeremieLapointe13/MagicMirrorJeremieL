/* MagicMirror² Config pour Rivière-du-Loup */

var config = {
	address: "0.0.0.0",
	port: 8080,
	basePath: "/", 
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1", "192.168.0.1/24"],

	language: "fr",
	locale: "fr-CA",
	timeFormat: 24,
	units: "metric",
	
	location: {
		lat: 47.8266,
		lng: -69.5348,
	},
	
	modules: [
		{
			module: "alert",
		},
		{
			module: "clock",
			position: "top_center",
			config: {
				displayType: "digital",
				showDate: true,
				dateFormat: "dddd, D MMMM YYYY",
				timezone: "America/Montreal"
			}
		},
		{
			module: "calendar",
			header: "Jours fériés",
			position: "top_left",
			config: {
				calendars: [
					{
						symbol: "calendar-check",
						url: "https://calendar.google.com/calendar/ical/fr.canadian%23holiday%40group.v.calendar.google.com/public/basic.ics"
					}
				],
				colored: true,
				maximumEntries: 5,
				fetchInterval: 604800000,
				timeFormat: "absolute",
				urgency: 7
			}
		},
		{
			module: "compliments",
			position: "lower_third",
			config: {
				compliments: {
					anytime: [
						"Bonjour!",
						"Belle journée!",
						"Passez une excellente journée!"
					],
					morning: [
						"Bon matin!",
						"Bonne journée à Rivière-du-Loup!",
						"Comment allez-vous ce matin?"
					],
					afternoon: [
						"Bon après-midi!",
						"Belle journée à Rivière-du-Loup, n'est-ce pas?"
					],
					evening: [
						"Bonne soirée!",
						"Reposez-vous bien!"
					]
				}
			}
		},
		{
			module: "MMM-OpenMeteo",
			position: "top_right",
			header: "Météo",
			config: {
				latitude: 47.8266,
				longitude: -69.5348,
				locationName: "Rivière-du-Loup",
				updateInterval: 1800000,
				forecastDays: 5,
				showCurrent: true,
				showForecast: true,
				showFeelsLike: true,
				showHumidity: true,
				showWindSpeed: true,
				showPrecipitationAmount: true,
				showSunTimes: true
			}
		},
		{
			module: "newsfeed",
			position: "bottom_bar",
			config: {
				feeds: [
					{
						title: "Radio-Canada Info",
						url: "http://localhost:8081/rss"
					}
				],
				showSourceTitle: true,
				showPublishDate: true,
				broadcastNewsFeeds: true,
				broadcastNewsUpdates: true,
				showDescription: true,
				updateInterval: 60000,
				reloadInterval: 300000,     // Recharger toutes les 5 minutes (au lieu de 1 heure)
				ignoreOldItems: true,
				ignoreOlderThan: 86400000,
				fetchInterval: 60000,       // Essayer de récupérer toutes les minutes (au lieu de 5 minutes)
				maxNewsItems: 5,
				retryFetch: true,           // Réessayer si la récupération échoue
				showLoading: true           // Afficher un indicateur de chargement
			}
		},
		{
			module: "MMM-PIR-Simple",
			config: {
				checkInterval: 1,
				powerSavingDelay: 30
			}
		}
	],
	
	customCss: "css/custom.css"
};

if (typeof module !== "undefined") { module.exports = config; }
