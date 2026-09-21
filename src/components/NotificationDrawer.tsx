'use client';

import React, { useState, useEffect } from 'react';

interface NotificationItem {
  id: string;
  recipient: string;
  subject: string;
  eventType: string;
  contentHtml: string;
  status: string;
  provider: string;
  isRead?: boolean;
  createdAt: string;
}

interface Preferences {
  notifyEmailAll: boolean;
  notifyOnPurchase: boolean;
  notifyOnSale: boolean;
  notifyOnDownload: boolean;
  notifyOnPublish: boolean;
  notifyOnWithdrawal: boolean;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<Preferences>({
    notifyEmailAll: true,
    notifyOnPurchase: true,
    notifyOnSale: true,
    notifyOnDownload: true,
    notifyOnPublish: true,
    notifyOnWithdrawal: true,
  });
  const [activeTab, setActiveTab] = useState<'inbox' | 'settings'>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/v1/user/notifications')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setNotifications(data.notifications || []);
            setUnreadCount(
              data.unreadCount ?? (data.notifications || []).filter((n: any) => !n.isRead).length
            );
            if (data.preferences) setPreferences(data.preferences);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  const handleOpenEmail = (item: NotificationItem) => {
    setSelectedEmail(item);
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch('/api/v1/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_READ', notificationId: id }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/v1/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_ALL_READ' }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (selectedEmail?.id === id) {
      setSelectedEmail(null);
    }
    try {
      await fetch('/api/v1/user/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Voulez-vous vraiment effacer toutes vos notifications ?')) return;
    setNotifications([]);
    setUnreadCount(0);
    setSelectedEmail(null);
    try {
      await fetch('/api/v1/user/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const togglePreference = async (key: keyof Preferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    setSavingPref(true);

    try {
      await fetch('/api/v1/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: updated[key] }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPref(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-surface-container-lowest h-full flex flex-col shadow-2xl border-l border-surface-container-high overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-surface-container-high flex items-center justify-between bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">notifications_active</span>
            <div>
              <h2 className="font-extrabold text-base text-on-surface leading-tight">Notifications & E-mails</h2>
              <p className="text-[11px] text-on-surface-variant">Moteur d&apos;envoi académique • SSL 256-bit</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-surface-container-high bg-surface-container-low/50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('inbox');
              setSelectedEmail(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'inbox'
                ? 'border-b-2 border-primary text-primary bg-surface-container-lowest'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">mail</span>
            <span>Boîte ({notifications.length})</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-secondary text-on-secondary">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              setSelectedEmail(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-b-2 border-primary text-primary bg-surface-container-lowest'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Consentement (&quot;s&apos;il accepte&quot;)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'inbox' && (
            <>
              {selectedEmail ? (
                <div className="flex flex-col h-full animate-fadeIn">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={() => setSelectedEmail(null)}
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                      <span>Retour aux notifications</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNotification(selectedEmail.id)}
                      className="flex items-center gap-1 text-xs font-bold text-error hover:bg-error/10 px-2 py-1 rounded-lg transition-colors"
                      title="Supprimer cet email"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Effacer</span>
                    </button>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-2xl mb-3 border border-outline-variant/20">
                    <p className="text-xs font-bold text-on-surface">{selectedEmail.subject}</p>
                    <p className="text-[10px] text-outline mt-0.5">
                      Envoyé à : <span className="font-mono text-primary font-bold">{selectedEmail.recipient}</span> •{' '}
                      {new Date(selectedEmail.createdAt).toLocaleDateString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div
                    className="flex-1 bg-white rounded-2xl p-4 border border-outline-variant/30 overflow-y-auto text-xs shadow-inner"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.contentHtml }}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {/* Top Action Toolbar */}
                  {notifications.length > 0 && (
                    <div className="flex items-center justify-between pb-2 mb-1 border-b border-surface-container-high/60">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant">
                        <span>{notifications.length} message(s)</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-secondary/15 text-secondary border border-secondary/30">
                            {unreadCount} non lu(s)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllAsRead}
                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                            title="Tout marquer comme lu"
                          >
                            <span className="material-symbols-outlined text-[15px]">done_all</span>
                            <span>Tout marquer lu</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleDeleteAll}
                          className="text-[11px] font-bold text-error/80 hover:text-error hover:underline flex items-center gap-0.5"
                          title="Effacer toutes les notifications"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                          <span>Tout effacer</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2" />
                      <p className="text-xs text-on-surface-variant">Chargement des notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                      <div className="w-12 h-12 rounded-full bg-primary-fixed/60 flex items-center justify-center text-primary mb-3">
                        <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
                      </div>
                      <p className="font-bold text-sm text-on-surface">Aucune notification</p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Dès qu'une ressource est validée, achetée ou publiée, votre reçu certifié apparaîtra ici.
                      </p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleOpenEmail(item)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-start gap-3 active:scale-[0.99] relative ${
                          !item.isRead
                            ? 'bg-primary/[0.04] border-primary/40 ring-1 ring-primary/20 hover:border-primary shadow-sm'
                            : 'bg-surface-container-lowest border-outline-variant/30 hover:border-primary/40 opacity-90'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            item.eventType === 'ORDER_PURCHASED'
                              ? 'bg-primary-fixed text-primary'
                              : item.eventType === 'RESOURCE_SOLD'
                              ? 'bg-[#10B981]/20 text-[#00422B]'
                              : item.eventType === 'WALLET_WITHDRAWAL'
                              ? 'bg-[#EA580C]/20 text-[#EA580C]'
                              : 'bg-surface-container-high text-on-surface'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {item.eventType === 'ORDER_PURCHASED'
                              ? 'shopping_bag'
                              : item.eventType === 'RESOURCE_SOLD'
                              ? 'payments'
                              : item.eventType === 'WALLET_WITHDRAWAL'
                              ? 'account_balance_wallet'
                              : 'mail'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {!item.isRead && (
                                <span className="w-2 h-2 rounded-full bg-secondary shrink-0" title="Non lu" />
                              )}
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono truncate">
                                {item.eventType.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <span className="text-[10px] text-outline shrink-0">
                              {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <h4 className={`text-xs truncate mt-0.5 ${!item.isRead ? 'font-black text-on-surface' : 'font-bold text-on-surface/80'}`}>
                            {item.subject}
                          </h4>
                          <p className="text-[11px] text-on-surface-variant truncate">
                            À : {item.recipient} • Status :{' '}
                            <span className="font-bold text-[#10B981]">{item.status}</span>
                          </p>

                          {/* Quick Actions Footer */}
                          <div className="flex items-center justify-end gap-2 mt-2 pt-1.5 border-t border-outline-variant/15">
                            {!item.isRead && (
                              <button
                                type="button"
                                onClick={(e) => handleMarkAsRead(item.id, e)}
                                className="px-2 py-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold flex items-center gap-0.5 transition-all"
                                title="Marquer comme lu"
                              >
                                <span className="material-symbols-outlined text-[13px]">check</span>
                                <span>Marquer lu</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteNotification(item.id, e)}
                              className="p-1 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-all flex items-center gap-0.5 text-[10px]"
                              title="Effacer cette notification"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                              <span>Effacer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'settings' && (
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-primary-fixed/40 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                  <h3 className="text-xs font-bold text-primary">Gestion du Consentement Étudiant</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Conformément à la charte, vous choisissez librement les notifications par e-mail que vous acceptez de
                  recevoir sur votre messagerie.
                </p>
              </div>

              {/* Preferences List */}
              <div className="flex flex-col gap-3">
                {/* Master Switch */}
                <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-on-surface">Activer toutes les notifications</p>
                    <p className="text-[10px] text-on-surface-variant">Interrupteur général e-mails</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.notifyEmailAll}
                    onChange={() => togglePreference('notifyEmailAll')}
                    className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                {/* Sub Options */}
                <div
                  className={`flex flex-col gap-2.5 pl-2 transition-opacity ${
                    preferences.notifyEmailAll ? 'opacity-100' : 'opacity-40 pointer-events-none'
                  }`}
                >
                  <div className="flex items-center justify-between p-2.5 bg-surface-container-lowest rounded-xl border border-surface-container-high">
                    <div>
                      <p className="text-xs font-semibold text-on-surface">Achats & Reçus de paiement</p>
                      <p className="text-[10px] text-on-surface-variant">Reçu immédiat + lien lecteur sécurisé</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifyOnPurchase}
                      onChange={() => togglePreference('notifyOnPurchase')}
                      className="w-4 h-4 rounded text-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-surface-container-lowest rounded-xl border border-surface-container-high">
                    <div>
                      <p className="text-xs font-semibold text-on-surface">Ventes de vos documents & Gains 85%</p>
                      <p className="text-[10px] text-on-surface-variant">Avis dès qu&apos;un camarade achète votre cours</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifyOnSale}
                      onChange={() => togglePreference('notifyOnSale')}
                      className="w-4 h-4 rounded text-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-surface-container-lowest rounded-xl border border-surface-container-high">
                    <div>
                      <p className="text-xs font-semibold text-on-surface">Accusés de téléchargement</p>
                      <p className="text-[10px] text-on-surface-variant">Jeton de déblocage & filigrane certifié</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifyOnDownload}
                      onChange={() => togglePreference('notifyOnDownload')}
                      className="w-4 h-4 rounded text-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-surface-container-lowest rounded-xl border border-surface-container-high">
                    <div>
                      <p className="text-xs font-semibold text-on-surface">Confirmation de publication</p>
                      <p className="text-[10px] text-on-surface-variant">Indexation officielle dans votre amphi</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifyOnPublish}
                      onChange={() => togglePreference('notifyOnPublish')}
                      className="w-4 h-4 rounded text-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-surface-container-lowest rounded-xl border border-surface-container-high">
                    <div>
                      <p className="text-xs font-semibold text-on-surface">Retraits Mobile Money</p>
                      <p className="text-[10px] text-on-surface-variant">Avis de transfert Orange Money / Moov Flooz</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifyOnWithdrawal}
                      onChange={() => togglePreference('notifyOnWithdrawal')}
                      className="w-4 h-4 rounded text-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {savingPref && (
                <p className="text-[11px] text-primary font-bold text-center flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  Mise à jour automatique des préférences...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
