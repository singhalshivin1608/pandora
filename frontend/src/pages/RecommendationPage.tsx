import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, RefreshCw, Settings, LogOut, Sparkles, Globe, Tag, X, ChevronDown, Heart } from 'lucide-react';
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

const ALL_MOODS = [
  'Romantic', 'Upbeat', 'Melancholic', 'Chill', 'Energetic', 'Nostalgic',
  'Motivational', 'Dreamy', 'Dark', 'Happy', 'Heartbreak', 'Party',
  'Late Night', 'Focus', 'Road Trip', 'Rainy Day',
];

interface Props {
  user: User | null;
}

type PageState = 'checking' | 'mood-picker' | 'loading' | 'ready' | 'error';
type ModalType = 'language' | 'genre' | 'mood' | null;

export default function RecommendationPage({ user }: Props) {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('checking');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [error, setError] = useState('');
  const [nextLoading, setNextLoading] = useState(false);

  // Mood picker selections — null means "pick for me"
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<ModalType>(null);

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

  function buildMood(lang: string | null, genre: string | null, mood: string | null): string {
    const parts: string[] = [];
    if (lang) parts.push(`${lang} music`);
    if (genre) parts.push(`${genre} genre`);
    if (mood) parts.push(`${mood} mood`);
    return parts.length > 0 ? parts.join(', ') : 'surprise';
  }

  async function handleDiscover() {
    setPageState('loading');
    setError('');
    const mood = buildMood(selectedLanguage, selectedGenre, selectedMood);
    try {
      const res = await recommendationApi.getNext(mood);
      setRecommendation(res.data);
      setPageState('ready');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to get recommendation. Please try again.');
      setPageState('error');
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

  function goToMoodPicker() {
    setSelectedLanguage(null);
    setSelectedGenre(null);
    setSelectedMood(null);
    setPageState('mood-picker');
  }

  const userLanguages = preferences?.languages || [];
  const userGenres = preferences?.genres || [];
  const otherLanguages = ALL_LANGUAGES.filter(l => !userLanguages.includes(l));
  const otherGenres = ALL_GENRES.filter(g => !userGenres.includes(g));
  // Show first 8 moods inline, rest in modal
  const inlineMoods = ALL_MOODS.slice(0, 8);
  const otherMoods = ALL_MOODS.slice(8);

  const languageOptions = userLanguages;
  const genreOptions = userGenres;

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
              <p className="text-gray-400">Choose a language and genre — or let us pick for you</p>
            </div>

            {/* Language selector */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-spotify-green" />
                <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Language</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* Pick for me */}
                <button
                  onClick={() => setSelectedLanguage(null)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-150 text-left ${
                    selectedLanguage === null
                      ? 'bg-spotify-green text-black border-spotify-green'
                      : 'bg-transparent text-gray-400 border-white/20 hover:border-white/40 hover:text-white'
                  }`}
                >
                  <span className="block">Pick for me</span>
                  <span className="block text-xs font-normal mt-0.5 opacity-70">Any language</span>
                </button>

                {languageOptions.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-150 text-left ${
                      selectedLanguage === lang
                        ? 'bg-spotify-green text-black border-spotify-green'
                        : 'bg-spotify-gray text-white border-white/10 hover:border-spotify-green/50 hover:bg-white/10'
                    }`}
                  >
                    {lang}
                  </button>
                ))}

                {/* Other languages button */}
                <button
                  onClick={() => setOpenModal('language')}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-150 text-left flex items-center justify-between ${
                    selectedLanguage && !languageOptions.includes(selectedLanguage)
                      ? 'bg-spotify-green text-black border-spotify-green'
                      : 'bg-transparent text-spotify-green border-spotify-green/40 hover:border-spotify-green hover:bg-spotify-green/10'
                  }`}
                >
                  <span>
                    {selectedLanguage && !languageOptions.includes(selectedLanguage)
                      ? selectedLanguage
                      : 'Other...'}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-70" />
                </button>
              </div>
            </div>

            <div className="border-t border-white/10 my-5" />

            {/* Genre selector */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-spotify-green" />
                <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Genre</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* Pick for me */}
                <button
                  onClick={() => setSelectedGenre(null)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-150 text-left ${
                    selectedGenre === null
                      ? 'bg-spotify-green text-black border-spotify-green'
                      : 'bg-transparent text-gray-400 border-white/20 hover:border-white/40 hover:text-white'
                  }`}
                >
                  <span className="block">Pick for me</span>
                  <span className="block text-xs font-normal mt-0.5 opacity-70">Any genre</span>
                </button>

                {genreOptions.map(genre => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-150 text-left ${
                      selectedGenre === genre
                        ? 'bg-spotify-green text-black border-spotify-green'
                        : 'bg-spotify-gray text-white border-white/10 hover:border-spotify-green/50 hover:bg-white/10'
                    }`}
                  >
                    {genre}
                  </button>
                ))}

                {/* Other genres button */}
                <button
                  onClick={() => setOpenModal('genre')}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-150 text-left flex items-center justify-between ${
                    selectedGenre && !genreOptions.includes(selectedGenre)
                      ? 'bg-spotify-green text-black border-spotify-green'
                      : 'bg-transparent text-spotify-green border-spotify-green/40 hover:border-spotify-green hover:bg-spotify-green/10'
                  }`}
                >
                  <span>
                    {selectedGenre && !genreOptions.includes(selectedGenre)
                      ? selectedGenre
                      : 'Other...'}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-70" />
                </button>
              </div>
            </div>

            <div className="border-t border-white/10 my-5" />

            {/* Mood / vibe selector */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-spotify-green" />
                <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Vibe / Mood</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedMood(null)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-150 text-left ${
                    selectedMood === null
                      ? 'bg-spotify-green text-black border-spotify-green'
                      : 'bg-transparent text-gray-400 border-white/20 hover:border-white/40 hover:text-white'
                  }`}
                >
                  <span className="block">Pick for me</span>
                  <span className="block text-xs font-normal mt-0.5 opacity-70">Any vibe</span>
                </button>

                {inlineMoods.map(mood => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-150 text-left ${
                      selectedMood === mood
                        ? 'bg-spotify-green text-black border-spotify-green'
                        : 'bg-spotify-gray text-white border-white/10 hover:border-spotify-green/50 hover:bg-white/10'
                    }`}
                  >
                    {mood}
                  </button>
                ))}

                <button
                  onClick={() => setOpenModal('mood')}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-150 text-left flex items-center justify-between ${
                    selectedMood && !inlineMoods.includes(selectedMood)
                      ? 'bg-spotify-green text-black border-spotify-green'
                      : 'bg-transparent text-spotify-green border-spotify-green/40 hover:border-spotify-green hover:bg-spotify-green/10'
                  }`}
                >
                  <span>
                    {selectedMood && !inlineMoods.includes(selectedMood) ? selectedMood : 'Other...'}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-70" />
                </button>
              </div>
            </div>

            {/* Summary + discover button */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <div className="flex-1 text-sm text-gray-300 flex flex-wrap gap-x-2 gap-y-1">
                <span className="text-white font-semibold">{selectedLanguage ?? 'Any language'}</span>
                <span className="text-gray-500">·</span>
                <span className="text-white font-semibold">{selectedGenre ?? 'Any genre'}</span>
                <span className="text-gray-500">·</span>
                <span className="text-white font-semibold">{selectedMood ?? 'Any vibe'}</span>
              </div>
              {(selectedLanguage || selectedGenre || selectedMood) && (
                <button
                  onClick={() => { setSelectedLanguage(null); setSelectedGenre(null); setSelectedMood(null); }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={handleDiscover}
              className="w-full flex items-center justify-center gap-2 bg-spotify-green hover:bg-green-400 text-black font-bold py-4 rounded-full transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-spotify-green/20"
            >
              {!selectedLanguage && !selectedGenre ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Surprise me!
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Find my hidden gem
                </>
              )}
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
                  setTimeout(() => goToMoodPicker(), 1500);
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
                onClick={goToMoodPicker}
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

      {/* Other language/genre modal */}
      {openModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setOpenModal(null)}
        >
          <div
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                {openModal === 'language' ? <Globe className="w-5 h-5 text-spotify-green" />
                  : openModal === 'genre' ? <Tag className="w-5 h-5 text-spotify-green" />
                  : <Heart className="w-5 h-5 text-spotify-green" />}
                <h2 className="text-white font-bold text-lg">
                  {openModal === 'language' ? 'Pick a Language' : openModal === 'genre' ? 'Pick a Genre' : 'Pick a Vibe'}
                </h2>
              </div>
              <button
                onClick={() => setOpenModal(null)}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-2">
                {(openModal === 'language' ? otherLanguages : openModal === 'genre' ? otherGenres : otherMoods).map(item => (
                  <button
                    key={item}
                    onClick={() => {
                      if (openModal === 'language') setSelectedLanguage(item);
                      else if (openModal === 'genre') setSelectedGenre(item);
                      else setSelectedMood(item);
                      setOpenModal(null);
                    }}
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
