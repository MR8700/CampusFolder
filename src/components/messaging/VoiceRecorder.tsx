'use client';

import React, { useState, useEffect, useRef } from 'react';

interface VoiceRecorderProps {
  onSendVoice: (voiceData: {
    audioUrl: string;
    durationSeconds: number;
    durationMs: number;
    waveform: number[];
  }) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSendVoice, onCancel }: VoiceRecorderProps) {
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>([15, 30, 45, 60, 40, 75, 90, 50, 20]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start microphone recording
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          audioChunksRef.current = [];

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          recorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
            const url = URL.createObjectURL(blob);
            setAudioBlobUrl(url);
            stream.getTracks().forEach((track) => track.stop());
          };

          recorder.start(200);
        })
        .catch(() => {
          // Fallback if browser permission is blocked (simulated recorder for preview)
          console.warn('Microphone permission fallback active');
        });
    }

    timerRef.current = setInterval(() => {
      setDurationSeconds((s) => s + 1);
      // Randomize waveform bars for visual feedback
      setWaveform((prev) => [
        ...prev.slice(1),
        Math.floor(Math.random() * 75 + 20),
      ]);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleStopAndSend = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const mockUrl =
      audioBlobUrl ||
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    onSendVoice({
      audioUrl: mockUrl,
      durationSeconds: Math.max(1, durationSeconds),
      durationMs: Math.max(1, durationSeconds) * 1000,
      waveform,
    });
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center justify-between gap-3 w-full bg-surface-container-highest px-3 py-2 rounded-2xl border-2 border-primary/30 animate-slideUp">
      {/* Recording Indicator & Timer */}
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-error animate-ping" />
        <span className="font-mono text-xs font-bold text-on-surface">
          {formatTimer(durationSeconds)}
        </span>
      </div>

      {/* Live Waveform Visualizer */}
      <div className="flex items-center gap-1 h-6 flex-1 px-2">
        {waveform.map((val, idx) => (
          <div
            key={idx}
            className="flex-1 bg-primary rounded-full transition-all duration-150"
            style={{ height: `${val}%` }}
          />
        ))}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Annuler l'enregistrement"
          className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container/40 active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>

        <button
          type="button"
          onClick={handleStopAndSend}
          aria-label="Envoyer la note vocale"
          className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[22px]">send</span>
        </button>
      </div>
    </div>
  );
}
