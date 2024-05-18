require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const knex = require('knex');
const knexConfig = require('./knexfile');

const app = express();
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY || 'martik';
const db = knex(knexConfig[process.env.NODE_ENV || 'development']);
const docsPath = path.join(__dirname, 'docs');

app.use(cors());
app.use(express.json());
app.use('/docs', express.static(docsPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(docsPath, 'index.html'));
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    resource_type: 'auto', // This allows uploading of any file type
    public_id: (req, file) => `${Date.now()}-${file.originalname}`
  },
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

app.get('/videos', async (req, res) => {
  try {
    const videos = await db('videos').select();
    videos.forEach(video => {
      if (!video.image.startsWith('http')) {
        video.image = `${req.protocol}://${req.get('host')}${video.image}`;
      }
      if (!video.video.startsWith('http')) {
        video.video = `${req.protocol}://${req.get('host')}${video.video}`;
      }
    });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching videos' });
  }
});

app.get('/videos/:id', async (req, res) => {
  try {
    const video = await db('videos').where({ id: req.params.id }).first();
    if (video) {
      if (!video.image.startsWith('http')) {
        video.image = `${req.protocol}://${req.get('host')}${video.image}`;
      }
      if (!video.video.startsWith('http')) {
        video.video = `${req.protocol}://${req.get('host')}${video.video}`;
      }
      const comments = await db('comments').where({ video_id: req.params.id });
      video.comments = comments;
      res.json(video);
    } else {
      res.status(404).json({ message: 'Video not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching video' });
  }
});

app.post('/videos', upload.single('file'), async (req, res) => {
  try {
    const { title, description, channel } = req.body;
    const fileUrl = req.file ? req.file.path : 'default-thumbnail-url';
    const newVideo = {
      id: uuidv4(),
      title,
      description,
      channel: channel || 'Default Channel',
      image: fileUrl,
      views: '0',
      likes: '0',
      duration: '0:00',
      video: fileUrl, // Assuming the uploaded file is the video file
      timestamp: Date.now()
    };
    await db('videos').insert(newVideo);
    res.status(201).json(newVideo);
  } catch (error) {
    res.status(500).json({ message: 'Error creating video' });
  }
});

app.post('/videos/:id/comments', async (req, res) => {
  try {
    const { name, comment } = req.body;
    const video = await db('videos').where({ id: req.params.id }).first();
    if (video) {
      const newComment = {
        id: uuidv4(),
        video_id: req.params.id,
        name,
        comment,
        likes: 0,
        timestamp: Date.now()
      };
      await db('comments').insert(newComment);
      res.status(201).json(newComment);
    } else {
      res.status(404).json({ message: 'Video not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment' });
  }
});

app.delete('/videos/:id/comments/:commentId', async (req, res) => {
  try {
    const video = await db('videos').where({ id: req.params.id }).first();
    if (video) {
      await db('comments').where({ id: req.params.commentId }).del();
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Video not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

app.post('/videos/:id/like', async (req, res) => {
  try {
    const video = await db('videos').where({ id: req.params.id }).first();
    if (video) {
      video.likes = (parseInt(video.likes, 10) + 1).toString();
      await db('videos').where({ id: req.params.id }).update({ likes: video.likes });
      res.status(200).json(video);
    } else {
      res.status(404).json({ message: 'Video not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error liking video' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
