import { useState } from 'react';
import LandingPage from './components/LandingPage';
import AdminDashboardView from './components/AdminDashboardView';
import StudentUserView from './components/StudentUserView';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import LoginModal from './components/LoginModal';

export default function App() {
  const [currentMode, setCurrentMode] = useState<'landing' | 'admin' | 'user'>('landing');
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      {currentMode === 'landing' && (
        <LandingPage
          onOpenAdmin={() => setShowLoginModal(true)}
          onOpenUserSide={() => setShowLoginModal(true)}
        />
      )}

      {currentMode === 'admin' && (
        <AdminDashboardView onBackToLanding={() => setCurrentMode('landing')} />
      )}

      {currentMode === 'user' && (
        <StudentUserView
          onBackToLanding={() => setCurrentMode('landing')}
          onOpenAdmin={() => setCurrentMode('admin')}
        />
      )}

      <PwaInstallPrompt />
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={(mode) => {
          setShowLoginModal(false);
          setCurrentMode(mode);
        }}
      />
    </>
  );
}
