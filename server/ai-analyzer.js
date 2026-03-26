const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Analyze videos using Gemini AI
 * Returns: topics, formulas, patterns, viewer persona
 */
export async function analyzeWithAI(videos, channelTitle, apiKey) {
  // Prepare compact video data for the prompt
  const videoData = videos
    .sort((a, b) => b.views - a.views)
    .slice(0, 200) // limit to top 200 for token efficiency
    .map(v => `${v.title} | ${v.views} views | ${v.publishedAt?.slice(0, 10)}`)
    .join('\n');

  const prompt = `You are a YouTube content strategist. Analyze this channel's videos and provide insights.

Channel: ${channelTitle}
Total videos analyzed: ${videos.length}

VIDEO LIST (sorted by views, top 200):
${videoData}

Respond in JSON format ONLY (no markdown, no code fences). The response must be valid JSON with this exact structure:

{
  "topics": [
    {
      "name": "Topic Name in English",
      "videoCount": 10,
      "avgViews": 500000,
      "topVideos": ["video title 1", "video title 2", "video title 3"],
      "fireRating": 3
    }
  ],
  "formulas": [
    {
      "pattern": "How to [Action]",
      "description": "Brief explanation why this formula works (in Vietnamese)",
      "examples": [
        { "title": "Example video title", "views": 1000000 }
      ]
    }
  ],
  "viewerPersona": {
    "demographics": "Age range, gender, location estimates (Vietnamese)",
    "interests": ["interest 1", "interest 2", "interest 3"],
    "painPoints": ["pain point 1", "pain point 2"],
    "motivations": ["motivation 1", "motivation 2"],
    "description": "2-3 sentence persona summary (Vietnamese)"
  },
  "keyInsights": [
    "Insight 1 about content strategy (Vietnamese)",
    "Insight 2 about what works (Vietnamese)",
    "Insight 3 about opportunity gaps (Vietnamese)"
  ],
  "publishingPatterns": {
    "avgPerMonth": 4,
    "bestPerformingPeriod": "Description of when best videos were published",
    "trend": "Growing/Stable/Declining + explanation"
  }
}

IMPORTANT RULES:
- topics: Group videos into 5-10 content topics/themes. Sort by avgViews descending.
- fireRating: 1-3 based on how viral the topic is (3 = most viral)
- formulas: Identify 4-8 title patterns/formulas used. Include 2-4 example videos per formula.
- viewerPersona: Infer from content themes who watches this channel.
- keyInsights: 3-5 actionable strategic insights in Vietnamese.
- All descriptions and insights should be in Vietnamese.
- Topic names should be in English.`;

  const res = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json'
      }
    })
  });

  const data = await res.json();

  if (data.error) {
    throw new Error(`Gemini API Error: ${data.error.message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  try {
    // Clean the response - remove markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('[AI] Failed to parse response:', text.slice(0, 500));
    throw new Error('Failed to parse AI response. Please try again.');
  }
}
