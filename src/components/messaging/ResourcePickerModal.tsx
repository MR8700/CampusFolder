'use client';

import React, { useState, useEffect } from 'react';

interface ResourcePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResource: (resourceId: string, resourceTitle: string) => void;
  onSelectYouTube?: (url: string, title: string) => void;
}

const PRESET_YOUTUBE_VIDEOS = [
  {
    id: 'kqtD5dpn9C8',
    title: 'Algorithmique & Structures de Données - Cours Complet',
    faculty: 'Informatique UJKZ',
    level: 'Licence 2',
    duration: '2h 15m',
    url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
  },
  {
    id: 'HXV3zeQKqGY',
    title: 'Bases de Données Relationnelles & SQL pour Débutants',
    faculty: 'Génie Logiciel',
    level: 'Licence 1/2',
    duration: '1h 45m',
    url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
  },
  {
    id: 'fNk_zzaMoSs',
    title: 'Analyse Mathématique & Algèbre Linéaire',
    faculty: 'Mathématiques & Physique',
    level: 'Licence 1',
    duration: '1h 30m',
    url: 'https://www.youtube.com/watch?v=fNk_zzaMoSs',
  },
  {
    id: 'grEKMHGYyns',
    title: 'Programmation Orientée Objet & Conception Modulaire',
    faculty: 'Informatique',
    level: 'Licence 3',
    duration: '2h 00m',
    url: 'https://www.youtube.com/watch?v=grEKMHGYyns',
  },
];

export default function ResourcePickerModal({
  isOpen,
  onClose,
  onSelectResource,
  onSelectYouTube,
}: ResourcePickerModalProps) {
  const [activeTab, setActiveTab] = useState<'RESOURCES' | 'YOUTUBE'>('RESOURCES');
  const [resources, setResources] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customYouTubeUrl, setCustomYouTubeUrl] = useState('');
  const [customYouTubeTitle, setCustomYouTubeTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/v1/resources/feed?filter=all')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.trendingResources) {
            setResources(data.trendingResources);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredResources = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.moduleName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShareCustomYouTube = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customYouTubeUrl.trim()) return;
    const title = customYouTubeTitle.trim() || 'Vidéo de cours partagée';
    if (onSelectYouTube) {
      onSelectYouTube(customYouTubeUrl.trim(), title);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl border border-outline-variant/30 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">school</span>
            <h3 className="font-headline-md text-base font-bold text-on-surface">
              Partager une ressource pédagogique
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-outline-variant/20 bg-surface-container-low px-4 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('RESOURCES')}
            className={`pb-2.5 font-label-md text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'RESOURCES'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span>Documents Campus</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('YOUTUBE')}
            className={`pb-2.5 font-label-md text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'YOUTUBE'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
            <span>Vidéos & YouTube</span>
          </button>
        </div>

        {/* Tab 1: Campus Resources */}
        {activeTab === 'RESOURCES' && (
          <>
            {/* Search Input */}
            <div className="p-3 border-b border-outline-variant/20 bg-surface-container-low">
              <div className="flex items-center gap-2 bg-surface px-3 py-2 rounded-xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-outline text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Rechercher un cours, TD, corrigé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm w-full outline-hidden text-on-surface placeholder:text-outline"
                />
              </div>
            </div>

            {/* List of Resources */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant text-xs">
                  <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
                    sync
                  </span>
                  <span>Chargement des documents du campus...</span>
                </div>
              ) : filteredResources.length > 0 ? (
                filteredResources.map((item) => {
                  const isPaid = item.accessPolicy?.mode === 'PAID';
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectResource(item.id, item.title);
                        onClose();
                      }}
                      className="p-3 rounded-2xl bg-surface hover:bg-surface-container transition-all border border-outline-variant/30 flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-12 h-14 object-cover rounded-lg shrink-0 border border-outline-variant/20"
                        />
                        <div className="min-w-0">
                          <span className="font-label-sm text-[10px] text-primary font-bold uppercase truncate block">
                            {item.faculty?.name || 'UFR'} • {item.academicLevel?.label || 'Licence'}
                          </span>
                          <h4 className="font-headline-md text-xs sm:text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                            Par {item.author?.profile?.displayName || 'Contributeur'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-md ${
                            isPaid
                              ? 'bg-secondary/15 text-secondary'
                              : 'bg-primary-fixed text-primary font-bold'
                          }`}
                        >
                          {isPaid ? `${item.accessPolicy?.priceAmount} F` : 'GRATUIT'}
                        </span>
                        <span className="font-label-sm text-[10px] text-primary mt-1 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Joindre <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-on-surface-variant text-xs">
                  Aucune ressource trouvée pour cette recherche.
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab 2: YouTube Video Sharing */}
        {activeTab === 'YOUTUBE' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Custom URL Input Form */}
            <form onSubmit={handleShareCustomYouTube} className="flex flex-col gap-2 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-red-500 text-[18px]">smart_display</span>
                Partager un lien YouTube
              </span>
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                value={customYouTubeUrl}
                onChange={(e) => setCustomYouTubeUrl(e.target.value)}
                className="px-3 py-2 bg-surface text-xs rounded-xl border border-outline-variant/30 outline-hidden focus:border-primary text-on-surface"
              />
              <input
                type="text"
                placeholder="Titre de la vidéo ou du cours (optionnel)"
                value={customYouTubeTitle}
                onChange={(e) => setCustomYouTubeTitle(e.target.value)}
                className="px-3 py-2 bg-surface text-xs rounded-xl border border-outline-variant/30 outline-hidden focus:border-primary text-on-surface"
              />
              <button
                type="submit"
                className="mt-1 h-9 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all hover:bg-primary-container"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>Partager cette vidéo dans la conversation</span>
              </button>
            </form>

            {/* Curated Presets */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Vidéos de cours recommandées
              </span>
              {PRESET_YOUTUBE_VIDEOS.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => {
                    if (onSelectYouTube) {
                      onSelectYouTube(vid.url, vid.title);
                    }
                    onClose();
                  }}
                  className="p-3 rounded-2xl bg-surface hover:bg-surface-container transition-all border border-outline-variant/30 flex items-center gap-3 cursor-pointer group active:scale-[0.98]"
                >
                  <div className="w-16 h-12 rounded-lg bg-black relative shrink-0 overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${vid.id}/hqdefault.jpg`}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[20px]">play_circle</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-red-500 uppercase block truncate">
                      {vid.faculty} • {vid.duration}
                    </span>
                    <h4 className="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                      {vid.title}
                    </h4>
                  </div>
                  <span className="material-symbols-outlined text-primary text-[20px] shrink-0 group-hover:translate-x-1 transition-transform">
                    send
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
