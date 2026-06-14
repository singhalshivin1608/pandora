import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, RefreshCw, Settings, LogOut, Sparkles } from 'lucide-react';
import { recommendationApi, authApi, preferencesApi, Recommendation, User, Preferences } from '../api';
import RecommendationCard from '../components/RecommendationCard';
import CountdownTimer from '../components/CountdownTimer';

interface Props {
  user: User | null;
}

type PageState = 'checking' | 'mood-picker' | 'loading' | 'ready' | 'error';

export default function RecommendationPage({ user }: Props) {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('checking');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [error, setError] = useState('');
  const [nextLoading, setNextLoading] = useState(false);

  useEffect(() => {
    checkForExisting();
  }, []);

  async function checkForExisting() {
    try {
      const [recRes, prefsRes] = await Promise.all([
        recommendationApi.getToday(),
        preferencesApi.get(),
      ]);
      setPreferences(prefsRes.data);
      setRecommendation(recRes.data);
      setPageState('ready');
    } catch (err: any) {
      if (err.response?.status === 500 || !err.response) {
        setError(err.response?.data?.error || 'Something went wrong.');
        setPageState('error');
      } else {
        // No recommendation yet — show mood picker
        try {
          const prefsRes = await preferencesApi.get();
          setPreferences(prefsRes.data);
        } catch {}
        setPageState('mood-picker');
      }
    }
  }

  async function handleMoodSelect(mood: string) {
    setPageState('loading');
    setError('');
    try {
      const res = await recommendationApi.getNext(mood);
      setRecommendation(res.data);
      setPageState('ready');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to get recommendation. Please try again.');
      setPageState('error');
    }
  }

  async function handleNext(mood?: string) {
    setNextLoading(true);
    setError('');
    try {
      const res = await recommendationApi.getNext(mood);
      setRecommendation(res.data);
      setPageState('ready');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to get next recommendation.');
    } finally {
      setNextLoading(false);
    }
  }

  async function handleLogout() {
    await authApi.logout();
    navigate('/');
    window.location.reload();
  }

  function handleExpired() {
    setPageState('mood-picker');
    setRecommendation(null);
  }

  const moodOptions = [
    ...(preferences?.languages || []).map(l => ({ label: l, emoji: '🌍', type: 'language' })),
    ...(preferences?.genres || []).map(g => ({ label: g, emoji: '🎵', type: 'genre' })),
  ];

  return (
    <div className="min-h-screen bg-spotify-dark">
      <header className="p-4 md:p-6 flex items-center gap-3 border-b border-white/10">
        <Music className="w-7 h-7 text-spotify-green" />
        <span className="text-xl font-bold text-white">Pandora</span>
        <div className="ml-auto flex items-center gap-3">
          {user?.display_name && (
            <span className="text-gray-400 text-sm hidden sm:block">{user.display_name}</span>
          )}
          <button
            onClick={() => navigate('/preferences')}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {pageState === 'checking' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-spotify-green" />
          </div>
        )}

        {pageState === 'mood-picker' && (
          <div className="text-center">
            <h1 className="text-3xl font-black text-white mb-2">What are you in the mood for?</h1>
            <p className="text-gray-400 mb-8">Pick a vibe and we'll find a hidden gem for you</p>

            {moodOptions.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {moodOptions.map(({ label, type }) => (
                  <button
                    key={`${type}-${label}`}
                    onClick={() => handleMoodSelect(`${type === 'language' ? label + ' music' : label + ' genre'}`)}
                    className="px-4 py-3 rounded-xl text-sm font-semibold bg-spotify-gray hover:bg-white/10 text-white border border-white/10 hover:border-spotify-green/50 transition-all duration-150"
                  >
                    {label}
                    <span className="block text-xs text-gray-400 font-normal mt-0.5 capitalize">{type}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => handleMoodSelect('surprise')}
              className="w-full flex items-center justify-center gap-2 bg-spotify-green hover:bg-green-400 text-black font-bold py-4 rounded-full transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-spotify-green/20"
            >
              <Sparkles className="w-5 h-5" />
              Surprise me — I don't know what I want
            </button>
          </div>
        )}

        {pageState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-spotify-green mb-4" />
            <p className="text-gray-400">Finding your perfect song...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
          </div>
        )}

        {pageState === 'error' && (
          <div className="text-center py-12">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 mb-6">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => setPageState('mood-picker')}
                className="px-6 py-2 bg-spotify-green text-black font-semibold rounded-full hover:bg-green-400 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {pageState === 'ready' && recommendation && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-black text-white mb-1">Today's Discovery</h1>
              <p className="text-gray-400 text-sm">Your AI-curated hidden gem</p>
            </div>

            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onFeedback={(feedback) => {
                setRecommendation({ ...recommendation, feedback });
                if (feedback === 'heard') {
                  setTimeout(() => setPageState('mood-picker'), 1500);
                }
              }}
            />

            <div className="mt-6 space-y-4">
              {recommendation.valid_until && (
                <CountdownTimer
                  validUntil={recommendation.valid_until}
                  onExpired={handleExpired}
                />
              )}

              <button
                onClick={() => setPageState('mood-picker')}
                disabled={nextLoading}
                className="w-full flex items-center justify-center gap-2 bg-spotify-gray hover:bg-white/10 text-white font-semibold py-3 px-6 rounded-full transition-all duration-200 border border-white/10"
              >
                <RefreshCw className="w-4 h-4" />
                Next Recommendation
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
