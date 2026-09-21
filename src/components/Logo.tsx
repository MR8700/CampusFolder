'use client';

import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  showWordmark?: boolean;
  className?: string;
}

export default function Logo({
  size = 40,
  showText = true,
  showWordmark,
  className = '',
}: LogoProps) {
  const displayBrandText = showWordmark !== undefined ? showWordmark : showText;
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Icon Emblem */}
      <svg
        viewBox="0 0 240 240"
        width={size}
        height={size}
        className="shrink-0 drop-shadow-sm transition-transform duration-300 hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cfEmblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0D5C3A" />
            <stop offset="60%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="cfAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>

        {/* Base Rounded Square */}
        <rect x="15" y="15" width="210" height="210" rx="48" fill="url(#cfEmblemGrad)" />

        {/* Folder Back Tab */}
        <path
          d="M50 72 C50 62, 58 54, 68 54 L102 54 C110 54, 116 58, 120 64 L126 72 L172 72 C182 72, 190 80, 190 90 L190 100 L50 100 Z"
          fill="#FFFFFF"
          opacity="0.28"
        />

        {/* Folder Front Pocket */}
        <path
          d="M44 88 L196 88 C202 88, 206 93, 205 99 L194 172 C192 181, 184 188, 175 188 L65 188 C56 188, 48 181, 46 172 L35 99 C34 93, 38 88, 44 88 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />

        {/* Academic Mortarboard Cap */}
        <g transform="translate(120, 134)">
          <polygon points="0,-24 44,-7 0,10 -44,-7" fill="url(#cfAccentGrad)" />
          <path d="M-26,-1 L-26,14 C-26,22, 26,22, 26,14 L26,-1 Z" fill="#C2410C" />
          <circle cx="0" cy="-7" r="4" fill="#FEF08A" />
          <path
            d="M0,-7 C12,-5, 28,2, 34,14"
            stroke="#FEF08A"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <polygon points="32,13 36,13 37,22 31,22" fill="#FEF08A" />
        </g>

        {/* Star */}
        <path
          d="M120 40 L122.5 47 L130 47.5 L124.2 52 L126.5 59 L120 54.5 L113.5 59 L115.8 52 L110 47.5 L117.5 47 Z"
          fill="#FACC15"
        />
      </svg>

      {/* Brand Text */}
      {displayBrandText && (
        <div className="flex flex-col leading-tight">
          <span className="font-extrabold text-base tracking-tight text-on-surface font-headline-md">
            Campus<span className="text-[#EA580C]">Folder</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest font-mono text-primary font-bold">
            Faso Académie
          </span>
        </div>
      )}
    </div>
  );
}
