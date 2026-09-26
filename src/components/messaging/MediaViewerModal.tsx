'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface MediaItem {
  type: 'PDF' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'YOUTUBE';
  url: string;
  title: string;
  authorName?: string;
  pageCount?: number;
  durationSeconds?: number;
  canDownload?: boolean;
  downloadToken?: string;
}

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem | null;
}

export default function MediaViewerModal({ isOpen, onClose, media }: MediaViewerModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setCurrentPage(1);
      setIsPlayingAudio(false);
      setAudioProgress(0);
    }
  }, [isOpen, media]);

  if (!isOpen || !media) return null;

  // Extract YouTube ID if youtube type or URL matches
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1` : url;
  };

  const isYouTube =
    media.type === 'YOUTUBE' ||
    media.url.includes('youtube.com') ||
    media.url.includes('youtu.be');

  const speeds = [0.75, 1, 1.25, 1.5, 2];
  const cycleSpeed = () => {
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
    if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-on-surface/95 backdrop-blur-xl text-white select-none animate-fadeIn">
      {/* Top Floating App Bar */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-black/40">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la visionneuse"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
          <div className="min-w-0">
            <h3 className="font-headline-md text-sm sm:text-base font-bold truncate text-white">
              {media.title}
            </h3>
            {media.authorName && (
              <p className="text-xs text-white/70 truncate">
                Ressource partagée par {media.authorName}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {media.type === 'PDF' && (
            <div className="hidden sm:flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="hover:text-primary transition-colors p-1"
              >
                <span className="material-symbols-outlined text-[18px]">zoom_out</span>
              </button>
              <span>{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                className="hover:text-primary transition-colors p-1"
              >
                <span className="material-symbols-outlined text-[18px]">zoom_in</span>
              </button>
            </div>
          )}

          {(media.type === 'VIDEO' || media.type === 'AUDIO') && !isYouTube && (
            <button
              type="button"
              onClick={cycleSpeed}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition-all"
            >
              {playbackSpeed}x
            </button>
          )}

          {media.canDownload && (
            <a
              href={media.url}
              download={media.title}
              className="h-9 px-3 rounded-xl bg-primary text-on-primary font-label-sm text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="hidden sm:inline">Télécharger</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Media Canvas Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-3 sm:p-6 relative">
        {/* 1. YOUTUBE VIDEO */}
        {isYouTube && (
          <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
            <iframe
              className="w-full h-full"
              src={getYouTubeEmbedUrl(media.url)}
              title={media.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}

        {/* 2. NATIVE VIDEO */}
        {!isYouTube && media.type === 'VIDEO' && (
          <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 flex flex-col items-center">
            <video
              ref={videoRef}
              src={media.url}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[75vh] object-contain"
            />
          </div>
        )}

        {/* 3. IMAGE VIEWER */}
        {media.type === 'IMAGE' && (
          <div
            className="w-full h-full flex items-center justify-center overflow-auto cursor-zoom-in"
            onClick={() => setZoomLevel((z) => (z === 1 ? 1.75 : 1))}
          >
            <img
              src={media.url}
              alt={media.title}
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-300"
            />
          </div>
        )}

        {/* 4. PDF VIEWER */}
        {media.type === 'PDF' && (
          <div className="w-full max-w-3xl h-full flex flex-col items-center justify-between gap-3">
            <div
              className="flex-1 w-full bg-white text-on-surface rounded-2xl shadow-2xl overflow-auto p-4 sm:p-8 border border-outline-variant/30 flex flex-col items-center"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
            >
              {/* Document Header Representation */}
              <div className="w-full pb-4 border-b border-outline-variant/30 flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-[10px] text-primary uppercase font-bold tracking-wider">
                    Université Joseph KI-ZERBO • Session 2025
                  </span>
                  <h4 className="font-headline-md text-base sm:text-lg font-bold text-on-surface">
                    {media.title}
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary-fixed text-primary font-bold text-xs">
                  Page {currentPage}/{media.pageCount || 14}
                </span>
              </div>

              {/* Dynamic Document Body Preview */}
              <div className="w-full py-6 flex flex-col gap-4 text-xs sm:text-sm leading-relaxed text-on-surface">
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
                  <h5 className="font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">school</span>
                    Module : Algorithmique Avancée & Structures de Données
                  </h5>
                  <p>
                    <strong>Exercice 1 :</strong> Étude de la complexité asymptotique de l'arbre binaire de recherche équilibré (AVL).
                  </p>
                  <p className="font-mono bg-white p-3 rounded-lg border border-outline-variant/30 text-[11px]">
                    {`int hauteur(Noeud* n) {\n  if (n == NULL) return 0;\n  return 1 + max(hauteur(n->gauche), hauteur(n->droite));\n}`}
                  </p>
                  <p>
                    La rotation droite simple s'effectue lorsque le facteur d'équilibre du nœud déséquilibré est supérieur à 1.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <h5 className="font-bold text-secondary mb-1">Méthode de Révision Recommandée</h5>
                  <p>
                    Revoir impérativement les TD 2 et 3 avant l'examen de session principale. La notation sanctionnera les fuites mémoires dans les allocations dynamiques.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Page Stepper */}
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shrink-0">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <span className="font-label-md text-xs font-bold">
                {currentPage} / {media.pageCount || 14}
              </span>
              <button
                type="button"
                disabled={currentPage >= (media.pageCount || 14)}
                onClick={() => setCurrentPage((p) => Math.min(media.pageCount || 14, p + 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. AUDIO WAVEFORM PLAYER */}
        {media.type === 'AUDIO' && (
          <div className="w-full max-w-lg bg-surface-container-lowest text-on-surface p-6 rounded-3xl shadow-2xl border border-outline-variant/30 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-md">
                <span className="material-symbols-outlined text-[32px]">mic</span>
              </div>
              <div className="min-w-0">
                <span className="font-label-sm text-[10px] text-primary uppercase font-bold">
                  Note Vocale Académique
                </span>
                <h4 className="font-headline-md text-lg font-bold text-on-surface truncate">
                  {media.title}
                </h4>
                <p className="text-xs text-on-surface-variant">
                  {media.authorName || 'Major de Promotion'}
                </p>
              </div>
            </div>

            {/* Interactive Audio Waveform Simulation */}
            <div className="flex items-center gap-1 h-14 bg-surface-container-low px-4 rounded-2xl border border-outline-variant/30">
              {[20, 45, 80, 50, 30, 95, 65, 40, 75, 85, 35, 60, 90, 45, 30, 70, 85, 40, 25, 60, 80, 50, 30].map(
                (h, idx) => {
                  const active = idx / 23 <= audioProgress;
                  return (
                    <div
                      key={idx}
                      onClick={() => setAudioProgress(idx / 23)}
                      className={`flex-1 rounded-full cursor-pointer transition-all duration-150 ${
                        active ? 'bg-primary' : 'bg-outline-variant/60 hover:bg-outline'
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  );
                }
              )}
            </div>

            {/* Player Controls */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-on-surface-variant">
                {Math.floor((audioProgress * (media.durationSeconds || 120)) / 60)}:
                {String(Math.floor((audioProgress * (media.durationSeconds || 120)) % 60)).padStart(2, '0')}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAudioProgress((p) => Math.max(0, p - 0.1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
                >
                  <span className="material-symbols-outlined text-[22px]">replay_10</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[30px]">
                    {isPlayingAudio ? 'pause' : 'play_arrow'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudioProgress((p) => Math.min(1, p + 0.1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
                >
                  <span className="material-symbols-outlined text-[22px]">forward_10</span>
                </button>
              </div>

              <button
                type="button"
                onClick={cycleSpeed}
                className="px-2.5 py-1 rounded-lg bg-surface-container-high text-xs font-bold text-on-surface"
              >
                {playbackSpeed}x
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
