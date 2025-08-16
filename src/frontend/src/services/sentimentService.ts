import axios from 'axios';
import { SentimentData } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class SentimentService {
  private getHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async analyzeSentiment(text: string): Promise<SentimentData> {
    const response = await axios.post(
      `${API_URL}/sentiment/analyze`,
      { text },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async getSentimentHistory(conversationId: string): Promise<SentimentData[]> {
    const response = await axios.get(
      `${API_URL}/sentiment/history/${conversationId}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async getSentimentTrends(period: 'daily' | 'weekly' | 'monthly'): Promise<SentimentData[]> {
    const response = await axios.get(
      `${API_URL}/sentiment/trends?period=${period}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async getSentimentReport(startDate: string, endDate: string) {
    const response = await axios.get(
      `${API_URL}/sentiment/report?start=${startDate}&end=${endDate}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async batchAnalyzeSentiment(texts: string[]): Promise<SentimentData[]> {
    const response = await axios.post(
      `${API_URL}/sentiment/batch`,
      { texts },
      { headers: this.getHeaders() }
    );
    return response.data;
  }
}

export default new SentimentService();