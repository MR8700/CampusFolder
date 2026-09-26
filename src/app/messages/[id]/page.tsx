'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MediaViewerModal, { MediaItem } from '@/components/messaging/MediaViewerModal';
import VoiceRecorder from '@/components/messaging/VoiceRecorder';
import ResourcePickerModal from '@/components/messaging/ResourcePickerModal';
import CallModal from '@/components/messaging/CallModal';

export default function ConversationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.id as string;

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Modals state
  const [viewerMedia, setViewerMedia] = useState<MediaItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isResourcePickerOpen, setIsResourcePickerOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'VOICE' | 'VIDEO'>('VOICE');
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [purchasingResourceId, setPurchasingResourceId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Initial Load: Conversation details & Messages
  useEffect(() => {
    if (!conversationId) return;

    Promise.all([
      fetch(`/api/v1/conversations/${conversationId}`).then((r) => r.json()),
      fetch(`/api/v1/conversations/${conversationId}/messages?limit=40`).then((r) => r.json()),
    ])
      .then(([convData, msgData]) => {
        if (convData.success && convData.conversation) {
          setConversation(convData.conversation);
          if (convData.currentUser) setCurrentUser(convData.currentUser);
        }
        if (msgData.success && msgData.messages) {
          setMessages(msgData.messages);
        }
        setLoading(false);
        setTimeout(scrollToBottom, 200);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [conversationId]);

  // 2. Real-time EventSource Stream (SSE)
  useEffect(() => {
    if (!conversationId) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/v1/conversations/${conversationId}/stream`);

      eventSource.addEventListener('message.created', (e: any) => {
        try {
          const newMsg = JSON.parse(e.data);
          // Refetch fresh messages to populate sender & attachments
          fetch(`/api/v1/conversations/${conversationId}/messages?limit=20`)
            .then((r) => r.json())
            .then((data) => {
              if (data.success && data.messages) {
                setMessages(data.messages);
                setTimeout(scrollToBottom, 150);
              }
            });
        } catch (err) {
          console.error(err);
        }
      });
    } catch (e) {
      console.warn('SSE connection notice:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [conversationId]);

  // 3. Send Text Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TEXT', text }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        // Optimistic refresh
        setMessages((prev) => [
          ...prev,
          {
            id: data.message.id,
            conversationId,
            senderId: currentUser?.id,
            isMe: true,
            sender: {
              displayName: currentUser?.displayName || 'Moi',
              avatarUrl: currentUser?.avatarUrl,
            },
            type: 'TEXT',
            text,
            sentAt: new Date().toISOString(),
            attachments: [],
            reactions: [],
          },
        ]);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // 4. Send Voice Note (Phase 4)
  const handleSendVoiceNote = async (voiceData: {
    audioUrl: string;
    durationSeconds: number;
    durationMs: number;
    waveform: number[];
  }) => {
    setIsVoiceRecording(false);
    try {
      const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'VOICE_NOTE',
          text: `🎙 Note vocale (${voiceData.durationSeconds}s)`,
          voiceNote: voiceData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Refetch messages
        const refresh = await fetch(`/api/v1/conversations/${conversationId}/messages?limit=20`);
        const refData = await refresh.json();
        if (refData.success) setMessages(refData.messages);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Failed to send voice note:', err);
    }
  };

  // 5. Send Resource Attachment (Phase 2)
  const handleSelectResourceToShare = async (resourceId: string, resourceTitle: string) => {
    try {
      const res = await fetch('/api/v1/resources/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          resourceId,
          messageText: `📚 ${resourceTitle}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const refresh = await fetch(`/api/v1/conversations/${conversationId}/messages?limit=20`);
        const refData = await refresh.json();
        if (refData.success) setMessages(refData.messages);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Failed to share resource:', err);
    }
  };

  // 5b. Share YouTube Video in Chat
  const handleSelectYouTubeToShare = async (url: string, title: string) => {
    try {
      const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🎥 ${title}\n${url}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const refresh = await fetch(`/api/v1/conversations/${conversationId}/messages?limit=20`);
        const refData = await refresh.json();
        if (refData.success) setMessages(refData.messages);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Failed to share YouTube video:', err);
    }
  };

  // Helper to extract YouTube video ID
  const getYouTubeVideoId = (text: string) => {
    if (!text) return null;
    const match = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/);
    return match && match[1] ? match[1] : null;
  };

  // 6. Open Resource in Native MediaViewer or Unlock Purchase
  const handleOpenOrBuyResource = async (resItem: any) => {
    // Check access policy
    try {
      const accessRes = await fetch(`/api/v1/resources/${resItem.id}/access-check`);
      const accessData = await accessRes.json();

      if (accessData.success && accessData.check?.canAccess) {
        const isVideo = resItem.type === 'VIDEO' || resItem.mediaType === 'VIDEO' || resItem.fileUrl?.endsWith('.mp4');
        const isYt = resItem.youtubeUrl || resItem.fileUrl?.includes('youtube.com') || resItem.fileUrl?.includes('youtu.be');

        // Open natively in full-screen Media Viewer
        setViewerMedia({
          type: isYt ? 'YOUTUBE' : isVideo ? 'VIDEO' : 'PDF',
          url: resItem.youtubeUrl || resItem.fileUrl || `/ressources/${resItem.slug}`,
          title: resItem.title,
          authorName: resItem.faculty || 'Faculté UJKZ',
          pageCount: 14,
          canDownload: !isYt,
        });
        setIsViewerOpen(true);
      } else {
        // Prompt purchase modal or route to payment
        router.push(`/paiement?resourceId=${resItem.id}`);
      }
    } catch {
      // Fallback: open viewer
      setViewerMedia({
        type: 'PDF',
        url: `/ressources/${resItem.slug}`,
        title: resItem.title,
        canDownload: false,
      });
      setIsViewerOpen(true);
    }
  };

  // 7. Initiate Call from Chat Header
  const handleStartCall = (type: 'VOICE' | 'VIDEO') => {
    fetch('/api/v1/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        type,
        title: `Appel avec ${interlocutorName}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.call) {
          setCurrentCallId(data.call.id);
          setCallType(type);
          setIsCallModalOpen(true);
        }
      });
  };

  // Find other participant
  const otherParticipant = conversation?.participants?.find(
    (p: any) => p.userId !== currentUser?.id
  );
  const interlocutorName =
    conversation?.type === 'DIRECT'
      ? otherParticipant?.user?.profile?.displayName || conversation?.title || 'Amina'
      : conversation?.title || 'Discussion de groupe';
  const interlocutorAvatar =
    conversation?.type === 'DIRECT'
      ? otherParticipant?.user?.profile?.avatarUrl
      : conversation?.avatarUrl;
  const isOnline = otherParticipant?.user?.presence?.status === 'ONLINE';

  return (
    <div className="flex flex-col h-screen bg-surface">
      {/* 1. Header (Exact Wireframe: ← Amina  📞 🎥) */}
      <header className="h-16 px-4 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/40 flex items-center justify-between shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.push('/messages')}
            aria-label="Retour"
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-95 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>

          {/* User info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/30">
                <img
                  src={
                    interlocutorAvatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                  }
                  alt={interlocutorName}
                  className="w-full h-full object-cover"
                />
              </div>
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-surface" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="font-headline-md text-base font-bold text-on-surface truncate leading-tight">
                {interlocutorName}
              </h2>
              <span className="font-body-sm text-[11px] text-on-surface-variant truncate block">
                {isOnline ? 'En ligne sur le campus' : 'UJKZ • Licence 3'}
              </span>
            </div>
          </div>
        </div>

        {/* Call Action Icons (📞 🎥) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => handleStartCall('VOICE')}
            aria-label="Appel vocal"
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-fixed/40 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">call</span>
          </button>
          <button
            type="button"
            onClick={() => handleStartCall('VIDEO')}
            aria-label="Appel vidéo"
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-fixed/40 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">videocam</span>
          </button>
        </div>
      </header>

      {/* 2. Messages Canvas (Chat History) */}
      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
              sync
            </span>
            <span className="text-xs">Chargement de la discussion...</span>
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.isMe || msg.senderId === currentUser?.id;
            const hasResource = msg.attachments?.some((a: any) => a.type === 'RESOURCE');
            const hasVoice = Boolean(msg.voiceMessage);
            const ytVideoId = getYouTubeVideoId(msg.text);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[88%] sm:max-w-[75%] ${
                  isMe ? 'self-end' : 'self-start'
                }`}
              >
                {/* Bubble Container */}
                <div
                  className={`rounded-2xl px-4 py-2.5 shadow-xs flex flex-col gap-2 transition-all ${
                    isMe
                      ? 'bg-primary text-on-primary rounded-br-xs'
                      : 'bg-surface-container-low text-on-surface border border-outline-variant/30 rounded-bl-xs'
                  }`}
                >
                  {/* Sender Name if Group */}
                  {!isMe && conversation?.type !== 'DIRECT' && (
                    <span className="font-label-sm text-[10px] text-primary font-bold">
                      {msg.sender?.displayName || 'Camarade'}
                    </span>
                  )}

                  {/* Standard Text Message */}
                  {msg.text && (
                    <p className="font-body-md text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  )}

                  {/* YouTube Video Player Preview Card */}
                  {ytVideoId && (
                    <div
                      className={`rounded-xl overflow-hidden mt-1.5 border shadow-xs ${
                        isMe
                          ? 'bg-black/20 border-white/20 text-white'
                          : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface'
                      }`}
                    >
                      <div
                        onClick={() => {
                          setViewerMedia({
                            type: 'YOUTUBE',
                            url: `https://www.youtube.com/watch?v=${ytVideoId}`,
                            title: msg.text.split('\n')[0].replace('🎥', '').trim() || 'Vidéo Académique (YouTube)',
                            authorName: msg.sender?.displayName,
                          });
                          setIsViewerOpen(true);
                        }}
                        className="relative aspect-video w-full bg-black cursor-pointer group"
                      >
                        <img
                          src={`https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`}
                          alt="Aperçu vidéo YouTube"
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-[28px] fill-current">play_arrow</span>
                          </div>
                        </div>
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1">
                          <span className="material-symbols-outlined text-red-500 text-[14px]">smart_display</span>
                          <span>YouTube Vidéo</span>
                        </div>
                      </div>
                      <div className="p-2.5 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold truncate">
                          {msg.text.split('\n')[0].replace('🎥', '').trim() || 'Vidéo de cours'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setViewerMedia({
                              type: 'YOUTUBE',
                              url: `https://www.youtube.com/watch?v=${ytVideoId}`,
                              title: msg.text.split('\n')[0].replace('🎥', '').trim() || 'Vidéo Académique (YouTube)',
                              authorName: msg.sender?.displayName,
                            });
                            setIsViewerOpen(true);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 transition-all ${
                            isMe
                              ? 'bg-white text-primary hover:bg-white/90'
                              : 'bg-primary text-on-primary hover:bg-primary-container'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">open_in_full</span>
                          <span>Visionner</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Resource Card Attachment (Phase 2 Core - Exact Wireframe Representation) */}
                  {hasResource &&
                    msg.attachments
                      .filter((a: any) => a.type === 'RESOURCE')
                      .map((att: any) => {
                        const snap = att.accessSnapshot || att.resource || {};
                        const isPaid = snap.isPaid;
                        const price = snap.priceAmount || 500;

                        return (
                          <div
                            key={att.id}
                            className={`p-3.5 rounded-xl flex flex-col gap-2.5 mt-1 shadow-sm border ${
                              isMe
                                ? 'bg-black/15 border-white/20 text-white'
                                : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-14 rounded-lg bg-surface-container-high shrink-0 overflow-hidden relative shadow-xs">
                                <img
                                  src={
                                    snap.thumbnailUrl ||
                                    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&auto=format&fit=crop&q=80'
                                  }
                                  alt={snap.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider block truncate ${
                                    isMe ? 'text-primary-fixed' : 'text-primary'
                                  }`}
                                >
                                  {snap.facultyName || 'Faculté de Sciences (UJKZ)'}
                                </span>
                                <h4 className="font-headline-md text-xs sm:text-sm font-bold truncate leading-tight mt-0.5">
                                  {snap.title || att.fileName}
                                </h4>
                                <span
                                  className={`text-[10px] font-black mt-1 inline-block px-1.5 py-0.2 rounded ${
                                    isPaid
                                      ? 'bg-secondary/20 text-secondary'
                                      : 'bg-emerald-500/20 text-emerald-400'
                                  }`}
                                >
                                  {isPaid ? `${price} FCFA` : 'DOCUMENT LIBRE'}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons: [Ouvrir] / [Voir] / [Acheter] */}
                            <div className="flex items-center gap-2 pt-1 border-t border-outline-variant/20">
                              <button
                                type="button"
                                onClick={() => handleOpenOrBuyResource(snap)}
                                className={`flex-1 h-8 rounded-lg font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xs ${
                                  isMe
                                    ? 'bg-white text-primary hover:bg-white/90'
                                    : 'bg-primary text-on-primary hover:bg-primary-container'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                <span>Ouvrir</span>
                              </button>

                              {isPaid && (
                                <button
                                  type="button"
                                  onClick={() => router.push(`/paiement?resourceId=${snap.id}`)}
                                  className="h-8 px-3 rounded-lg bg-secondary text-on-secondary font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
                                >
                                  <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                                  <span>Acheter</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                  {/* Voice Note Player (Phase 4 Core) */}
                  {hasVoice && (
                    <div
                      className={`p-3 rounded-xl flex items-center gap-3 mt-1 ${
                        isMe ? 'bg-black/15 text-white' : 'bg-surface-container-high/40 text-on-surface'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setViewerMedia({
                            type: 'AUDIO',
                            url: msg.voiceMessage?.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                            title: `Note vocale de ${msg.sender?.displayName || 'Camarade'}`,
                            authorName: msg.sender?.displayName,
                            durationSeconds: msg.voiceMessage?.durationSeconds || 15,
                          });
                          setIsViewerOpen(true);
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-all ${
                          isMe ? 'bg-white text-primary' : 'bg-primary text-on-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px]">play_arrow</span>
                      </button>

                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-1 h-5">
                          {(msg.voiceMessage?.waveform || [20, 50, 80, 40, 90, 60, 30, 70, 85, 40]).map(
                            (v: number, i: number) => (
                              <div
                                key={i}
                                className={`flex-1 rounded-full ${isMe ? 'bg-white/70' : 'bg-primary'}`}
                                style={{ height: `${v}%` }}
                              />
                            )
                          )}
                        </div>
                        <span className="text-[10px] opacity-75 font-mono">
                          0:{String(msg.voiceMessage?.durationSeconds || 15).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Timestamp & Status */}
                  <div
                    className={`flex items-center gap-1 text-[10px] self-end mt-0.5 ${
                      isMe ? 'text-white/80' : 'text-on-surface-variant'
                    }`}
                  >
                    <span>
                      {new Date(msg.sentAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && (
                      <span className="material-symbols-outlined text-[13px]">done_all</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] text-primary mb-2">
              forum
            </span>
            <h4 className="font-bold text-sm text-on-surface">Début de l'échange</h4>
            <p className="text-xs max-w-xs mt-1">
              Envoyez un message, posez une question ou partagez un document de cours avec {interlocutorName}.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* 3. Bottom Composer Action Bar (Exact Wireframe: 📎  🎙  📷  [Message...]  ➤) */}
      <footer className="p-3 bg-surface/95 backdrop-blur-xl border-t border-surface-container-high/40 shrink-0 max-w-3xl mx-auto w-full">
        {isVoiceRecording ? (
          <VoiceRecorder
            onSendVoice={handleSendVoiceNote}
            onCancel={() => setIsVoiceRecording(false)}
          />
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Attachment Button (📎) -> Resource Picker */}
            <button
              type="button"
              onClick={() => setIsResourcePickerOpen(true)}
              aria-label="Joindre une ressource pédagogique"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[22px]">attach_file</span>
            </button>

            {/* Voice Recording Button (🎙) */}
            <button
              type="button"
              onClick={() => setIsVoiceRecording(true)}
              aria-label="Enregistrer une note vocale"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[22px]">mic</span>
            </button>

            {/* Photo / Camera Button (📷) */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Prendre ou choisir une photo"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[22px]">photo_camera</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleSendMessage();
                }
              }}
            />

            {/* Message Input Field [Message...] */}
            <div className="flex-1 flex items-center bg-surface-container-low px-4 py-2.5 rounded-2xl border border-outline-variant/30 focus-within:border-primary shadow-xs transition-colors">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message..."
                className="w-full bg-transparent text-sm outline-hidden text-on-surface placeholder:text-outline"
              />
            </div>

            {/* Send Button (➤) */}
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              aria-label="Envoyer le message"
              className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-95 disabled:opacity-40 disabled:hover:bg-primary transition-all shrink-0 hover:bg-primary-container"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
        )}
      </footer>

      {/* 4. Native Full-Screen Media Viewer Modal */}
      <MediaViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        media={viewerMedia}
      />

      {/* 5. Resource Attachment Picker Modal */}
      <ResourcePickerModal
        isOpen={isResourcePickerOpen}
        onClose={() => setIsResourcePickerOpen(false)}
        onSelectResource={handleSelectResourceToShare}
        onSelectYouTube={handleSelectYouTubeToShare}
      />

      {/* 6. Active Call & Video Conference Modal */}
      {isCallModalOpen && currentCallId && (
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          callId={currentCallId}
          type={callType}
          title={`Appel avec ${interlocutorName}`}
          currentUserId={currentUser?.id || 'user-aminata'}
        />
      )}
    </div>
  );
}
