import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Send, MessageSquare, Mic, Image as ImageIcon, X, Play, Pause, MoreVertical, Trash2, Users, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  user_id: string;
  message: string;
  file_url?: string | null;
  file_type?: string | null;
  voice_duration?: number | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url?: string | null;
  };
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
}

interface TeamChatProps {
  teamId: string;
}

// Track deleted message IDs locally (for "delete for me")
const deletedForMe = new Set<string>();

export default function TeamChat({ teamId }: TeamChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [hiddenMessages, setHiddenMessages] = useState<Set<string>>(new Set(deletedForMe));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load team info and members
  useEffect(() => {
    const loadTeamInfo = async () => {
      const [teamRes, membersRes] = await Promise.all([
        supabase.from('teams').select('id, name, logo_url').eq('id', teamId).single(),
        supabase.from('team_members').select(`
          id,
          user_id,
          role,
          profiles:user_id (full_name, avatar_url, email)
        `).eq('team_id', teamId).eq('is_active', true)
      ]);

      if (teamRes.data) setTeam(teamRes.data);
      if (membersRes.data) setMembers(membersRes.data as unknown as TeamMember[]);
    };

    loadTeamInfo();
  }, [teamId]);

  const loadMessages = async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('team_messages')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        return;
      }

      const userIds = [...new Set(messagesData.map(m => m.user_id))];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, p])
      );

      const messagesWithProfiles = messagesData.map(msg => ({
        ...msg,
        profiles: profilesMap.get(msg.user_id),
      }));

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`team-messages-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            // Immediately remove from local state
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          } else {
            loadMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('team_messages')
        .insert({
          team_id: teamId,
          user_id: user.id,
          message: messageText,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setSending(true);
    try {
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('team-chat-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('team-chat-files')
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from('team_messages')
        .insert({
          team_id: teamId,
          user_id: user.id,
          message: '',
          file_url: publicUrl,
          file_type: 'image',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/ogg';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());
        await uploadVoiceMessage(audioBlob, mimeType);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      audioChunksRef.current = [];
    }
  };

  const uploadVoiceMessage = async (audioBlob: Blob, mimeType: string) => {
    if (!user) return;

    setSending(true);
    try {
      const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'ogg';
      const fileName = `${user.id}/${Date.now()}_voice.${extension}`;
      
      const { error: uploadError } = await supabase.storage
        .from('team-chat-files')
        .upload(fileName, audioBlob, {
          contentType: mimeType
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('team-chat-files')
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from('team_messages')
        .insert({
          team_id: teamId,
          user_id: user.id,
          message: '',
          file_url: publicUrl,
          file_type: 'voice',
          voice_duration: recordingTime,
        });

      if (error) throw error;
      setRecordingTime(0);
      toast.success('Voice message sent');
    } catch (error) {
      console.error('Error uploading voice message:', error);
      toast.error('Failed to upload voice message');
    } finally {
      setSending(false);
    }
  };

  const toggleAudioPlayback = (messageId: string, audioUrl: string) => {
    let audio = audioRefs.current.get(messageId);
    
    if (!audio) {
      audio = new Audio(audioUrl);
      audio.preload = 'auto';
      audioRefs.current.set(messageId, audio);
      
      audio.onended = () => {
        setPlayingAudioId(null);
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        toast.error('Could not play audio');
        setPlayingAudioId(null);
      };
    }

    if (playingAudioId === messageId) {
      audio.pause();
      setPlayingAudioId(null);
    } else {
      if (playingAudioId) {
        const currentAudio = audioRefs.current.get(playingAudioId);
        currentAudio?.pause();
      }
      audio.currentTime = 0;
      audio.play().catch(err => {
        console.error('Playback failed:', err);
        toast.error('Could not play audio');
      });
      setPlayingAudioId(messageId);
    }
  };

  const deleteForMe = (messageId: string) => {
    deletedForMe.add(messageId);
    setHiddenMessages(new Set(deletedForMe));
    toast.success('Message hidden');
  };

  const deleteForEveryone = async (messageId: string) => {
    // Optimistic update - remove immediately from UI
    setMessages(prev => prev.filter(m => m.id !== messageId));
    
    try {
      const { error } = await supabase
        .from('team_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      // Reload messages on error to restore state
      loadMessages();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatMessageTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const formatDateHeader = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const visibleMessages = messages.filter(m => !hiddenMessages.has(m.id));
  
  const groupedMessages = visibleMessages.reduce((acc, msg, index) => {
    const msgDate = new Date(msg.created_at);
    const prevMsg = visibleMessages[index - 1];
    const prevMsgDate = prevMsg ? new Date(prevMsg.created_at) : null;
    
    const needsDateHeader = !prevMsgDate || !isSameDay(msgDate, prevMsgDate);
    
    const isSameUser = prevMsg && prevMsg.user_id === msg.user_id;
    const timeDiff = prevMsg 
      ? (msgDate.getTime() - new Date(prevMsg.created_at).getTime()) / 1000 / 60
      : Infinity;
    const isGrouped = isSameUser && timeDiff < 5 && !needsDateHeader;

    if (needsDateHeader) {
      acc.push({ type: 'date', date: msgDate, id: `date-${msg.id}` });
    }

    acc.push({ 
      type: 'message', 
      ...msg, 
      isGroupStart: !isGrouped 
    });
    
    return acc;
  }, [] as (({ type: 'date'; date: Date; id: string }) | (Message & { type: 'message'; isGroupStart: boolean }))[]);

  const onlineMembers = members.length;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <Sheet>
        <SheetTrigger asChild>
          <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors">
            <Avatar className="h-10 w-10">
              <AvatarImage src={team?.logo_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {team?.name?.charAt(0) || 'T'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground truncate">{team?.name || 'Team Chat'}</h2>
              <p className="text-xs text-muted-foreground">{onlineMembers} members</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={team?.logo_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                  {team?.name?.charAt(0) || 'T'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{team?.name}</p>
                <p className="text-sm text-muted-foreground font-normal">{members.length} members</p>
              </div>
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Members</span>
            </div>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground text-sm">
                      {getUserInitials(member.profiles?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.profiles?.full_name || 'Unknown'}
                      {member.user_id === user?.id && (
                        <span className="text-muted-foreground ml-1">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role || 'Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 rounded-full bg-muted/20 mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground">Start the conversation!</p>
          </div>
        ) : (
          groupedMessages.map((item) => {
            if (item.type === 'date') {
              return (
                <div key={item.id} className="flex justify-center my-4">
                  <span className="px-3 py-1 rounded-lg bg-secondary text-xs text-muted-foreground">
                    {formatDateHeader(item.date)}
                  </span>
                </div>
              );
            }

            const msg = item as Message & { type: 'message'; isGroupStart: boolean };
            const isOwnMessage = msg.user_id === user?.id;
            
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2 mb-1 group",
                  isOwnMessage ? "flex-row-reverse" : "",
                  msg.isGroupStart ? "mt-3" : "mt-0.5"
                )}
              >
                {!isOwnMessage && msg.isGroupStart ? (
                  <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                    <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getUserInitials(msg.profiles?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                ) : !isOwnMessage ? (
                  <div className="w-8 flex-shrink-0" />
                ) : null}
                
                <div className={cn(
                  "flex items-center gap-1 max-w-[75%]",
                  isOwnMessage ? "flex-row-reverse" : ""
                )}>
                  <div
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm relative",
                      isOwnMessage
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-secondary text-foreground rounded-tl-none"
                    )}
                  >
                    {!isOwnMessage && msg.isGroupStart && (
                      <p className="text-xs font-medium text-primary mb-1">
                        {msg.profiles?.full_name || 'Unknown'}
                      </p>
                    )}
                    
                    {msg.file_type === 'image' && msg.file_url && (
                      <div className="mb-1">
                        <img 
                          src={msg.file_url} 
                          alt="Shared image" 
                          className="max-w-full rounded-lg max-h-64 object-cover"
                        />
                      </div>
                    )}
                    
                    {msg.file_type === 'voice' && msg.file_url && (
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <button
                          onClick={() => toggleAudioPlayback(msg.id, msg.file_url!)}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            isOwnMessage 
                              ? "bg-primary-foreground/20 hover:bg-primary-foreground/30" 
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {playingAudioId === msg.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className={cn(
                            "h-1 rounded-full",
                            isOwnMessage ? "bg-primary-foreground/30" : "bg-muted-foreground/30"
                          )}>
                            <div className="h-full w-0 bg-current rounded-full opacity-60"></div>
                          </div>
                        </div>
                        <span className={cn(
                          "text-xs",
                          isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {formatDuration(msg.voice_duration || 0)}
                        </span>
                      </div>
                    )}
                    
                    {msg.message && (
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    )}
                    
                    <p className={cn(
                      "text-[10px] mt-1 text-right",
                      isOwnMessage ? "text-primary-foreground/60" : "text-muted-foreground"
                    )}>
                      {formatMessageTime(new Date(msg.created_at))}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                      <DropdownMenuItem onClick={() => deleteForMe(msg.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete for me
                      </DropdownMenuItem>
                      {isOwnMessage && (
                        <DropdownMenuItem 
                          onClick={() => deleteForEveryone(msg.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete for everyone
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-secondary">
        {isRecording ? (
          <div className="flex items-center gap-3 px-3 py-2 bg-background rounded-full">
            <button
              onClick={cancelRecording}
              className="p-2 rounded-full hover:bg-muted text-destructive"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-foreground text-sm">{formatDuration(recordingTime)}</span>
            </div>
            <button
              onClick={stopRecording}
              className="p-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground"
              disabled={sending}
            >
              <ImageIcon className="h-5 w-5" />
            </button>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message"
              className="flex-1 bg-muted border-0 rounded-full text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              disabled={sending}
            />
            
            {newMessage.trim() ? (
              <button 
                type="submit" 
                disabled={sending}
                className="p-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={sending}
                className="p-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
