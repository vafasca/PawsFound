'use client';

import { Home, Map, PlusCircle, MessageCircle, User } from 'lucide-react';
import { useAppStore, type TabType } from '@/store/app-store';

const tabs: { id: TabType; label: string; icon: React.ElementType; highlight?: boolean }[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'report', label: 'Reportar', icon: PlusCircle, highlight: true },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'profile', label: 'Perfil', icon: User },
];

export default function BottomNavBar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setShowChat = useAppStore((s) => s.setShowChat);

  const handleTabClick = (tabId: TabType) => {
    if (tabId === 'chat') {
      setShowChat(true);
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <>
      {/* Desktop top nav bar with glass */}
      <nav className="hidden sm:flex fixed top-[60px] left-0 right-0 z-40 glass shadow-ambient px-6">
        <div className="flex items-center gap-1 max-w-5xl mx-auto w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-glass ${
                  tab.highlight
                    ? 'bg-gradient-to-br from-paw-primary to-paw-primary-container text-white shadow-ambient'
                    : isActive
                      ? 'text-paw-primary'
                      : 'text-paw-on-surface-variant hover:text-paw-on-surface'
                }`}
              >
                {isActive && !tab.highlight && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-paw-primary rounded-full" />
                )}
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom nav bar with glass */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass rounded-t-3xl shadow-ambient-lg">
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-glass ${
                  tab.highlight
                    ? isActive
                      ? 'bg-gradient-to-br from-paw-primary to-paw-primary-container text-white -mt-3 shadow-ambient-lg px-5 py-1.5 rounded-2xl'
                      : 'bg-paw-surface-high text-paw-primary -mt-1'
                    : isActive
                      ? 'text-paw-primary -mt-1'
                      : 'text-paw-on-surface-variant'
                }`}
              >
                {/* Subtle glow behind active icon */}
                {isActive && !tab.highlight && (
                  <span className="absolute inset-0 bg-paw-primary/5 rounded-2xl" />
                )}
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform duration-200 relative z-10`} />
                <span className="text-[10px] font-medium leading-tight relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}
