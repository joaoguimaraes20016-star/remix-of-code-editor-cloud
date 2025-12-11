// src/hooks/useTeamChat.ts
import { useEffect, useState } from 'react';
import type { ChatMessage, ChatChannel } from '../lib/chat/types';
// TODO: import Supabase client when you wire realtime

interface UseTeamChatOptions {
  teamId?: string;
  channelId?: string;
}

export function useTeamChat({ teamId, channelId }: UseTeamChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [channel, setChannel] = useState<ChatChannel | null>(null);

  useEffect(() => {
    if (!teamId || !channelId) return;

    setIsLoading(true);

    (async () => {
      try {
        // TODO: load initial messages from Supabase
        const initial: ChatMessage[] = [];
        setMessages(initial);

        const channelMeta: ChatChannel = {
          id: channelId,
          teamId,
          name: 'General',
          type: 'general',
          createdAt: new Date().toISOString(),
        };
        setChannel(channelMeta);

        // TODO: subscribe to realtime updates
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      // TODO: unsubscribe from realtime
    };
  }, [teamId, channelId]);

  async function sendMessage(content: string) {
    if (!teamId || !channelId || !content.trim()) return;

    console.warn('[useTeamChat] sendMessage stub', {
      teamId,
      channelId,
      content,
    });

    // Optimistic local append
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        teamId,
        channelId,
        authorId: 'me',
        authorName: 'Me',
        content,
        createdAt: new Date().toISOString(),
      },
    ]);

    // TODO: insert into Supabase
  }

  return { channel, messages, isLoading, sendMessage };
}
