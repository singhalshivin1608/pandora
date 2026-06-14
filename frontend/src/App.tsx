import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authApi, preferencesApi, User } from './api';
import LandingPage from './pages/LandingPage';
import PreferencesPage from './pages/PreferencesPage';
import RecommendationPage from './pages/RecommendationPage';

type AuthState = 'loading' | 'unauthenticated' | 'no-preferences' | 'ready';

function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const meRes = await authApi.getMe();
      setUser(meRes.data);

      const prefsRes = await preferencesApi.get();
      if (prefsRes.data.languages && prefsRes.data.languages.length > 0) {
        setAuthState('ready');
      } else {
        setAuthState('no-preferences');
      }
    } catch {
      setAuthState('unauthenticated');
    }
  }

  function handlePreferencesSaved() {
    setAuthState('ready');
  }

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-spotify-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            authState === 'unauthenticated' ? (
              <LandingPage />
            ) : authState === 'no-preferences' ? (
              <Navigate to="/preferences" replace />
            ) : (
              <Navigate to="/recommendation" replace />
            )
          }
        />
        <Route
          path="/preferences"
          element={
            authState === 'unauthenticated' ? (
              <Navigate to="/" replace />
            ) : (
              <PreferencesPage user={user} onSaved={handlePreferencesSaved} />
            )
          }
        />
        <Route
          path="/recommendation"
          element={
            authState === 'unauthenticated' ? (
              <Navigate to="/" replace />
            ) : authState === 'no-preferences' ? (
              <Navigate to="/preferences" replace />
            ) : (
              <RecommendationPage user={user} />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
