'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';

function VoiceNoteCard({
  doc,
  isPlayingAudio,
  setIsPlayingAudio,
  speeds,
  speedIdx,
  toggleSpeed,
  showToast,
}: any) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 rounded-full bg-surface-container-high overflow-hidden shrink-0 ring-2 ring-primary/20">
            <img
              className="w-full h-full object-cover"
              alt="Major"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCc3PVTyqZN1TppLsIyBpo2-6zoBYobbZF-u5hk8WlAqQVvtoGXYP16d1cAn-NNKUQegs04Pj8QwyO0BRzxue8JE2PACYiH_Ok8qjz5wyrGAL_AzPSUJHJyTx0EF074aMOdhMplv_WhsuktOSokZfbbP0ll-DQyxZxH-c_tJ3tV77qJXV4-BwPNI2bFg2w6_zXZNrncb0b2pAfvvRLck3zVLMf3dSQ0ecpAfm5A2_A5yhPYVgEM9e9o5w"
            />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-white text-[9px]">
              <span className="material-symbols-outlined text-[11px]">mic</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-label-md text-label-md text-on-surface font-bold truncate">
                {doc.voiceNote?.title || 'Note Vocale du Major'}
              </p>
              <span className="material-symbols-outlined text-primary text-[15px]">
                verified
              </span>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant truncate">
              {doc.voiceNote?.description || 'Explication dérivation & méthode'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleSpeed}
          className="px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-xs shrink-0 font-bold hover:bg-surface-container-highest transition-colors"
        >
          {speeds[speedIdx]}
        </button>
      </div>

      {/* Waveform & Controls */}
      <div className="flex items-center gap-3 pt-1 border-t border-surface-container-high">
        <button
          type="button"
          onClick={() => {
            const next = !isPlayingAudio;
            setIsPlayingAudio(next);
            showToast(next ? 'Audio du délégué en lecture...' : 'Audio mis en pause');
          }}
          className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm shrink-0 active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px]">
            {isPlayingAudio ? 'pause' : 'play_arrow'}
          </span>
        </button>

        <div
          className="flex-1 flex items-center gap-1 h-8 overflow-hidden cursor-pointer"
          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
        >
          {[12, 20, 24, 8, 16, 28, 20, 12, 16, 24, 12, 20, 8, 24, 16, 8, 14, 22, 18, 10].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                i < 10 ? 'bg-primary' : 'bg-primary-fixed-dim'
              }`}
              style={{ height: `${isPlayingAudio ? Math.max(h + (i % 4) * 3, 6) : h}px` }}
            ></span>
          ))}
        </div>
        <span className="font-label-sm text-xs text-on-surface-variant tabular-nums shrink-0 font-mono font-semibold">
          {doc.voiceNote?.duration || '02:14 / 06:40'}
        </span>
      </div>
    </div>
  );
}

function OfflineCacheCard() {
  return (
    <div className="p-4 bg-surface-container-lowest rounded-2xl flex flex-col gap-3 border border-surface-container-high shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[17px]">offline_pin</span>
          </span>
          <span className="font-label-md text-sm text-on-surface font-bold">
            Téléchargé & Prêt Hors-Ligne
          </span>
        </div>
        <span className="font-label-sm text-[11px] text-primary font-bold bg-primary-fixed/40 px-2 py-0.5 rounded-full">
          100% Zéro Data
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
          <div className="bg-primary h-2 rounded-full w-[28%] transition-all"></div>
        </div>
        <div className="flex items-center justify-between font-label-sm text-xs text-on-surface-variant font-medium">
          <span>Mémoire occupée : 3.4 Mo</span>
          <span>Quota Campus Cache : 12 Mo</span>
        </div>
      </div>
    </div>
  );
}

function WhatsAppGroupCard() {
  return (
    <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-xs flex items-center justify-between gap-3 border border-surface-container-high">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 flex items-center justify-center text-[#128C7E] shrink-0">
          <span className="material-symbols-outlined text-[24px]">forum</span>
        </div>
        <div className="min-w-0">
          <h4 className="font-label-lg text-sm text-on-surface font-bold truncate">
            Groupe WhatsApp de l'Amphi B
          </h4>
          <p className="font-body-sm text-xs text-on-surface-variant truncate">
            182 camarades débattent sur l'exercice 3
          </p>
        </div>
      </div>
      <a
        href="https://chat.whatsapp.com/demo-campus-folder"
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 rounded-lg bg-[#25D366] text-white font-label-sm text-xs font-bold flex items-center gap-1 shadow-sm shrink-0 active:scale-95 transition-transform"
      >
        <span>Rejoindre</span>
        <span className="material-symbols-outlined text-[14px]">north_east</span>
      </a>
    </div>
  );
}

export default function DocumentReaderPage() {
  const router = useRouter();
  const params = useParams();
  const token = (params?.token as string) || 'CF-8921-UJKZ-SSL';

  const [documentData, setDocumentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Viewer interactive states
  const [currentPage, setCurrentPage] = useState(1);
  const maxPages = 14;
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isAmphiMode, setIsAmphiMode] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const speeds = ['1.0x', '1.25x', '1.5x', '2.0x'];
  const [speedIdx, setSpeedIdx] = useState(0);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/reader/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.document) {
          setDocumentData(data.document);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleZoom = () => {
    if (zoomLevel === 100) setZoomLevel(125);
    else if (zoomLevel === 125) setZoomLevel(150);
    else setZoomLevel(100);
    showToast(`Zoom ajusté à ${zoomLevel === 100 ? '125%' : zoomLevel === 125 ? '150%' : '100%'}`);
  };

  const toggleAmphiMode = () => {
    const next = !isAmphiMode;
    setIsAmphiMode(next);
    showToast(next ? 'Mode Amphi Fort Contraste activé' : 'Mode Rendu Standard');
  };

  const toggleSpeed = () => {
    const nextIdx = (speedIdx + 1) % speeds.length;
    setSpeedIdx(nextIdx);
    showToast(`Vitesse vocale : ${speeds[nextIdx]}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <Header showBack title="Initialisation..." />
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">
              sync
            </span>
            <span className="text-body-sm text-on-surface-variant font-medium">
              Génération du filigrane sécurisé SSL...
            </span>
          </div>
        </div>
      </div>
    );
  }

  const doc = documentData || {
    title: 'Macroéconomie II • Modèle IS-LM',
    academicLevel: 'L2 Droit & Éco',
    licenseId: '#CF-8921',
    totalPages: 14,
    watermarkText: 'KOUASSI A. • ID #CF-8921 • UCAD • USAGE STRICTEMENT PERSONNEL',
    formulaTitle: '1. Formule de Référence IS-LM :',
    formulaEquation: 'Y = C(Y - T) + I(Y, i) + G\nM / P = L(Y, i)',
    professorNote:
      'Toujours dériver selon i avant d’injecter le multiplicateur budgétaire. Piège classique de l’examen final !',
    voiceNote: {
      authorName: 'Mamadou D.',
      title: 'Note Vocale du Major',
      description: 'Mamadou D. • Explication dérivation équation (3)',
      duration: '02:14 / 06:40',
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header showBack title="Lecteur Document Sécurisé" />

      <main className="flex-1 flex flex-col relative w-full pt-20 pb-24 bg-surface max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col w-full pb-10">
          {/* Top Banner Status & Metrics */}
          <div className="p-4 sm:p-5 bg-surface-container-low rounded-2xl flex flex-col gap-space-xs border border-surface-container-high shadow-xs mb-6">
            <div className="flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs min-w-0">
                <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider truncate font-bold">
                  Licence Active • SSL {doc.licenseId}
                </span>
              </div>
              <div className="flex items-center gap-space-xs shrink-0">
                <button
                  type="button"
                  onClick={toggleAmphiMode}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-label-sm font-label-sm transition-colors font-bold ${
                    isAmphiMode
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-highest text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">contrast</span>
                  <span>Amphi HQ</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Mode Plein Écran')}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <h2 className="font-headline-md text-xl sm:text-2xl text-on-surface truncate font-bold">
                {doc.title}
              </h2>
              <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold shrink-0">
                {doc.academicLevel}
              </span>
            </div>
          </div>

          {/* Desktop 2-Column Grid */}
          <div className="w-full lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Viewer Controls, Paper Canvas & Actions (8 cols on desktop) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Mobile-Only Voice Note Player */}
              <div className="lg:hidden">
                <VoiceNoteCard
                  doc={doc}
                  isPlayingAudio={isPlayingAudio}
                  setIsPlayingAudio={setIsPlayingAudio}
                  speeds={speeds}
                  speedIdx={speedIdx}
                  toggleSpeed={toggleSpeed}
                  showToast={showToast}
                />
              </div>

              {/* Interactive Secure Viewer */}
              <div className="flex flex-col gap-space-xs">
                {/* Viewer Controls Bar */}
                <div className="flex items-center justify-between px-space-sm py-2 bg-surface-container rounded-xl border border-surface-container-high shadow-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentPage > 1) {
                          setCurrentPage((p) => p - 1);
                          showToast(`Navigation vers la page ${currentPage - 1}`);
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    <span className="font-label-md text-label-md text-on-surface tabular-nums font-semibold px-1">
                      Page <strong>{currentPage}</strong> sur {doc.totalPages || 14}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentPage < maxPages) {
                          setCurrentPage((p) => p + 1);
                          showToast(`Navigation vers la page ${currentPage + 1}`);
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleZoom}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-label-sm font-bold shadow-xs border border-surface-container-high"
                    >
                      <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                      <span>{zoomLevel}%</span>
                    </button>
                    <div className="flex items-center gap-1 text-primary">
                      <span className="material-symbols-outlined text-[16px]">verified_user</span>
                      <span className="font-label-sm text-label-sm uppercase font-bold hidden sm:inline">Signé</span>
                    </div>
                  </div>
                </div>

                {/* Paper Mockup Canvas */}
                <div
                  className={`relative w-full bg-surface-container-lowest rounded-2xl shadow-md border border-surface-container-high overflow-hidden min-h-[460px] sm:min-h-[560px] select-none flex flex-col justify-between p-6 sm:p-8 transition-all duration-200 origin-top ${
                    isAmphiMode ? 'filter invert' : ''
                  }`}
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  {/* Anti-Piracy Dynamic Watermark Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-around items-center opacity-[0.08] rotate-[-25deg] select-none">
                    <div className="text-on-surface font-headline-md uppercase tracking-widest text-center font-black">
                      {doc.watermarkText}
                    </div>
                    <div className="text-on-surface font-headline-md uppercase tracking-widest text-center font-black">
                      USAGE STRICTEMENT PERSONNEL • LICENCE ACADÉMIQUE
                    </div>
                    <div className="text-on-surface font-headline-md uppercase tracking-widest text-center font-black">
                      {doc.watermarkText}
                    </div>
                  </div>

                  {/* Sheet Header */}
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">
                        Fiche de Synthèse & TD N°4
                      </span>
                      <h3 className="font-headline-lg-mobile sm:text-2xl text-headline-lg-mobile text-on-surface font-extrabold">
                        {doc.title}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Prof. K. Traoré • Semestre 4 • Année Académique 2024-2025
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm rounded-lg font-bold">
                      NOTE TD: 18.5/20
                    </span>
                  </div>

                  {/* Formula Section */}
                  <div className="my-space-md p-space-md bg-surface-container-low rounded-xl relative z-10 flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-primary font-bold">
                        {doc.formulaTitle}
                      </span>
                      <span className="text-[11px] text-on-surface-variant italic">Ref. p. 42 du polycopié</span>
                    </div>
                    <div className="py-3 px-4 bg-surface-container-lowest rounded-lg text-on-surface font-mono text-[14px] leading-relaxed shadow-xs font-semibold">
                      {doc.formulaEquation.split('\n').map((line: string, idx: number) => (
                        <div key={idx}>{line}</div>
                      ))}
                    </div>
                    {/* Professor Note */}
                    <div className="mt-1 p-2.5 bg-secondary-fixed/40 rounded-lg flex items-start gap-space-xs text-secondary">
                      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                        edit_note
                      </span>
                      <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant italic text-justify leading-loose">
                        <strong>Remarque du Délégué :</strong> {doc.professorNote}
                      </p>
                    </div>

                    {/* Academic Synthesis Text Excerpt (Interligne 2 & Texte Justifié) */}
                    <div className="mt-2 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">
                        Démonstration & Synthèse Académique d'Amphi
                      </span>
                      <p className="text-on-surface text-xs leading-loose text-justify text-justified-academic">
                        Dans le cadre de l'évaluation semestrielle, l'analyse comparative des structures syntaxiques exige de distinguer rigoureusement les constituants immédiats des syntagmes nominaux et verbaux. Chaque proposition subordonnée relative doit être décomposée conformément aux règles génératives énoncées au cours magistral, avec justification formelle à chaque étape.
                      </p>
                    </div>
                  </div>

                  {/* Document Page Footer */}
                  <div className="flex items-center justify-between pt-3 relative z-10 border-t border-outline-variant/30">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[15px]">lock</span>
                      <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold font-mono">
                        SHA-256 : {doc.shaFingerprint?.substring(0, 16)}...
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface font-bold">
                      Page {currentPage} / {doc.totalPages || 14}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Only: Offline cache & WhatsApp */}
              <div className="lg:hidden flex flex-col gap-3 mt-2">
                <OfflineCacheCard />
                <WhatsAppGroupCard />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => showToast('Téléchargement du PDF filigrané crypté lancé')}
                  className="flex-1 h-12 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-xs shadow-md active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">download_done</span>
                  <span>Exporter PDF Filigrané Sécurisé</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Lien de partage crypté généré pour votre binôme')}
                  className="flex-1 h-12 rounded-xl bg-surface-container-highest text-on-surface font-label-lg text-label-lg font-semibold flex items-center justify-center gap-space-xs hover:bg-surface-container-high transition-colors active:scale-[0.98] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">group_add</span>
                  <span>Transférer à un binôme certifié</span>
                </button>
              </div>
            </div>

            {/* Right Column: Sticky Study Companion (4 cols on desktop) */}
            <aside className="hidden lg:flex lg:col-span-4 flex-col gap-5 sticky top-20 self-start">
              <VoiceNoteCard
                doc={doc}
                isPlayingAudio={isPlayingAudio}
                setIsPlayingAudio={setIsPlayingAudio}
                speeds={speeds}
                speedIdx={speedIdx}
                toggleSpeed={toggleSpeed}
                showToast={showToast}
              />
              <OfflineCacheCard />
              <WhatsAppGroupCard />
            </aside>
          </div>

          {/* Toast feedback */}
          {toastMessage && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-inverse-surface text-inverse-on-surface shadow-xl flex items-center gap-2 transition-all duration-300 z-50 animate-bounce">
              <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">
                check_circle
              </span>
              <span className="font-label-sm text-label-sm">{toastMessage}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
