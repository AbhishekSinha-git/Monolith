import { http } from './client';

export const chatApi = {
  sendMessage: async (message: string, token: string): Promise<{ reply: string }> => {
    const response = await http.post(
      '/chat',
      { message },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response as { reply: string };
  },
};
