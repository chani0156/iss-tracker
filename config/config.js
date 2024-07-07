const path = require('path');

module.exports = {
    PORT: process.env.PORT || 3000,
    GEOJSON_PATH: path.join(__dirname, '../countries.geojson'),
    ISS_API_URL: 'http://api.open-notify.org/iss-now.json'
};
