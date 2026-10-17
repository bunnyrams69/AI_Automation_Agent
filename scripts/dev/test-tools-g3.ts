import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';
import { agentTools } from '../src/agent/tools/definitions.js';

async function testMultiTurnTools() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents: any[] = [
    { role: 'user', parts: [{ text: 'Hi, what properties do you have and what are their prices?' }] },
  ];

  console.log('Turn 1: sending user question...');
  const res1 = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction: 'You are a real estate agent. Call list_sites.',
      tools: [{ functionDeclarations: agentTools }],
    },
  });

  console.log('Turn 1 function calls:', res1.functionCalls?.map((f: any) => f.name));
  // Append model turn preserving thought_signature
  contents.push(res1.candidates![0].content);

  // Append tool response
  contents.push({
    role: 'user',
    parts: [
      {
        functionResponse: {
          name: 'list_sites',
          response: {
            sites: [
              { name: 'Emerald Meadows', price: '₹22,000/sq.yd' },
            ],
          },
        },
      },
    ],
  });

  console.log('Turn 2: sending function response back to Gemini...');
  const res2 = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction: 'You are a real estate agent. Call list_sites.',
      tools: [{ functionDeclarations: agentTools }],
    },
  });

  console.log('Turn 2 final text:', res2.text);
  console.log('SUCCESS: Turn 2 completed without thought_signature error!');
}

testMultiTurnTools();
