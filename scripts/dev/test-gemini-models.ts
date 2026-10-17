import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

async function listAllModels() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const list = await ai.models.list();
    console.log('Available Models for this API Key:');
    for await (const m of list) {
      if (m.name?.includes('gemini') && m.supportedActions?.includes('generateContent')) {
        console.log('-', m.name, `(${m.displayName})`);
      }
    }
  } catch (err: any) {
    console.error('List models error:', err.message);
  }
}

listAllModels();
