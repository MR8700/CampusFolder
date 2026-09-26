'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import CallModal from '@/components/messaging/CallModal';

export default function MessagesInboxPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups' | 'resources'>('all');
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [callType, setCallType] = useState<'VOICE' | 'VIDEO'>('VOICE');
  const [callTitle, setCallTitle] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch conversations
    fetch('/api/v1/conversations')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setConversations(data.conversations || []);
          if (data.currentUser) setCurrentUser(data.currentUser);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // 2. Check for active/incoming calls
    fetch('/api/v1/calls')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.activeCalls?.length > 0) {
          setActiveCall(data.activeCalls[0]);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenNewChat = () => {
    setShowNewChatModal(true);
    // Fetch users for new conversation
    fetch('/api/v1/academic/faculties')
      .then(() => {
        setAvailableUsers([
          {
            id: 'user-aminata',
            name: 'Aminata Sawadogo',
            role: 'Déléguée Promo L3 SEG • UJKZ',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          },
          {
            id: 'user-ibrahim',
            name: 'Ibrahim Ouedraogo',
            role: 'Major M1 Droit • Thomas Sankara',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
          },
          {
            id: 'user-idriss',
            name: 'Dr. Idriss Traoré',
            role: 'Enseignant-Chercheur • Formateur ENA',
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
          },
        ]);
      });
  };

  const handleStartDirectChat = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/v1/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'DIRECT', targetUserId }),
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        router.push(`/messages/${data.conversation.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartCall = (convId: string, targetName: string, type: 'VOICE' | 'VIDEO', e: React.MouseEvent) => {
    e.stopPropagation();
    fetch('/api/v1/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId, type, title: `Appel avec ${targetName}` }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.call) {
          setCurrentCallId(data.call.id);
          setCallType(type);
          setCallTitle(`Appel avec ${targetName}`);
          setIsCallModalOpen(true);
        }
      });
  };

  // Filter conversations based on tab and search
  const filteredConversations = conversations.filter((conv) => {
    const titleMatch =
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participants?.some((p: any) =>
        p.user?.profile?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (!titleMatch) return false;

    if (activeTab === 'direct') return conv.type === 'DIRECT';
    if (activeTab === 'groups') return conv.type === 'GROUP' || conv.type === 'ACADEMIC_GROUP';
    if (activeTab === 'resources') return conv.type === 'RESOURCE_CONTEXT' || Boolean(conv.context?.resource);

    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header title="Messages & Collaboration" showBack={false} />

      <main className="flex-1 flex flex-col pt-16 pb-24 max-w-3xl mx-auto w-full px-3 sm:px-6">
        {/* Active Incoming Call Banner if any */}
        {activeCall && (
          <div className="mt-3 p-4 rounded-2xl bg-secondary-container text-on-secondary shadow-lg flex items-center justify-between gap-3 animate-bounce">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[28px] animate-pulse">
                {activeCall.type === 'VIDEO' ? 'videocam' : 'ring_volume'}
              </span>
              <div>
                <h4 className="font-bold text-sm">Appel entrant : {activeCall.title}</h4>
                <p className="text-xs opacity-90">Un camarade vous invite à rejoindre</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCurrentCallId(activeCall.id);
                setCallType(activeCall.type);
                setCallTitle(activeCall.title);
                setIsCallModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-white text-secondary font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              Rejoindre
            </button>
          </div>
        )}

        {/* Top Search & Action Bar */}
        <div className="pt-4 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-surface-container-low px-3.5 py-2.5 rounded-2xl border border-outline-variant/30 shadow-xs">
            <span className="material-symbols-outlined text-outline text-[20px]">search</span>
            <input
              type="text"
              placeholder="Rechercher une discussion, un camarade, un TD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm w-full outline-hidden text-on-surface placeholder:text-outline"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenNewChat}
            aria-label="Nouvelle conversation"
            className="h-11 w-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm active:scale-95 transition-all shrink-0 hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[22px]">edit_square</span>
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 pt-3 pb-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'direct', label: 'Directes' },
            { id: 'groups', label: 'Groupes & Promo' },
            { id: 'resources', label: 'Ressources' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conversations List */}
        <div className="flex flex-col gap-2 pt-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
                sync
              </span>
              <span className="text-xs font-medium">Chargement des échanges...</span>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const other = conv.participants?.find((p: any) => p.userId !== currentUser?.id);
              const displayName =
                conv.type === 'DIRECT'
                  ? other?.user?.profile?.displayName || conv.title || 'Camarade'
                  : conv.title;
              const avatar =
                conv.type === 'DIRECT'
                  ? other?.user?.profile?.avatarUrl
                  : conv.avatarUrl;
              const isOnline = other?.user?.presence?.status === 'ONLINE';

              return (
                <div
                  key={conv.id}
                  onClick={() => router.push(`/messages/${conv.id}`)}
                  className="p-3.5 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-low transition-all border border-outline-variant/20 shadow-xs flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar with Presence Indicator */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/30">
                        <img
                          src={
                            avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                          }
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-surface" />
                      )}
                    </div>

                    {/* Metadata & Message Preview */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-headline-md text-sm sm:text-base font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                          {displayName}
                        </h4>
                        {other?.user?.profile?.isDelegate && (
                          <span className="text-[9px] bg-primary-fixed text-primary px-1.5 py-0.2 rounded font-bold shrink-0">
                            Délégué
                          </span>
                        )}
                      </div>

                      {/* Resource Context Tag if bound */}
                      {conv.context?.resource && (
                        <div className="flex items-center gap-1 text-[11px] text-primary font-bold truncate mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">menu_book</span>
                          <span className="truncate">{conv.context.resource.title}</span>
                        </div>
                      )}

                      {/* Last Message Snippet */}
                      <p className="font-body-sm text-xs text-on-surface-variant truncate mt-0.5 flex items-center gap-1">
                        {conv.lastMessage?.isVoiceNote && (
                          <span className="material-symbols-outlined text-[14px] text-primary">mic</span>
                        )}
                        {conv.lastMessage?.hasAttachment && (
                          <span className="material-symbols-outlined text-[14px] text-secondary">attachment</span>
                        )}
                        <span>
                          {conv.lastMessage?.text ||
                            (conv.lastMessage?.isVoiceNote
                              ? 'Note vocale reçue'
                              : conv.lastMessage?.hasAttachment
                              ? 'Document académique partagé'
                              : 'Débuter la discussion...')}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] text-on-surface-variant font-medium">
                      {conv.updatedAt
                        ? new Date(conv.updatedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Aujourd’hui'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleStartCall(conv.id, displayName, 'VOICE', e)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-fixed/40 transition-colors"
                        aria-label="Appeler"
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleStartCall(conv.id, displayName, 'VIDEO', e)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-fixed/40 transition-colors"
                        aria-label="Appel vidéo"
                      >
                        <span className="material-symbols-outlined text-[18px]">videocam</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center p-6 bg-surface-container-low rounded-3xl border border-outline-variant/30 mt-4">
              <span className="material-symbols-outlined text-[48px] text-primary mb-2">
                chat_bubble_outline
              </span>
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                Aucune discussion active
              </h3>
              <p className="text-xs text-on-surface-variant max-w-sm mt-1 mb-4">
                Échangez directement avec vos délégués de promo, vos camarades et les auteurs de cours certifiés.
              </p>
              <button
                type="button"
                onClick={handleOpenNewChat}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-sm active:scale-95 transition-all"
              >
                Démarrer un échange
              </button>
            </div>
          )}
        </div>
      </main>

      {/* New Conversation Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-md p-5 shadow-2xl border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                Nouvelle discussion
              </h3>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Contacts Campus Recommandés
              </span>
              {availableUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    setShowNewChatModal(false);
                    handleStartDirectChat(u.id);
                  }}
                  className="p-3 rounded-2xl bg-surface hover:bg-surface-container-low transition-all border border-outline-variant/20 flex items-center gap-3 cursor-pointer group active:scale-98"
                >
                  <img
                    src={u.avatarUrl}
                    alt={u.name}
                    className="w-11 h-11 rounded-full object-cover border border-outline-variant/20 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                      {u.name}
                    </h5>
                    <p className="text-[11px] text-on-surface-variant truncate">{u.role}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    arrow_forward
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Realtime Call Modal Overlay */}
      {isCallModalOpen && currentCallId && (
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          callId={currentCallId}
          type={callType}
          title={callTitle}
          currentUserId={currentUser?.id || 'user-aminata'}
        />
      )}

      <BottomNavigation />
    </div>
  );
}
