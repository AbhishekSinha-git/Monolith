import { createClient } from '@supabase/supabase-js';
import { config } from '@/config';

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our chat history tables
export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  is_user: boolean;
  type: 'text' | 'chart' | 'suggestion';
  data?: any;
  created_at: string;
  context?: {
    net_worth?: number;
    portfolio_snapshot?: any;
    market_conditions?: any;
  };
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  last_message_at: string;
  summary?: string;
}

// Helper functions for chat operations
export const chatApi = {
  // Session management
  createSession: async (userId: string, title: string): Promise<ChatSession> => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{
        user_id: userId,
        title,
        last_message_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getSessions: async (userId: string): Promise<ChatSession[]> => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select()
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Message operations
  addMessage: async (
    sessionId: string, 
    message: Omit<ChatMessage, 'id' | 'created_at'>
  ): Promise<ChatMessage> => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        ...message,
        session_id: sessionId,
      }])
      .select()
      .single();

    if (error) throw error;

    // Update session's last_message_at
    await supabase
      .from('chat_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', sessionId);

    return data;
  },

  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select()
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Realtime subscriptions
  subscribeToMessages: (
    sessionId: string, 
    callback: (message: ChatMessage) => void
  ) => {
    return supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => callback(payload.new as ChatMessage)
      )
      .subscribe();
  },

  // Context and history
  searchHistory: async (
    userId: string,
    query: string
  ): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, chat_sessions!inner(*)')
      .eq('chat_sessions.user_id', userId)
      .textSearch('content', query)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  }
};