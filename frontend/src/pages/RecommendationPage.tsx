import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, RefreshCw, Settings, LogOut, Sparkles, Globe, Tag, X } from 'lucide-react';
import { recommendationApi, authApi, preferencesApi, Recommendation, User, Preferences } from '../api';
import RecommendationCard from '../components/RecommendationCard';
import CountdownTimer from '../components/CountdownTimer';

const ALL_LANGUAGES = [
  'English', 'Spanish', 'French', 'Hindi', 'Korean', 'Japanese',
  'Portuguese', 'Arabic', 'German', 'Italian', 'Punjabi', 'Tamil',
  'Telugu', 'Bengali', 'Urdu', 'Turkish', 'Russian', 'Swahili',
  'Mandarin', 'Cantonese',
];

const ALL_GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical', 'Electronic',
  'Country', 'Folk', 'Indie', 'Metal', 'Reggae', 'Blues', 'Soul',
  'Funk', 'Latin', 'World', 'Ambient', 'Dance', 'Alternative',
];

interface Props {
  user: User | null;
}

type PageState = 'checking' | 'mood-picker' | 'loading' | 'ready' | 'error';

interface PickerModal {
  type: 'language' | 'genre';
  selected: string;
}

export default function RecommendationPage({ user }: Props) {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('checking');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [error, setError] = useState('');
  const [nextLoading, setNextLoading] = useState(false);
  const [modal, setModal] = useState<PickerModal | null>(null);

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
        try {
          const prefsRes = await preferencesApi.get();
          setPreferences(prefsRes.data);
        } catch {}
        setPageState('mood-picker');
      }
    }
  }

  async function handleMoodSelect(mood: string) {
    setModal(null);
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

  async function handleNext() {
    setNextLoading(true);
    setError('');
    try {
      const res = await recommendationApi.getNext();
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

  const userLanguages = preferences?.languages || [];
  const userGenres = preferences?.genres || [];

  // Languages/genres NOT already in the user's saved preferences (for the "Other" picker)
  const otherLanguages = ALL_LANGUAGES.filter(l => !userLanguages.includes(l));
  const otherGenres = ALL_GENRES.filter(g => !userGenres.includes(g));

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
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-white mb-2">What are you in the mood for?</h1>
              <p className="text-gray-400">Pick a vibe and we'll find a hidden gem for you</p>
            </div>

            {/* Languages section */}
            {userLanguages.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-spotify-green" />
                  <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Language</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {userLanguages.map(lang => (
                    <button
                      key={lang}
                      onClick={() => handleMoodSelect(`${lang} music`)}
                      className="px-4 py-3 rounded-xl text-sm font-semibold bg-spotify-gray hover:bg-white/10 text-white border border-white/10 hover:border-spotify-green/50 transition-all duration-150 text-left"
                    >
                      {lang}
                    </button>
                  ))}
                  {otherLanguages.length > 0 && (
                    <button
                      onClick={() => setModal({ type: 'language', selected: '' })}
                      className="px-4 py-3 rounded-xl text-sm font-semibold bg-transparent text-spotify-green border border-spotify-green/40 hover:border-spotify-green hover:bg-spotify-green/10 transition-all duration-150 text-left"
                    >
                      + Other language
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Divider */}
            {userLanguages.length > 0 && userGenres.length > 0 && (
              <div className="border-t border-white/10 my-6" />
            )}

            {/* Genres section */}
            {userGenres.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-spotify-green" />
                  <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Genre</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {userGenres.map(genre => (
                    <button
                      key={genre}
                      onClick={() => handleMoodSelect(`${genre} genre`)}
                      className="px-4 py-3 rounded-xl text-sm font-semibold bg-spotify-gray hover:bg-white/10 text-white border border-white/10 hover:border-spotify-green/50 transition-all duration-150 text-left"
                    >
                      {genre}
                    </button>
                  ))}
                  {otherGenres.length > 0 && (
                    <button
                      onClick={() => setModal({ type: 'genre', selected: '' })}
                      className="px-4 py-3 rounded-xl text-sm font-semibold bg-transparent text-spotify-green border border-spotify-green/40 hover:border-spotify-green hover:bg-spotify-green/10 transition-all duration-150 text-left"
                    >
                      + Other genre
                    </button>
                  )}
                </div>
              </div>
            )}

            {userLanguages.length === 0 && userGenres.length === 0 && (
              <div className="mb-6 text-center text-gray-400 text-sm">
                <p>No preferences saved yet. <button onClick={() => navigate('/preferences')} className="text-spotify-green underline">Set your preferences</button> or just surprise me below!</p>
              </div>
            )}

            <div className="border-t border-white/10 mt-6 pt-6">
              <button
                onClick={() => handleMoodSelect('surprise')}
                className="w-full flex items-center justify-center gap-2 bg-spotify-green hover:bg-green-400 text-black font-bold py-4 rounded-full transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-spotify-green/20"
              >
                <Sparkles className="w-5 h-5" />
                Surprise me — I don't know what I want
              </button>
            </div>
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

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                {modal.type === 'language'
                  ? <Globe className="w-5 h-5 text-spotify-green" />
                  : <Tag className="w-5 h-5 text-spotify-green" />
                }
                <h2 className="text-white font-bold text-lg">
                  {modal.type === 'language' ? 'Pick a Language' : 'Pick a Genre'}
                </h2>
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-2">
                {(modal.type === 'language' ? otherLanguages : otherGenres).map(item => (
                  <button
                    key={item}
                    onClick={() => handleMoodSelect(
                      modal.type === 'language' ? `${item} music` : `${item} genre`
                    )}
                    className="px-4 py-3 rounded-xl text-sm font-semibold bg-spotify-gray hover:bg-spotify-green hover:text-black text-white border border-white/10 hover:border-spotify-green transition-all duration-150 text-left"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
