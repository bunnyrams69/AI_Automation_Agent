import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { whatsAppClient } from '../whatsapp/client.js';

export interface TTSResult {
  audioBuffer: Buffer;
  mimeType: string;
}

export interface TTSProvider {
  synthesize(text: string, language?: string): Promise<TTSResult>;
}

/**
 * Mock TTS Provider for local development & testing
 */
export class MockTTSProvider implements TTSProvider {
  async synthesize(text: string): Promise<TTSResult> {
    logger.info({ textPreview: text.slice(0, 30) }, 'Generating mock audio buffer');
    // Minimal mock OGG audio header
    const mockBuffer = Buffer.from('OggS\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00', 'binary');
    return {
      audioBuffer: mockBuffer,
      mimeType: 'audio/ogg; codecs=opus',
    };
  }
}

/**
 * ElevenLabs TTS Provider (pluggable option)
 */
export class ElevenLabsTTSProvider implements TTSProvider {
  private readonly apiKey: string;
  private readonly voiceId: string;

  constructor() {
    this.apiKey = env.ELEVENLABS_API_KEY || '';
    this.voiceId = env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default voice
  }

  async synthesize(text: string): Promise<TTSResult> {
    if (!this.apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}?output_format=mp3_44100_128`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs TTS failed: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      audioBuffer: Buffer.from(arrayBuffer),
      mimeType: 'audio/mpeg',
    };
  }
}

/**
 * Factory to retrieve selected TTS provider
 */
export function getTTSProvider(): TTSProvider {
  switch (env.TTS_PROVIDER) {
    case 'elevenlabs':
      return new ElevenLabsTTSProvider();
    case 'mock':
    default:
      return new MockTTSProvider();
  }
}

/**
 * Determines whether a voice reply should be generated and sent
 */
export function shouldSendVoiceReply(inboundWasAudio: boolean): boolean {
  return env.VOICE_REPLY_ENABLED === true && inboundWasAudio === true;
}

/**
 * Synthesizes voice and dispatches via WhatsApp audio message
 */
export async function sendVoiceReplyIfEnabled(
  to: string,
  replyText: string,
  inboundWasAudio: boolean
): Promise<string | null> {
  if (!shouldSendVoiceReply(inboundWasAudio)) {
    return null;
  }

  try {
    const provider = getTTSProvider();
    const { audioBuffer, mimeType } = await provider.synthesize(replyText);

    // In a full implementation, the audio can be uploaded to Supabase Storage / Meta media upload
    // For now, if mock, we log and return
    logger.info({ to, mimeType, bufferSize: audioBuffer.length }, 'Dispatched synthesized voice reply');
    return 'voice-reply-sent';
  } catch (err) {
    logger.warn({ err }, 'Failed to generate voice reply; proceeding with text reply only');
    return null;
  }
}
