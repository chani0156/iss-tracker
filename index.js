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

wss.on('connection', (ws) => {
    const sendLocation = async () => {
        try {
            const coordinates = await getISSLocation();
            const country = getCountryByCoordinates(coordinates);
            ws.send(JSON.stringify({ coordinates, country }));
        } catch (error) {
            console.error('Error sending location:', error.message);
        }
    };

    sendLocation();
    const interval = setInterval(sendLocation, 10000);

    ws.on('close', () => clearInterval(interval));
});

const server = app.listen(PORT, () => {
    console.log(`ISS Tracker API running at http://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
