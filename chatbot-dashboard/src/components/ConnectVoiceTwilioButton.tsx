'use client';

import { useState } from 'react';
import { BACKEND_URL } from '@/utils/api';

type Props = {
  disabled?: boolean;
  onComplete?: () => void;
};

export default function ConnectVoiceTwilioButton({
  disabled,
  onComplete,
}: Props) {
  const [loading, setLoading] = useState(false);

  const setupVoice = async () => {
    if (disabled || loading) return;

    const ok = window.confirm(
      'Do you want to activate voice for this tenant? A Twilio number may be assigned.'
    );

    if (!ok) return;

    try {
      setLoading(true);

      const res = await fetch(`${BACKEND_URL}/api/twilio/voice/setup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Could not activate voice.');
      }

      alert(
        data?.twilio_voice_number
          ? `Voice activated. Number: ${data.twilio_voice_number}`
          : 'Voice activated.'
      );

      onComplete?.();
    } catch (error: any) {
      console.error('❌ Error activating voice:', error);
      alert(error?.message || 'Error activating voice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={setupVoice}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-md text-sm border ${
        disabled || loading
          ? 'opacity-60 cursor-not-allowed bg-white/5 border-white/20'
          : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500 text-white'
      }`}
    >
      {loading ? 'Activating voice...' : 'Activate voice'}
    </button>
  );
}