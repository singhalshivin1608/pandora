import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  validUntil: number;
  onExpired: () => void;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

export default function CountdownTimer({ validUntil, onExpired }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, validUntil - now);
  });

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpired();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [validUntil, onExpired]);

  return (
    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-3 px-4 bg-black/20 rounded-xl border border-white/5">
      <Clock className="w-4 h-4 text-spotify-green" />
      <span>Next refresh in: <span className="text-white font-mono font-semibold">{formatTime(secondsLeft)}</span></span>
    </div>
  );
}
