const { getISSLocation, getCountryByCoordinates, getUTMCoordinates, getGeoJSON } = require('../services/issService');

const getCountries = (req, res) => {
    const geojson = getGeoJSON();
    res.json(geojson.features.map(feature => feature.properties.name));
};

const getISSLocationHandler = async (req, res) => {
    try {
        const coordinates = await getISSLocation();
        const country = getCountryByCoordinates(coordinates);
        res.json({ country });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUTMCoordinatesHandler = async (req, res) => {
    try {
        const coordinates = await getISSLocation();
        const utmCoordinates = getUTMCoordinates(coordinates);
        res.json({ utm: utmCoordinates });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getCountries,
    getISSLocationHandler,
    getUTMCoordinatesHandler
};
