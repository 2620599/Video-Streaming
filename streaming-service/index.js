const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Video = require('./models/Video');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGODB_STREAMING_SERVICE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("MongoDB connected successfully");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});

// Get all videos with their metadata
app.get('/api/videos', async (req, res) => {
    try {
        const videos = await Video.find();
        res.json(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Error fetching videos' });
    }
});

// Stream video - fetch URL from MongoDB
app.get('/api/stream/:videoId', async (req, res) => {
    try {
        // Find the video document by ID
        const video = await Video.findById(req.params.videoId);
        
        if (!video) {
            console.error('Video not found:', req.params.videoId);
            return res.status(404).json({ error: 'Video not found' });
        }

        if (!video.fileUrl) {
            console.error('Video URL not found in document:', video);
            return res.status(404).json({ error: 'Video URL not found' });
        }

        // Return the Google Cloud Storage URL stored in MongoDB
        res.json({ 
            fileUrl: video.fileUrl,
            title: video.title,
            description: video.description
        });

    } catch (error) {
        console.error('Error fetching video from MongoDB:', error);
        res.status(500).json({ error: 'Error streaming video' });
    }
});

const port = process.env.PORT || 3003;
app.listen(port, () => {
    console.log(`Streaming service running on port ${port}`);
});
