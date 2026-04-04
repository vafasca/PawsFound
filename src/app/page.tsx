'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import TopAppBar from '@/components/pawsfound/TopAppBar';
import BottomNavBar from '@/components/pawsfound/BottomNavBar';
import PwaInstallBanner from '@/components/pawsfound/PwaInstallBanner';
import HomeView from '@/components/pawsfound/HomeView';
import MapView from '@/components/pawsfound/MapView';
import ReportView from '@/components/pawsfound/ReportView';
import ProfileView from '@/components/pawsfound/ProfileView';
import PetDetailModal from '@/components/pawsfound/PetDetailModal';
import AuthModal from '@/components/pawsfound/AuthModal';
import ChatDrawer from '@/components/pawsfound/ChatDrawer';
import AdminDashboard from '@/components/pawsfound/AdminDashboard';
import SettingsModals from '@/components/pawsfound/SettingsModals';
import AddPetModal from '@/components/pawsfound/AddPetModal';
import OneSignalBootstrap from '@/components/pawsfound/OneSignalBootstrap';

function AppContent() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setSelectedReport = useAppStore((s) => s.setSelectedReport);
  const setShowDetail = useAppStore((s) => s.setShowDetail);
  const showAuth = useAppStore((s) => s.showAuth);
  const showChat = useAppStore((s) => s.showChat);
  const showAdmin = useAppStore((s) => s.showAdmin);
  const showSettings = useAppStore((s) => s.showSettings);
  const showAddPet = useAppStore((s) => s.showAddPet);
  const { isAuthenticated } = useAuth();

  // Read initial tab from URL (for PWA shortcuts)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'map' || tab === 'report' || tab === 'profile') {
      setActiveTab(tab);
    }
    const reportId = params.get('reportId');
    if (reportId) {
      setActiveTab('home');
      setSelectedReport(reportId);
      setShowDetail(true);
    }
  }, [setActiveTab, setSelectedReport, setShowDetail]);

  const isMap = activeTab === 'map';

  return (
    <div className="min-h-screen bg-paw-bg flex flex-col">
      <TopAppBar />

      {/* Main content */}
      <main
        className={`flex-1 ${
          isMap
            ? 'fixed inset-0 pt-[60px] sm:pt-[108px] pb-[60px] sm:pb-0 z-0'
            : 'pt-[60px] sm:pt-[108px] pb-[72px] sm:pb-4'
        }`}
      >
        <div className={`mx-auto w-full max-w-6xl ${isMap ? 'h-full' : ''}`}>
          <div className={`h-full ${isMap ? '' : 'px-4 sm:px-6 lg:px-8'}`}>
            {activeTab === 'home' && (
              <div className="py-4 sm:py-6 max-w-6xl">
                <HomeView />
              </div>
            )}

            {activeTab === 'map' && <MapView />}

            {activeTab === 'report' && (
              <div className="py-4 sm:py-6 flex justify-center">
                <div className="w-full max-w-lg">
                  <ReportView />
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="py-4 sm:py-6 flex justify-center">
                <div className="w-full max-w-2xl">
                  <ProfileView />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNavBar />
      {isAuthenticated && <OneSignalBootstrap />}
      <PetDetailModal />
      <PwaInstallBanner />

      {/* Overlays and modals */}
      {showAuth && <AuthModal />}
      <ChatDrawer />
      {showAdmin && <AdminDashboard />}
      <SettingsModals
        activeSection={showSettings}
        onClose={() => useAppStore.getState().setShowSettings(null)}
      />
      <AddPetModal />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
