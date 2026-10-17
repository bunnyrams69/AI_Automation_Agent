import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';
import { agentTools } from '../src/agent/tools/definitions.js';

async function testTools() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log('Testing gemini-flash-latest with tools...');
  const start = Date.now();
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
      config: {
        systemInstruction: 'You are a friendly assistant.',
        tools: [{ functionDeclarations: agentTools }],
      },
    });
    console.log(`Finished in ${Date.now() - start}ms`);
    console.log('Result text:', res.text);
    console.log('Function calls:', res.functionCalls);
  } catch (err: any) {
    console.error('Error with tools:', err);
  }
}

testTools();
