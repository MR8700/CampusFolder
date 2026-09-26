'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { validatePassword, validateIne } from '@/lib/auth';
import Logo from '@/components/Logo';
import ImageUploadField from '@/components/ImageUploadField';
import Icon from '@/components/ui/Icon';

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

interface AcademicLevel {
  id: string;
  name?: string;
  label?: string;
  code: string;
}

const PROFILES = [
  {
    type: 'STUDENT',
    title: 'Étudiant',
    badge: 'Université BF',
    icon: 'school',
    desc: 'Accès amphi, cours, corrigés, examens et TD avec INE officiel',
    isStudent: true,
  },
  {
    type: 'TEACHER',
    title: 'Enseignant',
    badge: 'Pédagogie',
    icon: 'history_edu',
    desc: 'Partage de cours, travaux dirigés et supports académiques',
    isStudent: false,
  },
  {
    type: 'TRAINER',
    title: 'Formateur',
    badge: 'Ateliers & Pro',
    icon: 'workspace_premium',
    desc: 'Ateliers pratiques, certifications et modules métiers',
    isStudent: false,
  },
  {
    type: 'PROFESSIONAL',
    title: 'Professionnel',
    badge: 'Concours & Carrière',
    icon: 'work',
    desc: 'Préparation aux concours d’État, mémoires et documentation',
    isStudent: false,
  },
  {
    type: 'CONTRIBUTOR',
    title: 'Contributeur',
    badge: 'Partage & Annales',
    icon: 'edit_note',
    desc: 'Partage libre ou rémunéré de synthèses, fiches et annales',
    isStudent: false,
  },
  {
    type: 'OTHER',
    title: 'Grand Public',
    badge: 'Consultation',
    icon: 'public',
    desc: 'Accès aux ressources et documents ouverts à toute la communauté',
    isStudent: false,
  },
];

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

  // Profile Type: STUDENT, TEACHER, TRAINER, PROFESSIONAL, CONTRIBUTOR, OTHER
  const [profileType, setProfileType] = useState('STUDENT');
  const isStudent = profileType === 'STUDENT';

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
  const [profession, setProfession] = useState('');
  const [organization, setOrganization] = useState('');
  const [bio, setBio] = useState('');

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

  // Submit Registration Form
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Strict validation checks
    if (isStudent) {
      if (!ine.trim()) {
        setErrorMsg("L'Identifiant National de l'Étudiant (INE) est obligatoire pour les étudiants burkinabés.");
        return;
      }
      const ineValidation = validateIne(ine);
      if (!ineValidation.isValid) {
        setErrorMsg(ineValidation.message || "Format d'INE invalide.");
        return;
      }
    }

    if (!passwordResult.isValid) {
      setErrorMsg('Mot de passe trop faible : respectez les 7 critères de sécurité indiqués.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('La confirmation du mot de passe ne correspond pas.');
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
          accountType: isStudent ? 'STUDENT' : 'GENERAL',
          profileType,
          ine: isStudent ? ine.trim().toUpperCase() : undefined,
          firstName,
          lastName,
          email,
          phoneNumber: fullPhone,
          password,
          countryCode,
          region,
          profession: !isStudent ? profession : undefined,
          bio: !isStudent ? bio : undefined,
          address: !isStudent ? (organization || address) : address,
          institutionId: isStudent ? institutionId : undefined,
          facultyId: isStudent ? facultyId : undefined,
          academicLevelId: isStudent ? academicLevelId : undefined,
          filiere: isStudent ? filiere : undefined,
          avatarUrl: avatarUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Échec de l'inscription.");
      }

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
      setErrorMsg('Veuillez saisir le code à 6 chiffres reçu dans votre boîte email.');
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
        throw new Error(data.error || 'Code invalide ou expiré.');
      }

      setSuccessMsg('Compte vérifié avec succès ! Redirection vers Campus Folder...');
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Code de vérification incorrect.');
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

      setOtpTimer(60);
      setCanResendOtp(false);
      setSuccessMsg('Un nouveau code de vérification a été envoyé à votre adresse email.');
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
              <Icon name="arrow_back" size={22} />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} showWordmark={false} />
              <span className="font-extrabold text-base tracking-tight text-on-surface">Campus Folder</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/30 border border-primary/20 text-primary text-[11px] font-bold">
              <Icon name="lock" size={14} />
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

      {/* Main Content Form */}
      <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-safe px-4 sm:px-6">
        <div className="w-full max-w-2xl mx-auto py-6 sm:py-10">
          {/* Header Title */}
          <div className="mb-6 sm:mb-8 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-fixed/40 border border-primary/20 text-primary text-xs font-bold mb-3 shadow-xs">
              <span className="text-sm">🇧🇫</span>
              <span>Plateforme Académique & de Partage du Burkina Faso</span>
            </div>
            <h1 className="font-black text-2xl sm:text-3xl text-on-surface tracking-tight leading-tight">
              Parlez-nous un peu de vous
            </h1>
            <p className="text-on-surface-variant text-xs sm:text-sm mt-1.5 max-w-lg">
              Rejoignez Campus Folder pour accéder, partager ou publier des cours, corrigés, mémoires et ressources utiles.
            </p>

            {/* Profile Selection - 6 Human Choices */}
            <div className="mt-5 w-full">
              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 text-left sm:text-center">
                Quel profil vous correspond ?
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
                {PROFILES.map((p) => {
                  const isSelected = profileType === p.type;
                  return (
                    <button
                      key={p.type}
                      type="button"
                      onClick={() => setProfileType(p.type)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/40'
                          : 'border-outline-variant/40 bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface'
                          }`}
                        >
                          <Icon name={p.icon} size={20} />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-lowest text-on-surface-variant border border-outline-variant/20">
                          {p.badge}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-black text-on-surface flex items-center gap-1">
                          <span>{p.title}</span>
                          {isSelected && <span className="text-primary text-[10px]">✓</span>}
                        </div>
                        <div className="text-[10px] text-on-surface-variant line-clamp-2 mt-0.5 leading-tight">
                          {p.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-2xl text-xs sm:text-sm flex items-start gap-3 shadow-sm border border-error/20 animate-shake">
              <Icon name="error" size={20} className="text-error shrink-0" />
              <span className="flex-1 font-semibold leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-primary-fixed/60 text-primary rounded-2xl text-xs sm:text-sm flex items-center gap-3 shadow-sm border border-primary/20">
              <Icon name="check_circle" size={20} className="text-primary shrink-0" />
              <span className="flex-1 font-bold">{successMsg}</span>
            </div>
          )}

          {/* FORM CARD */}
          <div className="relative bg-surface-container-lowest rounded-[28px] p-6 sm:p-8 shadow-xl border border-outline-variant/40">
            <form onSubmit={handleRegister} className="flex flex-col gap-5">
              {/* Profile Photo */}
              <div className="flex flex-col items-center justify-center pb-2">
                <ImageUploadField
                  label="Photo de profil (Optionnel)"
                  folder="avatars"
                  shape="circle"
                  value={avatarUrl}
                  onChange={(url) => setAvatarUrl(url)}
                />
              </div>

              {/* INE Section (Only for STUDENT) */}
              {isStudent && (
                <div className="p-4 rounded-2xl bg-primary-fixed/20 border border-primary/25 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-primary flex items-center gap-1.5">
                      <Icon name="verified" size={16} />
                      <span>Identifiant National de l'Étudiant (INE) *</span>
                    </label>
                    <span className="text-[10px] font-mono font-bold bg-primary text-on-primary px-2 py-0.5 rounded">
                      Obligatoire BF
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    Votre numéro INE officiel (ex: N0145892301) vous identifie auprès de votre université et débloque les cours réservés aux étudiants burkinabés.
                  </p>
                  <div className="flex items-center bg-surface-container-lowest rounded-xl px-3.5 py-2.5 border border-primary/30 focus-within:border-primary transition-all">
                    <Icon name="badge" size={18} className="text-primary mr-2" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: N0145892301"
                      value={ine}
                      onChange={(e) => setIne(e.target.value.toUpperCase())}
                      className="w-full bg-transparent text-xs sm:text-sm font-bold uppercase tracking-wider outline-none placeholder:text-outline font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Prénom *</label>
                  <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 border border-outline-variant/30 focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
                    <input
                      type="text"
                      required
                      placeholder="Ex: Aminata"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-none placeholder:text-outline"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Nom de famille *</label>
                  <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 border border-outline-variant/30 focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
                    <input
                      type="text"
                      required
                      placeholder="Ex: Sawadogo"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-none placeholder:text-outline"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Email (Personnel ou Pro) *</label>
                  <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 border border-outline-variant/30 focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
                    <Icon name="mail" size={18} className="text-outline mr-2" />
                    <input
                      type="email"
                      required
                      placeholder="votre-email@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-none placeholder:text-outline"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Téléphone *</label>
                  <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 border border-outline-variant/30 focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
                    <span className="text-xs font-bold text-on-surface mr-2">+226</span>
                    <input
                      type="tel"
                      required
                      placeholder="70 12 34 56"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-none placeholder:text-outline"
                    />
                  </div>
                </div>
              </div>

              {/* Profile fields for Non-Students */}
              {!isStudent && (
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3.5">
                  <div className="text-xs font-black text-on-surface flex items-center gap-1.5">
                    <Icon name="work" size={16} className="text-primary" />
                    <span>Informations Professionnelles ou Publiques</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Profession ou Titre
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Enseignant, Formateur, Cadre, Auteur"
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="w-full bg-surface-container-lowest text-xs font-semibold rounded-xl p-2.5 border border-outline-variant/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Organisation ou Ville
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Ouagadougou, Cabinet Alpha, Lycée..."
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="w-full bg-surface-container-lowest text-xs font-semibold rounded-xl p-2.5 border border-outline-variant/40 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                      Courte présentation (Bio) <span className="text-outline font-normal">(Optionnel)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Passionné par la transmission des savoirs et le partage de ressources utiles..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-surface-container-lowest text-xs font-semibold rounded-xl p-2.5 border border-outline-variant/40 outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Academic dropdowns (Only for STUDENT) */}
              {isStudent && (
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
                  <div className="text-xs font-black text-on-surface flex items-center gap-1.5">
                    <Icon name="apartment" size={16} className="text-primary" />
                    <span>Établissement & Cursus Universitaire</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Université *</label>
                      <select
                        value={institutionId}
                        onChange={(e) => setInstitutionId(e.target.value)}
                        className="w-full bg-surface-container-lowest text-xs font-semibold rounded-xl p-2.5 border border-outline-variant/40 outline-none"
                      >
                        {institutions.map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.shortName} ({inst.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">UFR / Faculté *</label>
                      <select
                        value={facultyId}
                        onChange={(e) => setFacultyId(e.target.value)}
                        className="w-full bg-surface-container-lowest text-xs font-semibold rounded-xl p-2.5 border border-outline-variant/40 outline-none"
                      >
                        {faculties.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Filière / Module</label>
                      <input
                        type="text"
                        placeholder="Ex: SEG, Droit Privé, Informatique"
                        value={filiere}
                        onChange={(e) => setFiliere(e.target.value)}
                        className="w-full bg-surface-container-lowest text-xs font-semibold rounded-xl p-2.5 border border-outline-variant/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Niveau *</label>
                      <select
                        value={academicLevelId}
                        onChange={(e) => setAcademicLevelId(e.target.value)}
                        className="w-full bg-surface-container-lowest text-xs font-semibold rounded-xl p-2.5 border border-outline-variant/40 outline-none"
                      >
                        {academicLevels.map((lvl) => (
                          <option key={lvl.id} value={lvl.id}>
                            {lvl.label || lvl.name || lvl.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Mot de passe *</label>
                  <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 border border-outline-variant/30 focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
                    <Icon name="lock" size={18} className="text-outline mr-2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-on-surface-variant hover:text-on-surface p-1"
                    >
                      <Icon name="visibility" size={18} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Confirmer le mot de passe *</label>
                  <div className="flex items-center bg-surface-container-low rounded-xl px-3.5 py-2.5 border border-outline-variant/30 focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
                    <Icon name="lock" size={18} className="text-outline mr-2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-on-surface-variant hover:text-on-surface p-1"
                    >
                      <Icon name="visibility" size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Password criteria display */}
              {password && (
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-on-surface-variant">Sécurité du mot de passe :</span>
                    <span className={`font-black ${passwordResult.isValid ? 'text-primary' : 'text-error'}`}>
                      {passwordResult.score}% {passwordResult.isValid ? '✓ Valide' : '(Incomplet)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <span className={passwordResult.criteria.minLength ? 'text-primary font-bold' : 'text-outline'}>
                      {passwordResult.criteria.minLength ? '✓' : '•'} 8+ caractères
                    </span>
                    <span className={passwordResult.criteria.hasUppercase ? 'text-primary font-bold' : 'text-outline'}>
                      {passwordResult.criteria.hasUppercase ? '✓' : '•'} 1 Majuscule
                    </span>
                    <span className={passwordResult.criteria.hasLowercase ? 'text-primary font-bold' : 'text-outline'}>
                      {passwordResult.criteria.hasLowercase ? '✓' : '•'} 1 Minuscule
                    </span>
                    <span className={passwordResult.criteria.hasNumber ? 'text-primary font-bold' : 'text-outline'}>
                      {passwordResult.criteria.hasNumber ? '✓' : '•'} 1 Chiffre
                    </span>
                    <span className={passwordResult.criteria.hasSpecialChar ? 'text-primary font-bold' : 'text-outline'}>
                      {passwordResult.criteria.hasSpecialChar ? '✓' : '•'} 1 Caractère spécial
                    </span>
                    <span className={passwordResult.criteria.noConsecutiveRepeats ? 'text-primary font-bold' : 'text-outline'}>
                      {passwordResult.criteria.noConsecutiveRepeats ? '✓' : '•'} Pas de doublons (aa, 11)
                    </span>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !firstName || !lastName || !email || !phone || !password || !passwordsMatch || !passwordResult.isValid}
                className="mt-2 w-full py-4 rounded-2xl bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-md hover:bg-primary/90 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Icon name="autorenew" size={18} className="animate-spin" />
                    <span>Création du compte en cours...</span>
                  </>
                ) : (
                  <>
                    <Icon name="how_to_reg" size={18} />
                    <span>S'inscrire et Recevoir mon Code de Vérification</span>
                  </>
                )}
              </button>

              <div className="text-center text-xs text-on-surface-variant pt-2">
                <span>Vous avez déjà un compte ? </span>
                <Link href="/connexion" className="text-primary font-bold hover:underline">
                  Se connecter
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-outline-variant/40 flex flex-col gap-4">
            <div className="text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed/40 text-primary flex items-center justify-center mb-2 shadow-xs">
                <Icon name="mark_email_read" size={24} />
              </div>
              <h3 className="font-black text-xl text-on-surface">Vérification de votre Email</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Un code à 6 chiffres a été envoyé à <strong>{email}</strong>.
              </p>
            </div>

            <div className="my-2">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 rounded-2xl bg-surface-container border border-primary/30 focus:border-primary outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3.5 rounded-2xl bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-md hover:bg-primary/90 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Icon name="autorenew" size={18} className="animate-spin" />
                  <span>Validation du code...</span>
                </>
              ) : (
                <span>Confirmer et Activer mon Compte</span>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2">
              {canResendOtp ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-primary font-bold hover:underline"
                >
                  Renvoyer un nouveau code
                </button>
              ) : (
                <span>Renvoyer dans {otpTimer}s</span>
              )}
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-outline hover:text-on-surface"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
