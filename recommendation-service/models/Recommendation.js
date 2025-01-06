const mongoose = require('mongoose');

// Define the Recommendation schema
const RecommendationSchema = new mongoose.Schema({
    videoId: { type: String, required: true },  // Video ID from Upload Service
    reason: { type: String },  // Optional reason for recommendation
});

// Export the Recommendation model
const Recommendation = mongoose.model('Recommendation', RecommendationSchema);

module.exports = Recommendation;
