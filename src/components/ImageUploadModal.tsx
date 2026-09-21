'use client';

import React, { useState, useRef, useEffect } from 'react';
import { resizeImage, uploadResizedImage, ProcessedImageResult } from '@/lib/imageProcessor';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUploaded: (url: string) => void;
  title?: string;
  subtitle?: string;
  folder?: 'logos' | 'avatars' | 'covers' | 'documents';
  cropToSquare?: boolean;
  defaultMaxDimension?: number;
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  onImageUploaded,
  title = 'Charger une Image ou Logo',
  subtitle = 'Sélectionnez depuis votre appareil ou prenez une photo en direct',
  folder = 'images' as any,
  cropToSquare = true,
  defaultMaxDimension = 512,
}: ImageUploadModalProps) {
  // Navigation tabs
  const [activeSource, setActiveSource] = useState<'device' | 'camera' | 'url'>('device');

  // Image source state
  const [rawImageSource, setRawImageSource] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');

  // Resize settings
  const [selectedDimension, setSelectedDimension] = useState<number>(defaultMaxDimension);
  const [squareCrop, setSquareCrop] = useState<boolean>(cropToSquare);
  const [processedResult, setProcessedResult] = useState<ProcessedImageResult | null>(null);

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Loading & Error states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera on close or mode change
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setRawImageSource(null);
      setProcessedResult(null);
      setErrorMsg(null);
      setCameraError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeSource !== 'camera') {
      stopCamera();
    } else if (isOpen && !rawImageSource) {
      startCamera();
    }
  }, [activeSource, facingMode, isOpen]);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Votre navigateur ne supporte pas l\'accès direct à la caméra. Utilisez le bouton "Appareil photo".');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Impossible d\'activer la caméra (autorisation refusée ou inexistante). Vous pouvez utiliser le sélecteur d\'appareil photo.');
      setIsCameraActive(false);
    }
  };

  // Switch camera front/back
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture Frame from Video
  const captureFromVideo = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, flip horizontally for mirror effect
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    stopCamera();
    setRawImageSource(dataUrl);
  };

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP, SVG).');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSource(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Re-process image whenever dimension or crop mode changes
  useEffect(() => {
    if (!rawImageSource) {
      setProcessedResult(null);
      return;
    }

    let isMounted = true;
    setIsProcessing(true);

    resizeImage(rawImageSource, {
      maxWidth: selectedDimension,
      maxHeight: selectedDimension,
      cropToSquare: squareCrop,
      quality: 0.88,
      format: 'image/jpeg',
    })
      .then((res) => {
        if (isMounted) {
          setProcessedResult(res);
          setIsProcessing(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setErrorMsg('Erreur lors du redimensionnement de l\'image.');
          setIsProcessing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [rawImageSource, selectedDimension, squareCrop]);

  // Handle final upload
  const handleConfirmAndUpload = async () => {
    if (!processedResult) return;

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const res = await uploadResizedImage(processedResult.dataUrl, {
        maxWidth: selectedDimension,
        maxHeight: selectedDimension,
        cropToSquare: squareCrop,
        folder,
      });

      onImageUploaded(res.url);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors du téléversement vers le serveur.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-primary px-6 py-4 text-on-primary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[22px]">photo_camera</span>
            </div>
            <div>
              <h2 className="text-base font-black leading-tight text-white">{title}</h2>
              <p className="text-[11px] text-primary-fixed-dim mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Select or Capture Image if none chosen yet */}
          {!rawImageSource ? (
            <div className="flex flex-col gap-4">
              {/* Source Tabs */}
              <div className="flex rounded-2xl bg-surface-container-low p-1 border border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setActiveSource('device')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeSource === 'device'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">folder_open</span>
                  <span>Depuis l'appareil</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSource('camera')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeSource === 'camera'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">photo_camera</span>
                  <span>Prendre Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSource('url')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeSource === 'url'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">link</span>
                  <span>Lien URL</span>
                </button>
              </div>

              {/* Source: Device File Picker */}
              {activeSource === 'device' && (
                <div className="flex flex-col gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-outline-variant/60 hover:border-primary/60 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-surface-container-low/50 hover:bg-surface-container-low transition-all group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-on-surface">
                        Cliquez pour parcourir vos fichiers
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-1">
                        JPG, PNG, WebP ou SVG (taille max recommandée : 10 Mo)
                      </p>
                    </div>
                    <span className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs">
                      Sélectionner un fichier
                    </span>
                  </div>
                </div>
              )}

              {/* Source: Camera Live Viewfinder */}
              {activeSource === 'camera' && (
                <div className="flex flex-col gap-3">
                  {cameraError ? (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex flex-col gap-2">
                      <p className="font-semibold">{cameraError}</p>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-2 self-start shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[17px]">camera_alt</span>
                        <span>Ouvrir l'appareil photo du smartphone</span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-3xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-outline-variant/30">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Viewfinder Circle / Frame overlay */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div
                          className={`border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] ${
                            cropToSquare ? 'rounded-full w-56 h-56 sm:w-64 sm:h-64' : 'rounded-2xl w-4/5 h-4/5'
                          }`}
                        />
                      </div>

                      {/* Camera Controls Bar */}
                      <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-4 z-10 px-4">
                        <button
                          type="button"
                          onClick={toggleFacingMode}
                          className="w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center backdrop-blur-md"
                          title="Changer de caméra"
                        >
                          <span className="material-symbols-outlined text-[20px]">flip_camera_ios</span>
                        </button>

                        <button
                          type="button"
                          onClick={captureFromVideo}
                          className="w-14 h-14 rounded-full bg-white text-primary border-4 border-primary shadow-xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
                          title="Prendre la photo"
                        >
                          <span className="material-symbols-outlined text-[28px]">camera</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Source: Direct URL */}
              {activeSource === 'url' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant">
                      Adresse URL de l'image
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://domaine.bf/logo.png"
                        className="flex-1 h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!urlInput.trim()) return;
                          setRawImageSource(urlInput.trim());
                        }}
                        className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-sm"
                      >
                        Charger
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: Intelligent Resizing & Optimization Preview */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                {/* Visual Preview */}
                <div className="relative w-36 h-36 rounded-2xl overflow-hidden bg-black/5 border border-outline-variant/30 flex items-center justify-center shrink-0 shadow-inner">
                  {processedResult ? (
                    <img
                      src={processedResult.dataUrl}
                      alt="Aperçu redimensionné"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-outline animate-spin">
                      autorenew
                    </span>
                  )}

                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-white text-[10px] font-bold">
                      Redimensionnement...
                    </div>
                  )}
                </div>

                {/* Resizing Specs & Stats */}
                <div className="flex-1 flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-primary font-black">
                    <span className="material-symbols-outlined text-[17px]">auto_fix_high</span>
                    <span>Optimisation & Redimensionnement Automatique</span>
                  </div>

                  {processedResult && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/20">
                      <div>
                        <span className="text-outline block">Dimensions :</span>
                        <span className="font-bold text-on-surface font-mono">
                          {processedResult.width} × {processedResult.height} px
                        </span>
                      </div>
                      <div>
                        <span className="text-outline block">Poids optimisé :</span>
                        <span className="font-bold text-secondary font-mono">
                          ~{Math.round(processedResult.sizeBytes / 1024)} Ko
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-on-surface-variant">
                    L'image est automatiquement compressée et ajustée aux normes graphiques de Campus Folder pour un affichage instantané même en 3G/4G au Burkina Faso.
                  </p>
                </div>
              </div>

              {/* Dimension Presets */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface-variant flex items-center justify-between">
                  <span>Résolution cible</span>
                  <span className="text-[10px] text-outline font-semibold">
                    {selectedDimension} × {selectedDimension} px max
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { dim: 256, label: '256 px', desc: 'Miniature' },
                    { dim: 512, label: '512 px', desc: 'Recommandé' },
                    { dim: 800, label: '800 px', desc: 'Haute Réf.' },
                  ].map((preset) => (
                    <button
                      key={preset.dim}
                      type="button"
                      onClick={() => setSelectedDimension(preset.dim)}
                      className={`p-2 rounded-xl text-center border text-xs font-bold transition-all ${
                        selectedDimension === preset.dim
                          ? 'bg-primary text-on-primary border-primary shadow-xs'
                          : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <div className="font-black">{preset.label}</div>
                      <div
                        className={`text-[9px] ${
                          selectedDimension === preset.dim ? 'text-white/80' : 'text-outline'
                        }`}
                      >
                        {preset.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Crop mode toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">crop</span>
                  <span className="font-bold text-on-surface">Cadrage carré parfait (1:1)</span>
                </div>
                <input
                  type="checkbox"
                  checked={squareCrop}
                  onChange={(e) => setSquareCrop(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => {
                    setRawImageSource(null);
                    setProcessedResult(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                  <span>Changer d'image</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing || isUploading || !processedResult}
                  onClick={handleConfirmAndUpload}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-black shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Valider & Appliquer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
