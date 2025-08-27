import axios from 'axios';
import { VoiceSettings, MurfVoice } from '../types';

const MURF_API_KEY = import.meta.env.VITE_MURF_API_KEY;
const MURF_API_URL = 'https://api.murf.ai/v1';

const murfApi = axios.create({
  baseURL: MURF_API_URL,
  headers: {
    'Authorization': `Bearer ${MURF_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export class MurfService {
  static async getVoices(): Promise<MurfVoice[]> {
    try {
      const response = await murfApi.get('/voices');
      return response.data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      // Return default voices for demo
      return [
        {
          id: 'en-US-AriaNeural',
          name: 'Aria',
          gender: 'female',
          accent: 'American',
          language: 'English',
        },
        {
          id: 'en-US-GuyNeural',
          name: 'Guy',
          gender: 'male',
          accent: 'American',
          language: 'English',
        },
        {
          id: 'en-GB-SoniaNeural',
          name: 'Sonia',
          gender: 'female',
          accent: 'British',
          language: 'English',
        },
      ];
    }
  }

  static async generateSpeech(
    text: string,
    voiceSettings: VoiceSettings
  ): Promise<string> {
    try {
      const response = await murfApi.post('/speech/generate', {
        text,
        voice_id: voiceSettings.voiceId,
        speed: voiceSettings.speed,
        pitch: voiceSettings.pitch,
        volume: voiceSettings.volume,
        format: 'mp3',
      });

      return response.data.audio_url;
    } catch (error) {
      console.error('Error generating speech:', error);
      // Fallback to browser speech synthesis
      throw new Error('Failed to generate speech with Murf API');
    }
  }

  static async cloneVoice(audioFile: File, name: string = 'Custom Voice'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('name', name);

      const response = await murfApi.post('/voices/clone', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.voice_id;
    } catch (error) {
      console.error('Error cloning voice:', error);
      throw new Error('Failed to clone voice');
    }
  }

  static async dubAudio(
    originalAudioUrl: string,
    targetVoiceId: string
  ): Promise<string> {
    try {
      const response = await murfApi.post('/audio/dub', {
        source_audio_url: originalAudioUrl,
        target_voice_id: targetVoiceId,
      });

      return response.data.dubbed_audio_url;
    } catch (error) {
      console.error('Error dubbing audio:', error);
      throw new Error('Failed to dub audio');
    }
  }

  static async enhanceVoice(
    audioUrl: string,
    enhancements: {
      removeNoise?: boolean;
      enhanceClarity?: boolean;
      normalizeVolume?: boolean;
    }
  ): Promise<string> {
    try {
      const response = await murfApi.post('/audio/enhance', {
        audio_url: audioUrl,
        ...enhancements,
      });

      return response.data.enhanced_audio_url;
    } catch (error) {
      console.error('Error enhancing voice:', error);
      throw new Error('Failed to enhance voice');
    }
  }
}