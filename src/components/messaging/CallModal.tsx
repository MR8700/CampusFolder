'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CallParticipant {
  id: string;
  userId: string;
  role: string;
  status: string;
  user: {
    id: string;
    profile?: {
      displayName: string;
      avatarUrl?: string;
    };
  };
}

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string;
  type: 'VOICE' | 'VIDEO';
  title?: string;
  currentUserId: string;
}

export default function CallModal({
  isOpen,
  onClose,
  callId,
  type,
  title,
  currentUserId,
}: CallModalProps) {
  const [callData, setCallData] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(type === 'VIDEO');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen || !callId) return;

    // Load Call Details
    fetch(`/api/v1/calls/${callId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.call) {
          setCallData(data.call);
        }
      });

    // Start Local Media Stream
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: type === 'VIDEO',
        })
        .then((stream) => {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Media access note:', err);
        });
    }

    // Call Duration Counter
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, callId, type]);

  if (!isOpen) return null;

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  };

  const toggleVideo = () => {
    setIsVideoOn((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = next;
        });
      }
      return next;
    });
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices?.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          if (screenShareVideoRef.current) {
            screenShareVideoRef.current.srcObject = screenStream;
          }
          setIsScreenSharing(true);
          await fetch(`/api/v1/calls/${callId}/screen-share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'START' }),
          });

          screenStream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
          };
        }
      } catch (err) {
        console.warn('Screen share error:', err);
      }
    } else {
      setIsScreenSharing(false);
      await fetch(`/api/v1/calls/${callId}/screen-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'STOP' }),
      });
    }
  };

  const handleEndCall = async () => {
    try {
      await fetch(`/api/v1/calls/${callId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LEAVE' }),
      });
    } catch {
      // Ignored
    }
    onClose();
  };

  const handleSendInCallMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      {
        id: `chat-${Date.now()}`,
        sender: 'Moi',
        text: inputMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputMessage('');
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const participants: CallParticipant[] = callData?.participants || [];
  const otherParticipants = participants.filter((p) => p.userId !== currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0e1626] text-white select-none animate-fadeIn">
      {/* Top Overlay Bar */}
      <div className="h-16 px-4 flex items-center justify-between z-20 shrink-0 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base truncate text-white">
              {title || callData?.title || 'Session de travail'}
            </h3>
            <span className="font-mono text-xs text-white/70">
              {formatTimer(callDuration)} • {participants.length || 2} participant(s)
            </span>
          </div>
        </div>

        {/* In-Call Monetization Badge if applicable */}
        {callData?.offer && (
          <span className="px-2.5 py-1 rounded-full bg-secondary text-on-secondary text-xs font-black shadow-sm">
            {callData.offer.ticketPrice} FCFA / Billet
          </span>
        )}
      </div>

      {/* Main Video & Audio Stage */}
      <div className="flex-1 relative flex flex-col sm:flex-row items-center justify-center p-3 gap-3 overflow-hidden">
        {/* Screen Share Stage (High Priority when active) */}
        {isScreenSharing ? (
          <div className="flex-1 w-full h-full rounded-3xl overflow-hidden bg-black border-2 border-primary/50 relative shadow-2xl flex flex-col items-center justify-center">
            <div className="absolute top-3 left-3 z-10 bg-primary px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 shadow-md">
              <span className="material-symbols-outlined text-[16px]">screen_share</span>
              Partage d'écran en cours
            </div>
            <video
              ref={screenShareVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          /* Grid Stage */
          <div className="flex-1 w-full h-full grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-5xl max-h-[75vh]">
            {/* Primary/Remote Participant */}
            <div className="rounded-3xl overflow-hidden bg-surface-container-high/15 border border-white/10 relative flex flex-col items-center justify-center shadow-xl">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-primary/40 shadow-2xl mb-3 relative">
                <img
                  src={
                    otherParticipants[0]?.user?.profile?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                  }
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="font-headline-md text-base sm:text-lg font-bold text-white">
                {otherParticipants[0]?.user?.profile?.displayName || 'Aminata Sawadogo'}
              </h4>
              <span className="text-xs text-white/60 mt-0.5">Déléguée Promo L3</span>
              <span className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-emerald-400 text-[14px]">mic</span>
                Connecté
              </span>
            </div>

            {/* Local Video Thumbnail */}
            <div className="rounded-3xl overflow-hidden bg-surface-container-high/15 border border-white/10 relative flex flex-col items-center justify-center shadow-xl">
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-2xl shadow-lg mb-2">
                    Moi
                  </div>
                  <span className="text-xs text-white/70">Caméra désactivée</span>
                </div>
              )}
              <span className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                {isMuted ? (
                  <span className="material-symbols-outlined text-rose-400 text-[14px]">mic_off</span>
                ) : (
                  <span className="material-symbols-outlined text-emerald-400 text-[14px]">mic</span>
                )}
                Vous ({isMuted ? 'Muet' : 'Actif'})
              </span>
            </div>
          </div>
        )}

        {/* Integrated In-Call Chat Drawer (Phase 9) */}
        {showInCallChat && (
          <div className="w-full sm:w-80 h-72 sm:h-full bg-black/80 backdrop-blur-xl border border-white/15 rounded-3xl p-3 flex flex-col z-30 shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-xs uppercase tracking-wider text-white/80">
                Discussion de l'appel
              </span>
              <button
                type="button"
                onClick={() => setShowInCallChat(false)}
                className="text-white/60 hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-2">
              <div className="bg-white/10 p-2 rounded-xl text-xs">
                <span className="text-emerald-400 font-bold block">Aminata :</span>
                Je partage le corrigé dans le document joint !
              </div>
              {chatMessages.map((msg) => (
                <div key={msg.id} className="bg-primary/20 p-2 rounded-xl text-xs border border-primary/30">
                  <span className="text-primary-fixed font-bold block">{msg.sender} :</span>
                  {msg.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendInCallMessage} className="pt-2 flex gap-1.5 border-t border-white/10">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Poser une question..."
                className="flex-1 bg-white/10 text-xs px-3 py-2 rounded-xl outline-hidden text-white placeholder:text-white/40"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="h-20 px-4 flex items-center justify-center gap-3 sm:gap-6 z-20 shrink-0 bg-black/60 backdrop-blur-xl border-t border-white/10">
        {/* 1. Mute Toggle */}
        <button
          type="button"
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-rose-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">
            {isMuted ? 'mic_off' : 'mic'}
          </span>
        </button>

        {/* 2. Video Toggle */}
        <button
          type="button"
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            !isVideoOn ? 'bg-rose-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">
            {!isVideoOn ? 'videocam_off' : 'videocam'}
          </span>
        </button>

        {/* 3. Screen Share Toggle (Phase 8) */}
        <button
          type="button"
          onClick={toggleScreenShare}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isScreenSharing ? 'bg-primary text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">
            {isScreenSharing ? 'stop_screen_share' : 'screen_share'}
          </span>
        </button>

        {/* 4. In-Call Chat Toggle (Phase 9) */}
        <button
          type="button"
          onClick={() => setShowInCallChat(!showInCallChat)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            showInCallChat ? 'bg-primary text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">chat</span>
        </button>

        {/* 5. End Call Button */}
        <button
          type="button"
          onClick={handleEndCall}
          className="w-14 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[26px]">call_end</span>
        </button>
      </div>
    </div>
  );
}
