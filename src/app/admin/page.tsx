'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';
import Header from '@/components/Header';
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

const CATEGORIES = [
  { id: 'UNIVERSITE_PUBLIQUE', label: 'Université Publique' },
  { id: 'UNIVERSITE_PRIVEE', label: 'Université Privée' },
  { id: 'GRANDE_ECOLE', label: 'Grande École' },
  { id: 'INSTITUT_SUPERIEUR', label: 'Institut Supérieur' },
];

const DEGREE_LEVELS = [
  { id: 'LICENCE', label: 'Licence (L1, L2, L3)' },
  { id: 'MASTER', label: 'Master (M1, M2)' },
  { id: 'DOCTORAT', label: 'Doctorat (PhD)' },
  { id: 'INGENIEUR', label: 'Cycle Ingénieur' },
  { id: 'BTS_DUT', label: 'BTS / DUT' },
];

const DOC_TYPES = [
  { id: 'ALL', label: 'Tous les types de documents' },
  { id: 'EXAM_CORRECTION', label: "Corrigé d'Examen & Devoir" },
  { id: 'COURSE_NOTES', label: 'Polycopié de Cours Magistral' },
  { id: 'TUTORIAL_SHEET', label: 'Fiche de TD & Exercices' },
  { id: 'MEMOIRE_MASTER', label: 'Mémoire de Master' },
  { id: 'THESE_SOUTENANCE', label: 'Thèse de Soutenance (Doctorat/Médecine)' },
  { id: 'CONCOURS_TEST', label: 'Annales Concours Fonction Publique' },
  { id: 'FORMATION_ATELIER', label: 'Formation & Atelier Pratique' },
  { id: 'SUMMARY_MEMO', label: 'Fiche Mémo / Synthèse' },
];

const MEDIA_FORMATS = [
  { id: 'ALL', label: 'Tous formats' },
  { id: 'PDF', label: 'Document PDF' },
  { id: 'AUDIO', label: 'Note Vocale / Audio' },
  { id: 'VIDEO', label: 'Capsule Vidéo' },
  { id: 'BUNDLE', label: 'Pack Multimédia (PDF + Audio)' },
];

export default function AdminDashboardPage() {
  // Auth & role check
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [adminEmail, setAdminEmail] = useState('admin@campusfolder.bf');
  const [adminPassword, setAdminPassword] = useState('Password@2025!');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'validations' | 'institutions' | 'faculties' | 'filieres' | 'pricing' | 'students' | 'admins'
  >('validations');

  // Academic State
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [platformCommission, setPlatformCommission] = useState<number>(40);
  const [commissionUpdatedAt, setCommissionUpdatedAt] = useState<string | null>(null);
  const [isUpdatingCommission, setIsUpdatingCommission] = useState<boolean>(false);
  const [commissionFeedback, setCommissionFeedback] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  // Filter States
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedInstForFaculty, setSelectedInstForFaculty] = useState<string>('all');
  const [selectedInstForFiliere, setSelectedInstForFiliere] = useState<string>('all');
  const [selectedFacultyForFiliere, setSelectedFacultyForFiliere] = useState<string>('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  const [studentInstFilter, setStudentInstFilter] = useState<string>('all');

  // Validation State (Examens 24h & SLA)
  const [validations, setValidations] = useState<any[]>([]);
  const [validationStatusFilter, setValidationStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [validationSearchTerm, setValidationSearchTerm] = useState('');
  const [loadingValidations, setLoadingValidations] = useState(false);
  const [validationActionModal, setValidationActionModal] = useState<{
    type: 'APPROVE' | 'REJECT' | 'DELETE';
    resource: any;
  } | null>(null);
  const [validationNoteInput, setValidationNoteInput] = useState('');
  const [validationActionLoading, setValidationActionLoading] = useState(false);

  // Super Admin: College d'administration
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    ine: '',
    isSuperAdmin: false,
  });
  const [adminCreating, setAdminCreating] = useState(false);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [showInstModal, setShowInstModal] = useState(false);
  const [editingInst, setEditingInst] = useState<any>(null);
  const [instForm, setInstForm] = useState({
    name: '',
    shortName: '',
    category: 'UNIVERSITE_PUBLIQUE',
    region: 'Centre',
    city: 'Ouagadougou',
    logoUrl: '',
    websiteUrl: '',
  });

  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);
  const [facultyForm, setFacultyForm] = useState({
    institutionId: '',
    name: '',
    code: '',
    iconName: 'school',
    logoUrl: '',
    description: '',
  });

  const [showFiliereModal, setShowFiliereModal] = useState(false);
  const [editingFiliere, setEditingFiliere] = useState<any>(null);
  const [filiereForm, setFiliereForm] = useState({
    facultyId: '',
    name: '',
    code: '',
    degreeLevel: 'LICENCE',
    description: '',
  });

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState<any>(null);
  const [pricingForm, setPricingForm] = useState({
    title: '',
    documentType: 'ALL',
    mediaFormat: 'ALL',
    minPrice: 0,
    maxPrice: 1000,
    suggestedPrice: 500,
    institutionId: '',
    facultyId: '',
    filiereId: '',
    notes: '',
  });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [moderatingStudent, setModeratingStudent] = useState<any>(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  // Student Edit Modal (Full Admin Authority)
  const [showStudentEditModal, setShowStudentEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [studentForm, setStudentForm] = useState({
    userId: '',
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    ine: '',
    phoneNumber: '',
    points: 0,
    pointsJustification: 'Attribution accordée en faveur de la qualité et de la rigueur du contenu pédagogique',
    institutionId: '',
    facultyId: '',
    filiere: '',
    city: '',
    region: 'Centre',
    avatarUrl: '',
    status: 'ACTIVE',
  });
  const [studentEditFaculties, setStudentEditFaculties] = useState<any[]>([]);
  const [savingStudent, setSavingStudent] = useState(false);

  // Universal Admin Check
  const isAdmin = Boolean(
    currentUser?.isSuperAdmin ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.email?.toLowerCase() === 'admin@campusfolder.bf' ||
    (Array.isArray(currentUser?.roles) && currentUser.roles.some((r: any) =>
      typeof r === 'string'
        ? (r === 'ADMIN' || r === 'Administrateur')
        : (r?.code === 'ADMIN' || r?.name === 'ADMIN' || r?.name === 'Administrateur')
    ))
  );

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Check auth
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/v1/auth/me');
      const data = await res.json();
      if (data.success && data.authenticated && data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: adminEmail,
          password: adminPassword,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        const userObj = {
          ...data.user,
          role: 'ADMIN',
        };
        setCurrentUser(userObj);
        triggerToast(`Connecté avec succès en tant que ${data.user.email}`);
        loadInstitutions();
        loadPricingRules();
        loadValidations();
        loadAdmins();
        loadStudents();
      } else {
        setLoginError(data.error || 'Échec de connexion administrateur');
      }
    } catch {
      setLoginError('Erreur de communication avec le serveur.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Fetch data
  const loadInstitutions = async () => {
    try {
      const res = await fetch('/api/v1/academic/institutions?includeArchived=true');
      const data = await res.json();
      if (data.success) setInstitutions(data.institutions);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFaculties = async () => {
    try {
      const url =
        selectedInstForFaculty && selectedInstForFaculty !== 'all'
          ? `/api/v1/academic/faculties?institutionId=${selectedInstForFaculty}&includeArchived=true`
          : '/api/v1/academic/faculties?includeArchived=true';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setFaculties(data.faculties);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFilieres = async () => {
    try {
      let url = '/api/v1/academic/filieres?includeArchived=true';
      if (selectedFacultyForFiliere && selectedFacultyForFiliere !== 'all') {
        url += `&facultyId=${selectedFacultyForFiliere}`;
      } else if (selectedInstForFiliere && selectedInstForFiliere !== 'all') {
        url += `&institutionId=${selectedInstForFiliere}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setFilieres(data.filieres);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPricingRules = async () => {
    try {
      const res = await fetch('/api/v1/admin/pricing-rules');
      const data = await res.json();
      if (data.success) setPricingRules(data.rules);

      const commRes = await fetch('/api/v1/admin/commission');
      const commData = await commRes.json();
      if (commData.success && commData.settings) {
        setPlatformCommission(commData.settings.platformCommissionPercent ?? 40);
        setCommissionUpdatedAt(commData.settings.updatedAt ?? null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCommission = async (targetRate?: number) => {
    const rateToSave = targetRate !== undefined ? targetRate : platformCommission;
    setIsUpdatingCommission(true);
    setCommissionFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/commission', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformCommissionPercent: rateToSave, updatedBy: 'SUPER_ADMIN' }),
      });
      const data = await res.json();
      if (data.success) {
        setPlatformCommission(data.settings.platformCommissionPercent);
        setCommissionUpdatedAt(data.settings.updatedAt);
        setCommissionFeedback(data.message);
        setTimeout(() => setCommissionFeedback(null), 4500);
      } else {
        setCommissionFeedback(data.error || 'Erreur lors de la mise à jour de la commission');
      }
    } catch (err) {
      console.error(err);
      setCommissionFeedback('Erreur de connexion au serveur');
    } finally {
      setIsUpdatingCommission(false);
    }
  };

  const loadStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (studentSearchTerm.trim()) params.append('q', studentSearchTerm.trim());
      if (studentInstFilter && studentInstFilter !== 'all')
        params.append('institutionId', studentInstFilter);

      const res = await fetch(`/api/v1/admin/students?${params.toString()}`);
      const data = await res.json();
      if (data.success) setStudents(data.students);
    } catch (err) {
      console.error(err);
    }
  };

  const loadValidations = async () => {
    setLoadingValidations(true);
    try {
      const res = await fetch(`/api/v1/admin/validations?status=${validationStatusFilter}`);
      const data = await res.json();
      if (data.success) {
        setValidations(data.resources || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingValidations(false);
    }
  };

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const res = await fetch('/api/v1/admin/admins');
      const data = await res.json();
      if (data.success) {
        setAdminsList(data.admins || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Effects to trigger data loading
  useEffect(() => {
    if (isAdmin) {
      loadInstitutions();
      loadPricingRules();
      loadValidations();
      loadAdmins();
    }
  }, [isAdmin, currentUser]);

  useEffect(() => {
    if (isAdmin && activeTab === 'faculties') {
      loadFaculties();
    }
  }, [isAdmin, currentUser, activeTab, selectedInstForFaculty]);

  useEffect(() => {
    if (isAdmin && activeTab === 'filieres') {
      loadFilieres();
    }
  }, [isAdmin, currentUser, activeTab, selectedInstForFiliere, selectedFacultyForFiliere]);

  useEffect(() => {
    if (isAdmin && activeTab === 'students') {
      loadStudents();
    }
  }, [isAdmin, currentUser, activeTab, studentSearchTerm, studentInstFilter]);

  useEffect(() => {
    if (isAdmin && activeTab === 'validations') {
      loadValidations();
    }
  }, [isAdmin, currentUser, activeTab, validationStatusFilter]);

  useEffect(() => {
    if (isAdmin && activeTab === 'admins') {
      loadAdmins();
    }
  }, [isAdmin, currentUser, activeTab]);

  // Handlers: Validations 24h
  const handleConfirmValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationActionModal) return;
    setValidationActionLoading(true);
    try {
      if (validationActionModal.type === 'DELETE') {
        const res = await fetch('/api/v1/admin/validations', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceId: validationActionModal.resource.id,
            justification: validationNoteInput,
            adminName: currentUser?.profile?.displayName || currentUser?.email || 'Administrateur',
          }),
        });
        const data = await res.json();
        if (data.success) {
          triggerToast(data.message || 'Publication définitivement supprimée avec justification enregistrée.');
          setValidationActionModal(null);
          setValidationNoteInput('');
          loadValidations();
        } else {
          alert(data.error || 'Erreur lors de la suppression de la ressource');
        }
      } else {
        const res = await fetch('/api/v1/admin/validations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceId: validationActionModal.resource.id,
            action: validationActionModal.type,
            validationNote: validationNoteInput,
            validatedBy: currentUser?.profile?.displayName || currentUser?.email || 'Admin Campus Folder',
          }),
        });
        const data = await res.json();
        if (data.success) {
          triggerToast(
            validationActionModal.type === 'APPROVE'
              ? 'Ressource validée et publiée au catalogue avec succès !'
              : 'Ressource rejetée avec notification motivée transmise à l\'étudiant.'
          );
          setValidationActionModal(null);
          setValidationNoteInput('');
          loadValidations();
        } else {
          alert(data.error || 'Erreur lors du traitement de la ressource');
        }
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setValidationActionLoading(false);
    }
  };

  // Handlers: Admins (Super Admin)
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCreating(true);
    try {
      const res = await fetch('/api/v1/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Administrateur ${data.admin?.email} créé avec succès !`);
        setShowAdminModal(false);
        setAdminForm({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          ine: '',
          isSuperAdmin: false,
        });
        loadAdmins();
      } else {
        alert(data.error || 'Erreur lors de la création');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setAdminCreating(false);
    }
  };

  const handleToggleAdminSuspension = async (admin: any) => {
    const action = admin.status === 'ACTIVE' ? 'suspendre' : 'réactiver';
    if (!confirm(`Êtes-vous sûr de vouloir ${action} cet administrateur (${admin.email}) ?`)) return;
    try {
      const res = await fetch('/api/v1/admin/admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          isSuspended: admin.status === 'ACTIVE',
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || 'Statut administrateur mis à jour.');
        loadAdmins();
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const handleToggleSuperAdmin = async (admin: any) => {
    const action = admin.isSuperAdmin ? 'retirer les droits Super Admin à' : 'promouvoir en Super Admin';
    if (!confirm(`Êtes-vous sûr de vouloir ${action} ${admin.email} ?`)) return;
    try {
      const res = await fetch('/api/v1/admin/admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          isSuperAdmin: !admin.isSuperAdmin,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || 'Droits Super Admin mis à jour.');
        loadAdmins();
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  // Handlers: Institutions
  const handleSaveInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/v1/admin/institutions';
      const method = editingInst ? 'PATCH' : 'POST';
      const body = editingInst ? { id: editingInst.id, ...instForm } : instForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || 'Établissement enregistré');
        setShowInstModal(false);
        setEditingInst(null);
        loadInstitutions();
      } else {
        alert(data.error || 'Erreur lors de l’enregistrement');
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const toggleArchiveInstitution = async (inst: any) => {
    try {
      const res = await fetch('/api/v1/admin/institutions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inst.id, isArchived: !inst.isArchived }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(
          inst.isArchived
            ? `${inst.shortName} a été restauré.`
            : `${inst.shortName} a été archivé.`
        );
        loadInstitutions();
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  // Handlers: Faculties
  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/v1/admin/faculties';
      const method = editingFaculty ? 'PATCH' : 'POST';
      const body = editingFaculty ? { id: editingFaculty.id, ...facultyForm } : facultyForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || 'Faculté enregistrée');
        setShowFacultyModal(false);
        setEditingFaculty(null);
        loadFaculties();
      } else {
        alert(data.error || 'Erreur lors de l’enregistrement');
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const toggleArchiveFaculty = async (fac: any) => {
    try {
      const res = await fetch('/api/v1/admin/faculties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fac.id, isArchived: !fac.isArchived }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(
          fac.isArchived ? `${fac.name} a été restaurée.` : `${fac.name} a été archivée.`
        );
        loadFaculties();
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  // Handlers: Filières
  const handleSaveFiliere = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/v1/admin/filieres';
      const method = editingFiliere ? 'PATCH' : 'POST';
      const body = editingFiliere ? { id: editingFiliere.id, ...filiereForm } : filiereForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || 'Filière enregistrée');
        setShowFiliereModal(false);
        setEditingFiliere(null);
        loadFilieres();
      } else {
        alert(data.error || 'Erreur lors de l’enregistrement');
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const toggleArchiveFiliere = async (fil: any) => {
    try {
      const res = await fetch('/api/v1/admin/filieres', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fil.id, isArchived: !fil.isArchived }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(
          fil.isArchived ? `${fil.name} a été restaurée.` : `${fil.name} a été archivée.`
        );
        loadFilieres();
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  // Handlers: Pricing Ceiling Rules
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/v1/admin/pricing-rules';
      const method = editingPricing ? 'PATCH' : 'POST';
      const body = editingPricing ? { id: editingPricing.id, ...pricingForm } : pricingForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || 'Règle de tarification enregistrée');
        setShowPricingModal(false);
        setEditingPricing(null);
        loadPricingRules();
      } else {
        alert(data.error || 'Erreur lors de l’enregistrement');
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const toggleRuleActive = async (rule: any) => {
    try {
      const res = await fetch('/api/v1/admin/pricing-rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, isActive: !rule.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(rule.isActive ? 'Règle désactivée.' : 'Règle activée.');
        loadPricingRules();
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const deletePricingRule = async (id: string) => {
    if (!confirm('Confirmez-vous la suppression de ce plafond tarifaire ?')) return;
    try {
      const res = await fetch(`/api/v1/admin/pricing-rules?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Barème supprimé.');
        loadPricingRules();
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  // Handlers: Student Moderation
  const handleModerateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingStudent) return;

    try {
      const isSuspending = !moderatingStudent.isSuspended;
      const res = await fetch('/api/v1/admin/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: moderatingStudent.id,
          isSuspended: isSuspending,
          suspensionReason: isSuspending ? suspensionReason : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(
          isSuspending
            ? `Étudiant ${moderatingStudent.email} suspendu.`
            : `Compte étudiant réactivé.`
        );
        setShowStudentModal(false);
        setModeratingStudent(null);
        loadStudents();
      } else {
        alert(data.error || 'Erreur lors de la modération');
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  // Handlers: Student Full Edit (Admin Authority)
  const loadFacultiesForEdit = async (instId: string) => {
    try {
      const res = await fetch(`/api/v1/academic/faculties?institutionId=${instId}&includeArchived=true`);
      const data = await res.json();
      if (data.success) setStudentEditFaculties(data.faculties || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openEditStudent = (st: any) => {
    setEditingStudent(st);
    const prof = st.profile || {};
    setStudentForm({
      userId: st.id,
      firstName: prof.firstName || '',
      lastName: prof.lastName || '',
      displayName: prof.displayName || '',
      email: st.email || '',
      ine: st.ine || '',
      phoneNumber: st.phoneNumber || '',
      points: st.points || 0,
      pointsJustification: 'Attribution accordée en faveur de la qualité et de la rigueur du contenu pédagogique',
      institutionId: prof.institutionId || '',
      facultyId: prof.facultyId || '',
      filiere: prof.filiere || '',
      city: prof.city || '',
      region: prof.region || 'Centre',
      avatarUrl: prof.avatarUrl || '',
      status: st.status || 'ACTIVE',
    });
    if (prof.institutionId) {
      loadFacultiesForEdit(prof.institutionId);
    } else {
      setStudentEditFaculties([]);
    }
    setShowStudentEditModal(true);
  };

  const handleEditStudentInstitutionChange = (newInstId: string) => {
    setStudentForm((prev) => ({ ...prev, institutionId: newInstId, facultyId: '' }));
    if (newInstId) {
      loadFacultiesForEdit(newInstId);
    } else {
      setStudentEditFaculties([]);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentForm.points !== (editingStudent?.points || 0) && !studentForm.pointsJustification?.trim()) {
      alert("Une justification en faveur de la qualité du contenu pédagogique est obligatoire pour modifier ou accorder des points amphi.");
      return;
    }
    setSavingStudent(true);
    try {
      const res = await fetch('/api/v1/admin/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Dossier étudiant mis à jour avec succès.');
        setShowStudentEditModal(false);
        setEditingStudent(null);
        loadStudents();
      } else {
        alert(data.error || "Erreur lors de la mise à jour de l'étudiant");
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setSavingStudent(false);
    }
  };

  // Filtered institutions
  const filteredInstitutions = institutions.filter((inst) => {
    if (selectedRegionFilter !== 'all' && inst.region !== selectedRegionFilter) return false;
    if (selectedCategoryFilter !== 'all' && inst.category !== selectedCategoryFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header title="Administration Centrale" showBack />

      {/* Global Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-surface px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 font-bold text-xs animate-bounce">
          <Icon name="check_circle" className="text-[18px] text-primary" />
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="flex-1 flex flex-col relative w-full pt-20 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Auth Guard Screen if not admin */}
        {authChecking ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Icon name="autorenew" className="text-4xl text-primary animate-spin" />
            <p className="mt-3 text-sm font-semibold text-on-surface-variant">
              Vérification des droits d'accès administrateur...
            </p>
          </div>
        ) : !isAdmin ? (
          <div className="max-w-md mx-auto my-12 p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-xl flex flex-col gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-error-container text-on-error-container mx-auto flex items-center justify-center">
              <Icon name="admin_panel_settings" className="text-3xl" />
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-black text-on-surface">
                Espace Réservé : Direction Campus Folder
              </h1>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Cette console permet de réguler les universités burkinabè, d'administrer les UFR,
                les filières et de fixer les barèmes plafonds anti-spéculation en FCFA.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-bold text-left">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="flex flex-col gap-3 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Identifiant Administrateur
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                  placeholder="admin@campusfolder.bf"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Clé Secrète / Mot de Passe
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                  placeholder="••••••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="mt-2 w-full h-12 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50"
              >
                {loginLoading ? (
                  <Icon name="progress_activity" className="text-[18px] animate-spin" />
                ) : (
                  <>
                    <Icon name="lock_open" className="text-[18px]" />
                    <span>Déverrouiller le Pupitre d'Administration</span>
                  </>
                )}
              </button>

              <div className="p-3 bg-surface-container rounded-xl text-[11px] text-on-surface-variant flex flex-col gap-1">
                <span className="font-bold text-primary flex items-center gap-1">
                  <Icon name="info" className="text-[14px]" />
                  Accès d'évaluation immédiat
                </span>
                <span>Email : <code className="font-mono font-bold">admin@campusfolder.bf</code></span>
                <span>Mot de passe : <code className="font-mono font-bold">Password@2025!</code></span>
              </div>
            </form>
          </div>
        ) : (
          /* Logged In Admin Dashboard */
          <div className="flex flex-col gap-6">
            {/* Top Navigation & Status Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-surface-container-lowest p-5 rounded-3xl border-2 border-primary/25 ring-1 ring-primary/10 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md">
                  <Icon name="shield_person" className="text-2xl" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Gouvernance & Régulation BF
                  </span>
                  <h1 className="text-xl font-black text-on-surface">
                    Console Centrale d'Administration
                  </h1>
                  <p className="text-xs text-on-surface-variant">
                    Opérateur : <strong className="text-primary">{currentUser.email}</strong> •
                    INE : {currentUser.ine || 'ADM-BF-2025-01'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/explorer"
                  className="px-3.5 py-2 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container transition-all flex items-center gap-1.5"
                >
                  <Icon name="visibility" className="text-[16px]" />
                  <span>Voir le site public</span>
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/v1/auth/logout', { method: 'POST' });
                    window.location.reload();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-error/10 text-error hover:bg-error/20 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Icon name="logout" className="text-[16px]" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav
              aria-label="Sections du pupitre d'administration"
              className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-outline-variant/30"
            >
              {[
                {
                  id: 'validations',
                  label: '1. Validations & SLA 24h',
                  icon: 'fact_check',
                  badge: validations.filter((v) => v.validationStatus === 'PENDING').length,
                  highlight: validations.some((v) => v.validationStatus === 'PENDING' && (v.reminderCount > 0 || v.priorityScore > 0)),
                },
                {
                  id: 'institutions',
                  label: '2. Universités BF',
                  icon: 'account_balance',
                  badge: institutions.length,
                },
                {
                  id: 'faculties',
                  label: '3. UFR & Facultés',
                  icon: 'domain',
                  badge: faculties.length,
                },
                {
                  id: 'filieres',
                  label: '4. Filières Académiques',
                  icon: 'school',
                  badge: filieres.length,
                },
                {
                  id: 'pricing',
                  label: '5. Barèmes Anti-Spéculation',
                  icon: 'price_check',
                  badge: pricingRules.length,
                },
                {
                  id: 'students',
                  label: '6. Modération Étudiants',
                  icon: 'group',
                  badge: students.length,
                },
                {
                  id: 'admins',
                  label: '7. Gestion Admins (Super Admin)',
                  icon: 'admin_panel_settings',
                  badge: adminsList.length,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all relative ${
                    activeTab === tab.id
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  } ${tab.highlight ? 'ring-2 ring-error animate-pulse' : ''}`}
                >
                  <Icon name={tab.icon} className="text-[18px]" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : tab.highlight
                        ? 'bg-error text-white'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              ))}
            </nav>

            {/* ========================================================= */}
            {/* TAB 1: VALIDATIONS & EXAMENS 24H (SLA & RAPPELS PRIORITAIRES) */}
            {/* ========================================================= */}
            {activeTab === 'validations' && (
              <section aria-labelledby="tab-validations-heading" className="flex flex-col gap-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-container-lowest p-5 rounded-3xl border-2 border-outline-variant/40 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon name="fact_check" className="text-primary text-xl" />
                      <h2 id="tab-validations-heading" className="text-base font-black text-on-surface">
                        Centre d'Examen Pédagogique & Validations 24h
                      </h2>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Contrôlez l'authenticité, la présence obligatoire des médias et le respect du barème avant publication officielle au catalogue Burkinabè.
                    </p>
                  </div>

                  {/* Status counts pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'PENDING', label: 'En attente', count: validations.filter((v) => v.validationStatus === 'PENDING').length, color: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
                      { id: 'APPROVED', label: 'Validés', count: validations.filter((v) => v.validationStatus === 'APPROVED').length, color: 'bg-green-500/15 text-green-700 border-green-500/30' },
                      { id: 'REJECTED', label: 'Rejetés', count: validations.filter((v) => v.validationStatus === 'REJECTED').length, color: 'bg-red-500/15 text-red-700 border-red-500/30' },
                      { id: 'ALL', label: 'Tous', count: validations.length, color: 'bg-surface-container-high text-on-surface border-outline-variant/30' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setValidationStatusFilter(st.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                          validationStatusFilter === st.id
                            ? 'ring-2 ring-primary shadow-xs font-black'
                            : 'opacity-70 hover:opacity-100'
                        } ${st.color}`}
                      >
                        <span>{st.label}</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-white/40 dark:bg-black/20 text-[10px] font-black">
                          {st.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar for Validations */}
                <div className="relative">
                  <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]" />
                  <input
                    type="text"
                    value={validationSearchTerm}
                    onChange={(e) => setValidationSearchTerm(e.target.value)}
                    placeholder="Filtrer par titre de document, auteur, INE, université ou UFR..."
                    className="w-full h-11 pl-10 pr-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
                  />
                  {validationSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setValidationSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                    >
                      <Icon name="close" className="text-[16px]" />
                    </button>
                  )}
                </div>

                {/* Validations List */}
                {loadingValidations ? (
                  <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest rounded-3xl border border-outline-variant/30">
                    <Icon name="progress_activity" className="text-4xl text-primary animate-spin" />
                    <span className="text-xs font-bold text-on-surface-variant mt-2">
                      Chargement des dossiers d'examen...
                    </span>
                  </div>
                ) : (
                  (() => {
                    const filtered = validations.filter((res) => {
                      if (!validationSearchTerm.trim()) return true;
                      const term = validationSearchTerm.toLowerCase();
                      return (
                        res.title?.toLowerCase().includes(term) ||
                        res.author?.profile?.displayName?.toLowerCase().includes(term) ||
                        res.author?.ine?.toLowerCase().includes(term) ||
                        res.author?.email?.toLowerCase().includes(term) ||
                        res.institution?.name?.toLowerCase().includes(term) ||
                        res.faculty?.name?.toLowerCase().includes(term)
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 text-center gap-2">
                          <Icon name="task_alt" className="text-4xl text-primary/40" />
                          <h3 className="text-sm font-black text-on-surface">
                            Aucun document en attente dans cette catégorie
                          </h3>
                          <p className="text-xs text-on-surface-variant max-w-md">
                            Toutes les soumissions universitaires ont été traitées avec succès conformément à l'engagement de service 24h.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 gap-4">
                        {filtered.map((res) => {
                          const elapsedMs = Date.now() - new Date(res.submittedAt || res.createdAt).getTime();
                          const hoursElapsed = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60)));
                          const isPending = res.validationStatus === 'PENDING';
                          const isSlaBreached = isPending && hoursElapsed >= 24;
                          const hasReminders = (res.reminderCount || 0) > 0;

                          return (
                            <article
                              key={res.id}
                              className={`p-5 rounded-3xl bg-surface-container-lowest border transition-all shadow-xs flex flex-col gap-4 ${
                                isSlaBreached || hasReminders
                                  ? 'border-error/40 ring-1 ring-error/20 bg-error/[0.02]'
                                  : 'border-outline-variant/30 hover:border-primary/40'
                              }`}
                            >
                              {/* Top metadata strip */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Status badge */}
                                  <span
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      res.validationStatus === 'APPROVED'
                                        ? 'bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30'
                                        : res.validationStatus === 'REJECTED'
                                        ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {res.validationStatus === 'APPROVED'
                                      ? 'Validé & Publié'
                                      : res.validationStatus === 'REJECTED'
                                      ? 'Rejeté'
                                      : 'En attente d’examen'}
                                  </span>

                                  {/* Reminder alert badge */}
                                  {hasReminders && (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-error text-white flex items-center gap-1 animate-pulse">
                                      <Icon name="notification_important" className="text-[13px]" />
                                      URGENT • {res.reminderCount} RAPPEL(S) ÉTUDIANT (Priorité +{res.priorityScore || 0})
                                    </span>
                                  )}

                                  {/* SLA 24h timer */}
                                  {isPending && (
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 border ${
                                        isSlaBreached
                                          ? 'bg-error/15 text-error border-error/30'
                                          : 'bg-surface-container-high text-on-surface-variant border-outline-variant/30'
                                      }`}
                                    >
                                      <Icon name={isSlaBreached ? 'timer_off' : 'schedule'} className="text-[13px]" />
                                      {isSlaBreached
                                        ? `⚠️ Engagement 24h dépassé (${hoursElapsed}h d'attente)`
                                        : `Temps écoulé : ${hoursElapsed}h / 24h promis`}
                                    </span>
                                  )}

                                  {res.validationStatus === 'APPROVED' && res.validatedAt && (
                                    <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                                      <Icon name="check_circle" className="text-[14px]" />
                                      Validé le {new Date(res.validatedAt).toLocaleDateString('fr-FR')} par {res.validatedBy || 'Admin'}
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-outline font-medium">
                                  Soumis le {new Date(res.submittedAt || res.createdAt).toLocaleDateString('fr-FR')} à {new Date(res.submittedAt || res.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>

                              {/* Resource Title & Details */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 flex flex-col gap-2">
                                  <h3 className="text-sm font-black text-on-surface">
                                    {res.title}
                                  </h3>
                                  {res.description && (
                                    <p className="text-xs text-on-surface-variant line-clamp-2">
                                      {res.description}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 rounded-lg bg-surface-container-high text-[11px] font-bold text-on-surface">
                                      {res.institution?.name || 'Université'}
                                    </span>
                                    {res.faculty?.name && (
                                      <span className="px-2 py-0.5 rounded-lg bg-surface-container text-[11px] font-bold text-on-surface-variant">
                                        {res.faculty.name}
                                      </span>
                                    )}
                                    {res.filiere?.name && (
                                      <span className="px-2 py-0.5 rounded-lg bg-surface-container text-[11px] font-bold text-on-surface-variant">
                                        {res.filiere.name}
                                      </span>
                                    )}
                                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
                                      {res.documentType || 'DOCUMENT'}
                                    </span>
                                  </div>

                                  {/* Author identity */}
                                  <div className="p-3 bg-surface-container rounded-2xl flex items-center justify-between text-xs mt-1">
                                    <div className="flex items-center gap-2">
                                      <Icon name="person" className="text-primary text-[18px]" />
                                      <div>
                                        <span className="font-black text-on-surface block">
                                          {res.author?.profile?.displayName || `${res.author?.profile?.firstName || ''} ${res.author?.profile?.lastName || ''}` || res.author?.email}
                                        </span>
                                        <span className="text-[10px] text-on-surface-variant font-mono">
                                          INE : {res.author?.ine || 'N/A'} • {res.author?.email}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right font-mono">
                                      <span className="text-xs font-black text-primary block">
                                        {res.price} FCFA
                                      </span>
                                      <span className="text-[10px] text-outline">
                                        Gain auteur : {Math.round(res.price * ((100 - platformCommission) / 100))} F ({100 - platformCommission}%)
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Media Files Preview */}
                                <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/30 flex flex-col gap-2">
                                  <div className="flex items-center justify-between text-[11px] font-black text-on-surface border-b border-outline-variant/20 pb-1.5">
                                    <span className="flex items-center gap-1">
                                      <Icon name="attachment" className="text-[15px] text-primary" />
                                      Médias Attachés ({res.files?.length || 0})
                                    </span>
                                    <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                                      <Icon name="verified" className="text-[12px]" />
                                      Vérifié
                                    </span>
                                  </div>

                                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-28">
                                    {res.files && res.files.length > 0 ? (
                                      res.files.map((file: any, fIdx: number) => (
                                        <div
                                          key={file.id || fIdx}
                                          className="flex items-center justify-between p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-[11px]"
                                        >
                                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                            <Icon name={file.format === 'PDF' ? 'picture_as_pdf' : file.format === 'AUDIO' ? 'audio_file' : 'videocam'} className="text-[15px] text-primary shrink-0" />
                                            <span className="truncate font-semibold text-on-surface">
                                              {file.name || `Fichier ${fIdx + 1}`}
                                            </span>
                                          </div>
                                          {file.url && (
                                            <a
                                              href={file.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-[10px] font-black text-primary hover:underline shrink-0"
                                            >
                                              Ouvrir
                                            </a>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-[11px] text-error font-bold">
                                        ⚠️ Aucun fichier média rattaché !
                                      </span>
                                    )}
                                  </div>

                                  {/* Prior Note if existing */}
                                  {res.validationNote && (
                                    <div className="mt-1 p-2 rounded-xl bg-surface-container text-[11px] flex flex-col gap-0.5">
                                      <span className="font-bold text-on-surface">Motif / Commentaire :</span>
                                      <span className="text-on-surface-variant italic">"{res.validationNote}"</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/20 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValidationActionModal({ type: 'DELETE', resource: res });
                                    setValidationNoteInput('');
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-error/10 hover:bg-error/20 text-error text-xs font-bold transition-all flex items-center gap-1"
                                  title="Supprimer définitivement de la base de données avec justification obligatoire"
                                >
                                  <Icon name="delete_forever" className="text-[16px]" />
                                  <span>Supprimer définitivement</span>
                                </button>

                                <div className="flex items-center gap-2">
                                  {isPending ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setValidationActionModal({ type: 'REJECT', resource: res });
                                          setValidationNoteInput('');
                                        }}
                                        className="px-4 py-2 rounded-xl bg-error/10 text-error hover:bg-error/20 text-xs font-bold transition-all flex items-center gap-1.5"
                                      >
                                        <Icon name="cancel" className="text-[16px]" />
                                        <span>Rejeter avec motif</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setValidationActionModal({ type: 'APPROVE', resource: res });
                                          setValidationNoteInput('Document conforme aux programmes académiques officiels du Burkina Faso.');
                                        }}
                                        className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                                      >
                                        <Icon name="check_circle" className="text-[16px]" />
                                        <span>Valider & Publier au Catalogue</span>
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextType = res.validationStatus === 'APPROVED' ? 'REJECT' : 'APPROVE';
                                        setValidationActionModal({ type: nextType, resource: res });
                                        setValidationNoteInput('');
                                      }}
                                      className="px-3.5 py-1.5 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container transition-all flex items-center gap-1"
                                    >
                                      <Icon name="edit_note" className="text-[15px]" />
                                      <span>Modifier le statut ({res.validationStatus === 'APPROVED' ? 'Rejeter' : 'Valider'})</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </section>
            )}

            {/* ========================================================= */}
            {/* TAB 2: UNIVERSITÉS DU BURKINA FASO */}
            {/* ========================================================= */}
            {activeTab === 'institutions' && (
              <section aria-labelledby="tab-institutions-heading" className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 id="tab-institutions-heading" className="text-base font-black text-on-surface">
                      Universités & Établissements d'Enseignement Supérieur du Burkina Faso
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Gérez les établissements officiels, leurs logos, régions administratives et
                      statuts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInst(null);
                      setInstForm({
                        name: '',
                        shortName: '',
                        category: 'UNIVERSITE_PUBLIQUE',
                        region: 'Centre',
                        city: 'Ouagadougou',
                        logoUrl: '',
                        websiteUrl: '',
                      });
                      setShowInstModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <Icon name="add" className="text-[18px]" />
                    <span>Ajouter un établissement</span>
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20">
                  <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1 mr-1">
                    <Icon name="filter_alt" className="text-[16px] text-primary" />
                    Filtres :
                  </span>

                  {/* Region Filter */}
                  <select
                    value={selectedRegionFilter}
                    onChange={(e) => setSelectedRegionFilter(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-on-surface focus:outline-none"
                  >
                    <option value="all">Toutes les régions (13)</option>
                    {BF_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        Région {r}
                      </option>
                    ))}
                  </select>

                  {/* Category Filter */}
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-on-surface focus:outline-none"
                  >
                    <option value="all">Toutes les catégories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <span className="ml-auto text-xs font-semibold text-on-surface-variant">
                    {filteredInstitutions.length} résultat(s)
                  </span>
                </div>

                {/* Grid / Table of Institutions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInstitutions.map((inst) => (
                    <article
                      key={inst.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                        inst.isArchived
                          ? 'bg-surface-container/50 border-outline-variant/20 opacity-60'
                          : 'bg-surface-container-lowest border-outline-variant/30 shadow-xs hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center overflow-hidden shrink-0">
                          {inst.logoUrl ? (
                            <img
                              src={inst.logoUrl}
                              alt={inst.shortName}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <Icon name="account_balance" className="text-primary text-2xl" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono font-black text-xs text-primary truncate">
                              {inst.shortName}
                            </span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                inst.isArchived
                                  ? 'bg-outline-variant text-on-surface-variant'
                                  : 'bg-primary-container text-on-primary-container'
                              }`}
                            >
                              {inst.isArchived ? 'Archivé' : 'Actif'}
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-on-surface line-clamp-2 mt-0.5">
                            {inst.name}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-1">
                            <span className="flex items-center gap-0.5 font-semibold">
                              <Icon name="location_on" className="text-[13px] text-secondary" />
                              {inst.city} ({inst.region})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-xs">
                        <span className="text-[11px] font-semibold text-outline">
                          {inst.faculties?.length || 0} UFR / Facultés
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingInst(inst);
                              setInstForm({
                                name: inst.name,
                                shortName: inst.shortName,
                                category: inst.category || 'UNIVERSITE_PUBLIQUE',
                                region: inst.region || 'Centre',
                                city: inst.city || 'Ouagadougou',
                                logoUrl: inst.logoUrl || '',
                                websiteUrl: inst.websiteUrl || '',
                              });
                              setShowInstModal(true);
                            }}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary-fixed/30 transition-colors"
                            title="Modifier"
                          >
                            <Icon name="edit" className="text-[18px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleArchiveInstitution(inst)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              inst.isArchived
                                ? 'text-secondary hover:bg-secondary/10'
                                : 'text-error hover:bg-error/10'
                            }`}
                            title={inst.isArchived ? 'Désarchiver' : 'Archiver'}
                          >
                            <Icon name={inst.isArchived ? 'unarchive' : 'archive'} className="text-[18px]" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* ========================================================= */}
            {/* TAB 2: UFR & FACULTÉS */}
            {/* ========================================================= */}
            {activeTab === 'faculties' && (
              <section aria-labelledby="tab-faculties-heading" className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 id="tab-faculties-heading" className="text-base font-black text-on-surface">
                      UFR, Facultés & Instituts Spécialisés
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Chaque faculté est strictement rattachée à son université burkinabè tutélaire.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFaculty(null);
                      setFacultyForm({
                        institutionId:
                          selectedInstForFaculty !== 'all'
                            ? selectedInstForFaculty
                            : institutions[0]?.id || '',
                        name: '',
                        code: '',
                        iconName: 'school',
                        logoUrl: '',
                        description: '',
                      });
                      setShowFacultyModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <Icon name="add" className="text-[18px]" />
                    <span>Ajouter une UFR / Faculté</span>
                  </button>
                </div>

                {/* Filter by University */}
                <div className="flex items-center gap-3 bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20">
                  <label className="text-xs font-bold text-on-surface-variant shrink-0">
                    Université de rattachement :
                  </label>
                  <select
                    value={selectedInstForFaculty}
                    onChange={(e) => setSelectedInstForFaculty(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-on-surface focus:outline-none max-w-sm"
                  >
                    <option value="all">Toutes les universités</option>
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.shortName} - {i.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Faculties Table */}
                <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/20 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Code & Sigle</th>
                        <th className="p-3">Intitulé de l'UFR / Faculté</th>
                        <th className="p-3">Université Tutélaire</th>
                        <th className="p-3">Filières Actives</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {faculties.map((fac) => (
                        <tr
                          key={fac.id}
                          className={`hover:bg-surface-container/30 transition-colors ${
                            fac.isArchived ? 'opacity-50' : ''
                          }`}
                        >
                          <td className="p-3 font-mono font-black text-primary uppercase">
                            {fac.code}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-on-surface">{fac.name}</span>
                            {fac.description && (
                              <p className="text-[11px] text-on-surface-variant line-clamp-1">
                                {fac.description}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-on-surface-variant font-semibold">
                            {fac.institution?.shortName || 'N/A'}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-primary-fixed/40 text-primary font-bold text-[11px]">
                              {fac.filieres?.length || 0} filières
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                fac.isArchived
                                  ? 'bg-outline-variant text-on-surface-variant'
                                  : 'bg-primary-container text-on-primary-container'
                              }`}
                            >
                              {fac.isArchived ? 'Archivée' : 'Active'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFaculty(fac);
                                  setFacultyForm({
                                    institutionId: fac.institutionId,
                                    name: fac.name,
                                    code: fac.code,
                                    iconName: fac.iconName || 'school',
                                    logoUrl: fac.logoUrl || '',
                                    description: fac.description || '',
                                  });
                                  setShowFacultyModal(true);
                                }}
                                className="p-1 rounded-md text-primary hover:bg-primary-fixed/30"
                                title="Modifier"
                              >
                                <Icon name="edit" className="text-[16px]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleArchiveFaculty(fac)}
                                className={`p-1 rounded-md ${
                                  fac.isArchived
                                    ? 'text-secondary hover:bg-secondary/10'
                                    : 'text-error hover:bg-error/10'
                                }`}
                                title={fac.isArchived ? 'Restaurer' : 'Archiver'}
                              >
                                <Icon name={fac.isArchived ? 'unarchive' : 'archive'} className="text-[16px]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ========================================================= */}
            {/* TAB 3: FILIÈRES ACADÉMIQUES */}
            {/* ========================================================= */}
            {activeTab === 'filieres' && (
              <section aria-labelledby="tab-filieres-heading" className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 id="tab-filieres-heading" className="text-base font-black text-on-surface">
                      Filières & Spécialités Académiques
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Chaque filière est rattachée à une UFR spécifique et définit le cursus
                      (Licence, Master, Doctorat, Ingénieur).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFiliere(null);
                      setFiliereForm({
                        facultyId: faculties[0]?.id || '',
                        name: '',
                        code: '',
                        degreeLevel: 'LICENCE',
                        description: '',
                      });
                      setShowFiliereModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <Icon name="add" className="text-[18px]" />
                    <span>Ajouter une Filière</span>
                  </button>
                </div>

                {/* Cascaded Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-on-surface-variant">
                      1. Université :
                    </label>
                    <select
                      value={selectedInstForFiliere}
                      onChange={(e) => {
                        setSelectedInstForFiliere(e.target.value);
                        setSelectedFacultyForFiliere('all');
                      }}
                      className="h-9 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-on-surface focus:outline-none"
                    >
                      <option value="all">Toutes les universités</option>
                      {institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.shortName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-on-surface-variant">2. UFR :</label>
                    <select
                      value={selectedFacultyForFiliere}
                      onChange={(e) => setSelectedFacultyForFiliere(e.target.value)}
                      className="h-9 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-on-surface focus:outline-none"
                    >
                      <option value="all">Toutes les UFR</option>
                      {faculties
                        .filter(
                          (f) =>
                            selectedInstForFiliere === 'all' ||
                            f.institutionId === selectedInstForFiliere
                        )
                        .map((fac) => (
                          <option key={fac.id} value={fac.id}>
                            {fac.name} ({fac.institution?.shortName})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Filières Table */}
                <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/20 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Code Filière</th>
                        <th className="p-3">Intitulé de la Spécialité</th>
                        <th className="p-3">Cycle / Diplôme</th>
                        <th className="p-3">UFR & Université</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {filieres.map((fil) => (
                        <tr
                          key={fil.id}
                          className={`hover:bg-surface-container/30 transition-colors ${
                            fil.isArchived ? 'opacity-50' : ''
                          }`}
                        >
                          <td className="p-3 font-mono font-black text-primary uppercase">
                            {fil.code}
                          </td>
                          <td className="p-3 font-bold text-on-surface">{fil.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-bold text-[10px] uppercase">
                              {fil.degreeLevel}
                            </span>
                          </td>
                          <td className="p-3 text-on-surface-variant font-semibold">
                            {fil.faculty?.name} ({fil.faculty?.institution?.shortName})
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                fil.isArchived
                                  ? 'bg-outline-variant text-on-surface-variant'
                                  : 'bg-primary-container text-on-primary-container'
                              }`}
                            >
                              {fil.isArchived ? 'Archivée' : 'Active'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFiliere(fil);
                                  setFiliereForm({
                                    facultyId: fil.facultyId,
                                    name: fil.name,
                                    code: fil.code,
                                    degreeLevel: fil.degreeLevel || 'LICENCE',
                                    description: fil.description || '',
                                  });
                                  setShowFiliereModal(true);
                                }}
                                className="p-1 rounded-md text-primary hover:bg-primary-fixed/30"
                                title="Modifier"
                              >
                                <Icon name="edit" className="text-[16px]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleArchiveFiliere(fil)}
                                className={`p-1 rounded-md ${
                                  fil.isArchived
                                    ? 'text-secondary hover:bg-secondary/10'
                                    : 'text-error hover:bg-error/10'
                                }`}
                                title={fil.isArchived ? 'Restaurer' : 'Archiver'}
                              >
                                <Icon name={fil.isArchived ? 'unarchive' : 'archive'} className="text-[16px]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ========================================================= */}
            {/* TAB 4: BARÈMES ANTI-SPÉCULATION & PRIX PLAFONDS */}
            {/* ========================================================= */}
            {activeTab === 'pricing' && (
              <section aria-labelledby="tab-pricing-heading" className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 id="tab-pricing-heading" className="text-base font-black text-on-surface flex items-center gap-2">
                      <span>Régulation Éthique & Barèmes Plafonds Anti-Spéculation (FCFA)</span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary text-[10px] font-extrabold">
                        LOI ÉTUDIANTE BF
                      </span>
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Empêche la spéculation sur les mémoires, thèses et corrigés d'examen. Les
                      auteurs ne peuvent excéder le barème fixé.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPricing(null);
                      setPricingForm({
                        title: '',
                        documentType: 'ALL',
                        mediaFormat: 'ALL',
                        minPrice: 0,
                        maxPrice: 1000,
                        suggestedPrice: 500,
                        institutionId: '',
                        facultyId: '',
                        filiereId: '',
                        notes: '',
                      });
                      setShowPricingModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <Icon name="add" className="text-[18px]" />
                    <span>Ajouter un Barème Plafond</span>
                  </button>
                </div>

                {/* ======================================================== */}
                {/* SECTION 4.1: PARAMÉTRAGE CENTRALISÉ COMMISSION & ROYALTIES */}
                {/* ======================================================== */}
                <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-primary/5 border-2 border-primary/20 shadow-sm flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon name="payments" className="text-[22px]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm md:text-base font-black text-on-surface">
                            Paramétrage Centralisé des Commissions & Royalties
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-black uppercase">
                            Global
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Définit automatiquement la répartition financière sur chaque monétisation (téléchargement payant, billet masterclass).
                        </p>
                      </div>
                    </div>

                    {commissionUpdatedAt && (
                      <span className="text-[10px] font-mono text-outline self-start sm:self-center">
                        Dernière modif : {new Date(commissionUpdatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {commissionFeedback && (
                    <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                      <Icon name="check_circle" className="text-[18px] text-green-600 shrink-0" />
                      <span>{commissionFeedback}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
                    {/* Gauge Visual */}
                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30">
                      <span className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                        Répartition Active
                      </span>
                      <div className="flex items-baseline justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-outline">Part Plateforme</span>
                          <span className="text-2xl font-black text-primary font-mono">{platformCommission}%</span>
                        </div>
                        <div className="text-right flex flex-col">
                          <span className="text-xs font-semibold text-outline">Part Auteur / Net</span>
                          <span className="text-2xl font-black text-green-600 font-mono">{100 - platformCommission}%</span>
                        </div>
                      </div>
                      <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden flex">
                        <div className="bg-primary h-full transition-all duration-300" style={{ width: `${platformCommission}%` }} />
                        <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${100 - platformCommission}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-on-surface-variant pt-1">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary"></span> Campus Folder ({platformCommission}%)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span> Auteur ({100 - platformCommission}%)
                        </span>
                      </div>
                    </div>

                    {/* Interactive Slider & Controls */}
                    <div className="flex flex-col gap-3 lg:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-on-surface">
                          Ajuster la commission de la plateforme :
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={platformCommission}
                            onChange={(e) => setPlatformCommission(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                            className="w-16 h-8 text-center font-mono font-black text-sm rounded-xl bg-surface-container-low border border-outline-variant/40 text-primary focus:outline-none"
                          />
                          <span className="text-xs font-bold text-on-surface-variant">%</span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={platformCommission}
                        onChange={(e) => setPlatformCommission(Number(e.target.value))}
                        className="w-full accent-primary h-2 bg-surface-container-high rounded-lg cursor-pointer"
                      />

                      {/* Presets */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[11px] font-semibold text-outline">Raccourcis :</span>
                        <button
                          type="button"
                          onClick={() => { setPlatformCommission(40); handleSaveCommission(40); }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            platformCommission === 40
                              ? 'bg-primary text-on-primary shadow-xs'
                              : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                          }`}
                        >
                          40% Plateforme / 60% Auteur (Officiel)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPlatformCommission(30); handleSaveCommission(30); }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            platformCommission === 30
                              ? 'bg-primary text-on-primary shadow-xs'
                              : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                          }`}
                        >
                          30% / 70%
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPlatformCommission(50); handleSaveCommission(50); }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            platformCommission === 50
                              ? 'bg-primary text-on-primary shadow-xs'
                              : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                          }`}
                        >
                          50% / 50%
                        </button>
                      </div>

                      {/* Simulation & Save CTA */}
                      <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                        <div className="text-[11px] text-on-surface-variant flex items-center gap-2">
                          <Icon name="calculate" className="text-primary text-[18px]" />
                          <span>Exemple document à <strong>1 000 FCFA</strong> : Plateforme <strong>{Math.round(1000 * platformCommission / 100)} FCFA</strong> • Auteur <strong>{Math.round(1000 * (100 - platformCommission) / 100)} FCFA</strong></span>
                        </div>
                        <button
                          type="button"
                          disabled={isUpdatingCommission}
                          onClick={() => handleSaveCommission()}
                          className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                        >
                          <Icon name={isUpdatingCommission ? 'progress_activity' : 'save'} className={`text-[16px] ${isUpdatingCommission ? 'animate-spin' : ''}`} />
                          <span>{isUpdatingCommission ? 'Enregistrement...' : 'Enregistrer le Taux'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Regulatory Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pricingRules.map((rule) => (
                    <article
                      key={rule.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                        rule.isActive
                          ? 'bg-surface-container-lowest border-outline-variant/30 shadow-xs'
                          : 'bg-surface-container/50 border-outline-variant/20 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                            {DOC_TYPES.find((d) => d.id === rule.documentType)?.label ||
                              rule.documentType}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              rule.isActive
                                ? 'bg-primary-container text-on-primary-container'
                                : 'bg-outline-variant text-on-surface-variant'
                            }`}
                          >
                            {rule.isActive ? 'Vigueur' : 'Inactif'}
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-on-surface">{rule.title}</h3>
                        {rule.notes && (
                          <p className="text-[11px] text-on-surface-variant leading-relaxed">
                            {rule.notes}
                          </p>
                        )}
                      </div>

                      <div className="p-3 bg-surface-container rounded-xl flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-outline">
                            Prix Conseillé
                          </span>
                          <span className="text-xs font-black text-on-surface">
                            {rule.suggestedPrice} FCFA
                          </span>
                        </div>
                        <div className="h-6 w-px bg-outline-variant/40"></div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] uppercase font-bold text-error">
                            Plafond Max Strict
                          </span>
                          <span className="text-sm font-black text-error">
                            {rule.maxPrice} FCFA
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-xs">
                        <span className="text-[10px] font-mono text-on-surface-variant">
                          Format : {rule.mediaFormat}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleRuleActive(rule)}
                            className="p-1 rounded-md text-secondary hover:bg-secondary/10"
                            title={rule.isActive ? 'Désactiver' : 'Activer'}
                          >
                            <Icon name={rule.isActive ? 'toggle_on' : 'toggle_off'} className="text-[16px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPricing(rule);
                              setPricingForm({
                                title: rule.title,
                                documentType: rule.documentType,
                                mediaFormat: rule.mediaFormat,
                                minPrice: rule.minPrice,
                                maxPrice: rule.maxPrice,
                                suggestedPrice: rule.suggestedPrice,
                                institutionId: rule.institutionId || '',
                                facultyId: rule.facultyId || '',
                                filiereId: rule.filiereId || '',
                                notes: rule.notes || '',
                              });
                              setShowPricingModal(true);
                            }}
                            className="p-1 rounded-md text-primary hover:bg-primary-fixed/30"
                            title="Modifier"
                          >
                            <Icon name="edit" className="text-[16px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePricingRule(rule.id)}
                            className="p-1 rounded-md text-error hover:bg-error/10"
                            title="Supprimer"
                          >
                            <Icon name="delete" className="text-[16px]" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* ========================================================= */}
            {/* TAB 5: MODÉRATION DES ÉTUDIANTS */}
            {/* ========================================================= */}
            {activeTab === 'students' && (
              <section aria-labelledby="tab-students-heading" className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 id="tab-students-heading" className="text-base font-black text-on-surface">
                      Modération & Audit des Comptes Étudiants
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Contrôlez l'authenticité des INE, modérez les comportements et suspendez les
                      comptes frauduleux si nécessaire.
                    </p>
                  </div>
                </div>

                {/* Student Search & Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20">
                  <div className="flex items-center gap-2 flex-1 min-w-[240px] bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-outline-variant/30">
                    <Icon name="search" className="text-[18px] text-primary" />
                    <input
                      type="text"
                      placeholder="Rechercher par INE, email ou nom..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-on-surface focus:outline-none"
                    />
                  </div>

                  <select
                    value={studentInstFilter}
                    onChange={(e) => setStudentInstFilter(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-on-surface focus:outline-none"
                  >
                    <option value="all">Toutes les universités</option>
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Students Table */}
                <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/20 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">INE Étudiant</th>
                        <th className="p-3">Nom & Prénom</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Université & Filière</th>
                        <th className="p-3">Points Amphi</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3 text-right">Modération</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {students.map((st) => (
                        <tr
                          key={st.id}
                          className={`hover:bg-surface-container/30 transition-colors ${
                            st.isSuspended ? 'bg-error/5' : ''
                          }`}
                        >
                          <td className="p-3 font-mono font-black text-primary">{st.ine}</td>
                          <td className="p-3 font-bold text-on-surface">
                            {st.profile?.displayName ||
                              `${st.profile?.firstName || ''} ${st.profile?.lastName || ''}`}
                          </td>
                          <td className="p-3 text-on-surface-variant font-mono">{st.email}</td>
                          <td className="p-3">
                            <span className="font-bold text-on-surface block">
                              {st.profile?.institution?.shortName || 'N/A'}
                            </span>
                            <span className="text-[10px] text-outline">
                              {st.profile?.filiere || st.profile?.faculty?.name || '-'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-secondary">
                            {st.points || 0} pts
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                st.isSuspended
                                  ? 'bg-error-container text-on-error-container'
                                  : 'bg-primary-container text-on-primary-container'
                              }`}
                            >
                              {st.isSuspended ? 'Suspendu' : 'Actif'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditStudent(st)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1 shrink-0"
                                title="Modifier toutes les informations de l'étudiant (transfert, coordonnées, points)"
                              >
                                <Icon name="edit" className="text-[15px]" />
                                <span>Éditer</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setModeratingStudent(st);
                                  setSuspensionReason(st.suspensionReason || '');
                                  setShowStudentModal(true);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                                  st.isSuspended
                                    ? 'bg-primary text-on-primary hover:bg-primary/90'
                                    : 'bg-error/10 text-error hover:bg-error/20'
                                }`}
                              >
                                {st.isSuspended ? 'Réactiver' : 'Suspendre'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ========================================================= */}
            {/* TAB 7: GESTION DU COLLÈGE D'ADMINISTRATION (SUPER ADMIN) */}
            {/* ========================================================= */}
            {activeTab === 'admins' && (
              <section aria-labelledby="tab-admins-heading" className="flex flex-col gap-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon name="admin_panel_settings" className="text-primary text-xl" />
                      <h2 id="tab-admins-heading" className="text-base font-black text-on-surface">
                        Collège d'Administration & Super Gouvernance
                      </h2>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Nommez de nouveaux administrateurs, déléguez la gestion des universités et contrôlez les privilèges d'accès à la plateforme.
                    </p>
                  </div>

                  {currentUser?.isSuperAdmin ? (
                    <button
                      type="button"
                      onClick={() => setShowAdminModal(true)}
                      className="px-4 py-2.5 rounded-2xl bg-primary text-on-primary font-bold text-xs flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all shrink-0"
                    >
                      <Icon name="person_add" className="text-[18px]" />
                      <span>+ Nouvel Administrateur</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 text-xs font-bold border border-amber-500/20 flex items-center gap-1.5">
                      <Icon name="lock" className="text-[16px]" />
                      <span>Lecture seule (Réservé au Super Admin)</span>
                    </div>
                  )}
                </div>

                {!currentUser?.isSuperAdmin && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
                    <Icon name="verified_user" className="text-2xl text-amber-600 shrink-0" />
                    <p>
                      <strong>Information de sécurité :</strong> Vous êtes connecté en tant qu'administrateur standard. Seul le <strong>Super Administrateur</strong> ({currentUser?.email?.includes('admin@') ? 'Votre compte' : 'admin@campusfolder.bf'}) possède les droits de nomination, de promotion et de suspension des gestionnaires.
                    </p>
                  </div>
                )}

                {/* Admins Table */}
                <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-on-surface">
                      <thead className="bg-surface-container text-on-surface-variant uppercase text-[10px] font-black tracking-wider">
                        <tr>
                          <th className="p-3.5">Administrateur</th>
                          <th className="p-3.5">Identifiant / INE</th>
                          <th className="p-3.5">Accréditation</th>
                          <th className="p-3.5">Statut</th>
                          <th className="p-3.5">Enrôlement</th>
                          <th className="p-3.5 text-right">Actions de Gouvernance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {loadingAdmins ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-on-surface-variant font-medium">
                              <Icon name="progress_activity" className="text-2xl animate-spin align-middle mr-2" />
                              Chargement du collège d'administration...
                            </td>
                          </tr>
                        ) : adminsList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-on-surface-variant font-medium">
                              Aucun administrateur répertorié.
                            </td>
                          </tr>
                        ) : (
                          adminsList.map((adm) => {
                            const isSelf = adm.id === currentUser?.id;
                            const admName = adm.profile?.displayName || `${adm.profile?.firstName || ''} ${adm.profile?.lastName || ''}`.trim() || 'Administrateur';

                            return (
                              <tr key={adm.id} className="hover:bg-surface-container/30 transition-colors">
                                <td className="p-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                                      {adm.isSuperAdmin ? (
                                        <Icon name="stars" className="text-[18px] text-amber-600" />
                                      ) : (
                                        <Icon name="shield_person" className="text-[18px]" />
                                      )}
                                    </div>
                                    <div>
                                      <span className="font-bold text-on-surface block flex items-center gap-1.5">
                                        {admName}
                                        {isSelf && (
                                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-primary/15 text-primary font-black">
                                            VOUS
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-[11px] text-on-surface-variant font-mono">
                                        {adm.email}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-3.5 font-mono font-bold text-primary">
                                  {adm.ine || 'ADM-ROOT'}
                                </td>

                                <td className="p-3.5">
                                  {adm.isSuperAdmin ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                                      <Icon name="verified_user" className="text-[13px]" />
                                      SUPER ADMIN
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/30 inline-flex items-center gap-1">
                                      <Icon name="shield" className="text-[13px]" />
                                      ADMIN STANDARD
                                    </span>
                                  )}
                                </td>

                                <td className="p-3.5">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                                      adm.status === 'ACTIVE'
                                        ? 'bg-green-500/15 text-green-700 border border-green-500/30'
                                        : 'bg-error/15 text-error border border-error/30'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${adm.status === 'ACTIVE' ? 'bg-green-600' : 'bg-error'}`} />
                                    {adm.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                                  </span>
                                </td>

                                <td className="p-3.5 text-on-surface-variant text-[11px]">
                                  {new Date(adm.createdAt).toLocaleDateString('fr-FR')}
                                </td>

                                <td className="p-3.5 text-right">
                                  {currentUser?.isSuperAdmin ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* Toggle Super Admin */}
                                      <button
                                        type="button"
                                        disabled={isSelf}
                                        onClick={() => handleToggleSuperAdmin(adm)}
                                        title={adm.isSuperAdmin ? 'Rétrograder en Admin Standard' : 'Promouvoir en Super Admin'}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                          adm.isSuperAdmin
                                            ? 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'
                                            : 'bg-surface-container-high text-on-surface hover:bg-surface-container'
                                        }`}
                                      >
                                        {adm.isSuperAdmin ? 'Rétrograder' : 'Promouvoir Super Admin'}
                                      </button>

                                      {/* Toggle Suspension */}
                                      <button
                                        type="button"
                                        disabled={isSelf}
                                        onClick={() => handleToggleAdminSuspension(adm)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                          adm.status === 'ACTIVE'
                                            ? 'bg-error/10 text-error hover:bg-error/20'
                                            : 'bg-green-500/10 text-green-700 hover:bg-green-500/20'
                                        }`}
                                      >
                                        {adm.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-outline italic">Aucune action autorisée</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* MODAL: Ajouter / Modifier Établissement */}
        {showInstModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <h3 className="text-base font-black text-on-surface">
                  {editingInst ? 'Modifier l’Établissement' : 'Nouvel Établissement Burkinabè'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowInstModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>

              <form onSubmit={handleSaveInstitution} className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface-variant">Nom Officiel Complet</label>
                  <input
                    type="text"
                    required
                    value={instForm.name}
                    onChange={(e) => setInstForm({ ...instForm, name: e.target.value })}
                    placeholder="Ex. Université Joseph Ki-Zerbo"
                    className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Sigle / Nom Court</label>
                    <input
                      type="text"
                      required
                      value={instForm.shortName}
                      onChange={(e) => setInstForm({ ...instForm, shortName: e.target.value })}
                      placeholder="Ex. UJKZ"
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Catégorie</label>
                    <select
                      value={instForm.category}
                      onChange={(e) => setInstForm({ ...instForm, category: e.target.value })}
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Région (Burkina)</label>
                    <select
                      value={instForm.region}
                      onChange={(e) => setInstForm({ ...instForm, region: e.target.value })}
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                    >
                      {BF_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Ville de Résidence</label>
                    <input
                      type="text"
                      value={instForm.city}
                      onChange={(e) => setInstForm({ ...instForm, city: e.target.value })}
                      placeholder="Ouagadougou, Bobo-Dioulasso..."
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                <ImageUploadField
                  label="Logo Officiel de l'Université / Établissement"
                  hint="Depuis l'appareil ou capture photo (redimensionnement automatique)"
                  value={instForm.logoUrl}
                  onChange={(url) => setInstForm({ ...instForm, logoUrl: url })}
                  folder="logos"
                  cropToSquare={false}
                  defaultMaxDimension={512}
                  modalTitle="Logo Officiel de l'Université"
                />

                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setShowInstModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary/90"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Ajouter / Modifier UFR */}
        {showFacultyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <h3 className="text-base font-black text-on-surface">
                  {editingFaculty ? 'Modifier l’UFR' : 'Nouvelle UFR / Faculté'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFacultyModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>

              <form onSubmit={handleSaveFaculty} className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface-variant">Université Tutélaire</label>
                  <select
                    required
                    value={facultyForm.institutionId}
                    onChange={(e) =>
                      setFacultyForm({ ...facultyForm, institutionId: e.target.value })
                    }
                    className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                  >
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.shortName} - {i.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Code UFR (court)</label>
                    <input
                      type="text"
                      required
                      value={facultyForm.code}
                      onChange={(e) => setFacultyForm({ ...facultyForm, code: e.target.value })}
                      placeholder="Ex. sjp, seg, lac, sds..."
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Icône Material</label>
                    <input
                      type="text"
                      value={facultyForm.iconName}
                      onChange={(e) => setFacultyForm({ ...facultyForm, iconName: e.target.value })}
                      placeholder="Ex. school, gavel, science..."
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface-variant">Intitulé Complet</label>
                  <input
                    type="text"
                    required
                    value={facultyForm.name}
                    onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                    placeholder="Ex. UFR Sciences Juridiques et Politiques"
                    className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                  />
                </div>

                <ImageUploadField
                  label="Logo ou Blason de l'UFR"
                  hint="Depuis l'appareil ou capture photo (redimensionnement automatique)"
                  value={facultyForm.logoUrl}
                  onChange={(url) => setFacultyForm({ ...facultyForm, logoUrl: url })}
                  folder="logos"
                  cropToSquare={true}
                  defaultMaxDimension={256}
                  modalTitle="Logo / Blason de l'UFR"
                />

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface-variant">Description sommaire</label>
                  <textarea
                    rows={2}
                    value={facultyForm.description}
                    onChange={(e) =>
                      setFacultyForm({ ...facultyForm, description: e.target.value })
                    }
                    placeholder="Présentation des filières, départements..."
                    className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setShowFacultyModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary/90"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Ajouter / Modifier Filière */}
        {showFiliereModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <h3 className="text-base font-black text-on-surface">
                  {editingFiliere ? 'Modifier la Filière' : 'Nouvelle Filière Spécialisée'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFiliereModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>

              <form onSubmit={handleSaveFiliere} className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface-variant">UFR de Rattachement</label>
                  <select
                    required
                    value={filiereForm.facultyId}
                    onChange={(e) => setFiliereForm({ ...filiereForm, facultyId: e.target.value })}
                    className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                  >
                    {faculties.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name} ({fac.institution?.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Code Filière</label>
                    <input
                      type="text"
                      required
                      value={filiereForm.code}
                      onChange={(e) => setFiliereForm({ ...filiereForm, code: e.target.value })}
                      placeholder="Ex. DROIT-PUB, ECO-GEST..."
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Niveau / Cycle</label>
                    <select
                      value={filiereForm.degreeLevel}
                      onChange={(e) =>
                        setFiliereForm({ ...filiereForm, degreeLevel: e.target.value })
                      }
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                    >
                      {DEGREE_LEVELS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface-variant">Intitulé Officiel</label>
                  <input
                    type="text"
                    required
                    value={filiereForm.name}
                    onChange={(e) => setFiliereForm({ ...filiereForm, name: e.target.value })}
                    placeholder="Ex. Droit Public & Sciences Politiques"
                    className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setShowFiliereModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary/90"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Barème Tarifaire Plafond */}
        {showPricingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <h3 className="text-base font-black text-on-surface">
                  {editingPricing ? 'Modifier le Barème' : 'Nouveau Barème Plafond Anti-Spéculation'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPricingModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>

              <form onSubmit={handleSavePricing} className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface-variant">Titre de la Règle</label>
                  <input
                    type="text"
                    required
                    value={pricingForm.title}
                    onChange={(e) => setPricingForm({ ...pricingForm, title: e.target.value })}
                    placeholder="Ex. Plafond Corrigés de TD & Devoirs"
                    className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Type de Document</label>
                    <select
                      value={pricingForm.documentType}
                      onChange={(e) =>
                        setPricingForm({ ...pricingForm, documentType: e.target.value })
                      }
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                    >
                      {DOC_TYPES.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Format Média</label>
                    <select
                      value={pricingForm.mediaFormat}
                      onChange={(e) =>
                        setPricingForm({ ...pricingForm, mediaFormat: e.target.value })
                      }
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                    >
                      {MEDIA_FORMATS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Prix Min (FCFA)</label>
                    <input
                      type="number"
                      value={pricingForm.minPrice}
                      onChange={(e) =>
                        setPricingForm({ ...pricingForm, minPrice: Number(e.target.value) || 0 })
                      }
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Conseillé (FCFA)</label>
                    <input
                      type="number"
                      value={pricingForm.suggestedPrice}
                      onChange={(e) =>
                        setPricingForm({
                          ...pricingForm,
                          suggestedPrice: Number(e.target.value) || 0,
                        })
                      }
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-error">Plafond Max (FCFA)</label>
                    <input
                      type="number"
                      required
                      value={pricingForm.maxPrice}
                      onChange={(e) =>
                        setPricingForm({ ...pricingForm, maxPrice: Number(e.target.value) || 0 })
                      }
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-error/40 font-bold text-error focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface-variant">
                    Motif / Délibération Légale
                  </label>
                  <textarea
                    rows={2}
                    value={pricingForm.notes}
                    onChange={(e) => setPricingForm({ ...pricingForm, notes: e.target.value })}
                    placeholder="Barème officiel pour préserver le pouvoir d'achat étudiant..."
                    className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setShowPricingModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary/90"
                  >
                    Enregistrer le Barème
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Modération Étudiant (Suspendre / Réactiver) */}
        {showStudentModal && moderatingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <h3 className="text-base font-black text-on-surface">
                  {moderatingStudent.isSuspended ? 'Réactiver le Compte' : 'Suspendre le Compte'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>

              <div className="p-3 bg-surface-container rounded-xl flex flex-col gap-1 text-xs">
                <span className="font-bold text-on-surface">
                  {moderatingStudent.profile?.displayName || moderatingStudent.email}
                </span>
                <span className="font-mono text-primary font-bold">
                  INE : {moderatingStudent.ine}
                </span>
                <span className="text-on-surface-variant">
                  {moderatingStudent.profile?.institution?.name}
                </span>
              </div>

              <form onSubmit={handleModerateStudent} className="flex flex-col gap-3 text-xs">
                {!moderatingStudent.isSuspended && (
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-error">Motif officiel de la suspension</label>
                    <textarea
                      required
                      rows={3}
                      value={suspensionReason}
                      onChange={(e) => setSuspensionReason(e.target.value)}
                      placeholder="Ex. Tentative de spéculation tarifaire, publication de documents falsifiés..."
                      className="p-3 rounded-xl bg-surface-container-low border border-error/30 font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                )}

                {moderatingStudent.isSuspended && (
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Ce compte a été suspendu pour le motif suivant :
                    <strong className="block text-error mt-1">
                      {moderatingStudent.suspensionReason || 'Non spécifié'}
                    </strong>
                    Voulez-vous restaurer l'accès complet de cet étudiant à la plateforme ?
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setShowStudentModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl font-bold shadow-md text-white ${
                      moderatingStudent.isSuspended
                        ? 'bg-primary hover:bg-primary/90'
                        : 'bg-error hover:bg-error/90'
                    }`}
                  >
                    {moderatingStudent.isSuspended ? 'Confirmer la Réactivation' : 'Confirmer la Suspension'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Décision de Validation Pédagogique (Approuver / Rejeter) */}
        {validationActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <Icon
                    name={
                      validationActionModal.type === 'APPROVE'
                        ? 'check_circle'
                        : validationActionModal.type === 'DELETE'
                        ? 'delete_forever'
                        : 'cancel'
                    }
                    className={`text-xl ${
                      validationActionModal.type === 'APPROVE' ? 'text-green-600' : 'text-error'
                    }`}
                  />
                  <h3 className="text-base font-black text-on-surface">
                    {validationActionModal.type === 'APPROVE'
                      ? 'Valider & Publier la Ressource'
                      : validationActionModal.type === 'DELETE'
                      ? 'Suppression Définitive de la Publication'
                      : 'Rejeter la Ressource Pédagogique'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationActionModal(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>

              {/* Warning if DELETE */}
              {validationActionModal.type === 'DELETE' && (
                <div className="p-3.5 bg-error/10 border border-error/30 rounded-2xl flex items-start gap-2.5 text-xs text-error font-medium">
                  <Icon name="warning" className="text-lg shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Action Irréversible</strong>
                    <span>
                      Cette opération supprimera définitivement le document pédagogique de la base de données. Conformément à la réglementation de Campus Folder BF, une justification explicite est obligatoire et sera consignée au journal d'audit.
                    </span>
                  </div>
                </div>
              )}

              {/* Resource Summary Recap */}
              <div className="p-3.5 bg-surface-container rounded-2xl flex flex-col gap-1.5 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                  Document concerné
                </span>
                <span className="font-bold text-on-surface text-sm">
                  {validationActionModal.resource.title}
                </span>
                <span className="text-on-surface-variant">
                  Auteur : <strong>{validationActionModal.resource.author?.profile?.displayName || validationActionModal.resource.author?.email}</strong> (INE : {validationActionModal.resource.author?.ine})
                </span>
                <span className="text-on-surface-variant">
                  Établissement : {validationActionModal.resource.institution?.name} • Prix : {validationActionModal.resource.price} FCFA
                </span>
                <span className="text-primary font-bold">
                  {validationActionModal.resource.files?.length || 0} média(s) vérifié(s) rattaché(s)
                </span>
              </div>

              <form onSubmit={handleConfirmValidation} className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface">
                    {validationActionModal.type === 'APPROVE'
                      ? 'Note de validation / Commentaire (optionnel)'
                      : validationActionModal.type === 'DELETE'
                      ? 'Justification obligatoire de la suppression définitive (archivée dans l\'audit)'
                      : 'Motif obligatoire du rejet (transmis à l\'auteur par email)'}
                  </label>
                  <textarea
                    required={validationActionModal.type !== 'APPROVE'}
                    rows={3}
                    value={validationNoteInput}
                    onChange={(e) => setValidationNoteInput(e.target.value)}
                    placeholder={
                      validationActionModal.type === 'APPROVE'
                        ? 'Ex. Document rigoureux conforme aux programmes académiques burkinabè.'
                        : validationActionModal.type === 'DELETE'
                        ? 'Ex. Document falsifié, violation avérée des droits de propriété intellectuelle, sujet inexistant...'
                        : 'Ex. Fichier incomplet : manque la correction du sujet n°2 ou document flou/illisible.'
                    }
                    className={`p-3 rounded-xl bg-surface-container-low border font-medium text-on-surface focus:outline-none ${
                      validationActionModal.type !== 'APPROVE'
                        ? 'border-error/40 focus:border-error'
                        : 'border-outline-variant/30 focus:border-primary'
                    }`}
                  />
                  {validationActionModal.type === 'REJECT' && (
                    <span className="text-[11px] text-error font-semibold">
                      Un email détaillant ce motif sera automatiquement acheminé à l'adresse de l'étudiant pour qu'il rectifie son document.
                    </span>
                  )}
                  {validationActionModal.type === 'DELETE' && (
                    <span className="text-[11px] text-error font-semibold">
                      Cette justification sera enregistrée avec le nom de l'administrateur dans le journal d'activité de la plateforme.
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    disabled={validationActionLoading}
                    onClick={() => setValidationActionModal(null)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-bold disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={validationActionLoading}
                    className={`px-4 py-2 rounded-xl font-bold shadow-md text-white flex items-center gap-1.5 disabled:opacity-50 ${
                      validationActionModal.type === 'APPROVE'
                        ? 'bg-primary hover:bg-primary/90'
                        : 'bg-error hover:bg-error/90'
                    }`}
                  >
                    {validationActionLoading && (
                      <Icon name="progress_activity" className="text-[16px] animate-spin" />
                    )}
                    <span>
                      {validationActionModal.type === 'APPROVE'
                        ? 'Confirmer & Publier au Catalogue'
                        : validationActionModal.type === 'DELETE'
                        ? 'Confirmer la Suppression Définitive'
                        : 'Confirmer le Rejet'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Super Admin - Ajouter un Administrateur */}
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <Icon name="admin_panel_settings" className="text-primary text-xl" />
                  <h3 className="text-base font-black text-on-surface">
                    Nommer un Nouvel Administrateur
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="flex flex-col gap-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Prénom</label>
                    <input
                      type="text"
                      required
                      value={adminForm.firstName}
                      onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })}
                      placeholder="Ex. Aminata"
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Nom</label>
                    <input
                      type="text"
                      required
                      value={adminForm.lastName}
                      onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })}
                      placeholder="Ex. Sawadogo"
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-on-surface-variant">Email Professionnel</label>
                  <input
                    type="email"
                    required
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="prenom.nom@campusfolder.bf ou ujkz.bf"
                    className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Matricule / INE Admin</label>
                    <input
                      type="text"
                      value={adminForm.ine}
                      onChange={(e) => setAdminForm({ ...adminForm, ine: e.target.value })}
                      placeholder="Ex. ADM-BF-2025-05"
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Mot de passe temporaire</label>
                    <input
                      type="password"
                      required
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      placeholder="••••••••••••"
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-outline">
                  Exigence : 8 caractères min., 1 majuscule, 1 minuscule, 1 chiffre, 1 symbole.
                </span>

                {/* Checkbox Super Admin */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="isSuperAdminCheckbox"
                    checked={adminForm.isSuperAdmin}
                    onChange={(e) => setAdminForm({ ...adminForm, isSuperAdmin: e.target.checked })}
                    className="mt-0.5 rounded border-amber-500 text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="isSuperAdminCheckbox" className="flex flex-col cursor-pointer">
                    <span className="font-bold text-amber-900 dark:text-amber-100">
                      Accorder les prérogatives de Super Administrateur
                    </span>
                    <span className="text-[10px] text-amber-800/80 dark:text-amber-200/80">
                      Ce gestionnaire aura le pouvoir de nommer et suspendre d'autres administrateurs et d'administrer l'ensemble des universités, UFRs et filières du Burkina Faso.
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    disabled={adminCreating}
                    onClick={() => setShowAdminModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-bold disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={adminCreating}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {adminCreating && (
                      <Icon name="progress_activity" className="text-[16px] animate-spin" />
                    )}
                    <span>Enregistrer l'Administrateur</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Modifier l'Étudiant (Admin Full Control) */}
        {showStudentEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-2xl bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon name="manage_accounts" className="text-[20px]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-on-surface">
                      Édition Complète du Dossier Étudiant
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">
                      Modification des coordonnées, transferts d'université et attributions de points.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStudentEditModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="flex flex-col gap-4 text-xs">
                {/* Photo de profil de l'étudiant */}
                <ImageUploadField
                  label="Photo de profil / Avatar officiel de l'étudiant"
                  hint="Depuis l'appareil ou capture photo (redimensionnement automatique)"
                  value={studentForm.avatarUrl}
                  onChange={(url) => setStudentForm({ ...studentForm, avatarUrl: url })}
                  folder="avatars"
                  shape="circle"
                  cropToSquare={true}
                  defaultMaxDimension={512}
                  modalTitle="Photo de Profil de l'Étudiant"
                />

                {/* Identité */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Prénom</label>
                    <input
                      type="text"
                      required
                      value={studentForm.firstName}
                      onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Nom</label>
                    <input
                      type="text"
                      required
                      value={studentForm.lastName}
                      onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Nom d'Affichage</label>
                    <input
                      type="text"
                      value={studentForm.displayName}
                      onChange={(e) => setStudentForm({ ...studentForm, displayName: e.target.value })}
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Coordonnées & INE */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Matricule / INE Officiel</label>
                    <input
                      type="text"
                      value={studentForm.ine}
                      onChange={(e) => setStudentForm({ ...studentForm, ine: e.target.value })}
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-mono font-bold text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Email</label>
                    <input
                      type="email"
                      required
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-mono text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Téléphone (+226)</label>
                    <input
                      type="tel"
                      value={studentForm.phoneNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, phoneNumber: e.target.value })}
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Affiliation Universitaire (Transfert réservé à l'Admin) */}
                <div className="p-3.5 bg-primary/5 rounded-2xl border border-primary/20 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-primary font-black">
                    <Icon name="transfer_within_a_station" className="text-[18px]" />
                    <span>Rattachement & Transfert Universitaire (Prérogative Admin)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-on-surface-variant">Université / Établissement</label>
                      <select
                        value={studentForm.institutionId}
                        onChange={(e) => handleEditStudentInstitutionChange(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                      >
                        <option value="">Sélectionner une université</option>
                        {institutions.map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.shortName} - {inst.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-on-surface-variant">UFR / Faculté</label>
                      <select
                        value={studentForm.facultyId}
                        onChange={(e) => setStudentForm({ ...studentForm, facultyId: e.target.value })}
                        className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                      >
                        <option value="">Sélectionner une UFR</option>
                        {studentEditFaculties.map((fac) => (
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
                        value={studentForm.filiere}
                        onChange={(e) => setStudentForm({ ...studentForm, filiere: e.target.value })}
                        placeholder="Ex. Droit Privé, SEG..."
                        className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-on-surface-variant">Région</label>
                      <select
                        value={studentForm.region}
                        onChange={(e) => setStudentForm({ ...studentForm, region: e.target.value })}
                        className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                      >
                        {BF_REGIONS.map((reg) => (
                          <option key={reg} value={reg}>{reg}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-on-surface-variant">Ville</label>
                      <input
                        type="text"
                        value={studentForm.city}
                        onChange={(e) => setStudentForm({ ...studentForm, city: e.target.value })}
                        placeholder="Ouagadougou..."
                        className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Points & Statut */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-on-surface-variant">Points Amphi</label>
                      <span className="text-[10px] text-primary font-bold">Règle: 0 initial</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={studentForm.points}
                      onChange={(e) => setStudentForm({ ...studentForm, points: Number(e.target.value) })}
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-mono font-bold text-secondary focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-on-surface-variant">Statut du Compte</label>
                    <select
                      value={studentForm.status}
                      onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value })}
                      className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-semibold text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="ACTIVE">Actif (Accès total)</option>
                      <option value="INACTIVE">Inactif</option>
                      <option value="PENDING">En attente de vérification</option>
                    </select>
                  </div>
                </div>

                {/* Justification Obligatoire de la qualité du contenu pour attribution de points */}
                <div className="flex flex-col gap-1 p-3 rounded-2xl bg-surface-container-low border border-primary/20">
                  <label className="font-bold text-on-surface flex items-center justify-between">
                    <span className="flex items-center gap-1 text-primary">
                      <Icon name="verified" className="text-[16px]" />
                      <span>Justification en faveur de la qualité du contenu (Obligatoire)</span>
                    </span>
                    <span className="text-[10px] text-outline font-semibold">Audit admin</span>
                  </label>
                  <p className="text-[11px] text-on-surface-variant leading-tight">
                    Sur Campus Folder, les points ne sont octroyés par un admin qu'en justifiant de la qualité pédagogique, de la complétude ou de l'excellence académique des documents soumis.
                  </p>
                  <input
                    type="text"
                    value={studentForm.pointsJustification}
                    onChange={(e) => setStudentForm({ ...studentForm, pointsJustification: e.target.value })}
                    placeholder="Ex: Fiche de TD certifiée conforme, clarté rédactionnelle et rigueur validées."
                    className="h-9 px-3 text-xs rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-medium focus:outline-none focus:border-primary mt-1"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    disabled={savingStudent}
                    onClick={() => setShowStudentEditModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-bold disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={savingStudent}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingStudent && (
                      <Icon name="progress_activity" className="text-[16px] animate-spin" />
                    )}
                    <span>Sauvegarder les modifications</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
