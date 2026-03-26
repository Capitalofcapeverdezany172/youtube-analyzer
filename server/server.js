import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { resolveChannel, getChannelVideos } from './youtube-api.js';
import { analyzeWithAI } from './ai-analyzer.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    youtube: !!process.env.YOUTUBE_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY
  });
});

// Check API keys
app.get('/api/config', (req, res) => {
  res.json({
    hasYoutubeKey: !!process.env.YOUTUBE_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY
  });
});

// Save API keys at runtime
app.post('/api/config', (req, res) => {
  const { youtubeApiKey, geminiApiKey } = req.body;
  if (youtubeApiKey) process.env.YOUTUBE_API_KEY = youtubeApiKey;
  if (geminiApiKey) process.env.GEMINI_API_KEY = geminiApiKey;
  res.json({ 
    hasYoutubeKey: !!process.env.YOUTUBE_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY
  });
});

// Analyze channel
app.get('/api/analyze/:handle', async (req, res) => {
  const startTime = Date.now();
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(400).json({ error: 'YouTube API key is required. Please set it in Settings.' });
    }

    const handle = req.params.handle.replace('@', '');
    console.log(`[Analyze] Starting analysis for @${handle}...`);

    // Step 1: Resolve channel
    const channel = await resolveChannel(handle, process.env.YOUTUBE_API_KEY);
    if (!channel) {
      return res.status(404).json({ error: `Channel @${handle} not found` });
    }
    console.log(`[Analyze] Found channel: ${channel.title} (${channel.id})`);

    // Step 2: Get all videos
    const videos = await getChannelVideos(channel.uploadsPlaylistId, process.env.YOUTUBE_API_KEY);
    console.log(`[Analyze] Fetched ${videos.length} videos`);

    // Step 3: Compute stats
    const views = videos.map(v => v.views).sort((a, b) => a - b);
    const totalViews = views.reduce((s, v) => s + v, 0);
    const avgViews = Math.round(totalViews / views.length) || 0;
    const medianViews = views.length > 0 
      ? views[Math.floor(views.length / 2)] 
      : 0;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    const result = {
      channel: {
        id: channel.id,
        title: channel.title,
        handle: handle,
        thumbnail: channel.thumbnail,
        subscriberCount: channel.subscriberCount,
        url: `https://www.youtube.com/@${handle}`
      },
      stats: {
        totalVideos: videos.length,
        totalViews,
        avgViews,
        medianViews,
        maxViews: views.length > 0 ? views[views.length - 1] : 0,
        minViews: views.length > 0 ? views[0] : 0
      },
      videos: videos.sort((a, b) => b.views - a.views),
      analyzedAt: new Date().toISOString(),
      elapsedSeconds: elapsed
    };

    res.json(result);
  } catch (err) {
    console.error('[Analyze] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// AI Analysis endpoint
app.post('/api/ai-analyze', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'Gemini API key is required for AI analysis. Please set it in Settings.' });
    }

    const { videos, channelTitle } = req.body;
    if (!videos || !Array.isArray(videos)) {
      return res.status(400).json({ error: 'videos array is required' });
    }

    console.log(`[AI] Analyzing ${videos.length} videos for ${channelTitle}...`);
    const result = await analyzeWithAI(videos, channelTitle, process.env.GEMINI_API_KEY);
    console.log(`[AI] Analysis complete`);

    res.json(result);
  } catch (err) {
    console.error('[AI] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  YouTube Analyzer API running at http://localhost:${PORT}`);
  console.log(`  YouTube API Key: ${process.env.YOUTUBE_API_KEY ? '✓ configured' : '✗ missing'}`);
  console.log(`  Gemini API Key:  ${process.env.GEMINI_API_KEY ? '✓ configured' : '✗ missing'}\n`);
});
