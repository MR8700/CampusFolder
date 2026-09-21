'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'demo' | 'login'>('demo');
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loggingInId, setLoggingInId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Quick direct credentials login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingAccounts(true);
      fetch('/api/v1/auth/demo-accounts')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.accounts) {
            setDemoAccounts(data.accounts);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingAccounts(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickLogin = async (userId: string) => {
    setLoggingInId(userId);
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Échec de la connexion.');
      }

      if (onUserLoggedIn) {
        onUserLoggedIn(data.user);
      }
      onClose();
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la connexion rapide.');
    } finally {
      setLoggingInId(null);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Veuillez remplir vos identifiants.');
      return;
    }

    setFormSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
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

  const handleDismissGuest = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cf_guest_dismissed', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Banner Top */}
        <div className="bg-gradient-to-r from-primary-container via-primary to-primary-container p-6 text-on-primary relative overflow-hidden shrink-0">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-sm shadow-inner shrink-0">
                <Logo size={42} showWordmark={false} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-on-primary px-2 py-0.5 rounded-full inline-block mb-1">
                  Accès Académique Sécurisé
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  Bienvenue sur Campus Folder 🇧🇫
                </h2>
                <p className="text-xs sm:text-sm text-primary-fixed-dim mt-0.5 font-medium">
                  Connectez-vous pour accéder au campus exclusif de votre université.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissGuest}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-on-primary transition-colors shrink-0"
              title="Continuer en invité"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="px-6 pt-4 pb-2 border-b border-outline-variant/30 flex items-center gap-2 bg-surface">
          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'demo'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">badge</span>
            <span>Comptes Étudiants Pré-enregistrés (DB)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'login'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>Connexion Manuelle / Admin</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Database Demo Accounts (Zero Mock - Pure SQLite) */}
        {activeTab === 'demo' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
                  Sélectionnez un profil étudiant de test (Base de données active)
                </h3>
                <p className="text-[11px] text-on-surface-variant/80">
                  Chaque compte est associé à son université officielle dans la base SQLite.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary">
                Données Réelles
              </span>
            </div>

            {loadingAccounts ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs font-bold text-on-surface-variant">
                  Chargement des comptes étudiants depuis la base...
                </span>
              </div>
            ) : demoAccounts.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface-container text-center text-xs text-on-surface-variant">
                Aucun compte étudiant trouvé dans la base. Utilisez la connexion manuelle.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {demoAccounts.map((account) => {
                  const isBusy = loggingInId === account.id;
                  const profile = account.profile;
                  const inst = profile?.institution;
                  const faculty = profile?.faculty;
                  const level = profile?.academicLevel;

                  return (
                    <div
                      key={account.id}
                      className="p-3.5 rounded-2xl border border-outline-variant/40 bg-surface-container hover:border-primary/50 hover:bg-surface transition-all flex flex-col justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {profile?.avatarUrl ? (
                            <img
                              src={profile.avatarUrl}
                              alt={profile.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{profile?.firstName?.[0] || 'E'}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-on-surface truncate">
                              {profile?.displayName || `${profile?.firstName} ${profile?.lastName}`}
                            </span>
                            <span className="text-[10px] font-extrabold text-secondary shrink-0">
                              {account.points} pts
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-primary truncate flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[13px]">school</span>
                            <span>{inst?.shortName || 'Université'}</span>
                          </div>
                          <div className="text-[10px] text-on-surface-variant truncate">
                            {level?.code || 'L1'} {profile?.filiere ? `• ${profile.filiere}` : ''}
                          </div>
                          {account.ine && (
                            <span className="text-[9px] font-mono text-outline truncate block mt-0.5">
                              INE: {account.ine}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={loggingInId !== null}
                        onClick={() => handleQuickLogin(account.id)}
                        className="w-full py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isBusy ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                            <span>Connexion...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[15px]">login</span>
                            <span>Connexion Instantanée</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Manual Credentials Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleCredentialsSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1.5">
                Identifiant (Email officiel ou Numéro INE)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-outline">
                  badge
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ex: N0123456789 ou aminata@campusfolder.bf"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-outline">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={formSubmitting}
              className="w-full py-3 rounded-xl bg-primary text-on-primary text-sm font-bold shadow hover:bg-primary/90 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {formSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Vérification sécurisée...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Se connecter</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/connexion"
                className="text-xs text-primary font-bold hover:underline"
                onClick={onClose}
              >
                Page de connexion complète & récupération de mot de passe →
              </Link>
            </div>
          </form>
        )}

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-surface-container-high/40 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">Pas encore de compte ?</span>
            <Link
              href="/inscription"
              onClick={onClose}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              <span>Créer mon compte étudiant (INE)</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={handleDismissGuest}
            className="text-xs font-semibold text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-lg hover:bg-surface-container transition-colors"
          >
            Explorer en invité (lecture seule)
          </button>
        </div>
      </div>
    </div>
  );
}
