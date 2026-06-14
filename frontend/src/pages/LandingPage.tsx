import React from 'react';
import { Music, Headphones, Sparkles, Heart, RefreshCw } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-spotify-dark flex flex-col">
      <header className="p-6 flex items-center gap-3">
        <Music className="w-8 h-8 text-spotify-green" />
        <span className="text-2xl font-bold text-white">Pandora</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-spotify-green/20 flex items-center justify-center">
                <Headphones className="w-16 h-16 text-spotify-green" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-spotify-green/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-spotify-green" />
              </div>
            </div>
          </div>

          <h1 className="text-6xl font-black text-white mb-4 tracking-tight">
            Pandora
          </h1>
          <p className="text-2xl text-spotify-green font-semibold mb-6">
            Your Daily Music Discovery
          </p>
          <p className="text-gray-400 text-lg mb-12 leading-relaxed">
            Powered by AI, Pandora analyzes your Spotify listening history to deliver
            one perfectly curated song recommendation every day — complete with its history,
            trending status, and why it's the perfect match for you.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-spotify-gray rounded-xl p-6">
              <Music className="w-8 h-8 text-spotify-green mb-3 mx-auto" />
              <h3 className="text-white font-semibold mb-2">Personalized</h3>
              <p className="text-gray-400 text-sm">Based on your actual listening habits and taste</p>
            </div>
            <div className="bg-spotify-gray rounded-xl p-6">
              <Sparkles className="w-8 h-8 text-spotify-green mb-3 mx-auto" />
              <h3 className="text-white font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-400 text-sm">Claude AI understands the nuances of your music taste</p>
            </div>
            <div className="bg-spotify-gray rounded-xl p-6">
              <RefreshCw className="w-8 h-8 text-spotify-green mb-3 mx-auto" />
              <h3 className="text-white font-semibold mb-2">Daily Fresh</h3>
              <p className="text-gray-400 text-sm">New discovery every 24 hours, gets smarter over time</p>
            </div>
          </div>

          <button
            onClick={() => { window.location.href = '/auth/spotify'; }}
            className="inline-flex items-center gap-3 bg-spotify-green hover:bg-green-400 text-black font-bold text-lg px-10 py-4 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg shadow-spotify-green/30"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Connect with Spotify
          </button>

          <p className="text-gray-500 text-sm mt-6">
            <Heart className="w-4 h-4 inline mr-1 text-spotify-green" />
            Free to use. No data sold. Your taste, your discovery.
          </p>
        </div>
      </main>
    </div>
  );
}
