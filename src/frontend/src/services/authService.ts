import axios from 'axios';
import { LoginCredentials, RegisterCredentials, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class AuthService {
  private getHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async login(credentials: LoginCredentials) {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    return response.data;
  }

  async register(credentials: RegisterCredentials) {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: credentials.email,
      password: credentials.password,
      name: credentials.name,
    });
    return response.data;
  }

  async logout() {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { headers: this.getHeaders() });
    } catch (error) {
      // Logout anyway even if API call fails
      console.error('Logout API call failed:', error);
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await axios.get(`${API_URL}/auth/me`, { headers: this.getHeaders() });
    return response.data;
  }

  async resetPassword(email: string) {
    const response = await axios.post(`${API_URL}/auth/reset-password`, { email });
    return response.data;
  }

  async updatePassword(oldPassword: string, newPassword: string) {
    const response = await axios.put(
      `${API_URL}/auth/update-password`,
      { oldPassword, newPassword },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async verifyToken() {
    const response = await axios.get(`${API_URL}/auth/verify`, { headers: this.getHeaders() });
    return response.data;
  }
}

export default new AuthService();