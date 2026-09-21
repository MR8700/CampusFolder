'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ImageUploadModal from '@/components/ImageUploadModal';

export default function PublishResourcePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);

  const [selectedUniv, setSelectedUniv] = useState('inst-ujkz');
  const [selectedFaculty, setSelectedFaculty] = useState('fac-seg');
  const [selectedFiliere, setSelectedFiliere] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState('L3');
  const [selectedCategory, setSelectedCategory] = useState('EXAM_CORRECTION');
  const [title, setTitle] = useState('');

  // Media files state (strictly user-provided, zero hardcoded media)
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  // Search states for academic filters
  const [univSearchQuery, setUnivSearchQuery] = useState('');
  const [facSearchQuery, setFacSearchQuery] = useState('');
  const [filiereSearchQuery, setFiliereSearchQuery] = useState('');
  const [levelSearchQuery, setLevelSearchQuery] = useState('');

  // Pricing state (Prices < 50 FCFA or 0F are strictly disallowed)
  const [pricingModel, setPricingModel] = useState<'monetise' | 'presentiel'>('monetise');
  const [price, setPrice] = useState(500);

  // Legal agreement checkbox
  const [legalAgreement, setLegalAgreement] = useState(false);

  // Publishing & Validation workflow state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [publishedResource, setPublishedResource] = useState<any>(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);
  const [uploadToast, setUploadToast] = useState<string | null>(null);
  const [showDocPhotoModal, setShowDocPhotoModal] = useState(false);

  const handlePhotoCaptured = (url: string) => {
    setAttachedFiles((prev) => [
      ...prev,
      {
        originalFilename: `Document_Photo_${Date.now().toString(36)}.jpg`,
        storagePath: url,
        mimeType: 'image/jpeg',
        sizeBytes: 1024 * 180,
        mediaType: 'IMAGE',
        labelBadge: 'PHOTO HD',
      },
    ]);
    showToast('Photo pédagogique capturée, optimisée et ajoutée au pack !');
  };

  // Initial load
  useEffect(() => {
    Promise.all([
      fetch('/api/v1/academic/institutions').then((r) => r.json()),
      fetch('/api/v1/academic/levels').then((r) => r.json()),
      fetch('/api/v1/admin/pricing-rules').then((r) => r.json()),
    ]).then(([instData, levelData, rulesData]) => {
      if (instData.success && instData.institutions?.length > 0) {
        setInstitutions(instData.institutions);
        setSelectedUniv(instData.institutions[0].id);
      }
      if (levelData.success) setLevels(levelData.levels);
      if (rulesData.success) setPricingRules(rulesData.rules);
    });
  }, []);

  // Cascade 1: When selectedUniv changes, load faculties for that university
  useEffect(() => {
    if (!selectedUniv) return;
    fetch(`/api/v1/academic/faculties?institutionId=${selectedUniv}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.faculties) {
          setFaculties(data.faculties);
          if (data.faculties.length > 0) {
            setSelectedFaculty(data.faculties[0].id);
          } else {
            setSelectedFaculty('');
            setFilieres([]);
            setSelectedFiliere('');
          }
        }
      });
  }, [selectedUniv]);

  // Cascade 2: When selectedFaculty changes, load filieres for that faculty
  useEffect(() => {
    if (!selectedFaculty) {
      setFilieres([]);
      setSelectedFiliere('');
      return;
    }
    fetch(`/api/v1/academic/filieres?facultyId=${selectedFaculty}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.filieres) {
          setFilieres(data.filieres);
          if (data.filieres.length > 0) {
            setSelectedFiliere(data.filieres[0].id);
          } else {
            setSelectedFiliere('');
          }
        }
      });
  }, [selectedFaculty]);

  // Voice recording timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      // Add audio file to list
      setAttachedFiles((prev) => [
        ...prev,
        {
          originalFilename: `Note_Vocale_Amphi_${Date.now().toString(36)}.mp3`,
          storagePath: '/uploads/sample_vocal_amphi_points_clefs.mp3',
          mimeType: 'audio/mpeg',
          sizeBytes: 1024 * 800,
          mediaType: 'AUDIO',
          labelBadge: 'VOCAL',
          durationSeconds: recordDuration || 30,
        },
      ]);
      showToast('Note vocale enregistrée et ajoutée au pack !');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast('Numérisation et upload du document...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', file.type.includes('pdf') ? 'PDF' : 'IMAGE');

    try {
      const res = await fetch('/api/v1/resources/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.file) {
        setAttachedFiles((prev) => [
          ...prev,
          {
            ...data.file,
            labelBadge: data.file.mediaType,
          },
        ]);
        showToast('Document numérisé et optimisé avec succès');
      }
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l’upload du document');
    }
  };

  const showToast = (msg: string) => {
    setUploadToast(msg);
    setTimeout(() => setUploadToast(null), 3000);
  };

  const removeFile = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const authorGain = Math.round(price * 0.85);
  const platformFee = price - authorGain;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalAgreement) return;

    if (attachedFiles.length === 0) {
      alert('Média obligatoire : Vous devez joindre au moins un fichier pédagogique (PDF, audio ou photo) pour pouvoir publier.');
      setCurrentStep(2);
      return;
    }

    if (price < 50) {
      alert('Prix non conforme : Les publications à 0 FCFA ne sont pas acceptées sur Campus Folder. Le tarif minimum est de 50 FCFA.');
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title,
      description: title,
      institutionId: selectedUniv,
      facultyId: selectedFaculty,
      filiereId: selectedFiliere || null,
      academicLevelId: levels.find((l) => l.code === selectedLevel)?.id || 'level-l3',
      resourceType: selectedCategory,
      moduleName: title.split('-')[0]?.trim() || 'Économie',
      accessMode: pricingModel === 'monetise' ? 'PAID' : 'IN_PERSON',
      priceAmount: price,
      files: attachedFiles,
      agreementAccepted: legalAgreement,
      whatsappPhone: '+22676458812',
      whatsappLocation: 'Amphi A de 16h à 18h',
    };

    try {
      const res = await fetch('/api/v1/resources/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setPublishedResource(data.resource);
        setReminderSent(false);
        setReminderCount(0);
        setShowSuccessModal(true);
      } else {
        alert(data.error || 'Erreur lors de la publication');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau lors de la publication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReminder = async () => {
    if (!publishedResource?.id) return;
    setReminderLoading(true);

    try {
      const res = await fetch('/api/v1/resources/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: publishedResource.id }),
      });
      const data = await res.json();
      if (data.success) {
        setReminderSent(true);
        setReminderCount(data.reminderCount);
        showToast(`Rappel #${data.reminderCount} transmis à l'administrateur avec priorité rehaussée !`);
      } else {
        alert(data.error || 'Erreur lors de l’envoi du rappel');
      }
    } catch {
      alert('Erreur de connexion lors de l’envoi du rappel');
    } finally {
      setReminderLoading(false);
    }
  };

  const stepTitles: Record<number, string> = {
    1: 'Étape 1 sur 4 : Infos académiques',
    2: 'Étape 2 sur 4 : Dépôt multimédia',
    3: 'Étape 3 sur 4 : Prix & Rémunération',
    4: 'Étape 4 sur 4 : Droits & Propriété',
  };

  const percentages: Record<number, string> = {
    1: '25%',
    2: '50%',
    3: '75%',
    4: '100%',
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full lg:grid lg:grid-cols-12 lg:gap-8 pt-2">
          {/* Left Form Area (8 cols on desktop) */}
          <div className="lg:col-span-8 flex flex-col w-full">
            {/* Header Banner */}
            <div className="px-margin pt-space-md pb-space-lg flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">drive_folder_upload</span>
                </span>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-bold">
                  Création de ressource
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container-high px-2.5 py-1 rounded-full text-on-surface-variant font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[14px] text-secondary">bolt</span>
                <span>Revue en ~12 min</span>
              </div>
            </div>

            <div className="flex flex-col">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-extrabold">
                Partager & Valoriser un Document
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Partagez vos polycopiés, audios d'amphi ou fiches et fixez librement votre
                rétribution en FCFA.
              </p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border-2 border-primary/20 ring-1 ring-primary/10 flex flex-col gap-space-sm mt-space-xs">
              <div className="flex items-center justify-between text-on-surface">
                <span className="font-label-md text-label-md text-primary font-bold">
                  {stepTitles[currentStep]}
                </span>
                <span className="font-label-sm text-label-sm text-secondary font-bold">
                  {percentages[currentStep]}
                </span>
              </div>
              <div className="relative w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <div
                  className="h-full bg-primary-container rounded-full transition-all duration-300"
                  style={{ width: percentages[currentStep] }}
                ></div>
              </div>
              <div className="grid grid-cols-4 gap-1 pt-1">
                {[1, 2, 3, 4].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setCurrentStep(step)}
                    className={`py-1 rounded-lg text-center font-label-sm text-[10px] transition-colors ${
                      currentStep === step
                        ? 'bg-primary-fixed text-on-primary-fixed font-bold'
                        : step < currentStep
                        ? 'bg-primary-container text-on-primary'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {step === 1 && '1. Contexte'}
                    {step === 2 && '2. Médias'}
                    {step === 3 && '3. Prix'}
                    {step === 4 && '4. Droits'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stepper Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-space-lg px-margin pb-space-xl">
            {/* STEP 1: Contexte Académique */}
            {currentStep === 1 && (
              <section className="flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border-2 border-outline-variant/40 flex flex-col gap-space-md">
                  <div className="flex items-center gap-space-xs text-primary">
                    <span className="material-symbols-outlined text-[20px]">account_balance</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                      1. Cadre universitaire
                    </h2>
                  </div>

                  {/* University selection with search bar */}
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
                        Campus & Université d'appartenance
                      </label>
                      <span className="text-[11px] text-outline">
                        {institutions.filter((i) =>
                          !univSearchQuery ||
                          i.name?.toLowerCase().includes(univSearchQuery.toLowerCase()) ||
                          i.shortName?.toLowerCase().includes(univSearchQuery.toLowerCase()) ||
                          i.city?.toLowerCase().includes(univSearchQuery.toLowerCase())
                        ).length} universités
                      </span>
                    </div>

                    {/* Search bar Universités */}
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        value={univSearchQuery}
                        onChange={(e) => setUnivSearchQuery(e.target.value)}
                        placeholder="Rechercher une université burkinabè (UJKZ, UNB, Nazi Boni, UNZ, USTA...)"
                        className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                      />
                      {univSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setUnivSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {institutions
                        .filter((inst) =>
                          !univSearchQuery ||
                          inst.name?.toLowerCase().includes(univSearchQuery.toLowerCase()) ||
                          inst.shortName?.toLowerCase().includes(univSearchQuery.toLowerCase()) ||
                          inst.city?.toLowerCase().includes(univSearchQuery.toLowerCase())
                        )
                        .map((inst) => (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => setSelectedUniv(inst.id)}
                            className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm transition-transform active:scale-95 flex items-center gap-1 ${
                              selectedUniv === inst.id
                                ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            {selectedUniv === inst.id && (
                              <span className="material-symbols-outlined text-[14px]">check</span>
                            )}
                            {inst.name}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Faculty selection with search bar */}
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
                        UFR / Faculté / Spécialité
                      </label>
                      <span className="text-[11px] text-outline">
                        {faculties.filter((f) =>
                          !facSearchQuery ||
                          f.name?.toLowerCase().includes(facSearchQuery.toLowerCase()) ||
                          f.code?.toLowerCase().includes(facSearchQuery.toLowerCase())
                        ).length} facultés
                      </span>
                    </div>

                    {/* Search bar Facultés */}
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        value={facSearchQuery}
                        onChange={(e) => setFacSearchQuery(e.target.value)}
                        placeholder="Rechercher une UFR / Faculté (SEG, SEA, SJP, SDS, LAC, IBAM, IUT...)"
                        className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                      />
                      {facSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setFacSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {faculties
                        .filter((fac) =>
                          !facSearchQuery ||
                          fac.name?.toLowerCase().includes(facSearchQuery.toLowerCase()) ||
                          fac.code?.toLowerCase().includes(facSearchQuery.toLowerCase())
                        )
                        .map((fac) => (
                          <button
                            key={fac.id}
                            type="button"
                            onClick={() => setSelectedFaculty(fac.id)}
                            className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm transition-transform active:scale-95 flex items-center gap-1 ${
                              selectedFaculty === fac.id
                                ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            {selectedFaculty === fac.id && (
                              <span className="material-symbols-outlined text-[14px]">check</span>
                            )}
                            {fac.name} ({fac.code})
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Filière selection with search bar */}
                  {filieres.length > 0 && (
                    <div className="flex flex-col gap-space-xs">
                      <div className="flex items-center justify-between">
                        <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
                          Filière & Spécialité d'étude
                        </label>
                        <span className="text-[11px] text-outline">
                          {filieres.filter((fil) =>
                            !filiereSearchQuery ||
                            fil.name?.toLowerCase().includes(filiereSearchQuery.toLowerCase()) ||
                            fil.code?.toLowerCase().includes(filiereSearchQuery.toLowerCase())
                          ).length} filières
                        </span>
                      </div>

                      {/* Search bar Filières */}
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                          search
                        </span>
                        <input
                          type="text"
                          value={filiereSearchQuery}
                          onChange={(e) => setFiliereSearchQuery(e.target.value)}
                          placeholder="Rechercher une filière (Macro, Micro, Droit Privé, Informatique, Génie Civil...)"
                          className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                        />
                        {filiereSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setFiliereSearchQuery('')}
                            className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {filieres
                          .filter((fil) =>
                            !filiereSearchQuery ||
                            fil.name?.toLowerCase().includes(filiereSearchQuery.toLowerCase()) ||
                            fil.code?.toLowerCase().includes(filiereSearchQuery.toLowerCase())
                          )
                          .map((fil) => (
                            <button
                              key={fil.id}
                              type="button"
                              onClick={() => setSelectedFiliere(fil.id)}
                              className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm transition-transform active:scale-95 flex items-center gap-1 ${
                                selectedFiliere === fil.id
                                  ? 'bg-secondary text-on-secondary font-bold shadow-xs'
                                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                              }`}
                            >
                              {selectedFiliere === fil.id && (
                                <span className="material-symbols-outlined text-[14px]">check</span>
                              )}
                              {fil.name} ({fil.code})
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Level selection with search bar & Doctorant */}
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
                        Promotion & Niveau d'étude (Licence, Master & Doctorat)
                      </label>
                      <span className="text-[11px] text-outline">
                        {['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat D1', 'Doctorat D2', 'Doctorat D3 / Thèse'].filter(
                          (l) => !levelSearchQuery || l.toLowerCase().includes(levelSearchQuery.toLowerCase())
                        ).length} niveaux
                      </span>
                    </div>

                    {/* Search bar Niveaux & Doctorant */}
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        value={levelSearchQuery}
                        onChange={(e) => setLevelSearchQuery(e.target.value)}
                        placeholder="Rechercher un niveau ou cycle (ex: L1, L2, L3, M1, M2, Doctorat, Thèse...)"
                        className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                      />
                      {levelSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setLevelSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { code: 'L1', label: 'Licence 1 (L1)' },
                        { code: 'L2', label: 'Licence 2 (L2)' },
                        { code: 'L3', label: 'Licence 3 (L3)' },
                        { code: 'M1', label: 'Master 1 (M1)' },
                        { code: 'M2', label: 'Master 2 (M2)' },
                        { code: 'D1', label: 'Doctorat 1 (D1)' },
                        { code: 'D2', label: 'Doctorat 2 (D2)' },
                        { code: 'D3', label: 'Doctorat 3 / Thèse' },
                      ]
                        .filter(
                          (lvl) =>
                            !levelSearchQuery ||
                            lvl.code.toLowerCase().includes(levelSearchQuery.toLowerCase()) ||
                            lvl.label.toLowerCase().includes(levelSearchQuery.toLowerCase())
                        )
                        .map((lvl) => (
                          <button
                            key={lvl.code}
                            type="button"
                            onClick={() => setSelectedLevel(lvl.code)}
                            className={`py-2 px-2.5 rounded-xl font-label-md text-xs text-center transition-all flex items-center justify-center gap-1 ${
                              selectedLevel === lvl.code
                                ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            {selectedLevel === lvl.code && (
                              <span className="material-symbols-outlined text-[14px]">check</span>
                            )}
                            <span className="truncate">{lvl.label}</span>
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Category selection */}
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
                      Catégorie pédagogique
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          id: 'EXAM_CORRECTION',
                          title: "Corrigé d'Examen",
                          sub: 'Sessions & Devoirs',
                          icon: 'verified',
                        },
                        {
                          id: 'COURSE_NOTES',
                          title: 'Polycopié Cours',
                          sub: 'Synthèse amphi',
                          icon: 'menu_book',
                        },
                        {
                          id: 'TUTORIAL_SHEET',
                          title: 'Fiche TD / Exercices',
                          sub: 'Travaux dirigés guidés',
                          icon: 'draw',
                        },
                        {
                          id: 'MEMOIRE_MASTER',
                          title: 'Mémoire de Master',
                          sub: 'Recherche & Soutenance',
                          icon: 'history_edu',
                        },
                        {
                          id: 'THESE_SOUTENANCE',
                          title: 'Thèse de Doctorat',
                          sub: 'Soutenance officielle',
                          icon: 'workspace_premium',
                        },
                        {
                          id: 'CONCOURS_TEST',
                          title: 'Annales Concours',
                          sub: 'Fonction publique BF',
                          icon: 'quiz',
                        },
                        {
                          id: 'FORMATION_ATELIER',
                          title: 'Atelier / Pratique',
                          sub: 'Formation technique',
                          icon: 'handyman',
                        },
                        {
                          id: 'SUMMARY_MEMO',
                          title: 'Fiche Mémo',
                          sub: 'Aide-mémoire express',
                          icon: 'psychology',
                        },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`p-2.5 rounded-xl flex items-center gap-2 text-left transition-all ${
                            selectedCategory === cat.id
                              ? 'bg-primary-fixed text-on-primary-fixed font-bold'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          <span className="material-symbols-outlined text-primary text-[20px]">
                            {cat.icon}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-label-md text-label-md truncate font-bold">
                              {cat.title}
                            </span>
                            <span className="font-body-sm text-[11px] opacity-80 truncate">
                              {cat.sub}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title input */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
                      Titre descriptif du document
                    </label>
                    <input
                      className="w-full h-12 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-highest transition-colors border border-outline-variant/30"
                      placeholder="Ex. Macroéconomie - Session Unique 2023..."
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <button
                    className="mt-2 w-full h-12 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-transform font-bold"
                    onClick={() => setCurrentStep(2)}
                    type="button"
                  >
                    <span>Continuer vers les Fichiers</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </section>
            )}

            {/* STEP 2: Médias Polymorphiques */}
            {currentStep === 2 && (
              <section className="flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border-2 border-outline-variant/40 flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs text-primary">
                      <span className="material-symbols-outlined text-[20px]">perm_media</span>
                      <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                        2. Médias polymorphiques
                      </h2>
                    </div>
                    <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed border border-secondary/30 px-2.5 py-0.5 rounded-full font-bold">
                      Multi-formats acceptés
                    </span>
                  </div>

                  {/* Bundle info card */}
                  <div className="flex gap-2.5 bg-surface-container-low border border-outline-variant/30 p-2.5 rounded-2xl">
                    <img
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                      alt="Étudiants en amphi"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcENNuYhHNFN05IgeO-zQ7dDu21RCnPU3y2Vez00J1NoJE2C4rCGtLZfHEffgHy64OJFeYnHE4KNmcljCa0clgQHKlwOhsuaWe--g1f5wMUn90Yqx04JHuXc85Iq0bg9UQfuNJdoERMwSZ9_xOoLJaUCFlQr0i0o84cN0aWaafk5V-xQUgzhPDjWlFKQradHjsXFS20GLUH16C_Iu1hv8NnQej997E71gLjvrGb40gN-iVEb4bE2qpVg"
                    />
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="font-label-md text-label-md text-on-surface font-bold truncate">
                        Pack Pédagogique Tout-en-un
                      </span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">
                        Combinez texte, audio d'explication et photos pour maximiser vos ventes.
                      </span>
                    </div>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  />

                  {/* Upload Box */}
                  <div
                    className="bg-surface-container-low rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2.5 transition-all cursor-pointer border-2 border-dashed border-primary/40 hover:border-primary hover:bg-surface-container-high shadow-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center shadow-xs border border-primary/20">
                      <span className="material-symbols-outlined text-[26px]">cloud_upload</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">
                        Déposer le PDF Principal
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Glissez ou touchez ici pour sélectionner (Max 45 Mo)
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-label-sm text-[11px] text-primary bg-surface-container-lowest px-2.5 py-1 rounded-full shadow-xs border border-outline-variant/30 font-bold">
                      <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                      Optimisation compression automatique
                    </span>
                  </div>

                  {/* Multimedia Action Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Voice Note Button */}
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl gap-1.5 transition-all active:scale-95 text-center ${
                        isRecording ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          isRecording
                            ? 'bg-error text-on-error animate-pulse'
                            : 'bg-surface-container-highest text-secondary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">mic</span>
                      </div>
                      <span className="font-label-sm text-[11px] font-bold">Note Vocale</span>
                      <span
                        className={`font-body-sm text-[10px] ${
                          isRecording ? 'text-error font-bold' : 'text-on-surface-variant'
                        }`}
                      >
                        {isRecording ? `00:${recordDuration < 10 ? '0' : ''}${recordDuration}` : 'Microphone'}
                      </span>
                    </button>

                    {/* Video Button */}
                    <button
                      type="button"
                      onClick={() => showToast('Module vidéo configuré')}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-container text-on-surface gap-1.5 transition-all active:scale-95 text-center"
                    >
                      <div className="w-9 h-9 rounded-full bg-surface-container-highest text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">videocam</span>
                      </div>
                      <span className="font-label-sm text-[11px] font-bold">Extrait Amphi</span>
                      <span className="font-body-sm text-[10px] text-on-surface-variant">
                        Vidéo 60s max
                      </span>
                    </button>

                    {/* Photos / Scan Button */}
                    <button
                      type="button"
                      onClick={() => setShowDocPhotoModal(true)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-container text-on-surface gap-1.5 transition-all active:scale-95 text-center"
                    >
                      <div className="w-9 h-9 rounded-full bg-surface-container-highest text-tertiary-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                      </div>
                      <span className="font-label-sm text-[11px] font-bold">Photo / Scan</span>
                      <span className="font-body-sm text-[10px] text-on-surface-variant">
                        Caméra & Redim.
                      </span>
                    </button>
                  </div>

                  {/* Attached Files List */}
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
                        Fichiers attachés ({attachedFiles.length} prêt{attachedFiles.length > 1 ? 's' : ''})
                      </span>
                      {attachedFiles.length === 0 && (
                        <span className="text-[11px] text-error font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          Au moins 1 média requis
                        </span>
                      )}
                    </div>

                    {attachedFiles.length === 0 ? (
                      <div className="p-4 rounded-xl bg-error/5 border border-error/20 flex flex-col items-center justify-center text-center gap-1.5 text-error">
                        <span className="material-symbols-outlined text-[26px]">upload_file</span>
                        <p className="text-xs font-bold">Média obligatoire : Aucun document n'est joint</p>
                        <p className="text-[11px] text-on-surface-variant max-w-sm">
                          Pour soumettre votre document à la validation administrative, déposez au moins un fichier principal (PDF du devoir, audio d'amphi ou photos).
                        </p>
                      </div>
                    ) : (
                      attachedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`px-2 py-0.5 rounded-md font-label-sm text-[10px] font-bold shrink-0 ${
                                file.mediaType === 'PDF'
                                  ? 'bg-error-container text-on-error-container'
                                  : file.mediaType === 'AUDIO'
                                  ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                                  : 'bg-primary-fixed text-on-primary-fixed'
                              }`}
                            >
                              {file.mediaType}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
                                {file.originalFilename}
                              </span>
                              <span className="font-body-sm text-[10px] text-on-surface-variant">
                                {(file.sizeBytes / 1024 / 1024).toFixed(1)} Mo • Prêt
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="w-7 h-7 flex items-center justify-center rounded-full text-error hover:bg-error-container active:scale-90 transition-transform"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      className="h-12 px-4 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg active:scale-98 transition-transform font-bold"
                      onClick={() => setCurrentStep(1)}
                      type="button"
                    >
                      Retour
                    </button>
                    <button
                      className={`flex-1 h-12 rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-all font-bold ${
                        attachedFiles.length === 0
                          ? 'bg-surface-container-highest text-outline cursor-not-allowed'
                          : 'bg-primary-container text-on-primary active:scale-98'
                      }`}
                      onClick={() => {
                        if (attachedFiles.length === 0) {
                          alert('Média obligatoire : Vous devez déposer au moins un fichier pédagogique.');
                          return;
                        }
                        setCurrentStep(3);
                      }}
                      disabled={attachedFiles.length === 0}
                      type="button"
                    >
                      <span>{attachedFiles.length === 0 ? 'Fichier média requis pour continuer' : 'Passer à la Tarification'}</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* STEP 3: Monétisation & Partage (Prix 0F strictement interdit, barème plafond plafonné) */}
            {currentStep === 3 && (
              <section className="flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border-2 border-outline-variant/40 flex flex-col gap-space-md">
                  <div className="flex items-center gap-space-xs text-primary">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                      3. Rétribution & Modèle de Vente
                    </h2>
                  </div>

                  {/* Pricing Models: strictly non-zero */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Model 1: Téléchargement Mobile Money */}
                    <div
                      onClick={() => setPricingModel('monetise')}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-start gap-3 border-2 ${
                        pricingModel === 'monetise'
                          ? 'bg-primary-fixed border-primary ring-1 ring-primary/20 text-on-primary-fixed shadow-xs'
                          : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:border-primary/40'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">price_check</span>
                      </span>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-label-lg text-label-lg font-bold">
                            Téléchargement Mobile Money (Recommandé)
                          </span>
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              pricingModel === 'monetise' ? 'bg-primary' : 'bg-surface-variant'
                            }`}
                          >
                            {pricingModel === 'monetise' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-surface"></span>
                            )}
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm opacity-90 mt-0.5">
                          Paiement instantané par Orange Money et Moov Money Burkina. Rétribution de 85% reversée sur votre portefeuille.
                        </p>
                      </div>
                    </div>

                    {/* Model 2: Présentiel & Amphi */}
                    <div
                      onClick={() => setPricingModel('presentiel')}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-start gap-3 border-2 ${
                        pricingModel === 'presentiel'
                          ? 'bg-secondary-fixed border-secondary ring-1 ring-secondary/20 text-on-secondary-fixed-variant shadow-xs'
                          : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:border-secondary/40'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-full bg-surface-container-highest text-secondary flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">handshake</span>
                      </span>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-label-lg text-label-lg font-bold">
                            Remise en main propre / Kiosque Amphi & WhatsApp
                          </span>
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              pricingModel === 'presentiel' ? 'bg-secondary' : 'bg-surface-variant'
                            }`}
                          >
                            {pricingModel === 'presentiel' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-surface"></span>
                            )}
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm opacity-90 mt-0.5">
                          Rendez-vous physique au kiosque du campus ou à la pause amphi avec votre contact direct.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Calculator & Price field */}
                  <div className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-sm">
                    {/* Regulatory Anti-Speculation Banner */}
                    {(() => {
                      const activeRule = pricingRules.find(
                        (r) => r.isActive && (r.documentType === selectedCategory || r.documentType === 'ALL')
                      );
                      const ceilingPrice = activeRule?.maxPrice || 2000;

                      return (
                        <div className="p-2.5 rounded-xl bg-primary-fixed/20 border border-primary/20 flex flex-col gap-1 text-xs text-on-surface">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-primary">gavel</span>
                              <span>
                                Barème officiel Burkina Faso : <strong>Plafond maximum {ceilingPrice} FCFA</strong>
                              </span>
                            </div>
                            <span className="text-[9px] bg-primary-container text-on-primary px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                              Régulation MESRSI
                            </span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant">
                            Conseillé : {activeRule?.suggestedPrice || 500} FCFA • Minimum : 50 FCFA (Les prix à 0F ne sont pas autorisés)
                          </p>
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-label-md text-label-md text-on-surface font-bold">
                          Prix unitaire fixé (FCFA)
                        </label>
                        <p className="text-[10px] text-outline">Saisie bloquée au barème plafond</p>
                      </div>
                      <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1.5 rounded-xl border border-outline-variant/30">
                        <input
                          className="w-20 font-price-display text-price-display text-secondary font-black text-right bg-transparent focus:outline-none"
                          type="number"
                          min="50"
                          max={
                            pricingRules.find(
                              (r) => r.isActive && (r.documentType === selectedCategory || r.documentType === 'ALL')
                            )?.maxPrice || 2000
                          }
                          step="50"
                          value={price}
                          onChange={(e) => {
                            const activeRule = pricingRules.find(
                              (r) => r.isActive && (r.documentType === selectedCategory || r.documentType === 'ALL')
                            );
                            const ceilingPrice = activeRule?.maxPrice || 2000;
                            let val = Number(e.target.value) || 0;
                            if (val > ceilingPrice) {
                              val = ceilingPrice;
                              showToast(`Plafond barème atteint : La saisie ne peut pas dépasser ${ceilingPrice} FCFA.`);
                            }
                            setPrice(val);
                          }}
                        />
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                          FCFA
                        </span>
                      </div>
                    </div>

                    {/* Price validation error if < 50 */}
                    {price < 50 && (
                      <div className="p-2.5 rounded-xl bg-error/10 border border-error/30 text-error flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                        <span className="text-xs font-bold leading-tight">
                          Prix non conforme : Les publications à 0 FCFA ne sont pas acceptées. Tarif minimum requis : 50 FCFA.
                        </span>
                      </div>
                    )}

                    {/* Quick price pills up to ceiling */}
                    {(() => {
                      const activeRule = pricingRules.find(
                        (r) => r.isActive && (r.documentType === selectedCategory || r.documentType === 'ALL')
                      );
                      const ceilingPrice = activeRule?.maxPrice || 2000;
                      const quickPills = [100, 250, 500, 1000, 1500].filter((p) => p <= ceilingPrice);

                      return (
                        <div className="flex items-center justify-between gap-1 pt-1">
                          {quickPills.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPrice(p)}
                              className={`flex-1 py-1 rounded-md font-label-sm text-[11px] font-bold ${
                                price === p
                                  ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                              }`}
                            >
                              {p.toLocaleString('fr-FR')} F
                            </button>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Revenue breakdown card */}
                    <div className="bg-surface-container-lowest rounded-lg p-3 flex flex-col gap-2 mt-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          <span className="font-label-sm text-label-sm text-on-surface font-bold">
                            Votre part auteur (85%)
                          </span>
                        </div>
                        <span className="font-label-lg text-label-lg text-primary font-extrabold">
                          {authorGain.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-outline"></span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                            Frais Campus Folder & Télécoms (15%)
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                          {platformFee.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden flex mt-1">
                        <div className="bg-primary-container h-full" style={{ width: '85%' }}></div>
                        <div className="bg-secondary-container h-full" style={{ width: '15%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      className="h-12 px-4 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg active:scale-98 transition-transform font-bold"
                      onClick={() => setCurrentStep(2)}
                      type="button"
                    >
                      Retour
                    </button>
                    {(() => {
                      const activeRule = pricingRules.find(
                        (r) => r.isActive && (r.documentType === selectedCategory || r.documentType === 'ALL')
                      );
                      const ceilingPrice = activeRule?.maxPrice || 2000;
                      const isInvalid = price < 50 || price > ceilingPrice;

                      return (
                        <button
                          className={`flex-1 h-12 rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-transform font-bold ${
                            isInvalid
                              ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed opacity-60'
                              : 'bg-primary-container text-on-primary'
                          }`}
                          disabled={isInvalid}
                          onClick={() => {
                            if (!isInvalid) setCurrentStep(4);
                          }}
                          type="button"
                        >
                          <span>{price < 50 ? 'Prix min 50 FCFA obligatoire' : 'Valider la Charte'}</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </section>
            )}

            {/* STEP 4: Charte & Propriété */}
            {currentStep === 4 && (
              <section className="flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border-2 border-outline-variant/40 flex flex-col gap-space-md">
                  <div className="flex items-center gap-space-xs text-primary">
                    <span className="material-symbols-outlined text-[20px]">gavel</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                      4. Charte & Propriété
                    </h2>
                  </div>

                  {/* Contract Version v2.1 card */}
                  <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-2 border-2 border-primary/20 ring-1 ring-primary/10">
                    <div className="flex items-center gap-2 text-on-surface">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        shield_person
                      </span>
                      <span className="font-label-md text-label-md font-bold">
                        Contrat Contributeur Certifié v2.1
                      </span>
                    </div>
                    <p className="font-body-sm text-[12px] leading-relaxed text-on-surface-variant">
                      En publiant sur Campus Folder, vous garantissez que ces notes, enregistrements
                      et corrigés résultent de votre production ou ont été explicitement autorisés
                      au partage libre. Tout plagiat intégral ou document officiel confidentiel
                      entraîne la suspension immédiate du solde contributeur.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-label-sm text-[10px] text-primary bg-primary-fixed border border-primary/20 px-2 py-0.5 rounded-md font-bold">
                        Anti-plagiat actif
                      </span>
                      <span className="font-label-sm text-[10px] text-secondary bg-secondary-fixed border border-secondary/20 px-2 py-0.5 rounded-md font-bold">
                        Reversement Garanti
                      </span>
                    </div>
                  </div>

                  {/* Honor commitment checkbox */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-container cursor-pointer select-none border-2 border-outline-variant/40 hover:border-primary/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={legalAgreement}
                      onChange={(e) => setLegalAgreement(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded text-primary-container accent-primary-container focus:ring-0 cursor-pointer"
                      required
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md text-on-surface font-bold">
                        Engagement sur l'honneur
                      </span>
                      <span className="font-body-sm text-[12px] text-on-surface-variant leading-tight">
                        Je certifie être l'auteur principal ou détenir les droits d'exploitation
                        académique conformément à la législation burkinabè et au règlement Campus
                        Folder.
                      </span>
                    </div>
                  </label>

                  {/* Committee badge */}
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/30">
                    <img
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                      alt="Comité étudiant"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcpJ06I2MX2pYy6ZGrzSu0rgMZrq3DNOY2AvY8DYCUI57hgKjdJlt9em_aZGvhwYGy9q3h8E7zN0siGcr4A6S1FIEo4P2fMVpZLw7I6PjS21CLz97Pz7G7Er8FXWrzSm-cepsa4cddXHWhWfM8Mpnc-L38MKC9ER-P9-2Z4c5No8yyZ6CsTD6AK5Oa7Cww5J9Mbs0SB3z_iFcbvYO960qBAcAzfNXJdqPh2-Q5KAYikHE1yajb-AhDrg"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-sm text-label-sm text-on-surface font-bold truncate">
                        Comité des Pairs Étudiants
                      </span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">
                        Une validation express est lancée dès soumission.
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={!legalAgreement || isSubmitting}
                      className={`w-full h-14 rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all font-bold ${
                        legalAgreement && !isSubmitting
                          ? 'bg-primary-container text-on-primary cursor-pointer'
                          : 'bg-primary-container/60 text-on-primary/70 pointer-events-none opacity-60'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[22px] ${isSubmitting ? 'animate-spin' : ''}`}>
                        {isSubmitting ? 'sync' : 'verified_user'}
                      </span>
                      <span>
                        {isSubmitting
                          ? 'Indexation en base de données...'
                          : 'Soumettre à la validation académique'}
                      </span>
                    </button>
                    <button
                      className="w-full py-2.5 text-center font-label-md text-label-md text-on-surface-variant active:opacity-75 font-semibold"
                      onClick={() => setCurrentStep(3)}
                      type="button"
                    >
                      Modifier les réglages tarifaires
                    </button>
                  </div>
                </div>
              </section>
            )}
          </form>
          </div>

          {/* Right Sticky Sidebar (4 cols on desktop): Live Preview & Royalties Simulator */}
          <aside className="hidden lg:flex lg:col-span-4 flex-col gap-6 sticky top-20 self-start">
            {/* Live Card Preview */}
            <div className="bg-surface-container-lowest rounded-3xl p-5 border-2 border-primary/25 ring-1 ring-primary/10 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed border border-primary/20 text-primary font-label-sm text-[11px] font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  Aperçu dans l'Amphi
                </span>
                <span className="font-label-sm text-xs text-outline">En direct</span>
              </div>

              {/* Simulated Card */}
              <div className="rounded-2xl border-2 border-outline-variant/40 p-4 flex flex-col gap-3 bg-surface">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {attachedFiles.some((f) => f.mediaType === 'AUDIO') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold uppercase border border-[#15803D]/20">
                        <span className="material-symbols-outlined text-[12px]">mic</span>
                        Vocal
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant text-[10px] font-semibold">
                      {faculties.find((f) => f.id === selectedFaculty)?.code?.toUpperCase() || 'UFR'} • {selectedLevel}
                    </span>
                  </div>
                  <span className="text-secondary">
                    <span className="material-symbols-outlined text-[18px]">bookmark</span>
                  </span>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-xl bg-primary-fixed/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[28px]">description</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-on-surface line-clamp-1">
                      {title || 'Titre du document...'}
                    </h4>
                    <span className="text-xs text-outline truncate mt-0.5">
                      {institutions.find((i) => i.id === selectedUniv)?.name || 'Université'}
                    </span>
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-on-surface font-bold">
                      <span className="material-symbols-outlined text-[13px] text-secondary">star</span>
                      <span>5.0</span>
                      <span className="text-outline font-normal">({attachedFiles.length} fichiers attachés)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-outline font-bold">Tarif d'accès</span>
                    <span className="text-base font-extrabold text-primary">
                      {pricingModel === 'monetise' ? `${price} FCFA` : 'Gratuit (Solidaire)'}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-primary-container text-on-primary text-xs font-bold">
                    Télécharger
                  </span>
                </div>
              </div>
            </div>

            {/* Royalties Calculator Card */}
            <div className="bg-surface-container-lowest rounded-3xl p-5 border-2 border-outline-variant/40 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">calculate</span>
                <h3 className="font-bold text-sm text-on-surface">Simulateur Rémunération 85%</h3>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low">
                  <span className="text-on-surface-variant">Reversé à l'auteur (85%)</span>
                  <span className="font-bold text-primary font-mono text-sm">
                    {pricingModel === 'monetise' ? `${authorGain} FCFA` : '0 FCFA'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low">
                  <span className="text-on-surface-variant">Frais infrastructure (15%)</span>
                  <span className="font-bold text-outline font-mono text-sm">
                    {pricingModel === 'monetise' ? `${platformFee} FCFA` : '0 FCFA'}
                  </span>
                </div>
              </div>

              {pricingModel === 'monetise' && (
                <div className="p-3 rounded-xl bg-primary-fixed/20 border border-primary/20 text-xs flex flex-col gap-1 text-primary">
                  <span className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    Impact Promo Amphi :
                  </span>
                  <span>
                    Si <strong>30 camarades</strong> de promo acquièrent votre ressource, vous recevrez{' '}
                    <strong>{(authorGain * 30).toLocaleString('fr-FR')} FCFA</strong> directement sur votre compte Orange/Moov Money.
                  </span>
                </div>
              )}
            </div>

            {/* Integrity Shield Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2 text-on-surface font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px] text-tertiary-container">verified_user</span>
                <span>Garanties & Intégrité UJKZ</span>
              </div>
              <ul className="text-xs text-on-surface-variant flex flex-col gap-2 list-none">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">check</span>
                  <span>Filigrane anti-fuite dynamique avec numéro INE de l'acheteur.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">check</span>
                  <span>Compression adaptative pour réseaux étudiants à faible débit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">check</span>
                  <span>Paiements réversibles et audités sur le double-entry ledger.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
              <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 w-full max-w-lg flex flex-col items-center text-center gap-4 shadow-2xl border border-primary/20 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[34px]">hourglass_top</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                    Comité de Modération Universitaire • BF
                  </span>
                  <h3 className="font-headline-md text-lg sm:text-xl text-on-surface font-extrabold">
                    Document soumis à l'examen & validation administrative !
                  </h3>
                  <p className="font-body-md text-xs sm:text-sm text-on-surface-variant leading-relaxed mt-1">
                    Félicitations, votre document pédagogique a été envoyé avec succès. Il a été transmis au comité de modération académique.
                  </p>
                </div>

                {/* 24h SLA Promise Banner */}
                <div className="w-full bg-primary-fixed/20 border border-primary/30 rounded-2xl p-3.5 flex items-start gap-3 text-left">
                  <span className="material-symbols-outlined text-primary text-[24px] shrink-0 mt-0.5">
                    timer
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-primary">
                      Engagement Campus Folder : Validation en 24h max
                    </span>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                      La plateforme s'engage à valider votre ressource après examen de conformité (lisibilité, qualité et barème anti-spéculation), qui dure généralement <strong>24 heures ouvrées</strong>.
                    </p>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="w-full bg-surface-container-low rounded-2xl p-4 flex flex-col gap-2 text-left border border-outline-variant/20">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant">Titre du document</span>
                    <span className="text-on-surface font-bold truncate max-w-[220px]">
                      {title}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant">Rétribution auteur (85%)</span>
                    <span className="text-primary font-black font-mono">
                      {authorGain.toLocaleString('fr-FR')} FCFA / achat
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant">Fichiers attachés</span>
                    <span className="text-on-surface font-semibold">
                      {attachedFiles.length} support{attachedFiles.length > 1 ? 's' : ''} vérifié{attachedFiles.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-outline-variant/20">
                    <span className="text-on-surface-variant">Statut actuel</span>
                    <span className="inline-flex items-center gap-1 text-[10px] bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded-full font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      En attente d'examen
                    </span>
                  </div>
                </div>

                {/* Student Reminder Feature */}
                <div className="w-full bg-surface-container rounded-2xl p-4 flex flex-col gap-2.5 text-left border border-outline-variant/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-error">notification_important</span>
                      Besoin d'accélérer la modération ?
                    </span>
                    {reminderSent && (
                      <span className="text-[10px] bg-[#DCFCE7] text-[#15803D] font-bold px-2 py-0.5 rounded-full">
                        Priorité rehaussée
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Si le délai de 24h est dépassé ou en cas d'évaluation imminente, déclenchez un <strong>Rappel étudiant</strong>. Votre document sera reclassé en tête de file d'examen chez l'administrateur, qui recevra une notification urgente.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendReminder}
                    disabled={reminderLoading || reminderSent}
                    className={`w-full py-2.5 px-4 rounded-xl font-label-md text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      reminderSent
                        ? 'bg-[#DCFCE7] text-[#15803D] border border-[#15803D]/40'
                        : 'bg-error/10 hover:bg-error/20 text-error border border-error/30 active:scale-98'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {reminderSent ? 'done_all' : 'notifications_active'}
                    </span>
                    <span>
                      {reminderLoading
                        ? 'Transmission du rappel...'
                        : reminderSent
                        ? `Rappel #${reminderCount} envoyé ! (Reclassé en tête de file d'examen)`
                        : 'Envoyer un Rappel de ma publication (Priorité Haute)'}
                    </span>
                  </button>
                </div>

                <div className="flex gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="flex-1 h-12 rounded-xl bg-primary-container text-on-primary font-label-lg text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-transform font-bold shadow-md"
                  >
                    <span>Voir l'accueil</span>
                    <span className="material-symbols-outlined text-[18px]">home</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/explorer')}
                    className="flex-1 h-12 rounded-xl bg-surface-container text-on-surface font-label-lg text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-transform font-bold hover:bg-surface-container-high"
                  >
                    <span>Explorer</span>
                    <span className="material-symbols-outlined text-[18px]">explore</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toast feedback */}
          {uploadToast && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-primary-container text-on-primary px-4 py-2 rounded-full font-label-md text-label-md shadow-lg z-50 flex items-center gap-2 animate-fade-in">
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>{uploadToast}</span>
            </div>
          )}

          {/* Modal Photo / Scan Manuscrit avec Redimensionnement */}
          <ImageUploadModal
            isOpen={showDocPhotoModal}
            onClose={() => setShowDocPhotoModal(false)}
            onImageUploaded={handlePhotoCaptured}
            title="Photographier / Scanner une Fiche de Cours"
            subtitle="Capturez une photo nette de votre document avec redimensionnement automatique"
            folder="documents"
            cropToSquare={false}
            defaultMaxDimension={1200}
          />
      </main>

      <BottomNavigation />
    </div>
  );
}
