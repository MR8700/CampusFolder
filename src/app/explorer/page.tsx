'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import UniversityManagerModal from '@/components/UniversityManagerModal';
import AuthGatewayModal from '@/components/AuthGatewayModal';

const BF_REGIONS = [
  'Centre',
  'Hauts-Bassins',
  'Centre-Ouest',
  'Plateau-Central',
  'Centre-Est',
  'Centre-Nord',
  'Centre-Sud',
  'Boucle du Mouhoun',
  'Est',
  'Nord',
  'Sahel',
  'Cascades',
  'Sud-Ouest',
];

export default function ExplorerPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedUniv, setSelectedUniv] = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('recent');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [spotlightResource, setSpotlightResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showUniManager, setShowUniManager] = useState(false);
  const [showAuthGateway, setShowAuthGateway] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Search queries for sidebar filter cards
  const [filterRegionSearch, setFilterRegionSearch] = useState('');
  const [filterUnivSearch, setFilterUnivSearch] = useState('');
  const [filterFacSearch, setFilterFacSearch] = useState('');
  const [filterFiliereSearch, setFilterFiliereSearch] = useState('');

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetch('/api/v1/academic/institutions').then((r) => r.json()),
      fetch('/api/v1/academic/faculties').then((r) => r.json()),
      fetch('/api/v1/academic/filieres').then((r) => r.json()),
      fetch('/api/v1/auth/me').then((r) => r.json()),
    ]).then(([instData, facData, filData, authData]) => {
      if (instData.success) setInstitutions(instData.institutions);
      if (facData.success) setFaculties(facData.faculties);
      if (filData.success) setFilieres(filData.filieres);
      if (authData.success && authData.authenticated && authData.user) {
        setCurrentUser(authData.user);
        // Do NOT restrict selectedUniv by default so national Burkina Faso catalogue is immediately visible
      }
    });
  }, []);

  // Filter actions & synchronization
  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedRegion('all');
    setSelectedUniv(null);
    setSelectedFaculty('all');
    setSelectedFiliere('all');
    setSelectedSort('recent');
  };

  const handleSelectRegion = (reg: string) => {
    setSelectedRegion(reg);
    if (reg !== 'all' && selectedUniv) {
      const currentInst = institutions.find((i) => i.id === selectedUniv);
      if (currentInst && currentInst.region !== reg) {
        setSelectedUniv(null);
      }
    }
  };

  const handleSelectUniv = (univId: string | null) => {
    setSelectedUniv(univId);
    if (univId) {
      const inst = institutions.find((i) => i.id === univId);
      if (inst && inst.region) {
        setSelectedRegion(inst.region);
      }
    }
  };

  const handleSelectFaculty = (code: string) => {
    const normalized = code.toLowerCase();
    setSelectedFaculty(selectedFaculty.toLowerCase() === normalized ? 'all' : normalized);
  };

  const handleSelectFiliere = (id: string) => {
    setSelectedFiliere(selectedFiliere === id ? 'all' : id);
  };

  // Fetch search results
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('q', searchQuery.trim());
    if (selectedFaculty && selectedFaculty !== 'all') params.append('faculty', selectedFaculty);
    if (selectedUniv && selectedUniv !== 'all') params.append('institutionId', selectedUniv);
    if (selectedRegion && selectedRegion !== 'all') params.append('region', selectedRegion);
    if (selectedFiliere && selectedFiliere !== 'all') params.append('filiereId', selectedFiliere);
    if (selectedSort) params.append('sort', selectedSort);

    fetch(`/api/v1/resources/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSearchResults(data.results || []);
          if (data.spotlightResource) setSpotlightResource(data.spotlightResource);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [searchQuery, selectedRegion, selectedUniv, selectedFaculty, selectedFiliere, selectedSort]);

  const handleVoiceSearch = () => {
    setIsVoiceActive(!isVoiceActive);
    if (!isVoiceActive) {
      setSearchQuery('Droit');
      setTimeout(() => setIsVoiceActive(false), 2000);
    }
  };

  const filteredInstitutions = institutions.filter((inst) => {
    if (selectedRegion !== 'all' && inst.region !== selectedRegion) return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full lg:grid lg:grid-cols-12 lg:gap-8 pt-2">
          {/* Desktop Left Sidebar Filters (3 cols on PC, hidden on mobile) */}
          <aside
            aria-label="Filtres académiques et territoriaux"
            className="hidden lg:flex lg:col-span-3 flex-col gap-5 sticky top-20 self-start"
          >
            {/* 1. Régions du Burkina Faso with Search Bar */}
            <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-primary/20 hover:border-primary/40 shadow-xs flex flex-col gap-3 transition-all">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">public</span>
                  <span>Régions du Burkina Faso</span>
                </h2>
                {selectedRegion !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedRegion('all')}
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Search Bar Régions */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  value={filterRegionSearch}
                  onChange={(e) => setFilterRegionSearch(e.target.value)}
                  placeholder="Filtrer une région (ex: Centre, Hauts-Bassins...)"
                  className="w-full h-8 pl-8 pr-7 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
                {filterRegionSearch && (
                  <button
                    type="button"
                    onClick={() => setFilterRegionSearch('')}
                    className="absolute right-2 top-2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectRegion('all')}
                  className={`text-left px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    selectedRegion === 'all'
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                >
                  Toutes les 13 régions
                </button>
                {BF_REGIONS.filter((reg) =>
                  !filterRegionSearch || reg.toLowerCase().includes(filterRegionSearch.toLowerCase())
                ).map((reg) => (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => handleSelectRegion(reg)}
                    className={`text-left px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center justify-between ${
                      selectedRegion === reg
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span>{reg}</span>
                    {selectedRegion === reg && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Universités with Search Bar */}
            <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-primary/20 hover:border-primary/40 shadow-xs flex flex-col gap-3 transition-all">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    account_balance
                  </span>
                  <span>Filtre Universités</span>
                </h2>
                {selectedUniv && (
                  <button
                    type="button"
                    onClick={() => handleSelectUniv(null)}
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {currentUser?.profile?.institution && (
                <div className="p-3 rounded-xl bg-primary-fixed/20 border border-primary/30 text-xs text-on-surface">
                  <div className="flex items-center justify-between font-extrabold text-primary mb-1">
                    <span>Mon Université Officielle</span>
                    <button
                      type="button"
                      onClick={() => setShowUniManager(true)}
                      className="text-[11px] text-primary underline hover:text-primary-container"
                    >
                      Modifier
                    </button>
                  </div>
                  <p className="font-bold truncate text-[11px]">
                    {currentUser.profile.institution.name}
                  </p>
                  {selectedUniv !== currentUser.profile.institutionId ? (
                    <button
                      type="button"
                      onClick={() => handleSelectUniv(currentUser.profile.institutionId)}
                      className="mt-2 w-full py-1.5 rounded-lg bg-primary text-on-primary text-[10px] font-bold shadow-xs active:scale-95 transition-all"
                    >
                      Filtrer par mon université
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectUniv(null)}
                      className="mt-2 w-full py-1.5 rounded-lg bg-surface-container-highest text-on-surface text-[10px] font-bold shadow-xs active:scale-95 transition-all"
                    >
                      Voir toutes les universités
                    </button>
                  )}
                </div>
              )}

              {/* Search Bar Universités */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  value={filterUnivSearch}
                  onChange={(e) => setFilterUnivSearch(e.target.value)}
                  placeholder="Rechercher une université..."
                  className="w-full h-8 pl-8 pr-7 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
                {filterUnivSearch && (
                  <button
                    type="button"
                    onClick={() => setFilterUnivSearch('')}
                    className="absolute right-2 top-2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5 text-xs max-h-52 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => handleSelectUniv(null)}
                  className={`text-left px-3 py-2 rounded-xl font-medium transition-colors ${
                    selectedUniv === null
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                >
                  Toutes les universités
                </button>
                {filteredInstitutions
                  .filter((inst) =>
                    !filterUnivSearch ||
                    inst.name?.toLowerCase().includes(filterUnivSearch.toLowerCase()) ||
                    inst.shortName?.toLowerCase().includes(filterUnivSearch.toLowerCase()) ||
                    inst.city?.toLowerCase().includes(filterUnivSearch.toLowerCase())
                  )
                  .map((inst) => (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => handleSelectUniv(inst.id)}
                      className={`text-left px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-between ${
                        selectedUniv === inst.id
                          ? 'bg-primary text-on-primary font-bold shadow-xs'
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <span className="truncate">{inst.shortName || inst.name}</span>
                      {inst.id === currentUser?.profile?.institutionId ? (
                        <span className="text-[9px] bg-primary-container text-on-primary-container px-1.5 py-0.2 rounded-full font-bold">
                          MOI
                        </span>
                      ) : inst.isLive ? (
                        <span className="text-[9px] bg-secondary-container text-on-secondary px-1.5 py-0.2 rounded-full font-bold">
                          LIVE
                        </span>
                      ) : null}
                    </button>
                  ))}
              </div>
            </div>

            {/* 3. UFR / Facultés with Search Bar */}
            <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-primary/20 hover:border-primary/40 shadow-xs flex flex-col gap-3 transition-all">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">school</span>
                  <span>Facultés / UFR</span>
                </h2>
                {selectedFaculty !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedFaculty('all')}
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Search Bar Facultés */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  value={filterFacSearch}
                  onChange={(e) => setFilterFacSearch(e.target.value)}
                  placeholder="Rechercher une UFR / faculté..."
                  className="w-full h-8 pl-8 pr-7 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
                {filterFacSearch && (
                  <button
                    type="button"
                    onClick={() => setFilterFacSearch('')}
                    className="absolute right-2 top-2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setSelectedFaculty('all')}
                  className={`text-left px-3 py-2 rounded-xl font-medium transition-colors ${
                    selectedFaculty === 'all'
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                >
                  Toutes les facultés
                </button>
                {faculties
                  .filter((fac) =>
                    !filterFacSearch ||
                    fac.name?.toLowerCase().includes(filterFacSearch.toLowerCase()) ||
                    fac.code?.toLowerCase().includes(filterFacSearch.toLowerCase())
                  )
                  .map((fac) => (
                    <button
                      key={fac.id}
                      type="button"
                      onClick={() => handleSelectFaculty(fac.code)}
                      className={`text-left px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-between ${
                        selectedFaculty.toLowerCase() === fac.code.toLowerCase()
                          ? 'bg-primary text-on-primary font-bold shadow-xs'
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <span className="truncate">{fac.name}</span>
                      <span className="text-[10px] font-mono opacity-70 uppercase font-bold">
                        {fac.code}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* 4. Filières & Spécialités with Search Bar */}
            <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-primary/20 hover:border-primary/40 shadow-xs flex flex-col gap-3 transition-all">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    history_edu
                  </span>
                  <span>Filières Spécialisées</span>
                </h2>
                {selectedFiliere !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedFiliere('all')}
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Search Bar Filières */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  value={filterFiliereSearch}
                  onChange={(e) => setFilterFiliereSearch(e.target.value)}
                  placeholder="Rechercher une filière..."
                  className="w-full h-8 pl-8 pr-7 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
                {filterFiliereSearch && (
                  <button
                    type="button"
                    onClick={() => setFilterFiliereSearch('')}
                    className="absolute right-2 top-2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1 text-xs max-h-40 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setSelectedFiliere('all')}
                  className={`text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    selectedFiliere === 'all'
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                >
                  Toutes les filières
                </button>
                {filieres
                  .filter((f) =>
                    !filterFiliereSearch ||
                    f.name?.toLowerCase().includes(filterFiliereSearch.toLowerCase()) ||
                    f.code?.toLowerCase().includes(filterFiliereSearch.toLowerCase())
                  )
                  .map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSelectFiliere(f.id)}
                      className={`text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-between ${
                        selectedFiliere === f.id
                          ? 'bg-primary text-on-primary font-bold shadow-xs'
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <span className="truncate">{f.name}</span>
                      <span className="text-[10px] font-mono opacity-70 uppercase font-bold shrink-0 ml-1">
                        {f.code}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* 5. Tri */}
            <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-primary/20 hover:border-primary/40 shadow-xs flex flex-col gap-3 transition-all">
              <h2 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">sort</span>
                <span>Trier par</span>
              </h2>
              <div className="flex flex-col gap-1.5 text-xs">
                {[
                  { id: 'recent', label: 'Plus récents' },
                  { id: 'downloads', label: 'Les plus téléchargés' },
                  { id: 'rating', label: 'Mieux notés (★ 4.9)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSort(s.id)}
                    className={`text-left px-3 py-2 rounded-xl font-medium transition-colors ${
                      selectedSort === s.id
                        ? 'bg-primary text-on-primary font-bold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Main Search Results Area (9 cols on PC, 12 on mobile) */}
          <div className="lg:col-span-9 flex flex-col w-full min-w-0 max-w-full overflow-hidden pb-8">
            {/* Page Title & Context */}
            <div className="pt-2 pb-3 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                Catalogue National Burkina Faso
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
                Exploration des Savoirs Universitaires du Burkina Faso
              </h1>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Consultez, téléchargez et échangez les corrigés de devoirs, polycopiés, mémoires de
                master et thèses certifiées issus de l'ensemble des 13 régions burkinabè.
              </p>
            </div>

            {/* Search & Voice Module */}
            <section aria-labelledby="search-section-heading" className="pt-2 flex flex-col gap-space-sm w-full min-w-0 max-w-full">
              <h2 id="search-section-heading" className="sr-only">
                Recherche par mot-clé et campus
              </h2>
              <div className="flex items-center gap-space-xs bg-surface-container-lowest rounded-2xl p-2 shadow-xs border border-primary/25 hover:border-primary/50 transition-all">
                <div className="w-10 h-10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[24px]">search</span>
                </div>
                <input
                  className="w-full bg-transparent font-body-md text-on-surface placeholder:text-outline focus:outline-none min-w-0 text-xs sm:text-sm"
                  placeholder="Cours de Droit L2, TD Macro, Anatomie, Mémoires..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  aria-label="Recherche vocale"
                  type="button"
                  onClick={handleVoiceSearch}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl active:scale-90 transition-transform shrink-0 ${
                    isVoiceActive
                      ? 'bg-error text-on-error animate-pulse'
                      : 'bg-surface-container-low text-primary hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">mic</span>
                </button>
                <button
                  aria-label="Filtres avancés"
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-on-primary active:scale-90 transition-transform shrink-0 shadow-xs relative"
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  {(selectedRegion !== 'all' || selectedUniv !== null || selectedFaculty !== 'all' || selectedFiliere !== 'all') && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full ring-2 ring-surface"></span>
                  )}
                </button>
              </div>

              {/* Active University Pills (Mobile & quick access) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full max-w-full">
                <button
                  type="button"
                  onClick={() => handleSelectUniv(null)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-label-md text-xs shrink-0 whitespace-nowrap shadow-xs transition-transform active:scale-95 border ${
                    selectedUniv === null
                      ? 'bg-primary text-on-primary border-primary font-bold'
                      : 'bg-surface-container-lowest text-on-surface border-primary/20 hover:border-primary/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">school</span>
                  <span>Toutes Universités</span>
                </button>

                {filteredInstitutions.map((inst) => (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => handleSelectUniv(selectedUniv === inst.id ? null : inst.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-label-md text-xs shrink-0 whitespace-nowrap transition-transform active:scale-95 border ${
                      selectedUniv === inst.id
                        ? 'bg-primary text-on-primary border-primary font-bold shadow-xs'
                        : 'bg-surface-container-lowest text-on-surface border-primary/20 hover:border-primary/40'
                    }`}
                  >
                    <span>{inst.shortName || inst.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Faculties Interactive Carousel (UFR) */}
            <section aria-labelledby="faculties-carousel-heading" className="mt-space-md flex flex-col gap-space-xs w-full min-w-0 max-w-full">
              <div className="flex items-center justify-between">
                <h2 id="faculties-carousel-heading" className="font-label-lg text-label-lg text-on-surface font-bold">
                  UFR & Facultés d'Appartenance
                </h2>
                <span className="font-label-sm text-label-sm text-primary font-bold">
                  {faculties.length} spécialités actives
                </span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 w-full max-w-full">
                {faculties.map((fac) => {
                  const isSelected = selectedFaculty.toLowerCase() === fac.code.toLowerCase();
                  return (
                    <div
                      key={fac.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectFaculty(fac.code)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl shadow-xs w-24 shrink-0 active:scale-95 transition-all text-center cursor-pointer border ${
                        isSelected
                          ? 'bg-primary text-on-primary border-primary shadow-sm font-bold ring-2 ring-primary/20'
                          : 'bg-surface-container-lowest text-on-surface border-primary/20 hover:border-primary/40 hover:bg-surface-container-low'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-1.5 ${
                        isSelected ? 'bg-white/20 text-on-primary' : 'bg-primary/10 text-primary'
                      }`}>
                        <span className="material-symbols-outlined text-[22px]">
                          {fac.iconName || 'school'}
                        </span>
                      </div>
                      <span className="font-label-md text-xs font-bold leading-tight truncate w-full">
                        {fac.code.toUpperCase()}
                      </span>
                      <span className={`font-label-sm text-[10px] mt-0.5 ${
                        isSelected ? 'text-on-primary/80' : 'text-outline'
                      }`}>
                        {fac.activeDocsCount || 0} docs
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Quick Filter Sort Chips */}
            <section aria-label="Critères de tri rapide" className="mt-space-md w-full min-w-0 max-w-full">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full max-w-full">
                {[
                  { id: 'recent', label: 'Plus récents', icon: 'bolt', iconColor: 'text-primary' },
                  { id: 'rated', label: 'Mieux notés', icon: 'star', iconColor: 'text-secondary' },
                  {
                    id: 'exam',
                    label: 'Sessions d’examen',
                    icon: 'history',
                    iconColor: 'text-outline',
                  },
                  {
                    id: 'free',
                    label: 'Packs Solidaires',
                    icon: 'volunteer_activism',
                    iconColor: 'text-tertiary-container',
                  },
                ].map((sortItem) => (
                  <button
                    key={sortItem.id}
                    type="button"
                    onClick={() => setSelectedSort(sortItem.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-label-md text-xs shrink-0 whitespace-nowrap shadow-xs transition-all border ${
                      selectedSort === sortItem.id
                        ? 'bg-primary text-on-primary border-primary font-bold shadow-xs'
                        : 'bg-surface-container-lowest text-on-surface border-primary/20 hover:border-primary/40'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[16px] ${sortItem.iconColor}`}
                    >
                      {sortItem.icon}
                    </span>
                    <span>{sortItem.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Active Filter Chips Row */}
            {(selectedRegion !== 'all' || selectedUniv !== null || selectedFaculty !== 'all' || selectedFiliere !== 'all' || searchQuery.trim() !== '') && (
              <div className="mt-4 p-3 rounded-2xl bg-surface-container-lowest border border-primary/20 flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-outline text-[11px] uppercase tracking-wider mr-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">filter_alt</span>
                  <span>Filtres actifs:</span>
                </span>
                {selectedRegion !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                    <span>Région: {selectedRegion}</span>
                    <button type="button" onClick={() => handleSelectRegion('all')} className="hover:opacity-75">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}
                {selectedUniv && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                    <span>Univ: {institutions.find((i) => i.id === selectedUniv)?.shortName || 'Univ'}</span>
                    <button type="button" onClick={() => handleSelectUniv(null)} className="hover:opacity-75">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}
                {selectedFaculty !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                    <span>UFR: {selectedFaculty.toUpperCase()}</span>
                    <button type="button" onClick={() => setSelectedFaculty('all')} className="hover:opacity-75">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}
                {selectedFiliere !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                    <span>Filière: {filieres.find((f) => f.id === selectedFiliere)?.code || 'Filière'}</span>
                    <button type="button" onClick={() => setSelectedFiliere('all')} className="hover:opacity-75">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                    <span>Mot-clé: "{searchQuery.trim()}"</span>
                    <button type="button" onClick={() => setSearchQuery('')} className="hover:opacity-75">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-primary font-extrabold underline hover:text-primary-container ml-auto cursor-pointer"
                >
                  Tout effacer
                </button>
              </div>
            )}

            {/* Spotlight Campus Folder */}
            {spotlightResource && (
              <section aria-labelledby="spotlight-heading" className="mt-space-lg w-full min-w-0 max-w-full">
                <h2 id="spotlight-heading" className="sr-only">
                  Ressource remarquable mise en avant
                </h2>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D5C3A] via-[#094229] to-[#042818] text-on-primary p-4 sm:p-5 shadow-md border border-primary/30 ring-1 ring-primary/20">
                  <div className="flex items-center justify-between relative z-10 mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/20 font-label-sm text-[10px] tracking-wide uppercase backdrop-blur-md font-bold">
                      <span className="material-symbols-outlined text-[12px] text-secondary-fixed">
                        verified
                      </span>
                      Fiche Certifiée Major UJKZ
                    </span>
                    <span className="font-label-sm text-xs bg-secondary-container text-on-secondary px-2.5 py-0.5 rounded-full font-bold">
                      {spotlightResource.accessPolicy?.priceAmount || 400} FCFA
                    </span>
                  </div>
                  <div className="flex gap-3 sm:gap-4 items-center relative z-10 min-w-0">
                    <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 shadow-sm bg-surface-container">
                      <img
                        className="w-full h-full object-cover"
                        alt={spotlightResource.title}
                        src={spotlightResource.thumbnailUrl}
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                      <h3 className="text-sm sm:text-base text-on-primary font-bold truncate">
                        {spotlightResource.title}
                      </h3>
                      <p className="text-xs text-on-primary-container line-clamp-1 mt-0.5 opacity-90">
                        {spotlightResource.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 min-w-0">
                          <img
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-white/50 shrink-0"
                            alt="Major"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4SQsNhGCv0gZSRk-rnOclz2da1f7-aeD3HgDcuzYfH1GqKHkaaNS4eHeAHsGSUfKtQY7JySO40oWoox-ev6oLWvEOlwF8oHvlOYaLoes28GhuCwvnlrPg63LmNnR_i5BsisTsglh2Tmzdx89WBZsu6gLplTwh5y-G7bDCIy543RentDXPrB7yniYzpjA-QgKu4kP7ycK5ZIQSofiWGbt9xjfXIgwQ_kfaxvgTLyANbqFBI965gaZykA"
                          />
                          <span className="font-label-sm text-[11px] text-surface-container-high truncate font-medium">
                            {spotlightResource.author?.profile?.displayName || 'Ousmane K.'} (Major
                            16.4/20)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-md pt-space-xs flex items-center justify-between relative z-10 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-surface-container-high font-label-sm text-xs">
                      <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">
                        file_download_done
                      </span>
                      <span>Hors-ligne disponible</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/ressources/${spotlightResource.slug}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-surface-container-lowest text-primary font-label-md text-xs font-bold shadow-sm active:scale-95 transition-transform inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      <span>Aperçu rapide</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Academic Resources Stream */}
            <section aria-labelledby="stream-heading" className="mt-space-lg flex flex-col gap-space-md w-full min-w-0 max-w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    menu_book
                  </span>
                  <h2 id="stream-heading" className="font-headline-md text-headline-md text-on-surface font-bold">
                    Documents Recommandés ({searchResults.length})
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-outline">
                  Burkina Faso • Officiel
                </span>
              </div>

              {/* Loading Skeleton */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
                  {[1, 2, 3, 4, 5, 6].map((sk) => (
                    <div
                      key={sk}
                      className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 animate-pulse flex gap-3"
                    >
                      <div className="w-20 h-24 rounded-xl bg-surface-container shrink-0"></div>
                      <div className="flex flex-col flex-1 gap-2">
                        <div className="h-3 w-1/3 bg-surface-container rounded"></div>
                        <div className="h-4 w-4/5 bg-surface-container rounded"></div>
                        <div className="h-3 w-1/2 bg-surface-container rounded mt-auto"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-surface-container-lowest rounded-3xl border border-dashed border-primary/30 text-center my-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-3xl">content_paste_search</span>
                  </div>
                  <h3 className="font-extrabold text-base text-on-surface">
                    Aucun document ne correspond à vos filtres
                  </h3>
                  <p className="text-xs text-on-surface-variant max-w-md mt-1.5 leading-relaxed">
                    Essayez d'élargir votre recherche, de sélectionner « Toutes les universités » ou de réinitialiser les filtres territoriaux pour explorer l'ensemble des 13 régions du Burkina Faso.
                  </p>
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="mt-5 px-5 py-2.5 rounded-2xl bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                    <span>Réinitialiser tous les filtres</span>
                  </button>
                </div>
              )}

              {/* Document Cards with Beautiful Border Colors & No Cutoff */}
              {!loading && searchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full min-w-0">
                  {searchResults.map((item) => {
                    const isPaid = item.accessPolicy?.mode === 'PAID';
                    return (
                      <article
                        key={item.id}
                        onClick={() => router.push(`/ressources/${item.slug}`)}
                        className="group flex flex-col bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs border border-primary/20 hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden ring-1 ring-primary/5 hover:ring-primary/20"
                      >
                        <div className="flex gap-3 min-w-0">
                          <div className="w-20 h-24 rounded-xl overflow-hidden bg-surface-container shrink-0 relative shadow-xs">
                            <img
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              src={item.thumbnailUrl}
                            />
                            <div className="absolute top-1 left-1 bg-surface-container-lowest/90 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-bold font-mono text-primary">
                              {item.academicLevel?.code || 'L3'}
                            </div>
                          </div>

                          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-label-sm text-[10px] text-primary uppercase font-bold tracking-wider truncate">
                                {item.faculty?.name || 'Général'}
                              </span>
                              <span
                                className={`font-label-sm text-[11px] font-extrabold shrink-0 px-2 py-0.5 rounded-full ${
                                  isPaid
                                    ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                                    : 'bg-primary-container text-on-primary'
                                }`}
                              >
                                {isPaid
                                  ? `${item.accessPolicy?.priceAmount?.toLocaleString('fr-FR')} FCFA`
                                  : 'Tarif Solidaire'}
                              </span>
                            </div>

                            <h3 className="font-headline-md text-xs sm:text-sm text-on-surface font-bold line-clamp-2 mt-1 group-hover:text-primary transition-colors leading-tight">
                              {item.title}
                            </h3>

                            <div className="flex items-center gap-2 mt-auto pt-2 text-outline font-label-sm text-[11px] flex-wrap">
                              <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[13px] text-secondary">
                                  star
                                </span>
                                {item.ratingAverage || 5.0}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[13px]">
                                  download
                                </span>
                                {item.downloadsCount || 0}
                              </span>
                              {item.institution && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[100px]">{item.institution.shortName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <BottomNavigation />

      {/* Mobile Filters Drawer Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-surface h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">tune</span>
                <h3 className="font-extrabold text-sm text-on-surface">Filtres Académiques BF</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Drawer Body with scroll */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 text-xs">
              {/* 1. Régions */}
              <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-primary/20 flex flex-col gap-2.5">
                <div className="flex items-center justify-between font-bold text-on-surface">
                  <span className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[16px]">public</span>
                    Régions du Burkina Faso
                  </span>
                  {selectedRegion !== 'all' && (
                    <button
                      type="button"
                      onClick={() => handleSelectRegion('all')}
                      className="text-[10px] text-primary underline"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={filterRegionSearch}
                  onChange={(e) => setFilterRegionSearch(e.target.value)}
                  placeholder="Rechercher une région..."
                  className="w-full h-8 px-2.5 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => handleSelectRegion('all')}
                    className={`text-left px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                      selectedRegion === 'all'
                        ? 'bg-primary text-on-primary font-bold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    Toutes les 13 régions
                  </button>
                  {BF_REGIONS.filter((reg) =>
                    !filterRegionSearch || reg.toLowerCase().includes(filterRegionSearch.toLowerCase())
                  ).map((reg) => (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => handleSelectRegion(reg)}
                      className={`text-left px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center justify-between ${
                        selectedRegion === reg
                          ? 'bg-primary text-on-primary font-bold'
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <span>{reg}</span>
                      {selectedRegion === reg && (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Universités */}
              <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-primary/20 flex flex-col gap-2.5">
                <div className="flex items-center justify-between font-bold text-on-surface">
                  <span className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[16px]">account_balance</span>
                    Universités & Établissements
                  </span>
                  {selectedUniv && (
                    <button
                      type="button"
                      onClick={() => handleSelectUniv(null)}
                      className="text-[10px] text-primary underline"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={filterUnivSearch}
                  onChange={(e) => setFilterUnivSearch(e.target.value)}
                  placeholder="Rechercher une université..."
                  className="w-full h-8 px-2.5 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => handleSelectUniv(null)}
                    className={`text-left px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                      selectedUniv === null
                        ? 'bg-primary text-on-primary font-bold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    Toutes les universités
                  </button>
                  {filteredInstitutions
                    .filter((inst) =>
                      !filterUnivSearch ||
                      inst.name?.toLowerCase().includes(filterUnivSearch.toLowerCase()) ||
                      inst.shortName?.toLowerCase().includes(filterUnivSearch.toLowerCase())
                    )
                    .map((inst) => (
                      <button
                        key={inst.id}
                        type="button"
                        onClick={() => handleSelectUniv(inst.id)}
                        className={`text-left px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center justify-between ${
                          selectedUniv === inst.id
                            ? 'bg-primary text-on-primary font-bold'
                            : 'hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        <span className="truncate">{inst.shortName || inst.name}</span>
                        {selectedUniv === inst.id && (
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        )}
                      </button>
                    ))}
                </div>
              </div>

              {/* 3. UFR */}
              <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-primary/20 flex flex-col gap-2.5">
                <div className="flex items-center justify-between font-bold text-on-surface">
                  <span className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[16px]">school</span>
                    UFR & Facultés
                  </span>
                  {selectedFaculty !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedFaculty('all')}
                      className="text-[10px] text-primary underline"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={filterFacSearch}
                  onChange={(e) => setFilterFacSearch(e.target.value)}
                  placeholder="Rechercher une faculté..."
                  className="w-full h-8 px-2.5 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedFaculty('all')}
                    className={`text-left px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                      selectedFaculty === 'all'
                        ? 'bg-primary text-on-primary font-bold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    Toutes les facultés
                  </button>
                  {faculties
                    .filter((fac) =>
                      !filterFacSearch ||
                      fac.name?.toLowerCase().includes(filterFacSearch.toLowerCase()) ||
                      fac.code?.toLowerCase().includes(filterFacSearch.toLowerCase())
                    )
                    .map((fac) => (
                      <button
                        key={fac.id}
                        type="button"
                        onClick={() => handleSelectFaculty(fac.code)}
                        className={`text-left px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center justify-between ${
                          selectedFaculty.toLowerCase() === fac.code.toLowerCase()
                            ? 'bg-primary text-on-primary font-bold'
                            : 'hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        <span className="truncate">{fac.name}</span>
                        <span className="font-mono text-[10px] uppercase font-bold opacity-75">{fac.code}</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* 4. Filières */}
              <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-primary/20 flex flex-col gap-2.5">
                <div className="flex items-center justify-between font-bold text-on-surface">
                  <span className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[16px]">history_edu</span>
                    Filières
                  </span>
                  {selectedFiliere !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedFiliere('all')}
                      className="text-[10px] text-primary underline"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={filterFiliereSearch}
                  onChange={(e) => setFilterFiliereSearch(e.target.value)}
                  placeholder="Rechercher une filière..."
                  className="w-full h-8 px-2.5 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedFiliere('all')}
                    className={`text-left px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                      selectedFiliere === 'all'
                        ? 'bg-primary text-on-primary font-bold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    Toutes les filières
                  </button>
                  {filieres
                    .filter((f) =>
                      !filterFiliereSearch ||
                      f.name?.toLowerCase().includes(filterFiliereSearch.toLowerCase()) ||
                      f.code?.toLowerCase().includes(filterFiliereSearch.toLowerCase())
                    )
                    .map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSelectFiliere(f.id)}
                        className={`text-left px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center justify-between ${
                          selectedFiliere === f.id
                            ? 'bg-primary text-on-primary font-bold'
                            : 'hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        <span className="truncate">{f.name}</span>
                        <span className="font-mono text-[10px] uppercase font-bold opacity-75">{f.code}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest flex items-center gap-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface font-bold text-xs"
              >
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md text-center"
              >
                Afficher ({searchResults.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* University Switcher Modal */}
      {showUniManager && (
        <UniversityManagerModal
          isOpen={showUniManager}
          currentUser={currentUser}
          onClose={() => setShowUniManager(false)}
          onProfileUpdated={() => {
            setShowUniManager(false);
            window.location.reload();
          }}
        />
      )}

      {/* Auth Gateway Modal */}
      {showAuthGateway && (
        <AuthGatewayModal
          isOpen={showAuthGateway}
          onClose={() => setShowAuthGateway(false)}
          onUserLoggedIn={() => {
            setShowAuthGateway(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
