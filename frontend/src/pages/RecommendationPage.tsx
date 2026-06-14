import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, RefreshCw, Settings, LogOut } from 'lucide-react';
import { recommendationApi, authApi, Recommendation, User } from '../api';
import RecommendationCard from '../components/RecommendationCard';
import CountdownTimer from '../components/CountdownTimer';

interface Props {
  user: User | null;
}

export default function RecommendationPage({ user }: Props) {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextLoading, setNextLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecommendation = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await recommendationApi.getToday();
      setRecommendation(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  async function handleNext() {
    setNextLoading(true);
    setError('');
    try {
      const res = await recommendationApi.getNext();
      setRecommendation(res.data);
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
    fetchRecommendation();
  }

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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Today's Discovery</h1>
          <p className="text-gray-400">Your AI-curated song for today</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-spotify-green mb-4" />
            <p className="text-gray-400">Finding your perfect song...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 mb-6">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchRecommendation}
                className="px-6 py-2 bg-spotify-green text-black font-semibold rounded-full hover:bg-green-400 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : recommendation ? (
          <>
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onFeedback={(feedback) => {
                setRecommendation({ ...recommendation, feedback });
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
                onClick={handleNext}
                disabled={nextLoading}
                className="w-full flex items-center justify-center gap-2 bg-spotify-gray hover:bg-white/10 text-white font-semibold py-3 px-6 rounded-full transition-all duration-200 border border-white/10"
              >
                {nextLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Next Recommendation
                  </>
                )}
              </button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
