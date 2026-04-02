'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Send, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface ChatParticipant {
  id: string;
  name: string;
  avatar: string | null;
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: ChatParticipant;
}

interface ChatRoom {
  id: string;
  name: string;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  participants: { user: ChatParticipant }[];
}

export default function ChatDrawer() {
  const showChat = useAppStore((s) => s.showChat);
  const setShowChat = useAppStore((s) => s.setShowChat);
  const chatRoomId = useAppStore((s) => s.chatRoomId);
  const setChatRoomId = useAppStore((s) => s.setChatRoomId);
  const { user, isAuthenticated } = useAuth();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentUserId = user?.id;

  const fetchRooms = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/chat/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingRooms(false);
    }
  }, [isAuthenticated]);

  const fetchMessages = useCallback(async (roomId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Fetch rooms on open
  useEffect(() => {
    if (showChat) {
      fetchRooms();
    }
  }, [showChat, fetchRooms]);

  // Poll for messages when a room is open
  useEffect(() => {
    if (chatRoomId && showChat) {
      fetchMessages(chatRoomId);
      pollRef.current = setInterval(() => {
        fetchMessages(chatRoomId);
      }, 5000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [chatRoomId, showChat, fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openRoom = (roomId: string) => {
    setChatRoomId(roomId);
    setMessages([]);
  };

  const goBack = () => {
    setChatRoomId(null);
    setMessages([]);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/rooms/${chatRoomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
      }
    } catch {
      toast.error('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (room: ChatRoom) => {
    return room.participants.find((p) => p.user.id !== currentUserId)?.user;
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
    } catch {
      return 'hace un momento';
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const handleClose = (open: boolean) => {
    if (!open) {
      setShowChat(false);
      setChatRoomId(null);
      setMessages([]);
    }
  };

  const activeRoom = chatRoomId ? rooms.find((r) => r.id === chatRoomId) : null;
  const otherUser = activeRoom ? getOtherParticipant(activeRoom) : null;

  return (
    <Sheet open={showChat} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-paw-bg">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-paw-outline-variant/30 shrink-0">
          {chatRoomId && otherUser ? (
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="p-1.5 rounded-lg hover:bg-paw-surface-high transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-paw-on-surface" />
              </button>
              <div className="w-9 h-9 bg-paw-surface-high rounded-full flex items-center justify-center shrink-0">
                {otherUser.avatar ? (
                  <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-paw-on-surface-variant">{getInitials(otherUser.name)}</span>
                )}
              </div>
              <div>
                <SheetTitle className="text-sm font-semibold text-paw-on-surface">{otherUser.name}</SheetTitle>
                <p className="text-[11px] text-paw-on-surface-variant">En línea</p>
              </div>
            </div>
          ) : (
            <SheetTitle className="text-lg font-bold text-paw-on-surface flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-paw-primary" />
              Mensajes
            </SheetTitle>
          )}
        </SheetHeader>

        {/* Room list or chat messages */}
        {!chatRoomId ? (
          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-paw-primary animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <MessageCircle className="w-12 h-12 text-paw-outline mb-3" />
                <p className="text-paw-on-surface-variant">No hay conversaciones</p>
                <p className="text-xs text-paw-outline mt-1">Inicia un chat desde un reporte</p>
              </div>
            ) : (
              <div className="divide-y divide-paw-outline-variant/20">
                {rooms.map((room) => {
                  const other = getOtherParticipant(room);
                  if (!other) return null;
                  return (
                    <button
                      key={room.id}
                      onClick={() => openRoom(room.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-paw-surface-high/50 transition-colors text-left"
                    >
                      <div className="w-11 h-11 bg-paw-surface-high rounded-full flex items-center justify-center shrink-0 relative">
                        {other.avatar ? (
                          <img src={other.avatar} alt={other.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-paw-on-surface-variant">{getInitials(other.name)}</span>
                        )}
                        {room.unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-paw-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-paw-on-surface truncate">{other.name}</span>
                          {room.lastMessage && (
                            <span className="text-[10px] text-paw-outline shrink-0 ml-2">
                              {getTimeAgo(room.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-paw-on-surface-variant truncate mt-0.5">
                          {room.lastMessage ? room.lastMessage.content : 'Sin mensajes'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-paw-primary animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageCircle className="w-10 h-10 text-paw-outline mb-2" />
                  <p className="text-sm text-paw-on-surface-variant">Inicia la conversación</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                          isMine
                            ? 'bg-paw-primary text-white rounded-br-md'
                            : 'bg-paw-surface-high text-paw-on-surface rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isMine ? 'text-white/60' : 'text-paw-outline'
                          }`}
                        >
                          {getTimeAgo(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-paw-outline-variant/30 shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-paw-surface-highest text-sm text-paw-on-surface placeholder:text-paw-outline focus:outline-none focus:ring-2 focus:ring-paw-primary/20"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="w-10 h-10 bg-paw-primary text-white rounded-full flex items-center justify-center hover:bg-paw-on-primary-container transition-colors disabled:opacity-50 shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
