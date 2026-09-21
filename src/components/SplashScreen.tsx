'use client';

import React, { useState, useEffect } from 'react';
import Logo from '@/components/Logo';

const MESSAGES = [
  'Campus Folder • Le Carrefour Académique du Faso & d’Afrique',
  'Initialisation de vos amphis, annales d’examens & corrigés certifiés...',
  'Connexion au réseau universitaire (UJKZ, UTS, UNA, USTA)...',
  'Chiffrement SSL 256-bit de votre espace pédagogique...',
  'Prêt ! Bienvenue dans votre amphi numérique.',
];

export default function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(15);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if splash was already shown in this session
    const hasSeenSplash = sessionStorage.getItem('cf_splash_viewed');
    if (hasSeenSplash === 'true') {
      setVisible(false);
      if (onFinish) onFinish();
      return;
    }

    // Message rotation timer (calm reading pace)
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 1250);

    // Progress animation over ~5.5s
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const jump = Math.floor(Math.random() * 12) + 8;
        return Math.min(prev + jump, 100);
      });
    }, 450);

    // End splash after 5.5 seconds
    const endTimeout = setTimeout(() => {
      setIsFadingOut(true);
      sessionStorage.setItem('cf_splash_viewed', 'true');
      setTimeout(() => {
        setVisible(false);
        if (onFinish) onFinish();
      }, 600);
    }, 5500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      clearTimeout(endTimeout);
    };
  }, [onFinish]);

  if (!visible) return null;

  const handleDismiss = () => {
    setIsFadingOut(true);
    sessionStorage.setItem('cf_splash_viewed', 'true');
    setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 sm:p-10 bg-gradient-to-b from-[#093d26] via-[#0D5C3A] to-[#062618] text-white transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#EA580C_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Top University Accents & Top Skip Button */}
      <div className="w-full flex items-center justify-between pt-safe z-10 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl">🇧🇫</span>
          <span className="text-[11px] font-bold tracking-widest uppercase opacity-90 font-mono">
            Réseau Universitaire BF
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span>Session Sécurisée</span>
          </div>
          {/* Top Skip Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer border border-white/20"
          >
            <span>Passer</span>
            <span className="material-symbols-outlined text-[15px]">skip_next</span>
          </button>
        </div>
      </div>

      {/* Center Animated Emblem */}
      <div className="flex flex-col items-center text-center my-auto z-10 px-4 max-w-md">
        {/* Orbital Rings & Icon Container */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
          {/* Outer Pulsing Glow */}
          <div className="absolute inset-0 rounded-full bg-[#EA580C]/25 blur-2xl animate-pulse" />

          {/* Rotating Ring 1 */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#10B981]/50 animate-[spin_10s_linear_infinite]" />

          {/* Rotating Ring 2 (reverse) */}
          <div className="absolute inset-2 rounded-full border-2 border-t-[#EA580C] border-r-transparent border-b-[#10B981] border-l-transparent animate-[spin_6s_linear_infinite_reverse]" />

          {/* Central Logo Container */}
          <div className="relative w-28 h-28 rounded-3xl bg-white shadow-2xl p-3 flex items-center justify-center transform hover:scale-105 transition-transform">
            <Logo size={88} showText={false} />
          </div>

          {/* Badge Indicator */}
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#EA580C] text-white flex items-center justify-center shadow-lg border-2 border-white">
            <span className="material-symbols-outlined text-[18px]">school</span>
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="font-extrabold text-3xl sm:text-4xl tracking-tight text-white mb-2 flex items-center gap-2">
          Campus Folder
        </h1>
        <p className="text-[#10B981] font-semibold text-sm sm:text-base tracking-wide mb-6">
          Plateforme Académique & Partage Pédagogique
        </p>

        {/* Dynamic Captivating Loading Message */}
        <div className="min-h-[56px] flex items-center justify-center max-w-sm px-2">
          <p className="text-white/90 text-sm sm:text-base font-medium leading-snug animate-fadeIn transition-all text-center">
            {MESSAGES[messageIndex]}
          </p>
        </div>
      </div>

      {/* Bottom Progress & Skip Bar */}
      <div className="w-full max-w-sm flex flex-col items-center gap-3 pb-safe z-10">
        {/* Progress Bar Container */}
        <div className="w-full bg-white/15 h-2.5 rounded-full overflow-hidden backdrop-blur-sm p-[1px]">
          <div
            className="h-full bg-gradient-to-r from-[#EA580C] via-[#10B981] to-[#6ffbbe] rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="w-full flex items-center justify-between text-xs text-white/80 font-mono">
          <span>INE • SSL 256 bits</span>
          <span className="font-bold text-white">{progress}%</span>
        </div>

        {/* Big Bottom Skip button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-1 px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
        >
          <span>Passer l'introduction</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
