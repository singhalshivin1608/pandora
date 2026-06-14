import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Globe, Tag, ChevronRight } from 'lucide-react';
import { preferencesApi, User } from '../api';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'Hindi', 'Korean', 'Japanese',
  'Portuguese', 'Arabic', 'German', 'Italian', 'Punjabi', 'Tamil',
  'Telugu', 'Bengali', 'Urdu', 'Turkish', 'Russian', 'Swahili',
  'Mandarin', 'Cantonese',
];

const GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical', 'Electronic',
  'Country', 'Folk', 'Indie', 'Metal', 'Reggae', 'Blues', 'Soul',
  'Funk', 'Latin', 'World', 'Ambient', 'Dance', 'Alternative',
];

interface Props {
  user: User | null;
  onSaved: () => void;
}

export default function PreferencesPage({ user, onSaved }: Props) {
  const navigate = useNavigate();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    preferencesApi.get().then(res => {
      setSelectedLanguages(res.data.languages || []);
      setSelectedGenres(res.data.genres || []);
    }).catch(() => {});
  }, []);

  function toggleItem(item: string, list: string[], setList: (l: string[]) => void) {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  }

  async function handleSave() {
    if (selectedLanguages.length === 0) {
      setError('Please select at least one language.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await preferencesApi.save({ languages: selectedLanguages, genres: selectedGenres });
      onSaved();
      navigate('/recommendation');
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-spotify-dark">
      <header className="p-6 flex items-center gap-3 border-b border-white/10">
        <Music className="w-7 h-7 text-spotify-green" />
        <span className="text-xl font-bold text-white">Pandora</span>
        {user?.display_name && (
          <span className="ml-auto text-gray-400 text-sm">Hi, {user.display_name}!</span>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-3">Set Your Preferences</h1>
          <p className="text-gray-400 text-lg">Tell us what you love and we'll find your perfect daily song.</p>
        </div>

        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-spotify-green" />
            <h2 className="text-xl font-bold text-white">Languages</h2>
            <span className="text-spotify-green text-sm font-medium ml-1">(required)</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">Select the languages of music you want to listen to.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                onClick={() => toggleItem(lang, selectedLanguages, setSelectedLanguages)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  selectedLanguages.includes(lang)
                    ? 'bg-spotify-green text-black'
                    : 'bg-spotify-gray text-gray-300 hover:bg-white/10'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-spotify-green" />
            <h2 className="text-xl font-bold text-white">Genres</h2>
            <span className="text-gray-400 text-sm font-medium ml-1">(optional)</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">Optionally narrow down by genre. Leave empty for full variety.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => toggleItem(genre, selectedGenres, setSelectedGenres)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  selectedGenres.includes(genre)
                    ? 'bg-spotify-green text-black'
                    : 'bg-spotify-gray text-gray-300 hover:bg-white/10'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || selectedLanguages.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-spotify-green hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold text-lg py-4 rounded-full transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-spotify-green/20"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black" />
          ) : (
            <>
              Save & Start Discovering
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </main>
    </div>
  );
}
