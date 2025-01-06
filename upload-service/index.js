const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
// const AWS = require('aws-sdk'); // AWS SDK commented for future use
require('dotenv').config();

const app = express();

// Configure CORS properly
app.use(cors({
    origin: 'http://34.203.169.113:3000',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// Configure multer with size limits
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    }
});

// Google Cloud Storage configuration
const storage = new Storage({
    keyFilename: 'credentials/keen-sight-440922-d6-1e1d842a6056.json', // Path to your credentials file
    projectId: 'keen-sight-440922-d6' // Your Google Cloud project ID
});

const bucket = storage.bucket('maindabucket'); // Google Cloud Storage bucket name

// AWS S3 configuration (commented out for now)
// const s3 = new AWS.S3({
//     region: 'us-east-1',
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
// });

// Video Schema and Model
const videoSchema = new mongoose.Schema({
    title: String,
    description: String,
    fileUrl: String,
    createdAt: { type: Date, default: Date.now } // Keep track of upload time
});

const Video = mongoose.model('Video', videoSchema);

// Upload endpoint
app.post('/api/videos', upload.single('file'), async (req, res) => {
    try {
        const { title, description } = req.body;
        const file = req.file;

        if (!title || !description || !file) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log('Received file:', file.originalname); // Debug log

        const fileName = `${Date.now()}-${file.originalname}`;

        // Google Cloud Storage Upload
        const blob = bucket.file(fileName);
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: file.mimetype,
            public: true
        });

        blobStream.on('finish', async () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            console.log('Google Cloud Storage upload successful:', publicUrl); // Debug log

            const video = new Video({
                title,
                description,
                fileUrl: publicUrl,
            });

            await video.save();
            res.status(201).json(video);
        });

        blobStream.on('error', (err) => {
            console.error('Upload error:', err); // Detailed error logging
            res.status(500).json({
                error: 'Upload failed',
                details: err.message
            });
        });

        blobStream.end(file.buffer);

        // AWS S3 Upload (commented for now)
        // const params = {
        //     Bucket: process.env.AWS_BUCKET_NAME,
        //     Key: fileName,
        //     Body: file.buffer,
        //     ContentType: file.mimetype,
        //     ACL: 'public-read'
        // };

        // console.log('Uploading to bucket:', process.env.AWS_BUCKET_NAME); // Debug log
        // const s3Response = await s3.upload(params).promise();
        // console.log('S3 upload successful:', s3Response.Location); // Debug log

        // const video = new Video({
        //     title,
        //     description,
        //     fileUrl: s3Response.Location,
        // });

        // await video.save();
        // res.status(201).json(video);

    } catch (error) {
        console.error('Upload error details:', error); // Detailed error logging
        res.status(500).json({
            error: 'Upload failed',
            details: error.message
        });
    }
});

// Get videos endpoint
app.get('/api/videos', async (req, res) => {
    try {
        const videos = await Video.find().sort({ createdAt: -1 }); // Fetch all videos
        res.status(200).json(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Upload service running on port ${PORT}`);
});
