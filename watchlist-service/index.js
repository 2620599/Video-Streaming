const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');  // Import the CORS package
const Watchlist = require('./models/Watchlist');  // Watchlist model
const Video = require('./models/Video');  // Video model
require('dotenv').config();  // Load environment variables from .env file

const app = express();
app.use(express.json());

// Enable CORS for all origins (or specify specific origins if needed)
app.use(cors());  // This will allow CORS for all origins

// MongoDB connection URI for Watchlist Service (from environment variable)
const uri = process.env.MONGODB_WATCHLIST_SERVICE_URI;  // Mongo URI for Watchlist database

// Connect to MongoDB
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("MongoDB connected successfully to Watchlist Service database");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});

// Add video to watchlist
app.post('/api/watchlist', async (req, res) => {
    const { videoId } = req.body;  // Only videoId is needed here

    try {
        const newWatchlistItem = new Watchlist({
            videoId,
        });

        await newWatchlistItem.save();  // Save the new item to the Watchlist
        res.status(201).json(newWatchlistItem);
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        res.status(500).json({ error: 'Failed to add to watchlist' });
    }
});
// Get watchlist items (populate video details)
// Get watchlist items (populate video details)
//app.get('/api/watchlist', async (req, res) => {
app.get('/api/watchlist', async (req, res) => {
    try {
        const watchlistItems = await Watchlist.find();

        const populatedWatchlist = await Promise.all(
            watchlistItems.map(async (item) => {
                // Check if videoId exists and is a string
                console.log("Fetching video for videoId:", item.videoId);

                // Use findById instead of findOne for clarity and precision
                const video = await Video.findById(item.videoId);  // Using findById for clarity

                console.log("Found video:", video);  // Log the fetched video

                return {
                    ...item.toObject(),
                    video: video
                        ? { _id: video._id.toString(), title: video.title, description: video.description }
                        : { _id: item.videoId, title: "Video not found", description: "N/A" },
                };
            })
        );

        res.json(populatedWatchlist);
    } catch (error) {
        console.error("Error fetching watchlist:", error);
        res.status(500).json({ error: "Failed to fetch watchlist" });
    }
});

// Start the server
const port = process.env.PORT || 3004;
app.listen(port, () => {
    console.log(`Watchlist service is running on port ${port}`);
});
