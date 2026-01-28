'use client';

import { BACKEND_URL } from '@/utils/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaRobot,
  FaChartBar,
  FaWhatsapp,
  FaFacebookMessenger,
  FaInstagram,
  FaMicrophoneAlt,
  FaBullhorn,
} from 'react-icons/fa';
import { useI18n } from '../../i18n/LanguageProvider';

const nodos = [
  { Icon: FaRobot, color: '#a855f7', titleKey: 'login.nodes.attention.title', descKey: 'login.nodes.attention.desc', posClass: 'top-[5%] left-[10%]', x: 10, y: 5 },
  { Icon: FaChartBar, color: '#6366f1', titleKey: 'login.nodes.stats.title', descKey: 'login.nodes.stats.desc', posClass: 'top-[5%] right-[10%]', x: 90, y: 5 },
  { Icon: FaWhatsapp, color: '#25D366', titleKey: 'login.nodes.whatsapp.title', descKey: 'login.nodes.whatsapp.desc', posClass: 'top-[50%] left-[2%]', x: 2, y: 50 },
  { Icon: FaFacebookMessenger, color: '#0084FF', titleKey: 'login.nodes.facebook.title', descKey: 'login.nodes.facebook.desc', posClass: 'top-[50%] right-[2%]', x: 98, y: 50 },
  { Icon: FaInstagram, color: '#E1306C', titleKey: 'login.nodes.instagram.title', descKey: 'login.nodes.instagram.desc', posClass: 'bottom-[20%] left-[15%]', x: 15, y: 80 },
  { Icon: FaMicrophoneAlt, color: '#6366f1', titleKey: 'login.nodes.voice.title', descKey: 'login.nodes.voice.desc', posClass: 'bottom-[20%] right-[15%]', x: 85, y: 80 },
  { Icon: FaBullhorn, color: '#facc15', titleKey: 'login.nodes.campaigns.title', descKey: 'login.nodes.campaigns.desc', posClass: 'bottom-[5%] left-[40%]', x: 40, y: 95 },
];

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendSuccess(false);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (err) {
        setError(t('login.errors.parseServer'));
        return;
      }

      if (res.status === 403) {
        if (!email) {
          setError(t('login.errors.notVerifiedNoEmail'));
          setShowResend(false);
        } else {
          setError(t('login.errors.notVerified'));
          setShowResend(true);
        }
        return;
      }

      if (!res.ok) {
        setError(t('login.errors.http', { status: res.status }));
        return;
      }

      if (!data.uid) {
        setError(t('login.errors.noUid'));
        return;
      }

      await new Promise((r) => setTimeout(r, 100));
      router.push('/dashboard');

    } catch (err: any) {
      setError(err?.message || t('login.errors.unknownLogin'));
    }
  };

  const reenviarLink = async () => {
    if (cooldown > 0) return;
    setError('');

    if (!email) {
      setError(t('login.errors.emailRequiredResend'));
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('login.errors.resendFailed'));
        return;
      }

      setResendSuccess(true);
      setShowResend(false);
      setCooldown(60);
    } catch (err) {
      setError(t('login.errors.resendUnknown'));
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black text-white px-4 overflow-y-auto md:overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/30 to-black z-0" />

      <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {nodos.map((nodo, index) => (
          <line
            key={index}
            x1="50%"
            y1="50%"
            x2={`${nodo.x}%`}
            y2={`${nodo.y}%`}
            stroke="white"
            strokeOpacity="0.15"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="absolute inset-0 z-10">
      {nodos.map((nodo, index) => {
        const Icon = nodo.Icon;
        return (
          <div
            key={index}
            className={`absolute ${nodo.posClass} ${
              index > 3 ? 'hidden sm:block' : ''
            } bg-white/5 border border-white/10 p-3 rounded-xl w-48 md:w-60 max-w-[90vw] backdrop-blur-md shadow-lg hover:scale-105 transition-transform text-sm`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Icon size={36} style={{ color: nodo.color }} />
              <span className="text-white text-base font-semibold">{t(nodo.titleKey)}</span>
            </div>
            <p className="text-sm text-white/60">{t(nodo.descKey)}</p>
          </div>
        );
      })}
      </div>

      <div className="relative z-20 w-full max-w-md bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-purple-300 drop-shadow">
          {t('login.title')}
        </h1>

        {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm text-center">{error}</p>}

        {showResend && (
          <div className="text-center mb-4">
            <button
              onClick={reenviarLink}
              disabled={cooldown > 0}
              className="text-purple-300 hover:underline text-sm disabled:opacity-50"
            >
              {cooldown > 0
                ? t('login.resend.cooldown', { seconds: cooldown })
                : t('login.resend.cta')}
            </button>
          </div>
        )}

        {resendSuccess && (
          <p className="text-green-400 text-sm mt-2 text-center">
            {t('login.resend.success')}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">
              {t('login.form.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">
              {t('login.form.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="text-center mt-4">
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-indigo-400 transition underline-offset-4 hover:underline"
            >
              {t('login.links.privacy')}
            </a>
          </div>
          
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition text-white font-semibold shadow-lg"
          >
            {t('login.form.submit')}
          </button>
        </form>

        <p className="text-center text-sm mt-3">
          <a
            href="/forgot-password"
            className="text-white/70 hover:underline hover:text-white transition"
          >
            {t('login.links.forgot')}
          </a>
        </p>

        <p className="mt-6 text-sm text-center text-white/60">
          {t('login.links.noAccount')}{' '}
          <a href="/register" className="text-purple-400 underline hover:text-purple-300 transition">
            {t('login.links.register')}
          </a>
        </p>
      </div>
    </div>
  );
}
