import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';
import axios from 'axios';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/voice');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `voice-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

// Apply authentication
router.use(authenticateToken);

// Speech-to-text endpoint
router.post(
  '/speech-to-text',
  uploadRateLimiter,
  upload.single('audio'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      // Use OpenAI Whisper API for transcription
      const formData = new FormData();
      const audioBuffer = fs.readFileSync(req.file.path);
      formData.append('file', new Blob([audioBuffer]), req.file.filename);
      formData.append('model', 'whisper-1');
      formData.append('language', req.body.language || 'en');

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        text: response.data.text,
        language: response.data.language,
        duration: response.data.duration,
      });

      logger.info('Speech-to-text conversion completed', {
        userId: req.user!.id,
        duration: response.data.duration,
      });
    } catch (error: any) {
      logger.error('Speech-to-text error:', error);
      
      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ error: 'Failed to convert speech to text' });
    }
  }
);

// Text-to-speech endpoint
router.post('/text-to-speech', async (req: AuthRequest, res: Response) => {
  try {
    const { text, voice, speed } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Use ElevenLabs API for TTS
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice || process.env.ELEVENLABS_VOICE_ID}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: speed || 1.0,
        },
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    // Generate unique filename
    const filename = `tts-${Date.now()}.mp3`;
    const filePath = path.join(__dirname, '../../uploads/voice', filename);
    
    // Save audio file
    fs.writeFileSync(filePath, response.data);

    res.json({
      audioUrl: `/uploads/voice/${filename}`,
      duration: response.headers['x-audio-duration'],
    });

    logger.info('Text-to-speech conversion completed', {
      userId: req.user!.id,
      textLength: text.length,
    });

    // Schedule file deletion after 1 hour
    setTimeout(() => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }, 60 * 60 * 1000);
  } catch (error: any) {
    logger.error('Text-to-speech error:', error);
    
    if (error.response?.status === 401) {
      return res.status(500).json({ error: 'TTS service authentication failed' });
    }
    
    res.status(500).json({ error: 'Failed to convert text to speech' });
  }
});

// Get available voices
router.get('/voices', async (req: AuthRequest, res: Response) => {
  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
    });

    const voices = response.data.voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      labels: voice.labels,
      preview: voice.preview_url,
    }));

    res.json({ voices });
  } catch (error) {
    logger.error('Get voices error:', error);
    res.status(500).json({ error: 'Failed to retrieve available voices' });
  }
});

export default router;