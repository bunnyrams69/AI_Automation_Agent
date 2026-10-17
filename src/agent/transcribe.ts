import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { getSupabase } from '../db/client.js';
import { whatsAppClient } from '../whatsapp/client.js';

export interface TranscriptionResult {
  success: boolean;
  transcript: string | null;
  storagePath: string | null;
  error?: string;
}

/**
 * Downloads audio from WhatsApp Graph API, persists to private Supabase Storage bucket,
 * and transcribes using Gemini audio model (supporting English, Hindi, Telugu, and mixed speech).
 */
export async function downloadAndTranscribeAudio(
  mediaId: string,
  leadWaId: string,
  waMessageId: string,
  mimeType = 'audio/ogg; codecs=opus'
): Promise<TranscriptionResult> {
  try {
    logger.info({ mediaId, leadWaId }, 'Fetching WhatsApp voice note media URL');
    const { url, mimeType: metaMimeType } = await whatsAppClient.getMediaUrl(mediaId);
    const finalMime = metaMimeType || mimeType;

    logger.info({ mediaId }, 'Downloading voice note binary');
    const audioBuffer = await whatsAppClient.downloadMedia(url);

    // 1. Upload to Supabase Storage private "voice-notes" bucket
    const supabase = getSupabase();
    const cleanMime = finalMime.split(';')[0].trim();
    const ext = cleanMime.includes('ogg') ? 'ogg' : cleanMime.includes('mp4') ? 'm4a' : 'audio';
    const storagePath = `${leadWaId}/${waMessageId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('voice-notes')
      .upload(storagePath, audioBuffer, {
        contentType: cleanMime,
        upsert: true,
      });

    if (uploadError) {
      logger.warn({ uploadError, storagePath }, 'Failed to persist voice note to Supabase Storage');
    } else {
      logger.info({ storagePath }, 'Voice note stored in private Supabase Storage');
    }

    // 2. Transcribe with Google Gemini Audio Input
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const base64Audio = audioBuffer.toString('base64');

    logger.info({ model: env.GEMINI_MODEL }, 'Submitting audio to Gemini for multilingual transcription');

    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Audio,
                mimeType: cleanMime,
              },
            },
            {
              text: `You are an accurate voice note transcriber for a local Indian real estate business.
Transcribe the speech in this audio message verbatim.
The speaker may speak English, Hindi, Telugu, or code-mixed speech (Hinglish/Teluglish).
- Write down what the user said in the appropriate script (or Latin transliteration if spoken in mixed vernacular).
- Return ONLY the transcription text.
- Do NOT add quotes, timestamps, or comments like "Here is the transcription:".
- If the audio is silent, unintelligible, or only background static noise, reply exactly with: [INAUDIBLE]`,
            },
          ],
        },
      ],
    });

    const transcriptText = response.text ? response.text.trim() : '';

    if (!transcriptText || transcriptText.includes('[INAUDIBLE]')) {
      logger.warn({ mediaId }, 'Voice note was inaudible or empty');
      return {
        success: false,
        transcript: null,
        storagePath,
        error: 'INAUDIBLE',
      };
    }

    logger.info({ transcriptLength: transcriptText.length }, 'Voice note transcribed successfully');
    return {
      success: true,
      transcript: transcriptText,
      storagePath,
    };
  } catch (err: any) {
    logger.error({ err, mediaId }, 'Error in voice note transcription pipeline');
    return {
      success: false,
      transcript: null,
      storagePath: null,
      error: err.message || 'TRANSCRIPTION_FAILED',
    };
  }
}
