import axios from 'axios';
import { Conversation, Message } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ConversationService {
  private getHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await axios.get(`${API_URL}/conversations`, { headers: this.getHeaders() });
    return response.data;
  }

  async getConversation(id: string): Promise<Conversation> {
    const response = await axios.get(`${API_URL}/conversations/${id}`, { headers: this.getHeaders() });
    return response.data;
  }

  async createConversation(title: string): Promise<Conversation> {
    const response = await axios.post(
      `${API_URL}/conversations`,
      { title },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await axios.post(
      `${API_URL}/conversations/${conversationId}/messages`,
      { content },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async deleteConversation(id: string): Promise<void> {
    await axios.delete(`${API_URL}/conversations/${id}`, { headers: this.getHeaders() });
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const response = await axios.put(
      `${API_URL}/conversations/${id}`,
      updates,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async searchConversations(query: string): Promise<Conversation[]> {
    const response = await axios.get(
      `${API_URL}/conversations/search?q=${encodeURIComponent(query)}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }
}

export default new ConversationService();