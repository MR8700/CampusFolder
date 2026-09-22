'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';

interface AuthGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserLoggedIn?: (user: any) => void;
}

export default function AuthGatewayModal({
  isOpen,
  onClose,
  onUserLoggedIn,
}: AuthGatewayModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }

    setFormSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Identifiant ou mot de passe incorrect.');
      }

      if (onUserLoggedIn) {
        onUserLoggedIn(data.user);
      }
      onClose();
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de connexion.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Banner Top */}
        <div className="bg-gradient-to-r from-primary-container via-primary to-primary-container p-6 text-on-primary relative overflow-hidden shrink-0">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-sm shadow-inner shrink-0">
                <Logo size={40} showWordmark={false} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-on-primary px-2 py-0.5 rounded-full inline-block mb-1">
                  Accès Sécurisé 🇧🇫
                </span>
                <h2 className="text-xl font-black tracking-tight leading-tight">
                  Campus Folder
                </h2>
                <p className="text-xs text-primary-fixed-dim mt-0.5 font-medium">
                  Connectez-vous pour accéder à vos ressources.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-on-primary transition-colors shrink-0"
              title="Fermer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                Email, N° INE ou Téléphone *
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 border border-outline-variant/30 focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
                <span className="material-symbols-outlined text-outline text-[18px] mr-2">badge</span>
                <input
                  type="text"
                  required
                  placeholder="Ex: aminata@campusfolder.bf ou N0145892301"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-none placeholder:text-outline"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                Mot de passe *
              </label>
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
                  className="text-on-surface-variant hover:text-on-surface p-1"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={formSubmitting || !identifier.trim() || !password}
              className="mt-2 w-full py-3 rounded-2xl bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-md hover:bg-primary/90 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {formSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                  <span>Se Connecter</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-outline-variant/20 flex flex-col items-center gap-2 text-center text-xs text-on-surface-variant">
            <span>Vous n'avez pas encore de compte ?</span>
            <Link
              href="/inscription"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-primary/30 text-primary font-bold text-xs hover:bg-primary/5 transition-all text-center"
            >
              Créer un compte (Étudiant ou Public)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
