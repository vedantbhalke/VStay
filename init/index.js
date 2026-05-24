const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require("../models/listing.js");
require("dotenv").config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// const MONGO_URL = "mongodb://localhost:27017/VStay";
const MONGO_URL = process.env.MONGO_URL;

main()
    .then(() => { console.log("Connected to MongoDB"); })
    .catch((err) => { console.log(err); });

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});

    for (let obj of initData.data) {
        const geoResponse = await fetch(
            `https://api.maptiler.com/geocoding/${encodeURIComponent(obj.location)}.json?key=${process.env.MAPTILER_API_KEY}`
        );
        const geoData = await geoResponse.json();

        if (geoData.features && geoData.features.length) {
            obj.geometry = {
                type: "Point",
                coordinates: geoData.features[0].center
            };
        }
        obj.owner = '6a13708ffc9be76c83485f9f';
    }

    await Listing.insertMany(initData.data);
    console.log("Database initialized with sample data");
};

initDB();