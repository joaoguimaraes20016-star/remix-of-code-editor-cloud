// src/lib/chat/types.ts

export interface ChatChannel {
  id: string;
  teamId: string;
  name: string;
  type: 'general' | 'deal' | 'role' | 'custom';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  teamId: string;
  channelId: string;
  authorId: string;
  authorName: string | null;
  content: string;
  createdAt: string;
}
