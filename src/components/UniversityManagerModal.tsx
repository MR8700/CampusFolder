'use client';

import React, { useState, useEffect } from 'react';

interface UniversityManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onProfileUpdated: (updatedUser: any) => void;
}

export default function UniversityManagerModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}: UniversityManagerModalProps) {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [academicLevels, setAcademicLevels] = useState<any[]>([]);
  
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [filiere, setFiliere] = useState('');
  const [city, setCity] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pre-fill with current profile data
  useEffect(() => {
    if (currentUser?.profile) {
      setSelectedInstitutionId(currentUser.profile.institutionId || '');
      setSelectedFacultyId(currentUser.profile.facultyId || '');
      setSelectedLevelId(currentUser.profile.academicLevelId || '');
      setFiliere(currentUser.profile.filiere || '');
      setCity(currentUser.profile.city || '');
    }
  }, [currentUser]);

  // Load institutions & academic levels from database
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      fetch('/api/v1/academic/institutions')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.institutions) {
            setInstitutions(data.institutions);
          }
        })
        .catch(() => {});

      fetch('/api/v1/academic/faculties')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.faculties) {
            setFaculties(data.faculties);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter faculties belonging to the selected institution if any
  const availableFaculties = faculties.filter(
    (f) => !selectedInstitutionId || f.institutionId === selectedInstitutionId
  );

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitutionId) {
      setErrorMsg('Veuillez sélectionner une université officielle.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload: Record<string, any> = {
        facultyId: selectedFacultyId || null,
        academicLevelId: selectedLevelId || null,
        filiere: filiere || undefined,
        city: city || undefined,
      };

      // Only administrators can change university affiliation
      if (isAdmin) {
        payload.institutionId = selectedInstitutionId;
      }

      const res = await fetch('/api/v1/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la mise à jour de votre université.');
      }

      setSuccessMsg('Votre université de rattachement a été mise à jour avec succès !');
      if (onProfileUpdated) {
        onProfileUpdated({
          ...currentUser,
          profile: data.profile,
        });
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de connexion.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-primary px-6 py-5 text-on-primary flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px] text-on-primary">
                school
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold">Université de Rattachement</h2>
              <p className="text-xs text-primary-fixed-dim">
                Gestion de votre profil académique officiel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-lowest/20 hover:bg-surface-container-lowest/30 flex items-center justify-center transition-colors text-on-primary"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          <div className="p-3.5 bg-secondary-container/20 rounded-xl border border-secondary/20 text-xs text-on-surface leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-secondary mb-1">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>Règle de gouvernance universitaire BF</span>
            </div>
            {!isAdmin ? (
              <p>
                🔒 Votre université de rattachement officiel a été scellée lors de votre inscription.
                Seule l'administration centrale est habilitée à effectuer un transfert d'université.
                Vous pouvez toutefois actualiser votre UFR, votre filière et votre ville ci-dessous.
              </p>
            ) : (
              <p>
                Privilège Administrateur : Vous pouvez transférer et modifier l'université de rattachement.
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {/* Current Institution */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase text-on-surface-variant">
                Université / Institut Officiel *
              </label>
              {!isAdmin && (
                <span className="text-[10px] text-primary font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                  Scellée
                </span>
              )}
            </div>
            <select
              disabled={!isAdmin}
              value={selectedInstitutionId}
              onChange={(e) => {
                setSelectedInstitutionId(e.target.value);
                setSelectedFacultyId(''); // Reset faculty when university changes
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none ${
                !isAdmin
                  ? 'bg-surface-container-high/60 border-outline-variant/40 text-on-surface-variant cursor-not-allowed'
                  : 'border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-primary'
              }`}
              required
            >
              <option value="">-- Sélectionnez votre université --</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.shortName}) - {inst.city}
                </option>
              ))}
            </select>
          </div>

          {/* Faculty / UFR */}
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1.5">
              UFR / Faculté / Institut
            </label>
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Toutes les facultés de cet établissement --</option>
              {availableFaculties.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} ({fac.code})
                </option>
              ))}
            </select>
          </div>

          {/* Filière */}
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1.5">
              Filière / Département
            </label>
            <input
              type="text"
              value={filiere}
              onChange={(e) => setFiliere(e.target.value)}
              placeholder="Ex: Informatique, Droit Privé, Linguistique, Économie..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Ville */}
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1.5">
              Ville du campus
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Ouagadougou, Bobo-Dioulasso, Koudougou..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Enregistrer dans mon profil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
