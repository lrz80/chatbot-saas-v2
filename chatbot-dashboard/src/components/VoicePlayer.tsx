'use client';

import { useState, useRef, useEffect } from 'react';

interface VoicePlayerProps {
  url: string;
}

export default function VoicePlayer({ url }: VoicePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      // Detener otros reproductores
      document.querySelectorAll('audio').forEach((el) => {
        if (el !== audioRef.current) el.pause();
      });

      setLoading(true);
      audioRef.current.play().then(() => {
        setPlaying(true);
      }).catch(() => {
        setPlaying(false);
      }).finally(() => {
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    const current = audioRef.current;
    if (!current) return;

    const handleEnded = () => setPlaying(false);
    current.addEventListener('ended', handleEnded);

    return () => {
      current.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePlay}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-500 text-white rounded-full px-4 py-2 text-sm disabled:opacity-50"
        aria-label={playing ? 'Pausar audio' : 'Reproducir audio'}
      >
        {loading ? '⏳ Cargando...' : playing ? '⏸️ Pausar' : '▶️ Escuchar'}
      </button>
      <audio ref={audioRef} src={url} preload="auto" />
    </div>
  );
}
