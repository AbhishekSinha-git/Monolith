import { chatApi, type ChatMessage, type ChatSession } from '@/api/supabase';
import type { FiMcpConnectionStatus } from '@/api/mcp';

export interface StoredContext {
  netWorth?: number;
  portfolioSnapshot?: any;
  marketConditions?: any;
  connectionStatus: FiMcpConnectionStatus;
}

export class ChatHistoryService {
  private currentSession: ChatSession | null = null;
  private messageListeners: Set<(message: ChatMessage) => void> = new Set();

  constructor(private userId: string) {}

  async initialize(): Promise<void> {
    const sessions = await chatApi.getSessions(this.userId);
    if (sessions.length === 0) {
      this.currentSession = await this.createNewSession();
    } else {
      this.currentSession = sessions[0]; // Get most recent session
    }

    // Subscribe to real-time updates
    if (this.currentSession) {
      chatApi.subscribeToMessages(this.currentSession.id, (message) => {
        this.messageListeners.forEach(listener => listener(message));
      });
    }
  }

  private async createNewSession(): Promise<ChatSession> {
    const title = `Chat ${new Date().toLocaleDateString()}`;
    return await chatApi.createSession(this.userId, title);
  }

  async switchSession(sessionId: string): Promise<void> {
    const sessions = await chatApi.getSessions(this.userId);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    this.currentSession = session;
  }

  async loadMessages(sessionId?: string): Promise<ChatMessage[]> {
    const targetSession = sessionId || this.currentSession?.id;
    if (!targetSession) {
      throw new Error('No active session');
    }
    return await chatApi.getMessages(targetSession);
  }

  async addMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<void> {
    if (!this.currentSession) {
      this.currentSession = await this.createNewSession();
    }
    await chatApi.addMessage(this.currentSession.id, message);
  }

  async searchHistory(query: string): Promise<ChatMessage[]> {
    return await chatApi.searchHistory(this.userId, query);
  }

  onNewMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  async getSessions(): Promise<ChatSession[]> {
    return await chatApi.getSessions(this.userId);
  }

  getCurrentSession(): ChatSession | null {
    return this.currentSession;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await chatApi.deleteSession(sessionId);
    if (this.currentSession?.id === sessionId) {
      const sessions = await this.getSessions();
      this.currentSession = sessions[0] || null;
    }
  }
}