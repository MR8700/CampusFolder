'use client';

import React, { useState } from 'react';
import ImageUploadModal from './ImageUploadModal';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  folder?: 'logos' | 'avatars' | 'covers' | 'documents';
  cropToSquare?: boolean;
  defaultMaxDimension?: number;
  shape?: 'circle' | 'rounded';
  modalTitle?: string;
  placeholderText?: string;
}

export default function ImageUploadField({
  value,
  onChange,
  label = 'Logo ou Photo',
  hint = 'Fichier local ou capture photo avec redimensionnement automatique',
  folder = 'logos',
  cropToSquare = true,
  defaultMaxDimension = 512,
  shape = 'rounded',
  modalTitle = 'Sélectionner ou Capturer un Logo / Photo',
  placeholderText = 'Aucun visuel sélectionné',
}: ImageUploadFieldProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-primary font-bold lowercase">
            auto-redimensionné
          </span>
        </label>
      )}

      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant transition-colors">
        {/* Thumbnail Preview */}
        <div
          onClick={() => setIsModalOpen(true)}
          className={`relative w-14 h-14 shrink-0 bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-center overflow-hidden cursor-pointer group shadow-xs ${
            shape === 'circle' ? 'rounded-full' : 'rounded-xl'
          }`}
        >
          {value ? (
            <img
              src={value}
              alt="Logo ou visuel"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <span className="material-symbols-outlined text-2xl text-outline group-hover:text-primary transition-colors">
              {shape === 'circle' ? 'account_circle' : 'image'}
            </span>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
          </div>
        </div>

        {/* Text info and Action Buttons */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://... ou téléversé localement"
              className="flex-1 h-8 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface font-mono focus:outline-none focus:border-primary truncate"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="w-8 h-8 rounded-lg text-outline hover:text-error hover:bg-error/10 flex items-center justify-center transition-colors shrink-0"
                title="Supprimer l'image"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] text-outline truncate max-w-[180px]">
              {hint}
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[11px] font-bold shadow-xs hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">upload</span>
                <span>Charger / Photo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal instance */}
      <ImageUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImageUploaded={(url) => {
          onChange(url);
        }}
        title={modalTitle}
        folder={folder}
        cropToSquare={cropToSquare}
        defaultMaxDimension={defaultMaxDimension}
      />
    </div>
  );
}
