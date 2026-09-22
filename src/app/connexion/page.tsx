'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!identifier.trim() || !password) {
      setErrorMsg('Veuillez renseigner votre Email, N° INE ou Téléphone ainsi que votre mot de passe.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Identifiant ou mot de passe incorrect.');
      }

      setSuccessMsg(`Connexion réussie ! Bienvenue ${data.user?.profile?.firstName || data.user?.profile?.displayName || ''}.`);
      setTimeout(() => {
        router.push('/');
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface flex flex-col min-h-screen relative overflow-hidden">
      {/* Ambient glowing backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-primary/10 via-secondary/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="fixed top-0 w-full z-40 pt-safe bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/60">
        <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-space-sm max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Retour"
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} showWordmark={false} />
              <span className="font-extrabold text-base tracking-tight text-on-surface">
                Campus Folder
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/30 border border-primary/20 text-primary text-[11px] font-bold">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Connexion SSL</span>
            </div>
            <Link
              href="/inscription"
              className="text-xs font-bold text-on-surface hover:text-primary transition-colors py-1.5 px-3.5 rounded-full bg-surface-container hover:bg-surface-container-high"
            >
              Inscription
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-safe px-4 sm:px-6">
        <div className="w-full max-w-md mx-auto py-8 sm:py-12">
          {/* Header Title & Academic Badges */}
          <div className="mb-6 sm:mb-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-primary-fixed/50 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs border border-primary/20">
              <span className="material-symbols-outlined text-[28px]">account_balance</span>
            </div>
            <h1 className="font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
              Espace Connexion
            </h1>
            <p className="text-on-surface-variant text-xs sm:text-sm mt-1.5 max-w-xs">
              Accédez à vos cours, corrigés d'examen, publications et portefeuille amphi du Burkina Faso.
            </p>

            {/* Switcher Tab */}
            <div className="mt-5 p-1 bg-surface-container-low rounded-2xl border border-outline-variant/30 flex items-center w-full max-w-xs shadow-xs">
              <Link
                href="/inscription"
                className="flex-1 py-1.5 rounded-xl text-on-surface-variant hover:text-on-surface text-xs font-bold text-center transition-colors"
              >
                Inscription
              </Link>
              <span className="flex-1 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold text-center shadow-xs">
                Connexion
              </span>
            </div>
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="mb-5 p-4 bg-error-container text-on-error-container rounded-2xl text-xs sm:text-sm flex items-start gap-3 shadow-sm border border-error/20 animate-shake">
              <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
              <span className="flex-1 font-semibold leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-4 bg-primary-fixed/60 text-primary rounded-2xl text-xs sm:text-sm flex items-center gap-3 shadow-sm border border-primary/20">
              <span className="material-symbols-outlined text-[20px] text-primary shrink-0">check_circle</span>
              <span className="flex-1 font-bold">{successMsg}</span>
            </div>
          )}

          {/* DOUBLE CARD CONTAINER */}
          <div className="relative group">
            {/* Background decorative layered shadow card */}
            <div className="absolute -inset-1 rounded-[30px] bg-gradient-to-br from-primary/20 via-secondary/15 to-primary/10 blur-lg opacity-70 transition duration-500" />
            <div className="absolute inset-0 rounded-[28px] bg-surface-container-high/30 rotate-0.5 pointer-events-none" />

            {/* Front main card */}
            <div className="relative bg-surface-container-lowest rounded-[28px] p-6 sm:p-8 shadow-xl border border-outline-variant/40 flex flex-col gap-5">
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                {/* Identifier Input */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5 flex items-center justify-between">
                    <span>Email, N° INE ou Téléphone *</span>
                    <span className="text-[10px] font-mono font-bold text-primary bg-primary-fixed/30 px-2 py-0.5 rounded">
                      BF / INT
                    </span>
                  </label>
                  <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 border border-outline-variant/30 focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
                    <span className="material-symbols-outlined text-outline text-[18px] mr-2">badge</span>
                    <input
                      type="text"
                      required
                      placeholder="Ex: aminata@campusfolder.bf, N0145892301 ou +22676458812"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-none placeholder:text-outline"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Mot de passe *</label>
                    <span className="text-[11px] font-bold text-primary hover:underline cursor-pointer">
                      Oublié ?
                    </span>
                  </div>
                  <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 border border-outline-variant/30 focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
                    <span className="material-symbols-outlined text-outline text-[18px] mr-2">key</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-none placeholder:text-outline font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Afficher le mot de passe"
                      className="text-on-surface-variant hover:text-on-surface p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface-variant">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/40 border-outline-variant"
                    />
                    <span className="font-semibold">Rester connecté sur cet appareil</span>
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || !identifier.trim() || !password}
                  className="mt-2 w-full py-3.5 rounded-2xl bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-md hover:bg-primary/90 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        autorenew
                      </span>
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">lock_open</span>
                      <span>Se Connecter à Mon Espace</span>
                    </>
                  )}
                </button>
              </form>

              {/* Inscription prompt */}
              <div className="pt-2 text-center text-xs text-on-surface-variant border-t border-outline-variant/20">
                <span>Pas encore de compte ? </span>
                <Link href="/inscription" className="text-primary font-black underline hover:text-primary-container">
                  Créer un compte (Étudiant ou Public)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
