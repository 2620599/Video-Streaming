const mongoose = require('mongoose');

// Define the Watchlist schema
const WatchlistSchema = new mongoose.Schema({
    videoId: { type: String, required: true }, // Reference to the Video ID
//    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true }, // Store as ObjectId

    addedAt: { type: Date, default: Date.now },
});

// Export the Watchlist model
const Watchlist = mongoose.model('Watchlist', WatchlistSchema);

module.exports = Watchlist;
