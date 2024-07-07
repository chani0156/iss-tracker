const axios = require('axios');
const turf = require('@turf/turf');
const fs = require('fs');
const { GEOJSON_PATH, ISS_API_URL } = require('../config/config');
const UTMConverter = require('utm-latlng');

const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
const utmConverter = new UTMConverter();

const getISSLocation = async () => {
    const response = await axios.get(ISS_API_URL, {
        params: { timestamp: new Date().getTime() }
    });
    const { latitude, longitude } = response.data.iss_position;
    return [parseFloat(longitude), parseFloat(latitude)];
};
const getGeoJSON = () => {
    return geojson;
};
const getCountryByCoordinates = (coordinates) => {
    for (const feature of geojson.features) {
        if (turf.booleanPointInPolygon(turf.point(coordinates), feature)) {
            return feature.properties.name;
        }
    }
    return "Ocean";
};

const getUTMCoordinates = (coordinates, precision = 6) => {
    if (!coordinates || coordinates.length !== 2 || !isFinite(coordinates[0]) || !isFinite(coordinates[1])) {
        throw new TypeError('coordinates must be finite numbers');
    }
    const [longitude, latitude] = coordinates;
    return utmConverter.convertLatLngToUtm(latitude, longitude, precision);
};

module.exports = {
    getISSLocation,
    getCountryByCoordinates,
    getUTMCoordinates,
    getGeoJSON
};
