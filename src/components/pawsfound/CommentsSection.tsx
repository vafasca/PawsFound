'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/lib/auth-context';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface CommentsSectionProps {
  reportId: string;
}

export default function CommentsSection({ reportId }: CommentsSectionProps) {
  const { isAuthenticated, user } = useAuth();
  const setShowAuth = useAppStore((s) => s.setShowAuth);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/reports/${reportId}/comments`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data.comments || []);
      })
      .catch(() => {
        setComments([]);
      })
      .finally(() => setLoading(false));
  }, [reportId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    if (!isAuthenticated) {
      toast.error('Inicia sesión para comentar');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          reportId,
        }),
      });

      if (!res.ok) throw new Error('Error al comentar');

      const data = await res.json();
      setComments((prev) => [data.comment, ...prev]);
      setNewComment('');
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      toast.error('Error al enviar comentario');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
    } catch {
      return 'hace un momento';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-paw-secondary" />
        <span className="text-sm font-medium text-paw-on-surface">
          Comentarios ({comments.length})
        </span>
      </div>

      {/* Comments list */}
      <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-paw-primary animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-paw-on-surface-variant text-center py-4">
            Aún no hay comentarios
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <div className="w-8 h-8 bg-paw-surface-high rounded-full flex items-center justify-center shrink-0">
                {comment.author.avatar ? (
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-paw-on-surface-variant">
                    {getInitials(comment.author.name)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-paw-surface-low rounded-xl p-2.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-paw-on-surface truncate">
                      {comment.author.name}
                    </span>
                    <span className="text-[10px] text-paw-outline">
                      {getTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-paw-on-surface-variant break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Comment input */}
      {isAuthenticated ? (
        <div className="flex items-center gap-2 pt-1">
          <div className="w-7 h-7 bg-paw-primary/10 rounded-full flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-paw-primary">
              {user ? getInitials(user.name) : ''}
            </span>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-paw-surface-highest rounded-full px-3 py-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Escribe un comentario..."
              className="flex-1 bg-transparent text-sm text-paw-on-surface placeholder:text-paw-outline focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="text-paw-primary hover:text-paw-on-primary-container transition-colors disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-paw-on-surface-variant text-center py-2">
          <button
            onClick={() => setShowAuth(true)}
            className="text-paw-primary font-medium hover:underline"
          >
            Inicia sesión
          </button>{' '}
          para comentar
        </p>
      )}
    </div>
  );
}
