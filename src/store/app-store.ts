import { create } from 'zustand';

export type TabType = 'home' | 'map' | 'report' | 'profile' | 'chat';

interface AppState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  reportType: 'lost' | 'sighted';
  setReportType: (type: 'lost' | 'sighted') => void;
  reportStep: number;
  setReportStep: (step: number) => void;
  filters: {
    type: 'all' | 'lost' | 'sighted';
    species: 'all' | 'dog' | 'cat' | 'other';
    status: 'all' | 'active' | 'found' | 'closed';
  };
  setFilter: (key: keyof AppState['filters'], value: string) => void;
  selectedReport: string | null;
  setSelectedReport: (id: string | null) => void;
  showDetail: boolean;
  setShowDetail: (show: boolean) => void;
  notifications: number;
  setNotifications: (count: number) => void;
  // Auth state
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  currentUser: Record<string, unknown> | null;
  setCurrentUser: (user: Record<string, unknown> | null) => void;
  // Modals & panels
  showAuth: boolean;
  setShowAuth: (value: boolean) => void;
  showChat: boolean;
  setShowChat: (value: boolean) => void;
  showAdmin: boolean;
  setShowAdmin: (value: boolean) => void;
  showSettings: string | null;
  setShowSettings: (section: string | null) => void;
  showAddPet: boolean;
  setShowAddPet: (value: boolean) => void;
  chatRoomId: string | null;
  setChatRoomId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  reportType: 'lost',
  setReportType: (type) => set({ reportType: type }),
  reportStep: 1,
  setReportStep: (step) => set({ reportStep: step }),
  filters: {
    type: 'all',
    species: 'all',
    status: 'all',
  },
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  selectedReport: null,
  setSelectedReport: (id) => set({ selectedReport: id }),
  showDetail: false,
  setShowDetail: (show) => set({ showDetail: show }),
  notifications: 0,
  setNotifications: (count) => set({ notifications: count }),
  // Auth state
  isAuthenticated: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  // Modals & panels
  showAuth: false,
  setShowAuth: (value) => set({ showAuth: value }),
  showChat: false,
  setShowChat: (value) => set({ showChat: value }),
  showAdmin: false,
  setShowAdmin: (value) => set({ showAdmin: value }),
  showSettings: null,
  setShowSettings: (section) => set({ showSettings: section }),
  showAddPet: false,
  setShowAddPet: (value) => set({ showAddPet: value }),
  chatRoomId: null,
  setChatRoomId: (id) => set({ chatRoomId: id }),
}));
