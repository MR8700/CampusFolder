'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import AuthGatewayModal from '@/components/AuthGatewayModal';
import ImageUploadModal from '@/components/ImageUploadModal';
import ImageUploadField from '@/components/ImageUploadField';

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

const DEGREE_LEVELS = [
  { id: 'L1', label: 'Licence 1 (L1)' },
  { id: 'L2', label: 'Licence 2 (L2)' },
  { id: 'L3', label: 'Licence 3 (L3)' },
  { id: 'M1', label: 'Master 1 (M1)' },
  { id: 'M2', label: 'Master 2 (M2)' },
  { id: 'DOCTORAT', label: 'Doctorat / Thèse (D1, D2, D3)' },
  { id: 'INGENIEUR', label: 'Cycle Ingénieur' },
  { id: 'BTS_DUT', label: 'BTS / DUT' },
];

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthGateway, setShowAuthGateway] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Active Main Tab: info | mediatheque | parametres
  const [activeTab, setActiveTab] = useState<'info' | 'mediatheque' | 'parametres'>('info');

  // Academic select options from DB
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);

  // Personal Info Form State
  const [personalForm, setPersonalForm] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    phoneNumber: '',
    bio: '',
    region: 'Centre',
    city: 'Ouagadougou',
    address: '',
    institutionId: '',
    facultyId: '',
    filiere: '',
    avatarUrl: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Mediatheque Data State
  const [mediathequeSubTab, setMediathequeSubTab] = useState<'purchased' | 'published' | 'activity'>('purchased');
  const [purchasedDocs, setPurchasedDocs] = useState<any[]>([]);
  const [publishedDocs, setPublishedDocs] = useState<any[]>([]);
  const [activityTimeline, setActivityTimeline] = useState<any[]>([]);
  const [loadingMediatheque, setLoadingMediatheque] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Notification Toggles State
  const [notifications, setNotifications] = useState({
    notifyEmailAll: true,
    notifyOnPurchase: true,
    notifyOnSale: true,
    notifyOnDownload: true,
    notifyOnPublish: true,
    notifyOnWithdrawal: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [certifyingWhatsApp, setCertifyingWhatsApp] = useState(false);
  const [certifyingEmail, setCertifyingEmail] = useState(false);
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');

  // Published resource editing and management state
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [editResourceForm, setEditResourceForm] = useState({
    title: '',
    description: '',
    moduleName: '',
    academicYear: '',
    price: 0,
    visibility: 'PUBLIC',
    isArchived: false,
  });
  const [savingResourceEdit, setSavingResourceEdit] = useState(false);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  const handleOpenEditResource = (res: any) => {
    setEditingResource(res);
    setEditResourceForm({
      title: res.title || '',
      description: res.description || '',
      moduleName: res.moduleName || '',
      academicYear: res.academicYear || '',
      price: res.price || 0,
      visibility: res.visibility || 'PUBLIC',
      isArchived: Boolean(res.isArchived),
    });
  };

  const handleSaveResourceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    setSavingResourceEdit(true);
    try {
      const res = await fetch(`/api/v1/resources/${editingResource.slug || editingResource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editResourceForm),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || 'Document mis à jour avec succès.');
        setEditingResource(null);
        loadMediathequeAndActivity();
      } else {
        alert(data.error || 'Erreur lors de la mise à jour.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau lors de la mise à jour.');
    } finally {
      setSavingResourceEdit(false);
    }
  };

  const handleToggleArchive = async (res: any) => {
    const nextArchived = !res.isArchived;
    const confirmMsg = nextArchived
      ? 'Voulez-vous archiver ce document ? Il sera masqué des recherches et du catalogue public.'
      : 'Voulez-vous désarchiver ce document pour le rendre à nouveau accessible ?';
    if (!confirm(confirmMsg)) return;

    try {
      const resp = await fetch(`/api/v1/resources/${res.slug || res.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: nextArchived }),
      });
      const data = await resp.json();
      if (data.success) {
        triggerToast(nextArchived ? 'Publication archivée (masquée du catalogue).' : 'Publication désarchivée.');
        loadMediathequeAndActivity();
      } else {
        alert(data.error || 'Erreur lors du changement de statut d\'archive.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau.');
    }
  };

  const handleDeleteResource = async (res: any) => {
    if (!confirm(`Êtes-vous certain de vouloir supprimer définitivement "${res.title}" ? Cette action est irréversible.`)) {
      return;
    }
    setDeletingResourceId(res.id);
    try {
      const resp = await fetch(`/api/v1/resources/${res.slug || res.id}`, {
        method: 'DELETE',
      });
      const data = await resp.json();
      if (data.success) {
        triggerToast('Publication supprimée avec succès.');
        loadMediathequeAndActivity();
      } else {
        alert(data.error || 'Erreur lors de la suppression.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau.');
    } finally {
      setDeletingResourceId(null);
    }
  };

  const handleCertifyWhatsApp = async () => {
    if (!personalForm.phoneNumber?.trim()) {
      alert('Veuillez renseigner votre numéro de téléphone avant de certifier WhatsApp.');
      return;
    }
    setCertifyingWhatsApp(true);
    try {
      const res = await fetch('/api/v1/user/verify-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: personalForm.phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || 'WhatsApp certifié ! +1 point Amphi accordé.');
        loadProfile();
      } else {
        alert(data.error || 'Erreur lors de la certification WhatsApp');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setCertifyingWhatsApp(false);
    }
  };

  const handleStartCertifyEmail = async () => {
    if (!currentUser?.email) return;
    setCertifyingEmail(true);
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email }),
      });
      const data = await res.json();
      if (data.success) {
        setShowEmailOtpModal(true);
        triggerToast('Code OTP envoyé à votre adresse email.');
      } else {
        alert(data.error || "Impossible d'envoyer le code OTP");
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setCertifyingEmail(false);
    }
  };

  const handleConfirmEmailOtp = async () => {
    if (!emailOtpCode.trim()) return;
    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, otp: emailOtpCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setShowEmailOtpModal(false);
        setEmailOtpCode('');
        triggerToast('Gmail / Email certifié avec succès ! +1 point Amphi accordé.');
        loadProfile();
      } else {
        alert(data.error || 'Code incorrect');
      }
    } catch {
      alert('Erreur de validation');
    }
  };

  const handleAvatarUploaded = async (url: string) => {
    setPersonalForm((prev) => ({ ...prev, avatarUrl: url }));
    try {
      await fetch('/api/v1/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: url }),
      });
      triggerToast('Photo de profil mise à jour et enregistrée avec succès.');
      loadProfile();
    } catch {
      triggerToast('Photo mise à jour.');
    }
  };

  // 1. Fetch Current User Profile
  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/user/profile');
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        const p = data.user.profile || {};
        setPersonalForm({
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          displayName: p.displayName || '',
          phoneNumber: data.user.phoneNumber || '',
          bio: p.bio || '',
          region: p.region || 'Centre',
          city: p.city || 'Ouagadougou',
          address: p.address || '',
          institutionId: p.institutionId || '',
          facultyId: p.facultyId || '',
          filiere: p.filiere || '',
          avatarUrl: p.avatarUrl || '',
        });
        setNotifications({
          notifyEmailAll: data.user.notifyEmailAll ?? true,
          notifyOnPurchase: data.user.notifyOnPurchase ?? true,
          notifyOnSale: data.user.notifyOnSale ?? true,
          notifyOnDownload: data.user.notifyOnDownload ?? true,
          notifyOnPublish: data.user.notifyOnPublish ?? true,
          notifyOnWithdrawal: data.user.notifyOnWithdrawal ?? true,
        });
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Institutions for dynamic selectors
  const loadInstitutions = async () => {
    try {
      const res = await fetch('/api/v1/academic/institutions');
      const data = await res.json();
      if (data.success) setInstitutions(data.institutions || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Fetch Faculties when institution changes
  const loadFaculties = async (instId: string) => {
    if (!instId) {
      setFaculties([]);
      return;
    }
    try {
      const res = await fetch(`/api/v1/academic/faculties?institutionId=${instId}`);
      const data = await res.json();
      if (data.success) setFaculties(data.faculties || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Fetch Mediatheque and Activity
  const loadMediathequeAndActivity = async () => {
    setLoadingMediatheque(true);
    try {
      const [mediaRes, actRes] = await Promise.all([
        fetch('/api/v1/user/mediatheque'),
        fetch('/api/v1/user/activity'),
      ]);
      const mediaData = await mediaRes.json();
      const actData = await actRes.json();
      if (mediaData.success) {
        setPurchasedDocs(mediaData.purchasedDocuments || []);
        setPublishedDocs(mediaData.publishedDocuments || []);
      }
      if (actData.success) {
        setActivityTimeline(actData.timeline || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMediatheque(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadInstitutions();
  }, []);

  useEffect(() => {
    if (personalForm.institutionId) {
      loadFaculties(personalForm.institutionId);
    }
  }, [personalForm.institutionId]);

  useEffect(() => {
    if (currentUser && activeTab === 'mediatheque') {
      loadMediathequeAndActivity();
    }
  }, [currentUser, activeTab]);

  // Handler: Save Personal Info
  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/v1/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personalForm),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Informations personnelles enregistrées avec succès.');
        loadProfile();
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch {
      alert('Erreur de connexion au serveur.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handler: Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/v1/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Mot de passe mis à jour avec succès.');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordError(data.error || 'Échec du changement de mot de passe.');
      }
    } catch {
      setPasswordError('Erreur de communication avec le serveur.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Handler: Save Notification Settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/v1/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Préférences de notifications enregistrées.');
      } else {
        alert(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-20">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            progress_activity
          </span>
          <span className="text-xs font-bold text-on-surface-variant mt-2">
            Chargement de votre identité académique...
          </span>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-24 pb-20 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">account_circle</span>
          </div>
          <h2 className="text-xl font-black text-on-surface">Espace Profil Non Connecté</h2>
          <p className="text-xs text-on-surface-variant mt-2 mb-6 leading-relaxed">
            Connectez-vous avec votre INE ou votre adresse email pour gérer votre profil académique, votre médiathèque de documents et vos paramètres de sécurité.
          </p>
          <button
            type="button"
            onClick={() => setShowAuthGateway(true)}
            className="w-full h-12 rounded-2xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            <span>Connexion / Inscription Immédiate</span>
          </button>
        </main>
        <AuthGatewayModal
          isOpen={showAuthGateway}
          onClose={() => setShowAuthGateway(false)}
          onUserLoggedIn={() => {
            setShowAuthGateway(false);
            loadProfile();
          }}
        />
        <BottomNavigation />
      </div>
    );
  }

  const p = currentUser.profile || {};
  const institutionName = p.institution?.shortName || p.institution?.name || 'Université du Burkina Faso';
  const facultyName = p.faculty?.name || p.filiere || 'Formation Supérieure';

  const isAdmin = Boolean(
    currentUser.isSuperAdmin ||
    currentUser.role === 'ADMIN' ||
    currentUser.email?.toLowerCase() === 'admin@campusfolder.bf' ||
    (Array.isArray(currentUser.roles) && currentUser.roles.some((r: any) =>
      typeof r === 'string'
        ? (r === 'ADMIN' || r === 'Administrateur')
        : (r?.code === 'ADMIN' || r?.name === 'ADMIN' || r?.name === 'Administrateur')
    ))
  );

  const roleName = currentUser.isSuperAdmin
    ? 'Super Administrateur'
    : isAdmin
    ? 'Administrateur'
    : 'Étudiant Certifié BF';

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col">
      <Header />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-primary text-on-primary px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-28 gap-6">
        {/* ========================================================= */}
        {/* TOP IDENTITY CARD (SAHELIAN EMERALD & GOLD FINTECH CARD)  */}
        {/* ========================================================= */}
        <section
          aria-label="Identité de l'utilisateur"
          className="relative w-full rounded-3xl bg-gradient-to-br from-primary via-tertiary-container to-primary-container p-6 text-on-primary shadow-xl overflow-hidden border-2 border-primary/40 ring-1 ring-primary/20"
        >
          {/* Atmospheric SVG Motifs */}
          <svg
            className="absolute -right-12 -bottom-12 w-52 h-52 opacity-15 pointer-events-none"
            fill="none"
            viewBox="0 0 160 160"
          >
            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeDasharray="12 8" strokeWidth="8"></circle>
            <circle cx="80" cy="80" r="46" stroke="currentColor" strokeWidth="4"></circle>
            <path d="M40 80H120M80 40V120" stroke="currentColor" strokeLinecap="round" strokeWidth="6"></path>
          </svg>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* User Avatar + Identity Details */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-surface-container-lowest text-primary flex items-center justify-center text-2xl font-black overflow-hidden shadow-lg ring-4 ring-white/20">
                  {p.avatarUrl ? (
                    <img
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      src={p.avatarUrl}
                    />
                  ) : (
                    <span>{p.firstName?.[0] || 'U'}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  title="Changer de photo ou capturer par la caméra (avec redimensionnement)"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                </button>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
                    {roleName}
                  </span>
                  {currentUser.isSuperAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-black flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">stars</span>
                      Super Admin
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-surface-container-lowest tracking-tight mt-1 truncate">
                  {p.displayName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || currentUser.email}
                </h1>

                <div className="flex items-center gap-2 mt-1 text-xs text-primary-fixed-dim flex-wrap">
                  <span className="font-mono font-bold bg-black/20 px-2 py-0.5 rounded-md text-white">
                    INE: {currentUser.ine || 'ADM-BF-2025-01'}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-white/90">
                    {institutionName}
                  </span>
                </div>

                <span className="text-[11px] text-on-primary-container mt-0.5 truncate">
                  {facultyName}
                </span>
              </div>
            </div>

            {/* Quick Metrics (Points Amphi & Solde) */}
            <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/15">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl">
                <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
                  bolt
                </span>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-primary-fixed-dim font-bold">
                    Points amphi
                  </span>
                  <span className="text-base font-black text-surface-container-lowest font-mono leading-none">
                    {currentUser.points || 0} pts
                  </span>
                </div>
              </div>

              {currentUser.wallet && (
                <Link
                  href="/portefeuille"
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-all px-3 py-1.5 rounded-2xl text-surface-container-lowest"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
                    account_balance_wallet
                  </span>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] uppercase tracking-wider text-primary-fixed-dim font-bold">
                      Solde Ledger
                    </span>
                    <span className="text-sm font-black font-mono leading-none">
                      {currentUser.wallet.balance || 0} FCFA
                    </span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* TABS NAVIGATION BAR (3 CORES FROM STITCH ZIP)              */}
        {/* ========================================================= */}
        <nav
          aria-label="Navigation des sections de profil"
          className="flex items-center gap-2 border-b border-outline-variant/30 pb-1 overflow-x-auto no-scrollbar"
        >
          {[
            {
              id: 'info',
              label: '1. Informations Personnelles',
              icon: 'badge',
            },
            {
              id: 'mediatheque',
              label: '2. Médiathèque & Activités',
              icon: 'video_library',
              badge: (currentUser.counts?.purchasedDocs || 0) + (currentUser.counts?.publishedDocs || 0),
            },
            {
              id: 'parametres',
              label: '3. Paramètres & Sécurité',
              icon: 'tune',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === tab.id
                      ? 'bg-white/25 text-white'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ========================================================= */}
        {/* TAB 1: INFORMATIONS PERSONNELLES & CADRE UNIVERSITAIRE    */}
        {/* ========================================================= */}
        {activeTab === 'info' && (
          <section aria-labelledby="tab-info-heading" className="flex flex-col gap-5">
            <div className="bg-surface-container-lowest p-6 rounded-3xl border-2 border-outline-variant/40 shadow-xs flex flex-col gap-6">
              <div className="border-b border-outline-variant/20 pb-3">
                <h2 id="tab-info-heading" className="text-base font-black text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">contact_page</span>
                  Fiche d'Identité & Coordonnées de l'Étudiant
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Renseignez vos identifiants officiels enregistrés auprès des universités du Burkina Faso.
                </p>
              </div>

              <form onSubmit={handleSavePersonalInfo} className="flex flex-col gap-5 text-xs">
                {/* Photo de Profil & Avatar */}
                <ImageUploadField
                  label="Photo de profil / Avatar officiel"
                  hint="Prenez une photo en direct ou chargez depuis vos fichiers (redimensionnement automatique)"
                  value={personalForm.avatarUrl}
                  onChange={(url) => setPersonalForm({ ...personalForm, avatarUrl: url })}
                  folder="avatars"
                  shape="circle"
                  cropToSquare={true}
                  defaultMaxDimension={512}
                  modalTitle="Photo de Profil & Avatar Étudiant"
                />

                {/* Identity Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Prénom</label>
                    <input
                      type="text"
                      required
                      value={personalForm.firstName}
                      onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                      placeholder="Ex. Moussa"
                      className="h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Nom de Famille</label>
                    <input
                      type="text"
                      required
                      value={personalForm.lastName}
                      onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                      placeholder="Ex. Ouédraogo"
                      className="h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Nom d'Affichage Public</label>
                    <input
                      type="text"
                      required
                      value={personalForm.displayName}
                      onChange={(e) => setPersonalForm({ ...personalForm, displayName: e.target.value })}
                      placeholder="Ex. Moussa Ouedraogo • UJKZ"
                      className="h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* INE & Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant flex items-center justify-between">
                      <span>Identifiant National (INE)</span>
                      <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        Certifié
                      </span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.ine || 'ADM-BF-2025-01'}
                      className="h-11 px-3.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/30 text-xs text-primary font-mono font-bold cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant flex items-center justify-between">
                      <span>Téléphone / WhatsApp (+226)</span>
                      {currentUser.phoneVerified ? (
                        <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Certifié (+1 pt Amphi)
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={certifyingWhatsApp}
                          onClick={handleCertifyWhatsApp}
                          className="text-[10px] text-primary font-extrabold flex items-center gap-0.5 hover:underline disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[12px]">bolt</span>
                          <span>{certifyingWhatsApp ? 'Validation...' : 'Certifier (+1 pt)'}</span>
                        </button>
                      )}
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="tel"
                        value={personalForm.phoneNumber}
                        onChange={(e) => setPersonalForm({ ...personalForm, phoneNumber: e.target.value })}
                        placeholder="+226 70 12 34 56"
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary pr-9"
                      />
                      {currentUser.phoneVerified && (
                        <span className="material-symbols-outlined absolute right-2.5 text-green-600 text-[18px]">
                          check_circle
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant flex items-center justify-between">
                      <span>Email / Gmail BF</span>
                      {currentUser.emailVerified ? (
                        <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Certifié (+1 pt Amphi)
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={certifyingEmail}
                          onClick={handleStartCertifyEmail}
                          className="text-[10px] text-primary font-extrabold flex items-center gap-0.5 hover:underline disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[12px]">bolt</span>
                          <span>{certifyingEmail ? 'Envoi...' : 'Certifier (+1 pt)'}</span>
                        </button>
                      )}
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="email"
                        disabled
                        value={currentUser.email || ''}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/30 text-xs text-on-surface-variant font-mono cursor-not-allowed pr-9"
                      />
                      {currentUser.emailVerified && (
                        <span className="material-symbols-outlined absolute right-2.5 text-green-600 text-[18px]">
                          check_circle
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Academic Context (Burkina Faso) */}
                <div className="border-t border-outline-variant/20 pt-4 flex flex-col gap-3">
                  <h3 className="font-black text-on-surface text-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-base">school</span>
                    Affiliation & Cursus Universitaire
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-on-surface-variant">Université / Établissement</label>
                        {!isAdmin && (
                          <span className="text-[10px] text-primary font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">lock</span>
                            Scellée à l'inscription
                          </span>
                        )}
                      </div>
                      <select
                        disabled={!isAdmin}
                        value={personalForm.institutionId}
                        onChange={(e) => setPersonalForm({ ...personalForm, institutionId: e.target.value })}
                        className={`h-11 px-3.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                          !isAdmin
                            ? 'bg-surface-container-high/60 border-outline-variant/30 text-on-surface-variant cursor-not-allowed opacity-90'
                            : 'bg-surface-container-low border-outline-variant/30 text-on-surface focus:border-primary'
                        }`}
                      >
                        <option value="">Sélectionnez votre université</option>
                        {institutions.map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.name} ({inst.shortName})
                          </option>
                        ))}
                      </select>
                      {!isAdmin && (
                        <span className="text-[10px] text-outline italic">
                          🔒 Seule l'administration centrale est habilitée à modifier votre rattachement universitaire.
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-on-surface-variant">UFR / Faculté de Rattachement</label>
                        {!isAdmin && (
                          <span className="text-[10px] text-primary font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">lock</span>
                            Fixée à l'inscription
                          </span>
                        )}
                      </div>
                      <select
                        disabled={!isAdmin}
                        value={personalForm.facultyId}
                        onChange={(e) => setPersonalForm({ ...personalForm, facultyId: e.target.value })}
                        className={`h-11 px-3.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                          !isAdmin
                            ? 'bg-surface-container-high/60 border-outline-variant/30 text-on-surface-variant cursor-not-allowed opacity-90'
                            : 'bg-surface-container-low border-outline-variant/30 text-on-surface focus:border-primary'
                        }`}
                      >
                        <option value="">Sélectionnez votre UFR</option>
                        {faculties.map((fac) => (
                          <option key={fac.id} value={fac.id}>
                            {fac.name} ({fac.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-on-surface-variant">Filière / Spécialité</label>
                      <input
                        type="text"
                        value={personalForm.filiere}
                        onChange={(e) => setPersonalForm({ ...personalForm, filiere: e.target.value })}
                        placeholder="Ex. Macroéconomie appliquée, Droit public..."
                        className="h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-on-surface-variant">Région Administrative</label>
                      <select
                        value={personalForm.region}
                        onChange={(e) => setPersonalForm({ ...personalForm, region: e.target.value })}
                        className="h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                      >
                        {BF_REGIONS.map((reg) => (
                          <option key={reg} value={reg}>
                            {reg}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-on-surface-variant">Ville de Résidence</label>
                      <input
                        type="text"
                        value={personalForm.city}
                        onChange={(e) => setPersonalForm({ ...personalForm, city: e.target.value })}
                        placeholder="Ouagadougou, Bobo-Dioulasso..."
                        className="h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Bio / Présentation de l'Auteur</label>
                    <textarea
                      rows={2}
                      value={personalForm.bio}
                      onChange={(e) => setPersonalForm({ ...personalForm, bio: e.target.value })}
                      placeholder="Présentez vos domaines d'excellence académique ou vos travaux de recherche..."
                      className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-2xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingProfile && (
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                    )}
                    <span>Enregistrer les Modifications</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MÉDIATHÈQUE & HISTORIQUE D'ACTIVITÉ                 */}
        {/* ========================================================= */}
        {activeTab === 'mediatheque' && (
          <section aria-labelledby="tab-mediatheque-heading" className="flex flex-col gap-5">
            {/* Sub-Tabs: Purchased vs Published vs Activity */}
            <div className="flex items-center justify-between gap-2 flex-wrap bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/30 shadow-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'purchased', label: 'Documents Débloqués', count: purchasedDocs.length, icon: 'lock_open' },
                  { id: 'published', label: 'Mes Publications', count: publishedDocs.length, icon: 'upload_file' },
                  { id: 'activity', label: 'Journal d\'Activité', count: activityTimeline.length, icon: 'history' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setMediathequeSubTab(st.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      mediathequeSubTab === st.id
                        ? 'bg-primary text-on-primary shadow-xs font-black'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{st.icon}</span>
                    <span>{st.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        mediathequeSubTab === st.id
                          ? 'bg-white/20 text-white'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>

              <Link
                href="/publier"
                className="px-3.5 py-1.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-secondary/90 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Nouvelle Publication</span>
              </Link>
            </div>

            {loadingMediatheque ? (
              <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest rounded-3xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                  progress_activity
                </span>
                <span className="text-xs font-bold text-on-surface-variant mt-2">
                  Chargement de votre médiathèque en direct de la base de données...
                </span>
              </div>
            ) : (
              <>
                {/* SUBTAB 1: Purchased Documents */}
                {mediathequeSubTab === 'purchased' && (
                  <div className="flex flex-col gap-3">
                    {purchasedDocs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 text-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-primary/30">
                          menu_book
                        </span>
                        <h3 className="text-sm font-black text-on-surface">
                          Aucun document débloqué pour le moment
                        </h3>
                        <p className="text-xs text-on-surface-variant max-w-sm">
                          Explorez le catalogue académique pour acquérir des corrigés d'examens, des polycopiés et des fiches TD de votre UFR.
                        </p>
                        <Link
                          href="/explorer"
                          className="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs"
                        >
                          Explorer les ressources
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {purchasedDocs.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-3xl bg-surface-container-lowest border-2 border-outline-variant/40 shadow-xs flex flex-col justify-between gap-3 hover:border-primary/50 transition-all"
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                                  {item.resource.mediaFormat || 'PDF'}
                                </span>
                                <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px]">offline_pin</span>
                                  Accès permanent
                                </span>
                              </div>

                              <h3 className="font-bold text-on-surface text-sm line-clamp-2">
                                {item.resource.title}
                              </h3>

                              <div className="text-[11px] text-on-surface-variant flex flex-wrap gap-1.5">
                                <span className="font-semibold">{item.resource.institution}</span>
                                <span>•</span>
                                <span>{item.resource.faculty}</span>
                              </div>

                              <span className="text-[11px] text-outline">
                                Auteur : {item.resource.authorName}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
                              <span className="text-xs font-mono font-black text-primary">
                                {item.resource.price} FCFA
                              </span>

                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/lecteur/${item.downloadToken}`}
                                  className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-primary/90 transition-all"
                                >
                                  <span className="material-symbols-outlined text-[15px]">auto_stories</span>
                                  <span>Lire</span>
                                </Link>
                                {item.resource.media?.[0]?.url && (
                                  <a
                                    href={item.resource.media[0].url}
                                    download
                                    className="p-1.5 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container transition-all"
                                    title="Télécharger"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB 2: Published Documents by user */}
                {mediathequeSubTab === 'published' && (
                  <div className="flex flex-col gap-3">
                    {publishedDocs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest rounded-3xl border-2 border-outline-variant/40 text-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-primary/30">
                          upload_file
                        </span>
                        <h3 className="text-sm font-black text-on-surface">
                          Vous n'avez pas encore publié de documents
                        </h3>
                        <p className="text-xs text-on-surface-variant max-w-sm">
                          Partagez vos polycopiés, fiches TD et corrigés d'examens avec vos pairs burkinabè et percevez 85% de royalties chaque vendredi sur Orange Money ou Moov Money.
                        </p>
                        <Link
                          href="/publier"
                          className="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs"
                        >
                          Publier mon premier document
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {publishedDocs.map((res) => (
                          <div
                            key={res.id}
                            className="p-4 rounded-3xl bg-surface-container-lowest border-2 border-outline-variant/40 shadow-xs flex flex-col justify-between gap-3 hover:border-primary/50 transition-all"
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                      res.validationStatus === 'APPROVED'
                                        ? 'bg-green-500/15 text-green-700 border border-green-500/30'
                                        : res.validationStatus === 'REJECTED'
                                        ? 'bg-red-500/15 text-red-700 border border-red-500/30'
                                        : 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                                    }`}
                                  >
                                    {res.validationStatus === 'APPROVED'
                                      ? 'Validé & Public'
                                      : res.validationStatus === 'REJECTED'
                                      ? 'Rejeté'
                                      : 'Examen 24h en cours'}
                                  </span>

                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                      res.visibility === 'PUBLIC'
                                        ? 'bg-primary/10 text-primary'
                                        : res.visibility === 'UNLISTED'
                                        ? 'bg-surface-container-high text-on-surface-variant'
                                        : 'bg-error/10 text-error'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[12px]">
                                      {res.visibility === 'PUBLIC' ? 'public' : res.visibility === 'UNLISTED' ? 'link' : 'lock'}
                                    </span>
                                    {res.visibility === 'PUBLIC' ? 'Public' : res.visibility === 'UNLISTED' ? 'Non répertorié' : 'Privé'}
                                  </span>

                                  {res.isArchived && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[12px]">archive</span>
                                      Archivé
                                    </span>
                                  )}
                                </div>

                                <span className="font-mono text-xs font-black text-primary">
                                  {res.price} FCFA
                                </span>
                              </div>

                              <h3 className="font-bold text-on-surface text-sm line-clamp-2">
                                {res.title}
                              </h3>

                              <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
                                <span>Vues : <strong>{res.viewsCount || 0}</strong></span>
                                <span>Ventes : <strong>{res.salesCount || 0}</strong></span>
                                <span className="text-secondary font-bold">
                                  Gains : {res.royaltiesEarned || 0} FCFA
                                </span>
                              </div>

                              {res.validationNote && (
                                <div className="p-2 rounded-xl bg-surface-container text-[11px] text-on-surface-variant italic">
                                  "{res.validationNote}"
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/15 text-[11px]">
                              <div className="flex items-center justify-between text-outline">
                                <span>
                                  Soumis le {new Date(res.submittedAt).toLocaleDateString('fr-FR')}
                                </span>
                                <Link
                                  href={`/ressources/${res.slug}`}
                                  className="text-primary font-bold hover:underline flex items-center gap-0.5"
                                >
                                  <span>Fiche publique</span>
                                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                                </Link>
                              </div>

                              {/* Author Management Actions */}
                              <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-outline-variant/10">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditResource(res)}
                                    className="px-2.5 py-1 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface font-bold text-[11px] flex items-center gap-1 transition-all"
                                    title="Modifier le document"
                                  >
                                    <span className="material-symbols-outlined text-[14px] text-primary">edit</span>
                                    <span>Éditer</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleArchive(res)}
                                    className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all ${
                                      res.isArchived
                                        ? 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25'
                                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                                    }`}
                                    title={res.isArchived ? "Rendre à nouveau public/actif" : "Masquer du catalogue public"}
                                  >
                                    <span className="material-symbols-outlined text-[14px]">
                                      {res.isArchived ? 'unarchive' : 'archive'}
                                    </span>
                                    <span>{res.isArchived ? 'Désarchiver' : 'Archiver'}</span>
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  disabled={deletingResourceId === res.id}
                                  onClick={() => handleDeleteResource(res)}
                                  className="px-2 py-1 rounded-xl bg-error/10 hover:bg-error/20 text-error font-bold text-[11px] flex items-center gap-1 transition-all"
                                  title="Supprimer la publication"
                                >
                                  {deletingResourceId === res.id ? (
                                    <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                                  ) : (
                                    <span className="material-symbols-outlined text-[14px]">delete</span>
                                  )}
                                  <span>Supprimer</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB 3: Activity Timeline */}
                {mediathequeSubTab === 'activity' && (
                  <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
                    <h3 className="font-black text-on-surface text-sm flex items-center gap-1.5 border-b border-outline-variant/20 pb-3">
                      <span className="material-symbols-outlined text-primary text-base">timeline</span>
                      Journal des Actions & Événements Académiques
                    </h3>

                    {activityTimeline.length === 0 ? (
                      <p className="text-xs text-on-surface-variant py-4 text-center">
                        Aucun événement récent consigné dans votre journal.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {activityTimeline.map((item) => {
                          const isSecurity = item.category === 'SECURITY';
                          const isCommerce = item.category === 'COMMERCE';
                          const isAcademic = item.category === 'ACADEMIC';

                          return (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20 text-xs"
                            >
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  isSecurity
                                    ? 'bg-amber-500/15 text-amber-700'
                                    : isCommerce
                                    ? 'bg-primary/15 text-primary'
                                    : isAcademic
                                    ? 'bg-secondary/15 text-secondary'
                                    : 'bg-surface-container-high text-on-surface'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {isSecurity
                                    ? 'security'
                                    : isCommerce
                                    ? 'payments'
                                    : isAcademic
                                    ? 'school'
                                    : 'info'}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-on-surface block truncate">
                                  {item.title}
                                </span>
                                <span className="text-[10px] text-on-surface-variant">
                                  {new Date(item.date).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PARAMÈTRES, SÉCURITÉ & NOTIFICATIONS                */}
        {/* ========================================================= */}
        {activeTab === 'parametres' && (
          <section aria-labelledby="tab-params-heading" className="flex flex-col gap-5">
            {/* Section A: Sécurité & Changement de mot de passe */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border-2 border-outline-variant/40 shadow-xs flex flex-col gap-5">
              <div className="border-b border-outline-variant/20 pb-3">
                <h2 id="tab-params-heading" className="text-base font-black text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">lock_reset</span>
                  Sécurité du Compte & Mot de Passe
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Conformément aux normes Campus Folder, votre mot de passe doit comporter 8 caractères minimum, une majuscule, une minuscule, un chiffre et un caractère spécial, sans répétition consécutive.
                </p>
              </div>

              {passwordError && (
                <div className="p-3 rounded-xl bg-error/10 text-error text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface-variant">Mot de passe actuel</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Nouveau mot de passe</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="••••••••••••"
                      className="h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="••••••••••••"
                      className="h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-5 py-2.5 rounded-2xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingPassword && (
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                    )}
                    <span>Modifier mon mot de passe</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Section B: Préférences de Notifications (SLA 24h & Échanges) */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border-2 border-outline-variant/40 shadow-xs flex flex-col gap-5">
              <div className="border-b border-outline-variant/20 pb-3">
                <h3 className="text-base font-black text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">notifications_active</span>
                  Alertes & Préférences de Notifications
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Choisissez les événements pour lesquels vous souhaitez être notifié par email ou alerte in-app.
                </p>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                {[
                  {
                    id: 'notifyEmailAll',
                    title: 'Toutes les notifications email',
                    desc: 'Activer la réception des correspondances officielles de Campus Folder.',
                    checked: notifications.notifyEmailAll,
                  },
                  {
                    id: 'notifyOnPublish',
                    title: 'Validations 24h & Rappels de publication',
                    desc: 'Recevoir l\'avis de décision sous 24h et les accusés de rappels prioritaires.',
                    checked: notifications.notifyOnPublish,
                  },
                  {
                    id: 'notifyOnPurchase',
                    title: 'Déblocages de nouveaux documents',
                    desc: 'Alerte immédiate lors d\'un achat réussi avec votre lien de téléchargement permanent.',
                    checked: notifications.notifyOnPurchase,
                  },
                  {
                    id: 'notifyOnSale',
                    title: 'Ventes de mes documents & Royalties (85%)',
                    desc: 'Être prévenu à chaque fois qu\'un étudiant acquiert l\'un de vos polycopiés ou corrigés.',
                    checked: notifications.notifyOnSale,
                  },
                  {
                    id: 'notifyOnWithdrawal',
                    title: 'Reversements hebdomadaires Orange & Moov',
                    desc: 'Alerte de versement automatique de vos gains chaque vendredi sur votre compte mobile.',
                    checked: notifications.notifyOnWithdrawal,
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low/50 border border-outline-variant/20"
                  >
                    <div className="flex flex-col pr-4">
                      <span className="font-bold text-on-surface">{item.title}</span>
                      <span className="text-[11px] text-on-surface-variant mt-0.5">{item.desc}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            [item.id]: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={savingSettings}
                    onClick={handleSaveSettings}
                    className="px-5 py-2.5 rounded-2xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingSettings && (
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                    )}
                    <span>Enregistrer les Préférences</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section C: Sécurité de Session & Déconnexion */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="font-black text-on-surface text-sm">Session de Connexion</span>
                <span className="text-xs text-on-surface-variant mt-0.5">
                  Connecté en tant que <strong>{currentUser.email}</strong> • INE : {currentUser.ine || 'ADM-BF-2025-01'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentUser.isSuperAdmin && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 text-xs font-bold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                    <span>Console Admin</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/v1/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  className="px-4 py-2 rounded-xl bg-error/10 text-error hover:bg-error/20 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Modal Photo Avatar Flottante */}
        <ImageUploadModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          onImageUploaded={handleAvatarUploaded}
          title="Photo de Profil & Carte Étudiant"
          subtitle="Prenez une photo avec votre caméra ou sélectionnez un fichier (redimensionnement automatique)"
          folder="avatars"
          cropToSquare={true}
          defaultMaxDimension={512}
        />

        {/* Modal Certification Email OTP */}
        {showEmailOtpModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface p-6 rounded-3xl max-w-sm w-full border border-primary/20 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">mark_email_read</span>
                  <h3 className="font-extrabold text-sm text-on-surface">Certification Gmail / Email</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailOtpModal(false)}
                  className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-outline"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Entrez le code à 6 chiffres reçu sur <strong>{currentUser?.email}</strong> pour certifier votre adresse et débloquer <strong>+1 point Amphi</strong>.
              </p>

              <input
                type="text"
                maxLength={6}
                value={emailOtpCode}
                onChange={(e) => setEmailOtpCode(e.target.value)}
                placeholder="123456"
                className="h-12 px-4 rounded-xl bg-surface-container-low border border-primary/30 text-center font-mono font-black text-lg tracking-widest text-primary focus:outline-none focus:border-primary"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailOtpModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEmailOtp}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary/90"
                >
                  Valider (+1 pt Amphi)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Édition de Ressource par l'Auteur */}
        {editingResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
                  <h3 className="text-base font-black text-on-surface">
                    Gérer & Modifier la Publication
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Notice revalidation if resource is currently APPROVED */}
              {editingResource.validationStatus === 'APPROVED' && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-900">
                  <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">warning</span>
                  <div>
                    <strong className="block font-bold">Resoumission pour Validation Requise</strong>
                    <span>
                      Ce document est actuellement <strong>Validé & Public</strong>. Toute modification de contenu (titre, description, matière) ou de tarif le replace automatiquement en <strong>attente d'examen administratif (engagement 24h)</strong>.
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveResourceEdit} className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface">Titre de la publication</label>
                  <input
                    type="text"
                    required
                    value={editResourceForm.title}
                    onChange={(e) => setEditResourceForm({ ...editResourceForm, title: e.target.value })}
                    className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Module / Matière</label>
                    <input
                      type="text"
                      value={editResourceForm.moduleName}
                      onChange={(e) => setEditResourceForm({ ...editResourceForm, moduleName: e.target.value })}
                      placeholder="Ex. Algorithmique"
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Année Académique</label>
                    <input
                      type="text"
                      value={editResourceForm.academicYear}
                      onChange={(e) => setEditResourceForm({ ...editResourceForm, academicYear: e.target.value })}
                      placeholder="Ex. 2023-2024"
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface-variant">Description & Consignes</label>
                  <textarea
                    rows={3}
                    value={editResourceForm.description}
                    onChange={(e) => setEditResourceForm({ ...editResourceForm, description: e.target.value })}
                    placeholder="Détails sur les exercices, corrections ou examens..."
                    className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Tarif (FCFA)</label>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={editResourceForm.price}
                      onChange={(e) => setEditResourceForm({ ...editResourceForm, price: Number(e.target.value) || 0 })}
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-bold text-primary focus:outline-none focus:border-primary"
                    />
                    <span className="text-[10px] text-outline">0 = Gratuit / Accès Libre</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Visibilité du document</label>
                    <select
                      value={editResourceForm.visibility}
                      onChange={(e) => setEditResourceForm({ ...editResourceForm, visibility: e.target.value })}
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="PUBLIC">🌍 Public (Catalogue)</option>
                      <option value="UNLISTED">🔗 Non répertorié (Lien seul)</option>
                      <option value="PRIVATE">🔒 Privé (Auteur seul)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between mt-1">
                  <div className="flex flex-col pr-2">
                    <span className="font-bold text-on-surface">Archiver ce document</span>
                    <span className="text-[10px] text-on-surface-variant">
                      Masque le document de toutes les recherches publiques tout en préservant vos données.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editResourceForm.isArchived}
                    onChange={(e) => setEditResourceForm({ ...editResourceForm, isArchived: e.target.checked })}
                    className="w-5 h-5 text-primary rounded shrink-0"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    disabled={savingResourceEdit}
                    onClick={() => setEditingResource(null)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-bold disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={savingResourceEdit}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingResourceEdit && (
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    )}
                    <span>Enregistrer les modifications</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
