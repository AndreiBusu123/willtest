import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class VoiceService {
  private getHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async transcribeAudio(audioBlob: Blob): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await axios.post(
      `${API_URL}/voice/transcribe`,
      formData,
      {
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async synthesizeSpeech(text: string): Promise<Blob> {
    const response = await axios.post(
      `${API_URL}/voice/synthesize`,
      { text },
      {
        headers: this.getHeaders(),
        responseType: 'blob',
      }
    );
    return response.data;
  }

  async getVoiceSettings() {
    const response = await axios.get(`${API_URL}/voice/settings`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async updateVoiceSettings(settings: {
    language?: string;
    voice?: string;
    speed?: number;
    pitch?: number;
  }) {
    const response = await axios.put(
      `${API_URL}/voice/settings`,
      settings,
      { headers: this.getHeaders() }
    );
    return response.data;
  }
}

export default new VoiceService();