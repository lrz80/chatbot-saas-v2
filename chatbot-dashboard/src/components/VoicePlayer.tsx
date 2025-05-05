'use client';

import { useState, useRef } from 'react';

interface VoicePlayerProps {
  url: string;
}

export default function VoicePlayer({ url }: VoicePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePlay}
        className="bg-purple-600 hover:bg-purple-500 text-white rounded-full px-4 py-2 text-sm"
      >
        {playing ? '⏸️ Pausar' : '▶️ Escuchar'}
      </button>
      <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} />
    </div>
  );
}
