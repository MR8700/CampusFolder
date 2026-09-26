'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import NotificationDrawer from '@/components/NotificationDrawer';
import Logo from '@/components/Logo';
import AuthGatewayModal from '@/components/AuthGatewayModal';
import UniversityManagerModal from '@/components/UniversityManagerModal';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({
  title,
  showBack = false,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isNavActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const [showCampusDropdown, setShowCampusDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuthGateway, setShowAuthGateway] = useState(false);
  const [showUniManager, setShowUniManager] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {
        setCurrentUser(null);
      })
      .finally(() => setLoadingUser(false));
  }, []);

  const userInstitutionName =
    currentUser?.profile?.institution?.shortName ||
    currentUser?.profile?.institution?.name ||
    'Université du Burkina Faso';

  const isAdmin = Boolean(
    currentUser?.isSuperAdmin ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.email?.toLowerCase() === 'admin@campusfolder.bf' ||
    (Array.isArray(currentUser?.roles) && currentUser.roles.some((r: any) =>
      typeof r === 'string'
        ? (r === 'ADMIN' || r === 'Administrateur')
        : (r?.code === 'ADMIN' || r?.name === 'ADMIN' || r?.name === 'Administrateur')
    ))
  );

  return (
    <>
      <header className="fixed top-0 w-full z-40 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/40">
        <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-space-sm min-w-0">
            {showBack ? (
              <button
                aria-label="Retour"
                className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface active:scale-95 transition-transform shrink-0"
                onClick={() => router.back()}
                type="button"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
            ) : null}

            <Link href="/" className="shrink-0 flex items-center gap-2.5 group">
              <Logo size={34} showWordmark={false} />
              <span className="hidden sm:inline font-headline-md text-headline-md font-black text-on-surface tracking-tight">
                Campus Folder
              </span>
            </Link>

            {title ? (
              <h1 className="font-headline-md text-headline-md text-on-surface truncate min-w-0 leading-tight ml-2 border-l border-outline-variant/30 pl-3">
                {title}
              </h1>
            ) : (
              <div className="flex flex-col min-w-0 relative ml-1 sm:ml-3">
                <span className="font-label-sm text-[10px] uppercase tracking-wider text-primary truncate font-bold sm:hidden">
                  Campus Folder
                </span>
                
                {/* University display */}
                <div className="flex items-center gap-space-xs">
                  {currentUser ? (
                    <button
                      className="inline-flex items-center gap-1.5 bg-primary-fixed/30 hover:bg-primary-fixed/50 px-3 py-1 rounded-full text-left truncate min-w-0 max-w-[210px] active:scale-95 transition-all border border-primary/20"
                      type="button"
                      onClick={() => setShowCampusDropdown(!showCampusDropdown)}
                    >
                      <span className="material-symbols-outlined text-[15px] text-primary shrink-0">
                        account_balance
                      </span>
                      <span className="font-label-sm text-[11px] leading-tight font-extrabold text-on-surface truncate">
                        {userInstitutionName}
                      </span>
                      <span className="material-symbols-outlined text-[13px] text-primary shrink-0">
                        expand_more
                      </span>
                    </button>
                  ) : (
                    <button
                      className="inline-flex items-center gap-1 bg-surface-container-high hover:bg-surface-container px-2.5 py-1 rounded-full text-left truncate min-w-0 max-w-[190px] active:scale-95 transition-all"
                      type="button"
                      onClick={() => setShowAuthGateway(true)}
                    >
                      <span className="material-symbols-outlined text-[14px] text-secondary">
                        public
                      </span>
                      <span className="font-label-sm text-[11px] leading-tight font-bold text-on-surface truncate">
                        Burkina Faso (Tous)
                      </span>
                      <span className="text-[9px] bg-secondary text-on-secondary px-1 rounded font-bold ml-0.5">
                        INVITÉ
                      </span>
                    </button>
                  )}
                </div>

                {/* Campus Information & Management Dropdown */}
                {showCampusDropdown && currentUser && (
                  <div className="absolute top-12 left-0 w-80 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 p-4 z-50 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-outline-variant/20">
                      <div>
                        <span className="text-[10px] font-black tracking-wider text-primary uppercase block">
                          Mon Université Officielle
                        </span>
                        <h4 className="text-sm font-extrabold text-on-surface mt-0.5">
                          {currentUser.profile?.institution?.name || userInstitutionName}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {currentUser.profile?.faculty?.name
                            ? `${currentUser.profile.faculty.name} • `
                            : ''}
                          {currentUser.profile?.filiere || 'Étudiant'}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full shrink-0">
                        OFFICIEL
                      </span>
                    </div>

                    <div className="text-[11px] text-on-surface-variant bg-surface-container p-2.5 rounded-xl leading-relaxed">
                      💡 Votre flux d'accueil affiche uniquement le contenu de votre université.
                      Pour consulter les annales d'une autre université, utilisez les filtres de recherche.
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCampusDropdown(false);
                          router.push('/profil');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">account_circle</span>
                          <span>Mon Profil & Cursus Certifié</span>
                        </span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowCampusDropdown(false);
                          router.push('/explorer');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            filter_alt
                          </span>
                          <span>Filtrer d'autres universités</span>
                        </span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation Bar */}
          <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-bold transition-all ${
                isNavActive('/')
                  ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20'
                  : 'text-on-surface hover:text-primary hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>Accueil</span>
            </Link>

            <Link
              href="/explorer"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-bold transition-all ${
                isNavActive('/explorer')
                  ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20'
                  : 'text-on-surface hover:text-primary hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">explore</span>
              <span>Explorer</span>
            </Link>

            <Link
              href="/publier"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-bold transition-all ${
                isNavActive('/publier')
                  ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/40'
                  : 'bg-primary-container text-on-primary hover:bg-primary/90'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Publier</span>
            </Link>

            <Link
              href="/messages"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-bold transition-all relative ${
                isNavActive('/messages')
                  ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20'
                  : 'text-on-surface hover:text-primary hover:bg-surface-container'
              }`}
            >
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full" />
              </div>
              <span>Messages</span>
            </Link>

            <Link
              href="/portefeuille"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-bold transition-all ${
                isNavActive('/portefeuille')
                  ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20'
                  : 'text-on-surface hover:text-primary hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              <span>Portefeuille</span>
            </Link>

            <Link
              href="/profil"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-bold transition-all ${
                isNavActive('/profil')
                  ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20'
                  : 'text-on-surface hover:text-primary hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span>Mon Profil</span>
            </Link>

            {currentUser?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-bold transition-all ${
                  isNavActive('/admin')
                    ? 'bg-error text-white shadow-sm ring-2 ring-error/30'
                    : 'text-error bg-error/10 hover:bg-error/20'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {currentUser && (
              <button
                aria-label="Notifications"
                className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary transition-colors relative active:scale-95"
                type="button"
                onClick={() => setShowNotifications(true)}
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface"></span>
              </button>
            )}

            {currentUser ? (
              <div className="relative">
                <button
                  aria-label="Mon Profil"
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-container transition-transform active:scale-95"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  type="button"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-xs font-black overflow-hidden ring-2 ring-primary/20">
                    {currentUser.profile?.avatarUrl ? (
                      <img
                        alt="Photo de profil"
                        className="w-full h-full object-cover"
                        src={currentUser.profile.avatarUrl}
                      />
                    ) : (
                      <span>{currentUser.profile?.firstName?.[0] || 'U'}</span>
                    )}
                  </div>
                  <span className="hidden lg:inline text-xs font-bold text-on-surface pr-1 max-w-[100px] truncate">
                    {currentUser.profile?.firstName || 'Étudiant'}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute top-12 right-0 w-72 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 p-3.5 z-50 flex flex-col gap-2.5">
                    <Link
                      href="/profil"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 pb-3 border-b border-outline-variant/20 hover:opacity-85 transition-opacity"
                    >
                      <div className="w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-sm font-black overflow-hidden shrink-0 ring-2 ring-primary/20">
                        {currentUser.profile?.avatarUrl ? (
                          <img
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            src={currentUser.profile.avatarUrl}
                          />
                        ) : (
                          <span>{currentUser.profile?.firstName?.[0] || 'U'}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-on-surface truncate">
                          {currentUser.profile?.displayName ||
                            `${currentUser.profile?.firstName} ${currentUser.profile?.lastName}`}
                        </p>
                        <p className="text-[10px] font-mono text-primary font-bold truncate">
                          INE: {currentUser.ine || 'ADM-BF-2025-01'}
                        </p>
                        <p className="text-[10px] text-on-surface-variant truncate">
                          {userInstitutionName}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-outline shrink-0">
                        chevron_right
                      </span>
                    </Link>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant px-1 bg-surface-container py-1.5 rounded-lg">
                      <span className="flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[15px] text-secondary">
                          bolt
                        </span>
                        Points amphi
                      </span>
                      <span className="font-extrabold text-primary">{currentUser.points || 0} pts</span>
                    </div>

                    <div className="flex flex-col gap-1 pt-1 border-t border-outline-variant/20">
                      <Link
                        href="/profil"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          manage_accounts
                        </span>
                        <span>Gérer Mon Profil & Médiathèque</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowUniManager(true);
                        }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          school
                        </span>
                        <span>Modifier mon université</span>
                      </button>

                      <Link
                        href="/portefeuille"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          account_balance_wallet
                        </span>
                        <span>Mon Portefeuille</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-error bg-error/10 hover:bg-error/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            admin_panel_settings
                          </span>
                          <span>Console Centrale Admin</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowAuthGateway(true);
                        }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          switch_account
                        </span>
                        <span>Changer de compte étudiant</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await fetch('/api/v1/auth/logout', { method: 'POST' });
                          setShowUserMenu(false);
                          window.location.reload();
                        }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-error hover:bg-error/10 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-[16px]">logout</span>
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAuthGateway(true)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    isNavActive('/connexion')
                      ? 'bg-primary text-on-primary ring-2 ring-primary/30 font-black'
                      : 'bg-primary text-on-primary hover:bg-primary/90'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">login</span>
                  <span>Connexion</span>
                </button>
                <Link
                  href="/inscription"
                  className={`hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isNavActive('/inscription')
                      ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/30 font-black'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Gateway Modal */}
      <AuthGatewayModal
        isOpen={showAuthGateway}
        onClose={() => setShowAuthGateway(false)}
        onUserLoggedIn={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* University Official Manager Modal */}
      <UniversityManagerModal
        isOpen={showUniManager}
        onClose={() => setShowUniManager(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
          window.location.reload();
        }}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
