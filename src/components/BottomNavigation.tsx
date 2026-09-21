'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNavigation() {
  const pathname = usePathname();

  const isTab = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.05)] border-t border-outline-variant/20">
      <div className="h-16 px-2 flex items-center justify-around relative max-w-lg mx-auto">
        {/* Tab 1: Accueil */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 active:scale-90 ${
            isTab('/')
              ? 'bg-primary-fixed/50 text-primary font-black shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">school</span>
          <span className="font-label-sm text-[10px] mt-0.5 font-bold">Accueil</span>
        </Link>

        {/* Tab 2: Explorer */}
        <Link
          href="/explorer"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 active:scale-90 ${
            isTab('/explorer')
              ? 'bg-primary-fixed/50 text-primary font-black shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">menu_book</span>
          <span className="font-label-sm text-[10px] mt-0.5 font-bold">Explorer</span>
        </Link>

        {/* Tab 3: Publier (Central Elevated Action Button) */}
        <div className="relative -top-3.5 flex flex-col items-center justify-center">
          <Link
            href="/publier"
            className={`w-[52px] h-[52px] rounded-full text-on-primary flex items-center justify-center shadow-[0_4px_14px_rgba(13,92,58,0.35)] transition-transform duration-200 active:scale-95 ring-4 ring-surface ${
              isTab('/publier')
                ? 'bg-primary ring-primary/40 scale-105'
                : 'bg-primary-container'
            }`}
          >
            <span className="material-symbols-outlined text-[26px]">add</span>
          </Link>
          <span className={`font-label-sm text-[10px] mt-1 font-bold ${
            isTab('/publier') ? 'text-primary font-black' : 'text-primary-container'
          }`}>
            Publier
          </span>
        </div>

        {/* Tab 4: Revenus (Portefeuille) */}
        <Link
          href="/portefeuille"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 active:scale-90 ${
            isTab('/portefeuille')
              ? 'bg-primary-fixed/50 text-primary font-black shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
          <span className="font-label-sm text-[10px] mt-0.5 font-bold">Portefeuille</span>
        </Link>

        {/* Tab 5: Mon Profil */}
        <Link
          href="/profil"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 active:scale-90 ${
            isTab('/profil')
              ? 'bg-primary-fixed/50 text-primary font-black shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">person</span>
          <span className="font-label-sm text-[10px] mt-0.5 font-bold">Mon Profil</span>
        </Link>
      </div>
    </nav>
  );
}
