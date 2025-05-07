const NodeHelper = require("node_helper");
const fs = require("fs");

module.exports = NodeHelper.create({
    start: function() {
        console.log("MMM-PIR-Simple helper started...");
    },
    
    socketNotificationReceived: function(notification, payload) {
        if (notification === "READ_PIR_STATUS") {
            this.readPirStatus(payload);
        }
    },
readPirStatus: function(statusFile) {
    try {
        if (fs.existsSync(statusFile)) {
            const fileContent = fs.readFileSync(statusFile, "utf8");
            const status = JSON.parse(fileContent);
            this.sendSocketNotification("PIR_STATUS", { status: status });
        }
    } catch (error) {
        console.error("Error reading PIR status:", error);
    }
}
});
