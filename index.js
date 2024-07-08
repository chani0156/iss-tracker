const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const { PORT } = require('./config/config');
const { getISSLocation, getCountryByCoordinates } = require('./services/issService');
const { getCountries, getISSLocationHandler, getUTMCoordinatesHandler } = require('./controllers/issController');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/countries', getCountries);
app.get('/iss', getISSLocationHandler);
app.get('/utm', getUTMCoordinatesHandler);

const wss = new WebSocket.Server({ noServer: true });

let previousCountry = null;
let lastSentTime = 0;

// Function to send location to all connected clients
const sendLocationToClients = (coordinates, country) => {
    const message = JSON.stringify({ coordinates, country });

    console.log('Sending message to clients:', message);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });

    lastSentTime = Date.now();
};

// Function to check ISS location every 2 seconds
const pollISSLocation = async () => {
    try {
        const coordinates = await getISSLocation();
        const country = getCountryByCoordinates(coordinates);
        const currentTime = Date.now();

        // Send update if country changes
        if (country !== previousCountry&&country!="Ocean") {
            previousCountry = country;
            console.log("The ISS enters the territory of a new country.")
            sendLocationToClients(coordinates, country);
        }

        // Send periodic update every 10 seconds
        if (currentTime - lastSentTime >= 10000) {
            sendLocationToClients(coordinates, country);
        }
    } catch (error) {
        console.error('Error polling ISS location:', error.message);
    }
};

// WebSocket connection setup
wss.on('connection', (ws) => {
    console.log('Client connected');
    pollISSLocation();

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Set up an interval to poll ISS location every 2 seconds
setInterval(pollISSLocation, 2000);

const server = app.listen(PORT, () => {
    console.log(`ISS Tracker API running at http://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});