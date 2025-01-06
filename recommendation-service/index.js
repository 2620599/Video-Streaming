const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Video = require('./models/Video');
const Recommendation = require('./models/Recommendation');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("MongoDB connected successfully to recommendationDB");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});

// GET all recommendations
app.get('/api/recommendations', async (req, res) => {
    try {
        const videos = await Video.find();
        const recommendedVideos = videos.map((video) => ({
            _id: video._id,
            title: video.title,
            description: video.description,
            fileUrl: video.fileUrl
        }));
        res.json(recommendedVideos);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ error: 'Error fetching recommendations' });
    }
});

// POST endpoint for recommendations based on watched videos
app.post('/api/recommendations', async (req, res) => {
    try {
        const { watchedVideos } = req.body;
        
        // Find videos that haven't been watched
        const videos = await Video.find({
            _id: { $nin: watchedVideos || [] }
        });

        // Map videos to recommendation format
        const recommendedVideos = videos.map((video) => {
            const recommendation = new Recommendation({
                videoId: video._id,
                reason: `Recommended based on your watching history`,
            });
            
            // Save recommendation asynchronously
            recommendation.save().catch(err => 
                console.error('Error saving recommendation:', err)
            );

            return {
                _id: video._id,
                title: video.title,
                description: video.description,
                fileUrl: video.fileUrl,
                reason: recommendation.reason
            };
        });

        res.json(recommendedVideos);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ 
            error: 'Error fetching recommendations',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

const port = process.env.PORT || 3005;
app.listen(port, () => {
    console.log(`Recommendation service is running on port ${port}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something broke!',
        details: err.message
    });
});
