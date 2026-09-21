'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { validatePassword } from '@/lib/auth';
import Logo from '@/components/Logo';
import ImageUploadField from '@/components/ImageUploadField';

interface Institution {
  id: string;
  name: string;
  shortName: string;
  region?: string;
}

interface Faculty {
  id: string;
  name: string;
  code: string;
  institutionId: string;
}

interface Filiere {
  id: string;
  name: string;
  code: string;
  facultyId: string;
}

interface AcademicLevel {
  id: string;
  name: string;
  code: string;
}

const BURKINA_REGIONS = [
  'Centre (Ouagadougou)',
  'Hauts-Bassins (Bobo-Dioulasso)',
  'Centre-Ouest (Koudougou)',
  'Plateau-Central (Ziniaré)',
  'Centre-Est (Tenkodogo)',
  'Centre-Nord (Kaya)',
  'Centre-Sud (Manga)',
  'Boucle du Mouhoun (Dédougou)',
  'Est (Fada N’Gourma)',
  'Nord (Ouahigouya)',
  'Sahel (Dori)',
  'Cascades (Banfora)',
  'Sud-Ouest (Gaoua)',
];

const COUNTRIES = [
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', phoneCode: '+226' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', phoneCode: '+225' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', phoneCode: '+223' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', phoneCode: '+221' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', phoneCode: '+227' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', phoneCode: '+228' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯', phoneCode: '+229' },
  { code: 'FR', name: 'France', flag: '🇫🇷', phoneCode: '+33' },
];

export default function RegisterPage() {
  const router = useRouter();

  // Form Fields
  const [ine, setIne] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  // Academic & Geographic
  const [countryCode, setCountryCode] = useState('BF');
  const [region, setRegion] = useState('Centre (Ouagadougou)');
  const [institutionId, setInstitutionId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [academicLevelId, setAcademicLevelId] = useState('');
  const [filiere, setFiliere] = useState('');
  const [address, setAddress] = useState('');

  // Dropdown options from DB
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [academicLevels, setAcademicLevels] = useState<AcademicLevel[]>([]);

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpPreview, setOtpPreview] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // Status & UI
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load DB options
  useEffect(() => {
    Promise.all([
      fetch('/api/v1/academic/institutions').then((r) => r.json()),
      fetch('/api/v1/academic/levels').then((r) => r.json()),
    ])
      .then(([instData, levelData]) => {
        if (instData.success && instData.institutions?.length > 0) {
          setInstitutions(instData.institutions);
          setInstitutionId(instData.institutions[0].id);
        }
        if (levelData.success && levelData.levels?.length > 0) {
          setAcademicLevels(levelData.levels);
          setAcademicLevelId(levelData.levels[0].id);
        }
      })
      .catch((err) => console.error('Error fetching academic options:', err));
  }, []);

  // Cascading faculties when institution changes
  useEffect(() => {
    if (!institutionId) return;
    fetch(`/api/v1/academic/faculties?institutionId=${institutionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.faculties) {
          setFaculties(data.faculties);
          if (data.faculties.length > 0) {
            setFacultyId(data.faculties[0].id);
          } else {
            setFacultyId('');
          }
        }
      })
      .catch((err) => console.error('Error fetching faculties:', err));
  }, [institutionId]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtpModal && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, otpTimer]);

  // Real-time password validation
  const passwordResult = validatePassword(password);
  const passwordsMatch = Boolean(password && confirmPassword && password === confirmPassword);
  const confirmationHasError = Boolean(confirmPassword && password !== confirmPassword);

  // Submit Registration Form
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Strict validation checks
    if (!ine.trim()) {
      setErrorMsg("L'Identifiant National de l'Étudiant (INE) est obligatoire.");
      return;
    }
    if (!passwordResult.isValid) {
      setErrorMsg('Mot de passe invalide : L’ensemble des 7 critères de sécurité est strictement obligatoire.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Validation bloquante : La confirmation du mot de passe ne correspond pas.');
      return;
    }

    setLoading(true);

    try {
      const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
      const fullPhone = phone.startsWith('+') ? phone : `${selectedCountry.phoneCode}${phone.replace(/\s+/g, '')}`;

      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ine: ine.trim().toUpperCase(),
          firstName,
          lastName,
          email,
          phoneNumber: fullPhone,
          password,
          countryCode,
          region,
          institutionId,
          facultyId,
          academicLevelId,
          filiere,
          address,
          avatarUrl: avatarUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Échec de l'inscription.");
      }

      setOtpPreview(data.otpPreview || null);
      setShowOtpModal(true);
      setOtpTimer(60);
      setCanResendOtp(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP Verification Code
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg('Veuillez saisir le code à 6 chiffres reçu par email.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Code invalide.');
      }

      setSuccessMsg('Compte vérifié avec succès ! Redirection vers Campus Folder...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Code de vérification invalide.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Échec du renvoi.');

      setOtpPreview(data.otpPreview || null);
      setOtpTimer(60);
      setCanResendOtp(false);
      setSuccessMsg('Nouveau code envoyé par email.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors du renvoi de l'OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface flex flex-col min-h-screen relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-primary/10 via-secondary/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="fixed top-0 w-full z-40 pt-safe bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/60">
        <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-space-sm max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Retour"
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} showWordmark={false} />
              <span className="font-extrabold text-base tracking-tight text-on-surface">Campus Folder</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/30 border border-primary/20 text-primary text-[11px] font-bold">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>SSL 256 bits</span>
            </div>
            <Link
              href="/connexion"
              className="text-xs font-bold text-primary hover:text-primary-container transition-colors py-1.5 px-3.5 rounded-full bg-surface-container hover:bg-surface-container-high"
            >
              Connexion
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Form with Double Card Effect */}
      <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-safe px-4 sm:px-6">
        <div className="w-full max-w-2xl mx-auto py-6 sm:py-10">
          {/* Header Title & Accreditations */}
          <div className="mb-6 sm:mb-8 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-fixed/40 border border-primary/20 text-primary text-xs font-bold mb-3 shadow-xs">
              <span className="text-sm">🇧🇫</span>
              <span>Espace Universitaire Officiel du Burkina Faso</span>
            </div>
            <h1 className="font-black text-2xl sm:text-3xl text-on-surface tracking-tight leading-tight">
              Créer votre Compte Étudiant
            </h1>
            <p className="text-on-surface-variant text-xs sm:text-sm mt-1.5 max-w-lg">
              Rejoignez votre communauté amphi (UJKZ, UTS, UNB, USTA, 2iE...) et sécurisez vos devoirs, corrigés et royalties.
            </p>

            {/* Segmented control: Inscription vs Connexion */}
            <div className="mt-5 p-1 bg-surface-container-low rounded-2xl border border-outline-variant/30 flex items-center w-full max-w-xs shadow-xs">
              <span className="flex-1 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold text-center shadow-xs">
                Inscription
              </span>
              <Link
                href="/connexion"
                className="flex-1 py-1.5 rounded-xl text-on-surface-variant hover:text-on-surface text-xs font-bold text-center transition-colors"
              >
                Connexion
              </Link>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-5 p-4 bg-error-container text-on-error-container rounded-2xl text-xs sm:text-sm flex items-start gap-3 shadow-sm border border-error/20">
              <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
              <span className="flex-1 font-semibold leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-4 bg-primary-fixed/60 text-primary rounded-2xl text-xs sm:text-sm flex items-center gap-3 shadow-sm border border-primary/20">
              <span className="material-symbols-outlined text-[20px] text-primary shrink-0">check_circle</span>
              <span className="flex-1 font-bold">{successMsg}</span>
            </div>
          )}

          {/* DOUBLE CARD CONTAINER */}
          <div className="relative group">
            {/* Background decorative layered shadow card */}
            <div className="absolute -inset-1 rounded-[30px] bg-gradient-to-br from-primary/20 via-secondary/15 to-primary/10 blur-lg opacity-70 transition duration-500" />
            <div className="absolute inset-0 rounded-[28px] bg-surface-container-high/30 rotate-0.5 pointer-events-none" />

            {/* Front main card */}
            <div className="relative bg-surface-container-lowest rounded-[28px] p-5 sm:p-8 shadow-xl border border-outline-variant/40">
              <form onSubmit={handleRegister} className="flex flex-col gap-6">

                {/* 1. SECTION IDENTIFIANT NATIONAL ÉTUDIANT (INE) - OBLIGATOIRE */}
                <section aria-labelledby="sec-ine" className="p-4 sm:p-5 rounded-2xl bg-surface-container-low/70 border border-primary/30 relative flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center text-xs shadow-xs">
                        <span className="material-symbols-outlined text-[16px]">badge</span>
                      </span>
                      <h2 id="sec-ine" className="font-extrabold text-sm text-on-surface">
                        1. Identifiant National de l'Étudiant (INE) *
                      </h2>
                    </div>
                    <span className="bg-[#EA580C] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                      Strictement Requis
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    L'INE officiel burkinabè est indispensable pour authentifier votre cursus universitaire et débloquer les compensations financières.
                  </p>
                  <div className="flex items-center bg-surface-container-lowest rounded-xl px-3.5 py-2.5 border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-xs">
                    <span className="font-mono text-xs font-black text-primary mr-2 uppercase bg-primary-fixed/40 px-2 py-0.5 rounded">
                      INE BF
                    </span>
                    <input
                      id="ine"
                      type="text"
                      required
                      placeholder="Ex: N0123456789 ou 20230198"
                      value={ine}
                      onChange={(e) => setIne(e.target.value.toUpperCase())}
                      className="w-full bg-transparent text-on-surface text-xs sm:text-sm font-mono font-black outline-none placeholder:text-outline uppercase"
                    />
                    {ine.length >= 8 && (
                      <span className="material-symbols-outlined text-[20px] text-[#10B981] animate-bounce">
                        verified
                      </span>
                    )}
                  </div>
                </section>

                {/* 2. SECTION INFORMATIONS PERSONNELLES */}
                <section aria-labelledby="sec-personal" className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-xs">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                    </span>
                    <h2 id="sec-personal" className="font-extrabold text-sm text-on-surface">
                      2. Identité & Téléphone Mobile
                    </h2>
                  </div>

                  {/* Photo de Profil / Carte Étudiant */}
                  <ImageUploadField
                    label="Photo de Profil / Visage Étudiant (Optionnel)"
                    hint="Chargez un fichier ou prenez une photo en direct (redimensionnement automatique)"
                    value={avatarUrl}
                    onChange={(url) => setAvatarUrl(url)}
                    folder="avatars"
                    shape="circle"
                    cropToSquare={true}
                    defaultMaxDimension={512}
                    modalTitle="Photo de Profil / Carte Étudiant"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Prénom(s) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Aminata"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none border border-outline-variant/30 focus:border-primary focus:bg-surface-container-lowest transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Nom de famille *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: SANOGO"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none border border-outline-variant/30 focus:border-primary focus:bg-surface-container-lowest transition-all uppercase"
                      />
                    </div>
                  </div>

                  {/* Phone with Country Code */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Numéro Mobile (Paiement Orange Money / Moov Money) *
                    </label>
                    <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-outline-variant/30 focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
                      <div className="flex items-center gap-1.5 pr-2.5 border-r border-outline-variant/40 mr-2.5">
                        <span className="text-base">🇧🇫</span>
                        <span className="text-xs font-black font-mono text-on-surface">+226</span>
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="76 45 88 12"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-transparent text-xs sm:text-sm font-bold outline-none placeholder:text-outline"
                      />
                    </div>
                  </div>
                </section>

                {/* 3. SECTION EMAIL ET MOT DE PASSE HYPER-SÉCURISÉ */}
                <section aria-labelledby="sec-security" className="flex flex-col gap-3 pt-2 border-t border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-xs">
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                    </span>
                    <h2 id="sec-security" className="font-extrabold text-sm text-on-surface">
                      3. Authentification & Sécurité Rigoureuse
                    </h2>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Email étudiant valide * (Le code de vérification OTP y est envoyé)
                    </label>
                    <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 border border-outline-variant/30 focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
                      <span className="material-symbols-outlined text-outline text-[18px] mr-2">mail</span>
                      <input
                        type="email"
                        required
                        placeholder="etudiant@ujkz.bf ou perso@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-none placeholder:text-outline"
                      />
                    </div>
                  </div>

                  {/* Password Input with Strict Invalid / Valid Indicator */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-on-surface-variant">
                        Définir un Mot de passe fort *
                      </label>

                      {/* STRICT VALIDATION BADGE: Invalide if ANY criterion fails */}
                      {password.length === 0 ? (
                        <span className="text-[10px] font-bold text-outline uppercase bg-surface-container px-2 py-0.5 rounded-full">
                          En attente de saisie
                        </span>
                      ) : !passwordResult.isValid ? (
                        <span className="text-[10px] font-black text-error bg-error/10 border border-error/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-error" />
                          <span>NON CONFORME (Invalide)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          <span>CONFORME & HYPER-SÉCURISÉ</span>
                        </span>
                      )}
                    </div>

                    <div className={`flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 border transition-all ${
                      password.length > 0 && !passwordResult.isValid
                        ? 'border-error/50 focus-within:border-error focus-within:ring-2 focus-within:ring-error/20'
                        : passwordResult.isValid
                        ? 'border-[#10B981] focus-within:ring-2 focus-within:ring-[#10B981]/20'
                        : 'border-outline-variant/30 focus-within:border-primary'
                    }`}>
                      <span className="material-symbols-outlined text-outline text-[18px] mr-2">key</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Ex: Kours@Burkina2025!"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent text-xs sm:text-sm outline-none placeholder:text-outline font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Afficher le mot de passe"
                        className="text-on-surface-variant hover:text-on-surface p-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>

                    {/* STRICT REAL-TIME CRITERIA CHECKLIST (Color-coded) */}
                    <div className="mt-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-on-surface">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-primary">security</span>
                          <span>7 Critères Obligatoires (Chacun est éliminatoire) :</span>
                        </span>
                        <span className="font-mono text-xs">
                          {Object.values(passwordResult.criteria).filter(Boolean).length}/7
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                        {/* 1. Min Length */}
                        <div className={`flex items-center gap-1.5 p-1 rounded-lg transition-colors ${
                          passwordResult.criteria.minLength
                            ? 'text-[#10B981] font-bold bg-[#10B981]/5'
                            : password.length > 0
                            ? 'text-error font-semibold bg-error/5'
                            : 'text-on-surface-variant'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {passwordResult.criteria.minLength ? 'check_circle' : password.length > 0 ? 'cancel' : 'radio_button_unchecked'}
                          </span>
                          <span>Au moins 8 caractères</span>
                        </div>

                        {/* 2. No repeats */}
                        <div className={`flex items-center gap-1.5 p-1 rounded-lg transition-colors ${
                          passwordResult.criteria.noConsecutiveRepeats
                            ? 'text-[#10B981] font-bold bg-[#10B981]/5'
                            : password.length > 0
                            ? 'text-error font-semibold bg-error/5'
                            : 'text-on-surface-variant'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {passwordResult.criteria.noConsecutiveRepeats ? 'check_circle' : password.length > 0 ? 'cancel' : 'radio_button_unchecked'}
                          </span>
                          <span>Zéro répétition (aa, 11 interdit)</span>
                        </div>

                        {/* 3. Uppercase */}
                        <div className={`flex items-center gap-1.5 p-1 rounded-lg transition-colors ${
                          passwordResult.criteria.hasUppercase
                            ? 'text-[#10B981] font-bold bg-[#10B981]/5'
                            : password.length > 0
                            ? 'text-error font-semibold bg-error/5'
                            : 'text-on-surface-variant'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {passwordResult.criteria.hasUppercase ? 'check_circle' : password.length > 0 ? 'cancel' : 'radio_button_unchecked'}
                          </span>
                          <span>1 Lettre majuscule (A-Z)</span>
                        </div>

                        {/* 4. Lowercase */}
                        <div className={`flex items-center gap-1.5 p-1 rounded-lg transition-colors ${
                          passwordResult.criteria.hasLowercase
                            ? 'text-[#10B981] font-bold bg-[#10B981]/5'
                            : password.length > 0
                            ? 'text-error font-semibold bg-error/5'
                            : 'text-on-surface-variant'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {passwordResult.criteria.hasLowercase ? 'check_circle' : password.length > 0 ? 'cancel' : 'radio_button_unchecked'}
                          </span>
                          <span>1 Lettre minuscule (a-z)</span>
                        </div>

                        {/* 5. Number */}
                        <div className={`flex items-center gap-1.5 p-1 rounded-lg transition-colors ${
                          passwordResult.criteria.hasNumber
                            ? 'text-[#10B981] font-bold bg-[#10B981]/5'
                            : password.length > 0
                            ? 'text-error font-semibold bg-error/5'
                            : 'text-on-surface-variant'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {passwordResult.criteria.hasNumber ? 'check_circle' : password.length > 0 ? 'cancel' : 'radio_button_unchecked'}
                          </span>
                          <span>Au moins 1 chiffre (0-9)</span>
                        </div>

                        {/* 6. Special Char */}
                        <div className={`flex items-center gap-1.5 p-1 rounded-lg transition-colors ${
                          passwordResult.criteria.hasSpecialChar
                            ? 'text-[#10B981] font-bold bg-[#10B981]/5'
                            : password.length > 0
                            ? 'text-error font-semibold bg-error/5'
                            : 'text-on-surface-variant'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {passwordResult.criteria.hasSpecialChar ? 'check_circle' : password.length > 0 ? 'cancel' : 'radio_button_unchecked'}
                          </span>
                          <span>1 Caractère spécial (!@#$%...)</span>
                        </div>

                        {/* 7. No Spaces */}
                        <div className={`flex items-center gap-1.5 p-1 rounded-lg col-span-1 sm:col-span-2 transition-colors ${
                          passwordResult.criteria.noSpaces
                            ? 'text-[#10B981] font-bold bg-[#10B981]/5'
                            : 'text-error font-semibold bg-error/5'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {passwordResult.criteria.noSpaces ? 'check_circle' : 'cancel'}
                          </span>
                          <span>Zéro espace autorisé (aucun blanc)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DEUXIÈME CHAMP STRICTEMENT BLOQUANT : CONFIRMATION */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Confirmer le mot de passe (Champ Bloquant) *
                    </label>

                    <div className={`flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 border transition-all ${
                      confirmationHasError
                        ? 'border-error bg-error/5 focus-within:ring-2 focus-within:ring-error/20'
                        : passwordsMatch
                        ? 'border-[#10B981] bg-[#10B981]/5 focus-within:ring-2 focus-within:ring-[#10B981]/20'
                        : 'border-outline-variant/30 focus-within:border-primary'
                    }`}>
                      <span className="material-symbols-outlined text-outline text-[18px] mr-2">lock_clock</span>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        disabled={!passwordResult.isValid}
                        placeholder={!passwordResult.isValid ? "Définissez d'abord un mot de passe valide ci-dessus" : "Répétez exactement le mot de passe"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-transparent text-xs sm:text-sm outline-none placeholder:text-outline font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label="Afficher la confirmation"
                        className="text-on-surface-variant hover:text-on-surface p-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>

                    {/* Confirmation Status Feedback */}
                    {confirmPassword.length > 0 && (
                      <div className="mt-1.5">
                        {passwordsMatch ? (
                          <div className="p-2 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-center gap-1.5 text-[#10B981] text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            <span>Confirmation parfaite : Les deux mots de passe sont identiques.</span>
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-error/10 border border-error/30 flex items-center gap-1.5 text-error text-xs font-bold animate-shake">
                            <span className="material-symbols-outlined text-[16px]">block</span>
                            <span>Validation bloquante : Les deux mots de passe ne correspondent pas.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* 4. SECTION ACADÉMIQUE & GÉOGRAPHIQUE */}
                <section aria-labelledby="sec-academic" className="flex flex-col gap-3 pt-2 border-t border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-xs">
                      <span className="material-symbols-outlined text-[16px]">school</span>
                    </span>
                    <h2 id="sec-academic" className="font-extrabold text-sm text-on-surface">
                      4. Cursus Universitaire au Burkina Faso
                    </h2>
                  </div>

                  {/* Pays & Région */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Pays de résidence *
                      </label>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none border border-outline-variant/30 focus:border-primary"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Région administrative BF *
                      </label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none border border-outline-variant/30 focus:border-primary"
                      >
                        {BURKINA_REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Établissement / Université */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      Campus / Université d'appartenance *
                    </label>
                    <select
                      value={institutionId}
                      onChange={(e) => setInstitutionId(e.target.value)}
                      className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none border border-outline-variant/30 focus:border-primary"
                    >
                      {institutions.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} ({inst.shortName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* UFR / Faculté & Niveau */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        UFR / Faculté de rattachement *
                      </label>
                      <select
                        value={facultyId}
                        onChange={(e) => setFacultyId(e.target.value)}
                        className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none border border-outline-variant/30 focus:border-primary"
                      >
                        {faculties.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.code.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Promotion / Niveau d'études *
                      </label>
                      <select
                        value={academicLevelId}
                        onChange={(e) => setAcademicLevelId(e.target.value)}
                        className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none border border-outline-variant/30 focus:border-primary"
                      >
                        {academicLevels.map((lvl) => (
                          <option key={lvl.id} value={lvl.id}>
                            {lvl.code} ({lvl.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Filière & Adresse */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Filière & Spécialité *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Droit Public, Sciences Éco..."
                        value={filiere}
                        onChange={(e) => setFiliere(e.target.value)}
                        className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none border border-outline-variant/30 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Résidence étudiante / Adresse *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Cité Kossodo, Ouaga 2000, Amphi A"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none border border-outline-variant/30 focus:border-primary"
                      />
                    </div>
                  </div>
                </section>

                {/* SUBMIT BUTTON WITH STRICT BLOCKING LOGIC */}
                <div className="flex flex-col gap-3 pt-3 border-t border-outline-variant/20">
                  <p className="text-xs text-on-surface-variant text-center leading-relaxed">
                    En validant votre inscription, vous certifiez l'authenticité de votre INE et adhérez à la{' '}
                    <Link href="#" className="text-primary font-bold underline">
                      Charte Académique Anti-Spéculation v2.1
                    </Link>.
                  </p>

                  <button
                    type="submit"
                    disabled={loading || !passwordResult.isValid || !passwordsMatch || !ine.trim()}
                    className={`w-full py-4 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                      loading || !passwordResult.isValid || !passwordsMatch || !ine.trim()
                        ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed opacity-60'
                        : 'bg-primary text-on-primary hover:bg-primary/90 active:scale-98 shadow-lg'
                    }`}
                  >
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined text-[20px] animate-spin">
                          autorenew
                        </span>
                        <span>Traitement sécurisé en cours...</span>
                      </>
                    ) : !ine.trim() ? (
                      <>
                        <span className="material-symbols-outlined text-[20px]">badge</span>
                        <span>Veuillez renseigner votre INE (Obligatoire)</span>
                      </>
                    ) : !passwordResult.isValid ? (
                      <>
                        <span className="material-symbols-outlined text-[20px]">lock_clock</span>
                        <span>Mot de passe non conforme (Bloqué)</span>
                      </>
                    ) : !passwordsMatch ? (
                      <>
                        <span className="material-symbols-outlined text-[20px]">block</span>
                        <span>Confirmation non concordante (Bloqué)</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">send</span>
                        <span>Recevoir mon Code de Vérification OTP</span>
                      </>
                    )}
                  </button>

                  <div className="text-center mt-2">
                    <p className="text-xs text-on-surface-variant">
                      Vous possédez déjà un compte étudiant ?{' '}
                      <Link href="/connexion" className="text-primary font-black underline hover:text-primary-container">
                        Connectez-vous ici
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* OTP VERIFICATION MODAL */}
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 text-center animate-scale-up">
              <div className="w-16 h-16 rounded-2xl bg-primary-fixed/50 text-primary mx-auto flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-3xl">mark_email_read</span>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="font-black text-xl text-on-surface">
                  Vérification de votre Email
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Un code de sécurité à 6 chiffres a été envoyé à{' '}
                  <strong className="text-on-surface font-mono">{email}</strong>
                </p>
              </div>

              {/* Demo Preview Badge */}
              {otpPreview && (
                <div className="p-3 bg-secondary-fixed/30 text-on-secondary-fixed-variant rounded-xl text-xs font-bold flex items-center justify-between">
                  <span>Code OTP de test :</span>
                  <span className="font-mono text-sm tracking-widest text-secondary font-black">
                    {otpPreview}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2 my-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full h-14 text-center font-mono text-2xl font-black tracking-[0.5em] rounded-2xl bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otpCode.length !== 6}
                className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-md active:scale-98 transition-all disabled:opacity-50"
              >
                {loading ? 'Vérification en cours...' : 'Valider & Activer mon Compte'}
              </button>

              <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2">
                <span>Vous n'avez rien reçu ?</span>
                {canResendOtp ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-primary font-bold underline"
                  >
                    Renvoyer le code
                  </button>
                ) : (
                  <span className="font-mono text-outline">
                    Renvoyer dans {otpTimer}s
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
