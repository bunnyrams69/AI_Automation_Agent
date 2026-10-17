import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

const candidates = [
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-2.5-pro',
];

import { agentTools } from '../src/agent/tools/definitions.js';

async function checkCandidates() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = 'gemini-flash-latest';
  try {
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: 'Hi what are the plot sizes' }] }],
      config: {
        systemInstruction: 'You are an AI sales assistant for Apex Green Estates. Emerald Meadows has plot sizes 200, 300, and 500 sq.yds.',
        tools: [{ functionDeclarations: agentTools }],
      },
    });
    console.log(`🎉 SUCCESS with ${model}:`);
    console.log('Text:', res.text);
    console.log('Function calls:', res.functionCalls);
  } catch (err: any) {
    console.log('Error:', err.message);
  }
}

checkCandidates();
