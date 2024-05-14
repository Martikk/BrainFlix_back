require('dotenv').config();
const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY || 'martik';
const dataFilePath = process.env.DATA_FILE_PATH || path.join(__dirname, 'data.json');
const staticImagesPath = process.env.STATIC_IMAGES_PATH || path.join(__dirname, 'public', 'images');
const staticVideosPath = process.env.STATIC_VIDEOS_PATH || path.join(__dirname, 'public', 'videos');
const docsPath = path.join(__dirname, 'docs'); // Directory for the documentation

app.use(cors());
app.use(express.json());
app.use('/images', express.static(staticImagesPath));
app.use('/videos', express.static(staticVideosPath));
app.use('/docs', express.static(docsPath));


app.get('/', (req, res) => {
    res.sendFile(path.join(docsPath, 'index.html'));
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.query.api_key || req.headers['x-api-key'];
    if (apiKey && apiKey === API_KEY) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Invalid API Key' });
    }
};


app.use('/videos', apiKeyMiddleware);
app.use('/videos/:id', apiKeyMiddleware);
app.use('/videos/:id/comments', apiKeyMiddleware);
app.use('/videos/:id/comments/:commentId', apiKeyMiddleware);
app.use('/videos/:id/like', apiKeyMiddleware);

const readData = () => {
    const data = fs.readFileSync(dataFilePath);
    return JSON.parse(data);
};

const writeData = (data) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

app.get('/videos', (req, res) => {
    const videos = readData();
    videos.forEach(video => {
        if (!video.image.startsWith('http')) {
            video.image = `${req.protocol}://${req.get('host')}${video.image}`;
        }
        if (!video.video.startsWith('http')) {
            video.video = `${req.protocol}://${req.get('host')}${video.video}`;
        }
    });
    res.json(videos);
});

app.get('/videos/:id', (req, res) => {
    const videos = readData();
    const video = videos.find(v => v.id === req.params.id);
    if (video) {
        if (!video.image.startsWith('http')) {
            video.image = `${req.protocol}://${req.get('host')}${video.image}`;
        }
        if (!video.video.startsWith('http')) {
            video.video = `${req.protocol}://${req.get('host')}${video.video}`;
        }
        res.json(video);
    } else {
        res.status(404).json({ message: 'Video not found' });
    }
});

app.post('/videos', upload.single('image'), (req, res) => {
    const { title, description, channel } = req.body;
    const imageUrl = req.file ? `/images/${req.file.filename}` : '/images/default-thumbnail.jpg';
    const newVideo = {
        id: uuidv4(),
        title,
        description,
        channel: channel || 'Default Channel',
        image: imageUrl,
        views: '0',
        likes: '0',
        duration: '0:00',
        video: '/videos/stream.mp4',
        timestamp: Date.now(),
        comments: []
    };
    const videos = readData();
    videos.push(newVideo);
    writeData(videos);
    newVideo.image = `${req.protocol}://${req.get('host')}${newVideo.image}`;
    newVideo.video = `${req.protocol}://${req.get('host')}${newVideo.video}`;
    res.status(201).json(newVideo);
});

app.post('/videos/:id/comments', (req, res) => {
    const { name, comment } = req.body;
    const videos = readData();
    const video = videos.find(v => v.id === req.params.id);
    if (video) {
        const newComment = {
            id: uuidv4(),
            name,
            comment,
            likes: 0,
            timestamp: Date.now()
        };
        video.comments.push(newComment);
        writeData(videos);
        res.status(201).json(newComment);
    } else {
        res.status(404).json({ message: 'Video not found' });
    }
});

app.delete('/videos/:id/comments/:commentId', (req, res) => {
    const videos = readData();
    const video = videos.find(v => v.id === req.params.id);
    if (video) {
        const commentIndex = video.comments.findIndex(c => c.id === req.params.commentId);
        if (commentIndex !== -1) {
            video.comments.splice(commentIndex, 1);
            writeData(videos);
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Comment not found' });
        }
    } else {
        res.status(404).json({ message: 'Video not found' });
    }
});

app.post('/videos/:id/like', (req, res) => {
    const videos = readData();
    const video = videos.find(v => v.id === req.params.id);
    if (video) {
        video.likes = (parseInt(video.likes, 10) + 1).toString();
        writeData(videos);
        res.status(200).json(video);
    } else {
        res.status(404).json({ message: 'Video not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
