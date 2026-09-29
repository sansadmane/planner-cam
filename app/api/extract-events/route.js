import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('plannerImage');
    
    if (!file) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash', // Updated model!
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Extract all meetings and appointments from this handwritten planner page." },
            { inlineData: { data: base64Data, mimeType: file.type } }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              date: { type: 'STRING', description: 'Format: YYYY-MM-DD' },
              start_time: { type: 'STRING', description: 'Format: HH:MM in 24h' },
              end_time: { type: 'STRING', description: 'Format: HH:MM in 24h. If missing, assume 1 hour after start_time' }
            },
            required: ['title', 'date', 'start_time']
          }
        }
      }
    });

    const eventsData = JSON.parse(response.text);
    return Response.json({ events: eventsData });
    
  } catch (error) {
    // This catches the Google ApiError so your app doesn't crash!
    console.error("AI API Error:", error);
    return Response.json({ error: "Failed to process image with AI" }, { status: 500 });
  }
}