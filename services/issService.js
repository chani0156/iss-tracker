const axios = require('axios');
const turf = require('@turf/turf');
const fs = require('fs');
const path = require('path');
const UTMConverter = require('utm-latlng');
const { GEOJSON_PATH, ISS_API_URL } = require('../config/config');

// Load GeoJSON data once at startup
const geojson = JSON.parse(fs.readFileSync(path.resolve(__dirname, GEOJSON_PATH), 'utf8'));
const utmConverter = new UTMConverter();

// Fetch the current location of the ISS
const getISSLocation = async () => {
    try {
        const response = await axios.get(ISS_API_URL, {
            params: { timestamp: new Date().getTime() }
        });
        const { latitude, longitude } = response.data.iss_position;
        return [parseFloat(longitude), parseFloat(latitude)];
    } catch (error) {
        console.error('Error fetching ISS location:', error.message);
        throw new Error('Unable to fetch ISS location');
    }
};

// Return the GeoJSON data
const getGeoJSON = () => {
    return geojson;
};

// Determine the country by given coordinates
const getCountryByCoordinates = (coordinates) => {
    if (!coordinates || coordinates.length !== 2 || !isFinite(coordinates[0]) || !isFinite(coordinates[1])) {
        throw new TypeError('Invalid coordinates');
    }

    for (const feature of geojson.features) {
        if (turf.booleanPointInPolygon(turf.point(coordinates), feature)) {
            return feature.properties.name;
        }
    }
    return "Ocean";
};

// Convert coordinates to UTM
const getUTMCoordinates = (coordinates, precision = 6) => {
    if (!coordinates || coordinates.length !== 2 || !isFinite(coordinates[0]) || !isFinite(coordinates[1])) {
        throw new TypeError('Invalid coordinates');
    }
    const [longitude, latitude] = coordinates;
    const utm = utmConverter.convertLatLngToUtm(latitude, longitude, precision);
    return {
        zone: utm.ZoneNumber,
        easting: utm.Easting,
        northing: utm.Northing
    };
};

module.exports = {
    getISSLocation,
    getCountryByCoordinates,
    getUTMCoordinates,
    getGeoJSON
};
