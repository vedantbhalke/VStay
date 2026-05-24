const Listing = require("../models/listing");
const apiKey = process.env.MAPTILER_API_KEY;

module.exports.index = async (requestAnimationFrame, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing requested does not exist!");
        return res.redirect("/listings");
    }
    // console.log(listing);
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    const location = req.body.listing.location;

    const geoResponse = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(location)}.json?key=${process.env.MAPTILER_API_KEY}`
    );

    const geoData = await geoResponse.json();

    if (!geoData.features || !geoData.features.length) {
        req.flash("error", "Location not found!");
        return res.redirect("/listings/new");
    }

    const coords = geoData.features[0].center;

    newListing.geometry = {
        type: "Point",
        coordinates: coords
    };

    await newListing.save();

    req.flash("success", "Successfully created a new listing!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing requested does not exist!");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let { image, ...rest } = req.body.listing;
    let listing = await Listing.findByIdAndUpdate(id, {
        ...rest
    });
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Successfully updated the listing!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    // console.log("Deleted listing: ", deletedListing);
    req.flash("success", "Successfully deleted the listing!");
    res.redirect("/listings");
};


