import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, ExternalLink, BookOpen, Lightbulb, TrendingUp, Gem } from 'lucide-react';
import { Recommendation, recommendationApi } from '../api';

interface Props {
  recommendation: Recommendation;
  onFeedback: (feedback: string) => void;
}

export default function RecommendationCard({ recommendation, onFeedback }: Props) {
  const [feedbackSent, setFeedbackSent] = useState<'liked' | 'disliked' | null>(
    recommendation.feedback as any || null
  );
  const [submitting, setSubmitting] = useState(false);

  const rec = recommendation.recommendation_json;

  async function handleFeedback(feedback: 'liked' | 'disliked') {
    if (feedbackSent || submitting) return;
    setSubmitting(true);
    try {
      await recommendationApi.submitFeedback(recommendation.id, feedback);
      setFeedbackSent(feedback);
      onFeedback(feedback);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-spotify-gray rounded-2xl overflow-hidden shadow-2xl">
      <div className="relative">
        {recommendation.album_art_url ? (
          <img
            src={recommendation.album_art_url}
            alt={`${recommendation.track_name} album art`}
            className="w-full aspect-square object-cover"
          />
        ) : (
          <div className="w-full aspect-square bg-gradient-to-br from-spotify-green/30 to-purple-600/30 flex items-center justify-center">
            <svg className="w-24 h-24 text-white/20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
        )}

        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {rec.is_trending && (
            <span className="flex items-center gap-1.5 bg-orange-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              Trending
            </span>
          )}
          {rec.is_hidden_gem && (
            <span className="flex items-center gap-1.5 bg-purple-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
              <Gem className="w-3.5 h-3.5" />
              Hidden Gem
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-white mb-1 leading-tight">{recommendation.track_name}</h2>
          <p className="text-spotify-green font-semibold text-lg">{recommendation.artist_name}</p>
          {recommendation.album_name && (
            <p className="text-gray-400 text-sm mt-1">{recommendation.album_name}</p>
          )}
        </div>

        {recommendation.spotify_url && (
          <a
            href={recommendation.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-spotify-green hover:bg-green-400 text-black font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] mb-6 shadow-lg shadow-spotify-green/20"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Play on Spotify
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <div className="space-y-4">
          <div className="bg-black/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-spotify-green" />
              <h3 className="text-white font-semibold text-sm uppercase tracking-wide">About this Song</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{rec.history}</p>
          </div>

          {rec.is_trending && rec.trending_explanation && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <h3 className="text-orange-400 font-semibold text-sm uppercase tracking-wide">Why It's Trending</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{rec.trending_explanation}</p>
            </div>
          )}

          {rec.is_hidden_gem && rec.hidden_gem_explanation && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gem className="w-4 h-4 text-purple-400" />
                <h3 className="text-purple-400 font-semibold text-sm uppercase tracking-wide">Hidden Gem</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{rec.hidden_gem_explanation}</p>
            </div>
          )}

          <div className="bg-spotify-green/10 border border-spotify-green/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-spotify-green" />
              <h3 className="text-spotify-green font-semibold text-sm uppercase tracking-wide">Why For You</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{rec.why_recommended}</p>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/10">
          {feedbackSent ? (
            <div className="text-center py-2">
              {feedbackSent === 'liked' ? (
                <span className="text-spotify-green font-semibold flex items-center justify-center gap-2">
                  <ThumbsUp className="w-5 h-5" />
                  Liked! We'll find more like this.
                </span>
              ) : (
                <span className="text-gray-400 font-semibold flex items-center justify-center gap-2">
                  <ThumbsDown className="w-5 h-5" />
                  Noted! We'll refine your recommendations.
                </span>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleFeedback('liked')}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-spotify-green/10 hover:bg-spotify-green/20 text-spotify-green border border-spotify-green/30 font-semibold py-3 rounded-xl transition-all duration-150"
              >
                <ThumbsUp className="w-5 h-5" />
                Love it!
              </button>
              <button
                onClick={() => handleFeedback('disliked')}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold py-3 rounded-xl transition-all duration-150"
              >
                <ThumbsDown className="w-5 h-5" />
                Not for me
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
