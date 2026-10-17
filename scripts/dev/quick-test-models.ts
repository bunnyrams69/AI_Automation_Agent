import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

const modelsToTest = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-2.5-pro',
  'gemini-flash-latest',
];

async function testWithTimeout(model: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log(`Testing ${model}...`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await ai.models.generateContent({
      model,
      contents: 'Say hi in 1 word',
    });
    clearTimeout(timeout);
    console.log(`✅ ${model} SUCCESS:`, res.text?.trim());
    return true;
  } catch (err: any) {
    clearTimeout(timeout);
    console.log(`❌ ${model} ERROR:`, err.message?.slice(0, 150));
    return false;
  }
}

async function run() {
  for (const m of modelsToTest) {
    await testWithTimeout(m);
  }
}

run();
