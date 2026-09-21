'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface ResourceData {
  id: string;
  title: string;
  slug: string;
  category: string;
  resourceType: string;
  downloadsCount: number;
  thumbnailUrl: string | null;
  institution?: {
    name: string;
    code: string;
    shortName: string | null;
  };
  faculty?: {
    name: string;
    code: string;
  };
  academicLevel?: {
    code: string;
    name: string;
  };
  accessPolicy?: {
    policyType: string;
    priceAmount: number;
    currency: string;
    allowsPhysicalHandover: boolean;
  };
  author?: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      bio: string | null;
    };
  };
  contactChannel?: {
    whatsappNumber: string | null;
    physicalLocation: string | null;
  };
  media?: Array<{
    id: string;
    mediaType: string;
    title: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}

interface UserData {
  id: string;
  email: string;
  phoneNumber: string;
  points: number;
  profile?: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  wallet?: {
    availableBalance: number;
    currency: string;
  };
}

function ResourceSummaryCard({ resource }: { resource: ResourceData | null }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high shadow-xs flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0 relative overflow-hidden shadow-xs">
            <Image
              src={resource?.thumbnailUrl || '/images/sample-cover.jpg'}
              alt={resource?.title || 'Couverture ressource'}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                {resource?.academicLevel?.code || 'L1'} {resource?.faculty?.code || 'Lettres'}
              </span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                {resource?.resourceType === 'EXAM_SOLUTION' ? 'Corrigé Type' : resource?.resourceType || 'Document'}
              </span>
            </div>
            <h2 className="font-headline-md text-sm font-bold text-on-surface line-clamp-2 leading-snug">
              {resource?.title || 'Corrigé Examen Linguistique Générale L1'}
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px] text-primary">school</span>
              {resource?.author?.profile?.firstName} {resource?.author?.profile?.lastName} • {resource?.institution?.shortName || 'UJKZ'}
            </p>
          </div>
        </div>
      </div>

      {/* Included Media Assets Bar */}
      <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-on-surface font-medium">
          <span className="material-symbols-outlined text-primary text-[16px]">folder_open</span>
          <span>{resource?.media?.length || 3} médias inclus :</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {resource?.media && resource.media.length > 0 ? (
            resource.media.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1 bg-surface-container-highest px-2 py-0.5 rounded text-[10px] font-semibold text-on-surface"
              >
                <span className="material-symbols-outlined text-[12px] text-primary">
                  {m.mediaType === 'PDF' ? 'picture_as_pdf' : m.mediaType === 'AUDIO' ? 'mic' : 'attach_file'}
                </span>
                {m.mediaType === 'PDF' ? 'PDF' : m.mediaType === 'AUDIO' ? 'Audio' : 'Barème'}
              </span>
            ))
          ) : (
            <>
              <span className="inline-flex items-center gap-1 bg-surface-container-highest px-2 py-0.5 rounded text-[10px] font-semibold text-on-surface">
                <span className="material-symbols-outlined text-[12px] text-error">picture_as_pdf</span>
                PDF (12p)
              </span>
              <span className="inline-flex items-center gap-1 bg-surface-container-highest px-2 py-0.5 rounded text-[10px] font-semibold text-on-surface">
                <span className="material-symbols-outlined text-[12px] text-primary">mic</span>
                Audio
              </span>
              <span className="inline-flex items-center gap-1 bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded text-[10px] font-bold">
                <span className="material-symbols-outlined text-[12px]">check_circle</span>
                Barème
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FeeBreakdownCard({ price }: { price: number }) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-5 flex flex-col gap-2.5 border border-surface-container-high shadow-xs">
      <div className="flex items-center justify-between text-body-sm font-body-sm">
        <span className="text-on-surface-variant">Montant ressource pédagogique</span>
        <span className="font-label-md text-label-md text-on-surface font-semibold">
          {price.toLocaleString('fr-FR')} FCFA
        </span>
      </div>
      <div className="flex items-center justify-between text-body-sm font-body-sm">
        <span className="text-on-surface-variant flex items-center gap-1">
          Frais de traitement opérateur
          <span className="material-symbols-outlined text-[14px] text-outline">help</span>
        </span>
        <span className="font-label-md text-label-md text-primary font-bold">0 FCFA (Offerts)</span>
      </div>
      <div className="h-[1px] bg-surface-container-highest my-1"></div>
      <div className="flex items-center justify-between">
        <span className="font-headline-md text-body-lg text-on-surface font-extrabold">
          Total net à débiter
        </span>
        <div className="text-right">
          <span className="font-headline-md text-xl text-primary font-black">
            {price.toLocaleString('fr-FR')} FCFA
          </span>
          <span className="block font-label-sm text-[10px] text-outline">TVA incluse • 85% reversés à l'auteur</span>
        </div>
      </div>
    </div>
  );
}

function TrustBadgesCard() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-surface-container-lowest rounded-xl p-3.5 flex items-center gap-2.5 border border-surface-container-high shadow-xs">
        <div className="w-8 h-8 rounded-full bg-primary-fixed/60 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-[18px]">all_inclusive</span>
        </div>
        <div className="min-w-0">
          <p className="font-label-sm text-xs text-on-surface font-bold leading-tight">
            Accès illimité à vie
          </p>
          <p className="font-body-sm text-[10px] text-on-surface-variant leading-tight truncate mt-0.5">
            Toujours synchronisé
          </p>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-3.5 flex items-center gap-2.5 border border-surface-container-high shadow-xs">
        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface shrink-0">
          <span className="material-symbols-outlined text-[18px]">cloud_download</span>
        </div>
        <div className="min-w-0">
          <p className="font-label-sm text-xs text-on-surface font-bold leading-tight">
            Mode hors-ligne
          </p>
          <p className="font-body-sm text-[10px] text-on-surface-variant leading-tight truncate mt-0.5">
            Lecture sans datas
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resourceSlugParam = searchParams.get('slug') || searchParams.get('resourceId');

  const [resource, setResource] = useState<ResourceData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'orange' | 'moov' | 'in-person'>('wallet');
  const [orangePhone, setOrangePhone] = useState('76 45 88 12');
  const [moovPhone, setMoovPhone] = useState('60 12 34 56');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Connexion au serveur bancaire et émission du jeton d'accès...");
  const [progressWidth, setProgressWidth] = useState('33%');
  const [downloadToken, setDownloadToken] = useState('UJKZ-84920-F7D');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // 1. Fetch authenticated user data (wallet balance, phone)
        const userRes = await fetch('/api/v1/auth/me');
        const userData = await userRes.json();
        if (userData.success && userData.user) {
          setUser(userData.user);
          if (userData.user.phoneNumber) {
            setOrangePhone(userData.user.phoneNumber.replace('+226', '').trim());
          }
        }

        // 2. Fetch resource details
        const targetSlug = resourceSlugParam || 'corrige-examen-synthese-linguistique-generale-l1';
        const res = await fetch(`/api/v1/resources/${targetSlug}`);
        const data = await res.json();

        if (data.success && data.resource) {
          setResource(data.resource);
        } else {
          // Fallback to first resource from feed
          const feedRes = await fetch('/api/v1/resources/feed');
          const feedData = await feedRes.json();
          if (feedData.success && feedData.facultyStream && feedData.facultyStream.length > 0) {
            setResource(feedData.facultyStream[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load payment checkout context:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [resourceSlugParam]);

  const price = resource?.accessPolicy?.priceAmount || 500;
  const availableBalance = user?.wallet?.availableBalance ?? 2400;
  const newBalanceRemaining = availableBalance - price;

  const handleCheckout = async () => {
    if (selectedMethod === 'in-person') {
      const waNumber = resource?.contactChannel?.whatsappNumber?.replace('+', '') || '22670000000';
      const text = encodeURIComponent(
        `Bonjour, je souhaite acquérir le document "${resource?.title || 'Ressource'}" en remise physique.`
      );
      window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setProgressWidth('33%');

    let initialStatus = 'Débit direct du solde Portefeuille Campus...';
    if (selectedMethod === 'orange') {
      initialStatus = 'Appel USSD sécurisé vers Orange Money (+226)...';
    } else if (selectedMethod === 'moov') {
      initialStatus = 'Notification Push Moov Flooz envoyée à votre smartphone...';
    }
    setProcessingStatus(initialStatus);

    // Progressive UI feedback
    const timer1 = setTimeout(() => {
      setProgressWidth('75%');
      setProcessingStatus('Clé cryptographique générée. Chiffrement du document...');
    }, 900);

    const timer2 = setTimeout(() => {
      setProgressWidth('100%');
      setProcessingStatus('Achat vérifié ! Signature de la licence étudiante...');
    }, 1800);

    try {
      const methodKey =
        selectedMethod === 'wallet'
          ? 'CAMPUS_WALLET'
          : selectedMethod === 'orange'
          ? 'ORANGE_MONEY'
          : 'MOOV_MONEY';

      const payerPhone =
        selectedMethod === 'orange'
          ? `+226${orangePhone.replace(/\s+/g, '')}`
          : selectedMethod === 'moov'
          ? `+226${moovPhone.replace(/\s+/g, '')}`
          : user?.phoneNumber;

      const checkoutRes = await fetch('/api/v1/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: resource?.id,
          paymentMethod: methodKey,
          payerPhone,
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.success) {
        throw new Error(checkoutData.error || 'Échec de la transaction');
      }

      if (checkoutData.downloadToken) {
        setDownloadToken(checkoutData.downloadToken);
      }

      // Complete processing
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        // Scroll down to success banner
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 2400);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsProcessing(false);
      setErrorMessage(err.message || 'Une erreur est survenue lors du paiement.');
    }
  };

  const getCtaLabel = () => {
    if (selectedMethod === 'in-person') {
      return 'Organiser le rendez-vous physique';
    }
    if (selectedMethod === 'wallet') {
      return `Débloquer immédiatement • ${price} FCFA`;
    }
    return `Confirmer et Payer ${price} FCFA`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
        <p className="font-label-lg text-on-surface-variant">Chargement de la session de paiement sécurisée...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface font-body-md text-on-surface flex flex-col min-h-screen">
      {/* Fixed Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0 flex-1">
            <button
              type="button"
              aria-label="Retour"
              onClick={() => router.back()}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface active:scale-95 transition-transform shrink-0"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="relative h-7 w-28 shrink-0">
              <Image
                src="/images/logo.png"
                alt="Campus Folder"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface truncate min-w-0 leading-tight">
              Paiement Mobile
            </h1>
          </div>
          <div className="flex items-center gap-space-xs shrink-0">
            <button
              type="button"
              aria-label="Partager"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: resource?.title || 'Campus Folder',
                    url: window.location.href,
                  });
                }
              }}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary-container/20 shrink-0">
              <Image
                src={user?.profile?.avatarUrl || '/images/avatars/aminata.jpg'}
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative w-full pt-20 pb-24 bg-surface max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Context, Methods, Mobile Summary, CTA (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Mobile Only: Summary Bento */}
            <div className="lg:hidden">
              <ResourceSummaryCard resource={resource} />
            </div>

            {/* Dynamic Context Notification Banner */}
            <div className="bg-primary-fixed/40 rounded-xl p-space-md flex items-center gap-space-sm shadow-sm">
              <span className="material-symbols-outlined text-primary text-[22px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-label-md text-label-md text-primary font-bold">
                  Session d&apos;achat sécurisée ({resource?.institution?.code || 'UJKZ'} - {resource?.institution?.shortName || 'Ouaga 1'})
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  Cryptage SSL 256 bits • Livraison instantanée
                </p>
              </div>
              <span className="bg-primary text-on-primary text-label-sm font-label-sm px-2 py-0.5 rounded-full shrink-0">
                Direct
              </span>
            </div>

          {/* Interactive Payment Selection Module */}
          <div className="px-margin mt-space-xl">
            <div className="flex items-center justify-between mb-space-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface">Mode de règlement</h3>
              <span className="font-label-sm text-label-sm text-primary flex items-center gap-1 bg-primary-fixed/40 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[14px]">bolt</span> Sans frais
              </span>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="mb-space-sm p-space-sm bg-error-container text-on-error-container rounded-xl text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-error">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Options List */}
            <div className="flex flex-col gap-space-sm" id="payment-accordion">
              {/* 1. Campus Wallet (Recommended / One-Click) */}
              <div
                onClick={() => setSelectedMethod('wallet')}
                className={`payment-method-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-all duration-200 cursor-pointer ${
                  selectedMethod === 'wallet' ? 'bg-surface-container-high/40 ring-2 ring-primary/30' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-md">
                    <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <span className="font-headline-md text-body-lg text-on-surface font-bold">
                          Solde Portefeuille Campus
                        </span>
                        <span className="bg-primary text-on-primary px-1.5 py-0.5 rounded-full text-label-sm font-label-sm font-bold scale-90">
                          1-Clic
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Solde dispo :{' '}
                        <strong className="text-primary font-bold">
                          {availableBalance.toLocaleString('fr-FR')} FCFA
                        </strong>
                      </p>
                    </div>
                  </div>
                  <div
                    className={`radio-indicator w-6 h-6 rounded-full flex items-center justify-center text-on-primary transition-colors ${
                      selectedMethod === 'wallet' ? 'bg-primary' : 'bg-surface-container-high'
                    }`}
                  >
                    {selectedMethod === 'wallet' && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </div>
                </div>

                {selectedMethod === 'wallet' && (
                  <div className="mt-space-md pt-space-sm bg-surface-container-low p-space-sm rounded-lg">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface-variant">Nouveau solde restant :</span>
                      <span className="text-on-surface font-bold">
                        {newBalanceRemaining >= 0
                          ? `${newBalanceRemaining.toLocaleString('fr-FR')} FCFA`
                          : 'Solde insuffisant'}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-primary-container mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">flash_on</span>
                      Déblocage instantané sur votre bibliothèque sans délai.
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Orange Money Burkina */}
              <div
                onClick={() => setSelectedMethod('orange')}
                className={`payment-method-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-all duration-200 cursor-pointer ${
                  selectedMethod === 'orange' ? 'bg-surface-container-high/40 ring-2 ring-primary/30' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-md">
                    <div className="w-11 h-11 rounded-xl bg-secondary-container flex items-center justify-center text-white shadow-sm font-black text-[15px] tracking-tight">
                      OM
                    </div>
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <span className="font-headline-md text-body-lg text-on-surface font-bold">
                          Orange Money Burkina
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Paiement OTP ou push direct +226
                      </p>
                    </div>
                  </div>
                  <div
                    className={`radio-indicator w-6 h-6 rounded-full flex items-center justify-center text-on-primary transition-colors ${
                      selectedMethod === 'orange' ? 'bg-primary' : 'bg-surface-container-high'
                    }`}
                  >
                    {selectedMethod === 'orange' && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </div>
                </div>

                {selectedMethod === 'orange' && (
                  <div className="mt-space-md pt-space-xs flex flex-col gap-space-sm" onClick={(e) => e.stopPropagation()}>
                    <label className="font-label-md text-label-md text-on-surface-variant">
                      Numéro Orange Money (Burkina Faso)
                    </label>
                    <div className="flex items-center bg-surface-container-low rounded-lg px-space-md py-space-sm gap-space-sm">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">+226</span>
                      <input
                        className="bg-transparent font-headline-md text-body-lg text-on-surface flex-1 outline-none placeholder:text-outline"
                        maxLength={11}
                        placeholder="76 XX XX XX"
                        type="tel"
                        value={orangePhone}
                        onChange={(e) => setOrangePhone(e.target.value)}
                      />
                      <span className="material-symbols-outlined text-primary text-[20px]">phone_android</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">info</span>
                      Composez *144*4*6# si vous demandez un code OTP d&apos;autorisation.
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Moov Money Flooz */}
              <div
                onClick={() => setSelectedMethod('moov')}
                className={`payment-method-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-all duration-200 cursor-pointer ${
                  selectedMethod === 'moov' ? 'bg-surface-container-high/40 ring-2 ring-primary/30' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-md">
                    <div className="w-11 h-11 rounded-xl bg-surface-tint flex items-center justify-center text-white shadow-sm font-black text-[13px] tracking-tighter">
                      MOOV
                    </div>
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <span className="font-headline-md text-body-lg text-on-surface font-bold">
                          Moov Money (Flooz)
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Prompt USSD direct sur votre écran
                      </p>
                    </div>
                  </div>
                  <div
                    className={`radio-indicator w-6 h-6 rounded-full flex items-center justify-center text-on-primary transition-colors ${
                      selectedMethod === 'moov' ? 'bg-primary' : 'bg-surface-container-high'
                    }`}
                  >
                    {selectedMethod === 'moov' && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </div>
                </div>

                {selectedMethod === 'moov' && (
                  <div className="mt-space-md pt-space-xs flex flex-col gap-space-sm" onClick={(e) => e.stopPropagation()}>
                    <label className="font-label-md text-label-md text-on-surface-variant">
                      Numéro Moov Africa (+226)
                    </label>
                    <div className="flex items-center bg-surface-container-low rounded-lg px-space-md py-space-sm gap-space-sm">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">+226</span>
                      <input
                        className="bg-transparent font-headline-md text-body-lg text-on-surface flex-1 outline-none placeholder:text-outline"
                        maxLength={11}
                        placeholder="60 XX XX XX"
                        type="tel"
                        value={moovPhone}
                        onChange={(e) => setMoovPhone(e.target.value)}
                      />
                      <span className="material-symbols-outlined text-primary-container text-[20px]">sim_card</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">touch_app</span>
                      Une invite push USSD apparaîtra automatiquement pour valider votre code PIN.
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Cash / Peer Handover Mode (WhatsApp Author link) */}
              <div
                onClick={() => setSelectedMethod('in-person')}
                className={`payment-method-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-all duration-200 cursor-pointer ${
                  selectedMethod === 'in-person' ? 'bg-surface-container-high/40 ring-2 ring-primary/30' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-md">
                    <div className="w-11 h-11 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[22px]">diversity_3</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-headline-md text-body-lg text-on-surface font-bold">
                          Remise en main propre
                        </span>
                        <span className="bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded text-label-sm font-label-sm">
                          Campus
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        Échange physique ou WhatsApp direct
                      </p>
                    </div>
                  </div>
                  <div
                    className={`radio-indicator w-6 h-6 rounded-full flex items-center justify-center text-on-primary transition-colors ${
                      selectedMethod === 'in-person' ? 'bg-primary' : 'bg-surface-container-high'
                    }`}
                  >
                    {selectedMethod === 'in-person' && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </div>
                </div>

                {selectedMethod === 'in-person' && (
                  <div className="mt-space-md pt-space-xs flex flex-col gap-space-sm bg-surface-container-low p-space-md rounded-lg" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-space-sm">
                      <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0">
                        <Image
                          src={resource?.author?.profile?.avatarUrl || '/images/avatars/moussa.jpg'}
                          alt={resource?.author?.profile?.firstName || 'Auteur'}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-label-lg text-label-lg text-on-surface truncate">
                          {resource?.author?.profile?.firstName} {resource?.author?.profile?.lastName} (Auteur L3)
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Lieu habituel : {resource?.contactChannel?.physicalLocation || 'Devant Amphi A'}
                        </p>
                      </div>
                    </div>
                    <a
                      className="w-full bg-on-tertiary-container/20 text-tertiary font-label-lg text-label-lg py-2.5 rounded-lg flex items-center justify-center gap-2 active:scale-98 transition-transform"
                      href={`https://wa.me/${resource?.contactChannel?.whatsappNumber?.replace('+', '') || '22670000000'}?text=${encodeURIComponent(
                        `Bonjour, je souhaite récupérer le corrigé "${resource?.title}" en main propre.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      Écrire à {resource?.author?.profile?.firstName || "l'auteur"} sur WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

            {/* Transparent Fee Breakdown Section (Mobile only) */}
            <div className="lg:hidden">
              <FeeBreakdownCard price={price} />
            </div>

            {/* Trust & Guarantee Badges Grid (Mobile only) */}
            <div className="lg:hidden">
              <TrustBadgesCard />
            </div>

            {/* Major CTA Button Floating Anchor */}
            {!isSuccess ? (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-primary text-on-primary py-space-md rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-sm shadow-lg active:scale-98 transition-all duration-150 relative overflow-hidden group disabled:opacity-75 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="material-symbols-outlined text-[20px] text-primary-fixed animate-pulse">lock</span>
                  <span className="font-bold tracking-wide">{getCtaLabel()}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <div className="mt-space-xs text-center flex items-center justify-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                  <span className="font-body-sm text-body-sm text-[11px]">
                    Garantie de téléchargement immédiat par token signé
                  </span>
                </div>
              </div>
            ) : null}

            {/* Success Notification Sheet */}
            {isSuccess && (
              <div className="mt-2">
                <div className="bg-primary text-on-primary rounded-xl p-space-md shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[28px] text-primary-fixed">check_circle</span>
                    <div>
                      <h4 className="font-headline-md text-body-lg font-bold">Fichier débloqué avec succès !</h4>
                      <p className="font-body-sm text-body-sm text-primary-fixed">
                        Disponible dans votre bibliothèque hors-ligne.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/lecteur/${downloadToken}`}
                    className="bg-on-primary text-primary px-space-md py-1.5 rounded-lg font-label-md text-label-md font-bold shrink-0 shadow-sm hover:bg-white"
                  >
                    Ouvrir
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky desktop summary (5 cols) */}
          <aside className="hidden lg:flex lg:col-span-5 flex-col gap-6 sticky top-24 self-start">
            <ResourceSummaryCard resource={resource} />
            <FeeBreakdownCard price={price} />
            <TrustBadgesCard />
          </aside>
        </div>

        {/* Processing State Modal */}
        {isProcessing && (
          <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-md flex items-end sm:items-center justify-center p-space-md animate-fadeIn">
            <div className="bg-surface-container-lowest rounded-2xl p-space-xl w-full max-w-sm flex flex-col items-center text-center shadow-2xl relative">
              <div className="relative mb-space-md">
                <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[32px] animate-spin">sync</span>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-secondary-container text-white flex items-center justify-center text-[12px]">
                  <span className="material-symbols-outlined text-[14px]">shield</span>
                </div>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-1">
                Validation sécurisée en cours...
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
                {processingStatus}
              </p>
              <div className="w-full bg-surface-container-low rounded-full h-2 overflow-hidden mb-space-md">
                <div
                  className="bg-primary h-full transition-all duration-500 rounded-full"
                  style={{ width: progressWidth }}
                />
              </div>
              <div className="bg-surface-container-high/60 rounded-lg p-space-sm w-full flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">key</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-left truncate text-[11px]">
                  Token SHA256 : <span className="font-mono text-on-surface font-bold">{downloadToken}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PaiementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
