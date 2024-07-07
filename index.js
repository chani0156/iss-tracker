const express = require('express');
const axios = require('axios');
const turf = require('@turf/turf');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const UTMConverter = require('utm-latlng');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Read and parse the countries.geojson file
const geojsonPath = path.join(__dirname, 'countries.geojson');
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));


// Define UTM projection
const utmConverter = new UTMConverter();

const getCountries = () => {
    return geojson.features.map(feature => feature.properties.name);
};


const getISSLocation = async () => {
    const response = await axios.get('http://api.open-notify.org/iss-now.json', {
        params: { timestamp: new Date().getTime() }
    });
    const { latitude, longitude } = response.data.iss_position;
    return [longitude, latitude];
};
const getCountryByCoordinates = (coordinates) => {
    for (const feature of geojson.features) {
        if (turf.booleanPointInPolygon(turf.point(coordinates), feature)) {
            return feature.properties.name;
        }
    }
    return "Ocean";
};

const getUTMCoordinates = (coordinates) => {
    if (!coordinates || coordinates.length !== 2 || !isFinite(coordinates[0]) || !isFinite(coordinates[1])) {
        console.error('Invalid coordinates for UTM conversion:', coordinates);
        throw new TypeError('coordinates must be finite numbers');
    }
    const [longitude, latitude] = coordinates;
    const utm = utmConverter.convertLatLngToUtm(latitude, longitude, 33);
    return utm;
};

app.get('/countries', (req, res) => {
    res.json(getCountries());
});

app.get('/iss', async (req, res) => {
    const coordinates = await getISSLocation();
    const country = getCountryByCoordinates(coordinates);
    res.json({ country });
});

app.get('/utm', async (req, res) => {
    try {
        const coordinates = await getISSLocation();
        const utmCoordinates = getUTMCoordinates(coordinates);
        res.json({ utm: utmCoordinates });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// WebSocket setup
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

    // Send location immediately when connected
    sendLocation();

    // Set up an interval to send updates every 10 seconds
    const interval = setInterval(sendLocation, 10000);

    ws.on('close', () => clearInterval(interval));
});

const server = app.listen(port, () => {
    console.log(`ISS Tracker API running at http://localhost:${port}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});