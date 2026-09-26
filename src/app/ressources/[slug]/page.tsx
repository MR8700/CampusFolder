'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';

export default function ResourceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/v1/resources/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.resource) {
          setResource(data.resource);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <Header showBack title="Chargement..." />
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">
              sync
            </span>
            <span className="text-body-sm text-on-surface-variant font-medium">
              Chargement du document académique...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <Header showBack title="Erreur" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-16">
          <span className="material-symbols-outlined text-[48px] text-secondary mb-2">
            description
          </span>
          <h2 className="font-headline-md font-bold">Document introuvable</h2>
          <p className="text-body-sm text-on-surface-variant mt-1 mb-4">
            Ce fichier n'est plus disponible ou a été déplacé.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold"
          >
            Retour au flux
          </button>
        </div>
      </div>
    );
  }

  const isPaid = resource.accessPolicy?.mode === 'PAID';
  const price = resource.accessPolicy?.priceAmount || 500;
  const pdfMedia = resource.media?.find((m: any) => m.mediaType === 'PDF');
  const audioMedia = resource.media?.find((m: any) => m.mediaType === 'AUDIO');
  const imageMedia = resource.media?.find((m: any) => m.mediaType === 'IMAGE');

  const handleUnlockClick = () => {
    setIsUnlocking(true);
    setTimeout(() => {
      router.push(`/paiement?resourceId=${resource.id}`);
    }, 500);
  };

  const handleContactAuthorInApp = async () => {
    if (!resource) return;
    try {
      const res = await fetch('/api/v1/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DIRECT',
          targetUserId: resource.authorId,
          resourceId: resource.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        router.push(`/messages/${data.conversation.id}`);
      } else {
        router.push('/messages');
      }
    } catch {
      router.push('/messages');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header showBack title="Détails Document" />

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="w-full lg:grid lg:grid-cols-12 lg:gap-8 pt-2">
          {/* Left Column (7 cols on PC, 12 on mobile) */}
          <div className="lg:col-span-7 flex flex-col w-full pb-12">
          {/* Top Highlight Banner / Urgency badge */}
          <div className="px-margin pt-space-md">
            <div className="bg-secondary/10 border-2 border-secondary/30 rounded-2xl p-space-md flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-space-sm min-w-0">
                <span className="flex h-2.5 w-2.5 rounded-full bg-secondary animate-pulse shrink-0"></span>
                <p className="font-label-md text-label-md text-on-surface truncate font-semibold">
                  {resource.urgencyBanner || 'Session Rattrapage & Partiels 2025 • UJKZ Ouaga'}
                </p>
              </div>
              <span className="font-label-sm text-label-sm bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full shrink-0 font-extrabold">
                {resource.badgeQuality || 'Vérifié A+'}
              </span>
            </div>
          </div>

          {/* Resource Title & Author Card */}
          <section className="px-margin mt-space-md flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-xs flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-bold shadow-xs">
                <span className="material-symbols-outlined text-[14px]">school</span>
                {resource.academicLevel?.code} {resource.faculty?.name}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold border border-secondary/20 shadow-xs">
                <span className="material-symbols-outlined text-[14px]">folder_zip</span>
                Pack {resource.media?.length || 3} Médias
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-bold border border-outline-variant/30">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Certifié {resource.institution?.shortName?.split(' ')[1] || 'UJKZ'}
              </span>
            </div>

            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-extrabold tracking-tight">
              {resource.title}
            </h2>

            {/* Author Profile Strip */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border-2 border-outline-variant/40 hover:border-primary/40 transition-all flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-md min-w-0">
                <div className="relative shrink-0">
                  <img
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                    alt={resource.author?.profile?.displayName || 'Auteur'}
                    src={
                      resource.author?.profile?.avatarUrl ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCqw4Rqz6DkCcqV7-yJey0ewO4g_KDREzxvhZjeaF_x2uuOKdfn4SZIKtAtH_D8KQjzgwm3Wy4OZl6aYIkcKUou3aYOYUPugqS_KN_RznR01JFCNh0K6GpChxpa52X-aISol9AN07n9dyZC5x9A7MB0aZp1tpv_SoOFC5D1AtSz-ZPQKKjM4Zt2K-YJNvcLHPT199E_v33TlSXwn9Z3EGQ2WwP2V6SHKctPCjgkoacvdCJWctvk9gP9NQ'
                    }
                  />
                  <div className="absolute -bottom-1 -right-1 bg-secondary-container text-on-secondary w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[13px]">star</span>
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-label-lg text-label-lg text-on-surface truncate font-bold">
                      {resource.author?.profile?.displayName || 'Moussa O.'}
                    </h3>
                    <span className="material-symbols-outlined text-primary text-[16px]">
                      verified
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    {resource.author?.profile?.bio || 'Major de promo 2024 • UJKZ Ouagadougou'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="font-label-sm text-label-sm text-secondary font-bold">
                      ★ {resource.ratingAverage?.toFixed(1) || '4.9'}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      ({resource.ratingCount || 142} étudiants certifiés)
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="shrink-0 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-primary hover:text-on-primary text-primary font-label-md text-label-md transition-all active:scale-95 font-bold border border-outline-variant/30"
                type="button"
                onClick={() => router.push('/lecteur/CF-8921-UJKZ-SSL')}
              >
                Profil
              </button>
            </div>
          </section>

          {/* Pedagogical Description with Interligne 2 and Text Justification */}
          {resource.description && (
            <section className="px-margin mt-space-md">
              <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border-2 border-primary/20 ring-1 ring-primary/10">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-outline-variant/30">
                  <span className="material-symbols-outlined text-[20px] text-primary">menu_book</span>
                  <h3 className="font-label-lg text-sm font-bold text-on-surface">
                    Présentation Pédagogique & Objectifs d'Amphi
                  </h3>
                </div>
                <p className="font-body-md text-sm text-on-surface leading-loose text-justify text-justified-academic">
                  {resource.description}
                </p>
              </div>
            </section>
          )}

          {/* Visual Preview Carousel with Watermark/Frosted Paywall */}
          <section className="mt-space-lg">
            <div className="px-margin flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  visibility
                </span>
                <h4 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Aperçu interactif
                </h4>
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant">
                Page 1 sur {resource.pageCount || 14}
              </span>
            </div>
            <div className="px-margin">
              <div className="relative w-full rounded-2xl overflow-hidden bg-surface-container-lowest shadow-sm border-2 border-primary/25 ring-1 ring-primary/10">
                {/* Document Preview Canvas */}
                <div className="relative h-80 w-full overflow-hidden bg-surface-container-high">
                  <img
                    className="w-full h-full object-cover filter blur-[2px] scale-105 select-none pointer-events-none"
                    alt="Aperçu document"
                    src={resource.thumbnailUrl}
                  />
                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-surface-tint/20 to-surface/90"></div>
                  {/* Academic watermark stamp */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 -rotate-12">
                    <div className="border-4 border-dashed border-primary px-6 py-2 rounded-2xl text-center">
                      <span className="font-headline-xl-mobile text-headline-xl-mobile font-extrabold uppercase text-primary tracking-widest">
                        CAMPUS CERTIFIÉ
                      </span>
                      <p className="font-label-sm text-label-sm text-primary font-bold">
                        COPYRIGHT UJKZ 2025 • ANTI-PLAGIAT
                      </p>
                    </div>
                  </div>
                  {/* Teaser Highlight Floating Badge */}
                  <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      auto_stories
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                      Extrait Exercice 1 : Phonétique combinatoire
                    </span>
                  </div>
                  {/* Interactive Peeking Card Overlay */}
                  <div className="absolute inset-x-3 bottom-3 bg-surface-container-lowest/95 backdrop-blur-xl p-space-md rounded-xl shadow-md border border-primary/20 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-[20px]">
                          lock
                        </span>
                        <span className="font-label-lg text-label-lg text-on-surface font-bold">
                          {Math.max((resource.pageCount || 14) - 1, 1)} pages restantes verrouillées
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed px-2 py-0.5 rounded-md font-bold">
                        Déblocage direct
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Inclus : Arbre syntaxique complet, méthode de transcription API, et questions
                      types probables pour le rattrapage.
                    </p>
                  </div>
                </div>
                {/* Carousel navigation tabs */}
                <div className="p-space-sm bg-surface-container-low flex items-center justify-between border-t border-primary/15">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-2 rounded-full bg-primary inline-block"></span>
                    <span className="w-2 h-2 rounded-full bg-outline-variant inline-block"></span>
                    <span className="w-2 h-2 rounded-full bg-outline-variant inline-block"></span>
                    <span className="w-2 h-2 rounded-full bg-outline-variant inline-block"></span>
                  </div>
                  <button
                    className="text-primary font-label-md text-label-md flex items-center gap-1 active:opacity-75 font-bold"
                    type="button"
                    onClick={() => router.push('/lecteur/CF-8921-UJKZ-SSL')}
                  >
                    Feuilleter l'index
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Polymorphic Media Bundle Showcase */}
          <section className="px-margin mt-space-xl flex flex-col gap-space-md">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Contenu du Pack ({resource.media?.length || 3} Fichiers)
                </h4>
                <span className="font-label-sm text-label-sm text-primary font-bold bg-primary-fixed px-2.5 py-0.5 rounded-full border border-primary/20">
                  Prêt hors-ligne
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Ce dossier combine cours rédigé, mémo oral et schéma haute définition.
              </p>
            </div>

            {/* Media Item 1: Master PDF */}
            <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-xs border-2 border-red-500/30 hover:border-red-500/50 transition-colors flex flex-col gap-space-sm">
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-sm text-label-sm bg-error-container text-on-error-container px-1.5 py-0.5 rounded font-bold uppercase">
                        PDF
                      </span>
                      <p className="font-label-lg text-label-lg text-on-surface truncate font-bold">
                        {pdfMedia?.originalFilename || 'Correction_Examen_2025.pdf'}
                      </p>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      {resource.pageCount || 14} pages • 2.4 Mo • Annotations en couleur
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 px-3 py-2 rounded-xl flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[16px] text-primary">psychology</span>
                  Astuces barème & pièges des profs
                </span>
                <span className="font-label-sm text-label-sm text-primary shrink-0 font-bold">
                  100% lisible
                </span>
              </div>
            </div>

            {/* Media Item 2: Interactive Audio Player */}
            <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-xs border-2 border-amber-500/35 hover:border-amber-500/55 transition-colors flex flex-col gap-space-sm">
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[24px]">graphic_eq</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed px-1.5 py-0.5 rounded font-bold uppercase">
                        AUD
                      </span>
                      <p className="font-label-lg text-label-lg text-on-surface truncate font-bold">
                        {audioMedia?.originalFilename || 'Vocal_Points_Clefs_Amphi.mp3'}
                      </p>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Explication 8 min 42 s • Moussa en direct
                    </p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm bg-tertiary/10 text-tertiary border border-tertiary/20 px-2 py-0.5 rounded-full shrink-0 font-bold">
                  Aperçu 30s
                </span>
              </div>

              {/* Animated Audio Waveform & Control Bar */}
              <div className="bg-amber-500/5 border border-amber-500/20 p-space-sm rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <button
                    aria-label="Jouer extrait audio"
                    type="button"
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className={`w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform ${
                      isPlayingAudio ? 'animate-pulse' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {isPlayingAudio ? 'pause' : 'play_arrow'}
                    </span>
                  </button>

                  {/* Waveform Bars */}
                  <div className="flex-1 flex items-center justify-between gap-[3px] h-8 px-1">
                    {[12, 24, 16, 28, 20, 32, 16, 24, 12, 20, 28, 16, 24, 12, 16, 8].map(
                      (h, idx) => (
                        <div
                          key={idx}
                          className={`w-1 rounded-full transition-all duration-300 ${
                            idx < 8 ? 'bg-primary' : 'bg-outline-variant'
                          }`}
                          style={{ height: `${isPlayingAudio ? Math.max(h + (idx % 3) * 4, 8) : h}px` }}
                        ></div>
                      )
                    )}
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0 tabular-nums font-mono">
                    00:30 / 08:42
                  </span>
                </div>
                <div className="flex items-center justify-between px-1">
                  <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-tertiary">mic</span>
                    "Écoutez bien l'explication sur la morphologie dérivationnelle..."
                  </p>
                </div>
              </div>
            </div>

            {/* Media Item 3: Diagram Photo */}
            <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-xs border-2 border-blue-500/30 hover:border-blue-500/50 transition-colors flex flex-col gap-space-sm">
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[24px]">schema</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed-variant px-1.5 py-0.5 rounded font-bold uppercase">
                        JPG
                      </span>
                      <p className="font-label-lg text-label-lg text-on-surface truncate font-bold">
                        {imageMedia?.originalFilename || 'Synthese_Arbre_Syntaxique.jpg'}
                      </p>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Ultra HD 3840x2160 • Prise de vue tableau amphi
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
              </div>
              <div
                className="relative rounded-xl overflow-hidden h-32 bg-surface-container border border-blue-500/20 cursor-pointer group"
                onClick={() => setIsZoomModalOpen(true)}
              >
                <img
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  alt="Schéma Arbre Syntaxique"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUeNOmRkjhIiWurH8UEA2THc-a8167rdsJQaSzMPhb1qOkmrkgcVtLq-x1EXSQrQoXxsEI3zPah1qxfYSbOC89FM0OSUk3PcXu8HKJ9gtrGL3NcpCaNKwP_dglqVV-jR6jao8gBIsCf6Qp_e2mC_QhoKxnobPFXgX2bXdcDMU1n1ZASAIbjjgVG5srkdIhRXIrRzvrdwMtbRMcLRxGFQjAoGxYyXEnBTQ-Q086Ti_jSNtCfFpZX9FpPA"
                />
                <div className="absolute inset-0 bg-inverse-surface/40 flex items-center justify-center">
                  <div className="bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-blue-500/20">
                    <span className="material-symbols-outlined text-primary text-[16px]">
                      zoom_in
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                      Cliquer pour zoom HD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Direct Campus Support Switch (WhatsApp Study Circle) */}
          <section className="px-margin mt-space-xl">
            <div className="bg-surface-container-low rounded-2xl p-space-md shadow-xs border-2 border-[#15803D]/30">
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">groups</span>
                  </div>
                  <div>
                    <h4 className="font-headline-md text-headline-md text-on-surface font-bold">
                      Mode Présentiel & WhatsApp
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Besoin d'aide en direct sur le campus UJKZ ?
                    </p>
                  </div>
                </div>

                {/* Toggle Micro Switch */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={whatsappEnabled}
                    onChange={(e) => setWhatsappEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                </label>
              </div>

              {whatsappEnabled && (
                <div className="mt-space-md p-space-sm bg-surface-container-lowest rounded-xl flex items-center justify-between gap-space-sm border border-[#15803D]/30 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-[#15803D] animate-ping"></div>
                    <p className="font-body-sm text-body-sm text-on-surface truncate">
                      {resource.contactChannel?.meetingLocation ||
                        'Moussa dispo Amphi A aujourd’hui de 16h à 18h'}
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/${resource.contactChannel?.phoneNumber?.replace(/[^0-9]/g, '') || '22670112233'}?text=${encodeURIComponent(
                      'Bonjour, je souhaite échanger sur le document : ' + resource.title
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-label-sm text-label-sm text-[#15803D] bg-[#DCFCE7] border border-[#15803D]/20 px-2.5 py-1 rounded-md font-bold hover:bg-[#bbf7d0] transition-colors"
                  >
                    Rejoindre le cercle
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Intellectual Property & Guarantee Badge */}
          <section className="px-margin mt-space-md">
            <div className="bg-surface-container-lowest p-space-md rounded-2xl flex items-center gap-space-sm shadow-xs border-2 border-primary/20 ring-1 ring-primary/10">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary border border-primary/20">
                <span className="material-symbols-outlined text-[22px]">verified_user</span>
              </div>
              <div className="min-w-0">
                <h5 className="font-label-lg text-label-lg text-on-surface font-bold">
                  Déclaration originale certifiée
                </h5>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  Ressource déposée par l'auteur • Conforme au programme {resource.academicYear}
                </p>
              </div>
            </div>
          </section>

          {/* Student Reviews Mini Strip */}
          <section className="px-margin mt-space-xl flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Avis des camarades
                </h4>
                <span className="font-label-md text-label-md text-secondary font-bold">
                  ★ {resource.ratingAverage?.toFixed(1) || '4.9'}/5
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {resource.reviews?.length || 2} retours
              </span>
            </div>

            <div className="flex flex-col gap-space-sm">
              {resource.reviews?.length > 0 ? (
                resource.reviews.map((rev: any) => (
                  <div
                    key={rev.id}
                    className="bg-surface-container-lowest p-space-md rounded-2xl shadow-xs border-2 border-outline-variant/40"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md text-on-surface font-bold">
                          {rev.user?.profile?.displayName || 'Étudiant'}
                        </span>
                        <span className="font-label-sm text-label-sm text-primary bg-primary-fixed border border-primary/20 px-1.5 py-0.2 rounded font-bold">
                          Achat vérifié
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Il y a 2h
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface">"{rev.comment}"</p>
                  </div>
                ))
              ) : (
                <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-xs border-2 border-outline-variant/30 text-body-sm text-on-surface-variant">
                  Soyez le premier camarade à donner votre avis après consultation !
                </div>
              )}
            </div>
          </section>

          {/* Sticky Monetization & Purchase Drawer Zone (Mobile only) */}
          <div className="lg:hidden sticky bottom-0 left-0 right-0 z-40 mt-space-xl p-margin bg-surface-container-lowest/98 backdrop-blur-xl shadow-2xl border-t-2 border-primary/30 ring-1 ring-primary/10">
            <div className="max-w-md mx-auto flex flex-col gap-space-sm">
              {/* Price & Guarantee Row */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-price-display text-price-display text-secondary font-black">
                      {isPaid ? `${price} FCFA` : 'GRATUIT'}
                    </span>
                    {isPaid && (
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        (~{(price / 655.957).toFixed(2)} €)
                      </span>
                    )}
                  </div>
                  <p className="font-label-sm text-label-sm text-primary flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-[13px]">bolt</span> Accès illimité à vie
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-label-sm text-label-sm bg-orange-100 border border-orange-300 text-orange-800 px-2 py-1 rounded-md font-bold">
                    Orange Money
                  </span>
                  <span className="font-label-sm text-label-sm bg-blue-100 border border-blue-300 text-blue-800 px-2 py-1 rounded-md font-bold">
                    Moov
                  </span>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="flex items-center gap-space-sm">
                <button
                  type="button"
                  onClick={handleUnlockClick}
                  disabled={isUnlocking}
                  className="flex-1 h-12 bg-secondary-container text-on-secondary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all font-bold cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-[20px] ${isUnlocking ? 'animate-spin' : ''}`}>
                    {isUnlocking ? 'sync' : isPaid ? 'download' : 'menu_book'}
                  </span>
                  <span>
                    {isUnlocking
                      ? 'Connexion Orange/Moov...'
                      : isPaid
                      ? 'Débloquer & Télécharger'
                      : 'Consulter Gratuitement'}
                  </span>
                </button>

                {/* Native Campus Folder Direct Chat with Author */}
                <button
                  type="button"
                  onClick={handleContactAuthorInApp}
                  aria-label="Échanger directement avec l’auteur sur Campus Folder"
                  className="w-12 h-12 rounded-xl bg-primary-fixed border border-primary/30 text-primary flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[24px]">chat</span>
                </button>
              </div>

              <p className="text-center font-body-sm text-body-sm text-on-surface-variant flex items-center justify-center gap-1 text-[11px]">
                <span className="material-symbols-outlined text-[14px] text-outline">lock</span>
                Paiement mobile instantané • Pas de carte bancaire requise
              </p>
            </div>
          </div>
        </div>
        {/* End Left Column (7 cols) */}

        {/* Right Desktop Sticky Action Column (5 cols on Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col gap-6 sticky top-20 self-start">
          {/* Main Purchase Card */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-md border-2 border-primary/30 ring-1 ring-primary/15 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-outline">Tarif Certifié</span>
              <span className="text-[11px] bg-primary-fixed border border-primary/25 text-primary px-2.5 py-0.5 rounded-full font-bold">
                Session 2025
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-secondary font-mono">
                {isPaid ? `${price.toLocaleString('fr-FR')} FCFA` : 'GRATUIT'}
              </span>
              {isPaid && (
                <span className="text-xs text-on-surface-variant font-medium">
                  TVA incluse • 0 FCFA de frais
                </span>
              )}
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Débloquez l&apos;intégralité des <strong>3 supports pédagogiques</strong> (PDF 12p, Audio explication, Barème officiel) avec synchronisation hors-ligne garantie.
            </p>

            <button
              type="button"
              onClick={handleUnlockClick}
              disabled={isUnlocking}
              className="w-full h-13 py-3.5 bg-secondary-container hover:bg-[#c94b0a] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isUnlocking ? 'sync' : isPaid ? 'shopping_bag' : 'menu_book'}
              </span>
              <span>
                {isUnlocking
                  ? 'Connexion sécurisée...'
                  : isPaid
                  ? `Débloquer maintenant • ${price} FCFA`
                  : 'Consulter Gratuitement'}
              </span>
            </button>

            {/* Mobile Operators Supported */}
            <div className="flex items-center justify-center gap-3 pt-3 border-t border-outline-variant/30 text-xs font-bold text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Orange Money (+226)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Moov Flooz
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" />
                1-Clic Solde
              </span>
            </div>
          </div>

          {/* Physical Peer Handover & WhatsApp Contact Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border-2 border-[#15803D]/30 ring-1 ring-[#15803D]/15 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#15803D] text-[20px]">diversity_3</span>
                <h4 className="text-sm font-bold text-on-surface">Remise physique ou WhatsApp</h4>
              </div>
              <span className="text-[10px] bg-[#DCFCE7] border border-[#15803D]/25 text-[#15803D] px-2 py-0.5 rounded-full font-bold">
                Campus
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Vous pouvez également rencontrer {resource.author?.profile?.displayName || 'l’auteur'} directement devant l&apos;Amphi A pour récupérer les notes imprimées.
            </p>
            <button
              type="button"
              onClick={handleContactAuthorInApp}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">forum</span>
              <span>Discuter avec l'auteur sur Campus Folder</span>
            </button>
            <a
              href={`https://wa.me/${resource.contactChannel?.phoneNumber?.replace(/[^0-9]/g, '') || '22670112233'}?text=${encodeURIComponent(
                'Bonjour, je souhaite échanger sur le document : ' + resource.title
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/30 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>Échanger par WhatsApp (+226)</span>
            </a>
          </div>

          {/* Academic Trust Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/40 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[22px]">all_inclusive</span>
              <div>
                <p className="text-[11px] font-bold text-on-surface leading-tight">Accès à vie</p>
                <p className="text-[10px] text-on-surface-variant leading-tight">Toujours synchronisé</p>
              </div>
            </div>
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/40 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[22px]">cloud_download</span>
              <div>
                <p className="text-[11px] font-bold text-on-surface leading-tight">Mode hors-ligne</p>
                <p className="text-[10px] text-on-surface-variant leading-tight">Lecture sans datas</p>
              </div>
            </div>
          </div>
        </div>
        {/* End Right Column */}
      </div>

        {/* Modal Zoom HD for Diagram Photo */}
        {isZoomModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsZoomModalOpen(false)}
          >
            <div className="relative max-w-lg w-full bg-surface-container-lowest rounded-2xl overflow-hidden p-2">
              <button
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center"
                onClick={() => setIsZoomModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUeNOmRkjhIiWurH8UEA2THc-a8167rdsJQaSzMPhb1qOkmrkgcVtLq-x1EXSQrQoXxsEI3zPah1qxfYSbOC89FM0OSUk3PcXu8HKJ9gtrGL3NcpCaNKwP_dglqVV-jR6jao8gBIsCf6Qp_e2mC_QhoKxnobPFXgX2bXdcDMU1n1ZASAIbjjgVG5srkdIhRXIrRzvrdwMtbRMcLRxGFQjAoGxYyXEnBTQ-Q086Ti_jSNtCfFpZX9FpPA"
                alt="Zoom HD Arbre Syntaxique"
                className="w-full h-auto rounded-xl"
              />
              <p className="text-center text-body-sm text-on-surface-variant mt-2 font-medium">
                Synthese_Arbre_Syntaxique.jpg • Prise de vue amphi haute résolution
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
