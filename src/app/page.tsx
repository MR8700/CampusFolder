'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import SplashScreen from '@/components/SplashScreen';
import AuthGatewayModal from '@/components/AuthGatewayModal';
import UniversityManagerModal from '@/components/UniversityManagerModal';
import Icon from '@/components/ui/Icon';

export default function HomeFeedPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  const [feedData, setFeedData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showAuthGateway, setShowAuthGateway] = useState(false);
  const [showUniManager, setShowUniManager] = useState(false);
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [sidebarUnivSearchQuery, setSidebarUnivSearchQuery] = useState('');

  useEffect(() => {
    // Fetch user & feed data concurrently
    Promise.all([
      fetch('/api/v1/auth/me').then((r) => r.json()),
      fetch(`/api/v1/resources/feed?filter=${activeFilter}`).then((r) => r.json()),
    ])
      .then(([userData, feed]) => {
        if (userData.success && userData.authenticated && userData.user) {
          setCurrentUser(userData.user);
        } else {
          setCurrentUser(null);
          // If first-time visitor and hasn't dismissed the gateway
          if (typeof window !== 'undefined') {
            const dismissed = sessionStorage.getItem('cf_guest_dismissed');
            if (!dismissed) {
              setShowAuthGateway(true);
            }
          }
        }
        if (feed.success) setFeedData(feed);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [activeFilter]);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chips = [
    { id: 'all', label: 'Tout', icon: 'explore', isSecondary: false },
    { id: 'corrige', label: 'Corrigés Devoirs', icon: 'flash_on', isSecondary: true, dot: true },
    { id: 'cours', label: 'Cours Magistraux', icon: 'menu_book', isSecondary: false },
    { id: 'exam', label: 'Sujets Examens', icon: 'history_edu', isSecondary: false },
    { id: 'video', label: 'Vidéos & Vocaux', icon: 'videocam', isSecondary: true },
    { id: 'presentiel', label: 'Présentiel', icon: 'groups', isSecondary: false },
  ];

  const userInstitutionName =
    currentUser?.profile?.institution?.name ||
    feedData?.activeCampus?.name ||
    'Université Joseph KI-ZERBO (UJKZ)';
  const userInstitutionShort =
    currentUser?.profile?.institution?.shortName ||
    feedData?.activeCampus?.shortName ||
    'UJKZ';

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <SplashScreen />
      <Header />

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="w-full lg:grid lg:grid-cols-12 lg:gap-8 pt-2">
          {/* Main Feed Column (8 cols on Desktop, 12 on mobile) */}
          <div className="lg:col-span-8 flex flex-col w-full">
            {/* User greeting & Points */}
            <section className="px-1 sm:px-0 pt-space-md pb-space-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  {currentUser ? (
                    <>
                      <span className="font-headline-lg-mobile md:text-2xl text-on-surface tracking-tight font-extrabold">
                        Bonjour {currentUser.profile?.firstName || 'Étudiant'} 👋
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                        <span>{userInstitutionShort} • Prêt(e) pour cartonner au Semestre 2 ?</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-headline-lg-mobile md:text-2xl text-on-surface tracking-tight font-extrabold">
                        Partagez & découvrez des ressources utiles 🇧🇫
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                        Cours, exercices, corrigés, sujets, documents et ressources partagées par la communauté.
                      </span>
                    </>
                  )}
                </div>

                {currentUser ? (
                  <div className="bg-surface-container-high px-space-sm py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Icon name="bolt" size={16} className="text-secondary" />
                    <span className="font-label-sm text-label-sm text-on-surface font-bold">
                      {currentUser?.points || 0} pts
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAuthGateway(true)}
                    className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1"
                  >
                    <Icon name="login" size={15} />
                    <span>Connexion</span>
                  </button>
                )}
              </div>

            {/* Active Campus Interactive Banner */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-primary-container text-on-primary shadow-md border border-primary/20">
              <div
                className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuArDRKd4nUKG-pi7EKmQCO93OlZ9Cl3ZZhsFe212NOUjkEwB2QNVJEmHMHUncJQZFm_K5mq2j0D0i3D0hI1y0jOIpJj7px-MOraG2MguyrGseJuKVQzZmSFW17pAew3VUEQJOUzOofc5rgoIxmIur3TQ1DXKQgZxfvuPCvu__MTEZ8eXSX0J4VSDGd8w98UxNOMQNRGNQzXLhdfZ_O2iITCaByuws_57zoH_VNvnhrfzfhT0Lns75yVHA')",
                }}
              ></div>
              <div className="relative p-space-md flex items-center justify-between gap-space-sm z-10">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-surface-container-lowest/20 backdrop-blur-md flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px] text-primary-fixed">
                      school
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-bold">
                        {currentUser ? 'Mon Campus Officiel' : 'Campus en Direct'}
                      </span>
                      <span className="font-label-sm text-[10px] bg-secondary-container text-on-secondary px-1.5 py-0.2 rounded-full font-bold">
                        {currentUser ? 'RATTAGHÉ' : 'EN LIGNE'}
                      </span>
                    </div>
                    <span className="font-headline-md text-[17px] leading-tight font-extrabold truncate text-on-primary">
                      {userInstitutionName}
                    </span>
                    <span className="font-body-sm text-[11px] text-primary-fixed-dim truncate">
                      {currentUser?.profile?.faculty?.name
                        ? `${currentUser.profile.faculty.name} • `
                        : ''}
                      {feedData?.stats?.activeStudents || 1420} étudiants connectés
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {currentUser ? (
                    <button
                      aria-label="Gérer mon université dans mon profil"
                      title="Modifier mon université dans mon profil"
                      className="px-3 py-1.5 rounded-xl bg-surface-container-lowest/25 hover:bg-surface-container-lowest/35 text-on-primary flex items-center gap-1 text-xs font-bold active:scale-95 transition-all"
                      type="button"
                      onClick={() => setShowUniManager(true)}
                    >
                      <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                      <span className="hidden sm:inline">Mon Profil</span>
                    </button>
                  ) : (
                    <button
                      aria-label="Choisir mon campus"
                      title="Choisir mon campus"
                      className="px-3 py-1.5 rounded-xl bg-primary text-on-primary flex items-center gap-1 text-xs font-bold active:scale-95 transition-all shadow"
                      type="button"
                      onClick={() => setShowAuthGateway(true)}
                    >
                      <span className="material-symbols-outlined text-[16px]">login</span>
                      <span>Se connecter</span>
                    </button>
                  )}

                  <button
                    aria-label="Filtrer d'autres universités"
                    title="Filtrer d'autres universités sur la page Explorer"
                    className="w-8 h-8 rounded-full bg-surface-container-lowest/20 hover:bg-surface-container-lowest/30 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                    type="button"
                    onClick={() => router.push('/explorer')}
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-primary">
                      filter_alt
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Fully Responsive Filter Chips with Polymorphic Badges & No Cutoff */}
          <section className="py-2 px-margin flex flex-col gap-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 w-full max-w-full">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveFilter(chip.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-label-sm text-xs shrink-0 whitespace-nowrap active:scale-95 transition-all border ${
                    activeFilter === chip.id
                      ? 'bg-primary text-on-primary border-primary shadow-xs font-bold'
                      : 'bg-surface-container-lowest text-on-surface border-primary/20 hover:border-primary/40 hover:bg-surface-container-low'
                  }`}
                >
                  <Icon
                    name={chip.icon}
                    size={16}
                    className={
                      activeFilter === chip.id
                        ? 'text-on-primary'
                        : chip.isSecondary
                        ? 'text-secondary'
                        : 'text-primary'
                    }
                  />
                  <span>{chip.label}</span>
                  {chip.dot && <span className="w-2 h-2 rounded-full bg-secondary"></span>}
                </button>
              ))}
            </div>

            {/* Interactive Search Bar directly below the category chips */}
            <div className="pt-1">
              <div className="flex items-center gap-2 bg-surface-container-lowest rounded-2xl p-1.5 shadow-xs border border-primary/25 hover:border-primary/50 transition-all">
                <Icon name="search" size={20} className="text-primary pl-2" />
                <input
                  type="text"
                  value={homeSearchQuery}
                  onChange={(e) => setHomeSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && homeSearchQuery.trim()) {
                      router.push(`/explorer?q=${encodeURIComponent(homeSearchQuery.trim())}`);
                    }
                  }}
                  placeholder="Rechercher un cours magistral, corrigé de devoir, examen ou note vocale..."
                  className="w-full bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none pr-1"
                />
                {homeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHomeSearchQuery('')}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-outline hover:text-on-surface shrink-0"
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => router.push(`/explorer?q=${encodeURIComponent(homeSearchQuery.trim())}`)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all shrink-0 flex items-center gap-1 shadow-xs"
                >
                  <span>Chercher</span>
                  <Icon name="arrow_forward" size={14} />
                </button>
              </div>
            </div>
          </section>

          {/* Section 1: Top Ressources Tendance (Carousel) */}
          <section className="mt-space-md flex flex-col gap-space-sm">
            <div className="px-margin flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  local_fire_department
                </span>
                <h2 className="font-headline-md text-[18px] text-on-surface font-bold tracking-tight">
                  Top Ressources Tendance
                </h2>
              </div>
              <Link
                href="/explorer"
                className="font-label-sm text-label-sm text-primary flex items-center font-bold"
              >
                Voir tout
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>

            {/* Cards responsives : alignement vertical 1 par 1 sur mobile si l'espace est restreint, multi-colonnes sur grand écran */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md px-margin pb-space-sm">
              {feedData?.trendingResources?.map((res: any) => {
                const isBookmarked = bookmarkedIds.has(res.id);
                const isPaid = res.accessPolicy?.mode === 'PAID';
                const isInPerson = res.accessPolicy?.mode === 'IN_PERSON';
                const priceText = isPaid ? `${res.accessPolicy?.priceAmount} FCFA` : 'GRATUIT';

                return (
                  <article
                    key={res.id}
                    onClick={() => router.push(`/ressources/${res.slug}`)}
                    className="w-full rounded-2xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md active:scale-[0.99] cursor-pointer border border-outline-variant/20"
                  >
                    <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-secondary/5 blur-xl pointer-events-none"></div>
                    <div>
                      {/* Tags Row */}
                      <div className="flex items-center justify-between mb-space-sm">
                        <div className="flex items-center gap-1 flex-wrap">
                          {res.media?.some((m: any) => m.mediaType === 'PDF') && (
                            <span className="bg-error-container text-on-error-container font-label-sm text-[10px] px-2 py-0.5 rounded uppercase font-bold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px]">
                                picture_as_pdf
                              </span>{' '}
                              PDF
                            </span>
                          )}
                          {res.media?.some((m: any) => m.mediaType === 'AUDIO') && (
                            <span className="bg-surface-container-high text-on-surface font-label-sm text-[10px] px-2 py-0.5 rounded uppercase font-bold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px] text-secondary">
                                mic
                              </span>{' '}
                              Audio
                            </span>
                          )}
                          {isInPerson && (
                            <span className="bg-surface-container-highest text-primary font-label-sm text-[10px] px-2 py-0.5 rounded uppercase font-bold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px]">handshake</span>{' '}
                              Présentiel
                            </span>
                          )}
                          {!isPaid && !isInPerson && (
                            <span className="bg-on-tertiary-container/20 text-tertiary font-label-sm text-[10px] px-2 py-0.5 rounded uppercase font-extrabold">
                              GRATUIT
                            </span>
                          )}
                        </div>
                        <button
                          aria-label="Sauvegarder"
                          type="button"
                          onClick={(e) => toggleBookmark(res.id, e)}
                          className={`w-8 h-8 rounded-full bg-surface-container-high/60 flex items-center justify-center transition-colors ${
                            isBookmarked ? 'text-primary' : 'text-on-surface-variant hover:text-secondary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isBookmarked ? 'bookmark_added' : 'bookmark'}
                          </span>
                        </button>
                      </div>

                      {/* Title & Faculty */}
                      <span className="font-label-sm text-[10px] text-primary uppercase font-bold">
                        {res.faculty?.name || 'UFR Universitaire'}
                      </span>
                      <h3 className="font-headline-md text-[15px] font-bold text-on-surface line-clamp-2 mt-0.5 leading-snug">
                        {res.title}
                      </h3>

                      {/* Author and Rating */}
                      <div className="flex items-center gap-2 mt-space-sm">
                        <div className="w-7 h-7 rounded-full bg-surface-container-high overflow-hidden shrink-0">
                          <img
                            className="w-full h-full object-cover"
                            alt={res.author?.profile?.displayName || 'Auteur'}
                            src={
                              res.author?.profile?.avatarUrl ||
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuBYIhUHvtel7pkNZrJb3gdQbNdsAIBLE7IcJzbeX-fctDyJ2IDAlarN7q6J6ZDX5IiwDqlKwbybvm3l4xcfcyh1rOnrDNk1zW3s9cfunhS3Uxu2tBAZXuleseJLx60SRjqhRy1L8VcXYdVwS03RREshU1RDj0uo4ez-1j5CLis3NUiYOVl2dtlvAt7o75FHIkWoUQGjCJ5Ko8nC55x0P8VLibZfAEFuZaQn1fuqLb_YmzednW4raG2EnQ'
                            }
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
                            {res.author?.profile?.displayName || 'Étudiant UJKZ'}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                            <span className="material-symbols-outlined text-[13px] text-secondary">
                              star
                            </span>
                            <span className="font-bold text-on-surface">
                              {res.ratingAverage?.toFixed(1) || '4.9'}
                            </span>
                            <span>• {res.ratingCount || 142} avis</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="mt-space-md pt-space-xs flex items-center justify-between bg-surface-container-low p-2 rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">
                          {isPaid ? 'Tarif membre' : 'Accès Libre'}
                        </span>
                        <span
                          className={`font-price-display text-price-display leading-none font-extrabold ${
                            isPaid ? 'text-secondary' : 'text-primary'
                          }`}
                        >
                          {priceText}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isPaid) router.push(`/paiement?resourceId=${res.id}`);
                          else if (isInPerson) router.push(`/ressources/${res.slug}`);
                          else router.push(`/lecteur/CF-8921-UJKZ-SSL`);
                        }}
                        className={`h-9 px-3 rounded-lg font-label-sm text-label-sm flex items-center gap-1 shadow-sm active:scale-95 transition-transform ${
                          isPaid
                            ? 'bg-secondary text-on-secondary'
                            : isInPerson
                            ? 'bg-primary text-on-primary'
                            : 'bg-primary-container text-on-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isPaid ? 'lock_open' : isInPerson ? 'chat' : 'download'}
                        </span>
                        <span>
                          {isPaid ? 'Débloquer' : isInPerson ? 'WhatsApp' : '1-Clic'}
                        </span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Live Pulse Stats Counter Banner */}
          <section className="px-margin my-space-sm">
            <div className="rounded-xl bg-gradient-to-r from-surface-container-high to-surface-container p-space-sm flex items-center justify-around text-center shadow-xs">
              <div className="flex flex-col items-center">
                <span className="font-headline-md text-[16px] text-primary font-black leading-tight">
                  +{feedData?.stats?.docsAdded24h || 84}
                </span>
                <span className="font-label-sm text-[10px] text-on-surface-variant font-medium">
                  Docs ajoutés 24h
                </span>
              </div>
              <div className="w-px h-6 bg-surface-variant"></div>
              <div className="flex flex-col items-center">
                <span className="font-headline-md text-[16px] text-secondary font-black leading-tight">
                  {feedData?.stats?.examSuccessRate || 98.4}%
                </span>
                <span className="font-label-sm text-[10px] text-on-surface-variant font-medium">
                  Validés aux examens
                </span>
              </div>
              <div className="w-px h-6 bg-surface-variant"></div>
              <div className="flex flex-col items-center">
                <span className="font-headline-md text-[16px] text-tertiary-container font-black leading-tight">
                  {feedData?.stats?.activeStudents || '4.2k'}
                </span>
                <span className="font-label-sm text-[10px] text-on-surface-variant font-medium">
                  Étudiants UJKZ
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Flux en direct des facultés */}
          <section className="mt-space-sm px-margin flex flex-col gap-space-sm pb-space-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  dynamic_feed
                </span>
                <h2 className="font-headline-md text-[18px] text-on-surface font-bold tracking-tight">
                  Flux en direct des facultés
                </h2>
              </div>
              <span className="font-label-sm text-[11px] text-on-surface-variant">
                Mis à jour en direct
              </span>
            </div>

            {/* Feed Cards Stream - Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedData?.facultyFeed?.map((item: any) => {
                const isPaid = item.accessPolicy?.mode === 'PAID';
                const hasVideo = item.media?.some((m: any) => m.mediaType === 'VIDEO');

                return (
                  <article
                    key={item.id}
                    onClick={() => router.push(`/ressources/${item.slug}`)}
                    className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col gap-space-sm transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <div className="flex items-start gap-space-sm">
                      {/* Visual miniature document preview */}
                      <div className="w-20 h-24 rounded-lg bg-surface-container-high shrink-0 overflow-hidden relative shadow-xs">
                        <img
                          className="w-full h-full object-cover"
                          alt={item.title}
                          src={item.thumbnailUrl}
                        />
                        {hasVideo && (
                          <div className="absolute inset-0 bg-inverse-surface/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[24px] text-on-primary">
                              play_circle
                            </span>
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 bg-surface-tint/90 text-on-primary text-[9px] font-bold px-1 rounded">
                          {hasVideo ? '18:40' : `${item.pageCount || 6} p.`}
                        </span>
                      </div>

                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-label-sm text-[10px] text-primary font-bold uppercase truncate">
                            {item.faculty?.name || 'Faculté'}
                          </span>
                          <span className="inline-flex items-center gap-0.5 bg-primary-fixed text-on-primary-fixed font-label-sm text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0">
                            <span className="material-symbols-outlined text-[11px] text-primary">
                              verified
                            </span>{' '}
                            {item.badgeQuality || 'Vérifié Commu'}
                          </span>
                        </div>
                        <h3 className="font-headline-md text-[15px] font-bold text-on-surface leading-tight mt-1 line-clamp-2">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-space-xs mt-1.5">
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-variant shrink-0">
                            <img
                              className="w-full h-full object-cover"
                              alt="Avatar"
                              src={
                                item.author?.profile?.avatarUrl ||
                                'https://lh3.googleusercontent.com/aida-public/AB6AXuCjC2BBqjMHuxspWXeJT-OC8MDF4Ki7hvlvoYgJIf5xs4Nvw0tdU1C97olgZ01XcBJJ5flXj1i_szjuEwaUX2qaXFWg4CWgieM2LXckus_oXpTmja8tD3l-v74-5VfA86Z0u6hxnoE9HFR6IMW13gTKHnpmj7_LSpSVI7R0uGldiWBnK5GfnAdhFiOWBtU7Ormpv-FtwDSrI0SFUq_giTKDu8vPtVLUeFdRASKhwEITRGqDCR5LDRjUNw'
                              }
                            />
                          </div>
                          <span className="font-body-sm text-[11px] text-on-surface-variant truncate">
                            {item.author?.profile?.displayName || 'Délégué promo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action & Pricing Bar */}
                    <div className="flex items-center justify-between pt-space-xs bg-surface-container-low px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-label-sm text-[9px] text-on-surface-variant uppercase">
                            {isPaid ? 'Paiement Mobile' : 'Accès Libre'}
                          </span>
                          <span
                            className={`font-price-display text-[16px] font-extrabold ${
                              isPaid ? 'text-secondary' : 'text-primary'
                            }`}
                          >
                            {isPaid ? `${item.accessPolicy?.priceAmount} FCFA` : 'GRATUIT'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-on-surface-variant text-[11px]">
                          <span className="material-symbols-outlined text-[13px] text-primary">
                            {hasVideo ? 'play_arrow' : 'sim_card_download'}
                          </span>
                          <span className="font-semibold text-on-surface">
                            {item.downloadsCount || item.viewsCount || 430}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/ressources/${item.slug}`);
                          }}
                          className="h-8 px-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-[11px] flex items-center gap-1 active:scale-95 transition-transform"
                        >
                          <span className="material-symbols-outlined text-[15px]">visibility</span>
                          <span>Aperçu</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPaid) router.push(`/paiement?resourceId=${item.id}`);
                            else router.push(`/lecteur/CF-8921-UJKZ-SSL`);
                          }}
                          className="h-8 px-3 rounded-lg bg-primary-container text-on-primary font-label-sm text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition-transform font-bold"
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {isPaid ? 'shopping_cart_checkout' : 'play_circle'}
                          </span>
                          <span>{isPaid ? 'Acheter' : 'Consulter'}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Quick Floating Upload Micro-Interaction trigger helper */}
          <div className="px-margin mb-space-md">
            <div className="p-space-md rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-space-sm min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary-fixed/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px] text-primary-fixed">
                    monetization_on
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md font-bold truncate">
                    Tu as un corrigé de devoir ?
                  </span>
                  <span className="font-body-sm text-[11px] text-primary-fixed-dim">
                    Publie-le et gagne 85% par téléchargement
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
          {/* End Main Feed Column (8 cols) */}

          {/* Desktop Sidebar Column (4 cols on Desktop, hidden on mobile) */}
          <aside className="hidden lg:flex lg:col-span-4 flex-col gap-6 pt-space-md sticky top-20 self-start">
            {/* 1. Quick FinTech Wallet Widget */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline uppercase font-mono">
                  Portefeuille FinTech
                </span>
                <span className="text-[10px] bg-[#10B981]/20 text-[#00422B] px-2 py-0.5 rounded-full font-bold">
                  CF-PAY
                </span>
              </div>
              {currentUser ? (
                <>
                  <div>
                    <p className="text-xs text-on-surface-variant font-medium">Solde disponible</p>
                    <p className="text-2xl font-extrabold text-primary font-mono tracking-tight mt-0.5">
                      {`${(currentUser.wallet?.availableBalance ?? 0).toLocaleString('fr-FR')} FCFA`}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container-high">
                    <button
                      type="button"
                      onClick={() => router.push('/portefeuille')}
                      className="py-2 px-3 bg-primary text-on-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-container transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                      <span>Portefeuille</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/portefeuille')}
                      className="py-2 px-3 bg-surface-container-high text-on-surface rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-surface-container transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">payments</span>
                      <span>Retirer gains</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-on-surface-variant font-medium">Solde sécurisé</p>
                    <p className="text-xs text-on-surface mt-1 leading-relaxed">
                      Connectez-vous pour consulter votre solde réel CF-PAY et gérer vos royalties.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-surface-container-high">
                    <button
                      type="button"
                      onClick={() => setShowAuthGateway(true)}
                      className="w-full py-2.5 px-3 bg-primary text-on-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-container active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">login</span>
                      <span>Se connecter</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 2. Live University Amphi Network with Search Bar */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-primary/20 hover:border-primary/40 shadow-sm flex flex-col gap-3 transition-all">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
                  <h3 className="text-sm font-bold text-on-surface">Réseau Universitaire BF</h3>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-secondary font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                  EN DIRECT
                </span>
              </div>

              {/* Search Bar for Universities in Network */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  value={sidebarUnivSearchQuery}
                  onChange={(e) => setSidebarUnivSearchQuery(e.target.value)}
                  placeholder="Rechercher une université ou ville..."
                  className="w-full h-8 pl-8 pr-7 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary placeholder:text-outline"
                />
                {sidebarUnivSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSidebarUnivSearchQuery('')}
                    className="absolute right-2 top-2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 text-xs max-h-72 overflow-y-auto pr-1">
                {[
                  { name: 'Univ. Joseph KI-ZERBO (UJKZ)', short: 'UJKZ', city: 'Ouagadougou • 5 facultés', count: '1 420 étudiants' },
                  { name: 'Univ. Nazi Boni (UNB)', short: 'UNB', city: 'Bobo-Dioulasso • Sciences & Med', count: '890 étudiants' },
                  { name: 'Univ. Norbert Zongo (UNZ)', short: 'UNZ', city: 'Koudougou • Économie & LSH', count: '640 étudiants' },
                  { name: 'Univ. Saint Thomas d\'Aquin', short: 'USTA', city: 'USTA • Droit & Médecine', count: '310 étudiants' },
                  { name: 'Univ. Thomas Sankara (UTS)', short: 'UTS', city: 'Ouagadougou • Économie & SJP', count: '980 étudiants' },
                  { name: 'Institut 2iE', short: '2IE', city: 'Ouagadougou • Génie Civil & Eau', count: '450 étudiants' },
                  { name: 'Univ. de Fada N\'Gourma', short: 'UFDG', city: 'Fada • Mines & Agro', count: '290 étudiants' },
                ]
                  .filter(
                    (u) =>
                      !sidebarUnivSearchQuery ||
                      u.name.toLowerCase().includes(sidebarUnivSearchQuery.toLowerCase()) ||
                      u.short.toLowerCase().includes(sidebarUnivSearchQuery.toLowerCase()) ||
                      u.city.toLowerCase().includes(sidebarUnivSearchQuery.toLowerCase())
                  )
                  .map((u, i) => (
                    <div
                      key={i}
                      onClick={() => router.push('/explorer')}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all cursor-pointer border border-primary/10 hover:border-primary/30"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">🇧🇫</span>
                        <div className="min-w-0">
                          <p className="font-bold text-on-surface truncate">{u.name}</p>
                          <p className="text-[10px] text-on-surface-variant truncate">{u.city}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-primary text-[11px] shrink-0 ml-1">
                        {u.count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* 3. Contributor Royalties Promo */}
            <div className="bg-gradient-to-br from-[#0D5C3A] to-[#00422B] text-white p-5 rounded-2xl shadow-md flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] text-[#10B981]">local_fire_department</span>
                <h4 className="font-bold text-sm">Monétisez vos corrigés de devoirs</h4>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Rejoignez les 57 délégués et majors qui partagent leurs synthèses. Vous touchez <strong>85% en FCFA</strong> par téléchargement via Orange Money ou Moov Flooz.
              </p>
              <button
                type="button"
                onClick={() => router.push('/publier')}
                className="mt-1 w-full bg-[#EA580C] hover:bg-[#c94b0a] text-white py-2.5 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all text-center"
              >
                Publier une ressource (Étape 1/4)
              </button>
            </div>
          </aside>
          {/* End Desktop Sidebar Column */}
        </div>
      </main>

      <BottomNavigation />

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
    </div>
  );
}
