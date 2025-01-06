const mongoose = require('mongoose');

// Define the Video schema
const VideoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    fileUrl: { type: String, required: true },
   // uploadDate: { type: Date, default: Date.now },
});

// Export the Video model
const Video = mongoose.model('Video', VideoSchema);

module.exports = Video;
