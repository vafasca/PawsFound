'use client';

import { useEffect, useState } from 'react';
import { Lock, Loader2, Award } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  iconUrl: string | null;
}

interface UserBadge {
  id: string;
  earnedAt: string;
  badge: Badge;
}

interface BadgesDisplayProps {
  userId?: string;
}

const categoryLabels: Record<string, string> = {
  social: 'Social',
  comunidad: 'Comunidad',
  rescate: 'Rescate',
  especial: 'Especial',
};

export default function BadgesDisplay({ userId }: BadgesDisplayProps) {
  const { isAuthenticated } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    Promise.all([
      fetch('/api/badges/my').then((r) => (r.ok ? r.json() : { badges: [] })),
      fetch('/api/badges').then((r) => (r.ok ? r.json() : { badges: [] })),
    ])
      .then(([earnedData, allData]) => {
        setEarnedBadges(earnedData.badges || []);
        setAllBadges(allData.badges || []);
      })
      .catch(() => {
        setEarnedBadges([]);
        setAllBadges([]);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const earnedIds = new Set(earnedBadges.map((b) => b.badgeId || b.badge.id));

  // Group by category
  const grouped = allBadges.reduce<Record<string, Badge[]>>((acc, badge) => {
    const cat = badge.category || 'otro';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(badge);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-paw-primary animate-spin" />
      </div>
    );
  }

  if (allBadges.length === 0) {
    return (
      <div className="bg-paw-surface-high rounded-2xl p-6 text-center">
        <Award className="w-8 h-8 text-paw-outline mx-auto mb-2" />
        <p className="text-sm text-paw-on-surface-variant">
          Aún no hay insignias disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, badges]) => (
        <div key={category}>
          <h4 className="text-xs font-bold text-paw-on-surface-variant uppercase tracking-wider mb-2">
            {categoryLabels[category] || category}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {badges.map((badge) => {
              const isEarned = earnedIds.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`relative rounded-xl p-3 transition-all ${
                    isEarned
                      ? 'bg-white shadow-sm border border-paw-primary/20'
                      : 'bg-paw-surface-high opacity-60'
                  }`}
                >
                  {isEarned && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-paw-tertiary text-white rounded-full flex items-center justify-center">
                      <span className="text-[8px]">✓</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{isEarned ? badge.emoji : '🔒'}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isEarned ? 'text-paw-on-surface' : 'text-paw-on-surface-variant'}`}>
                        {badge.name}
                      </p>
                      <p className="text-[10px] text-paw-on-surface-variant line-clamp-1 mt-0.5">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
