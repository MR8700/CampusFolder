'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import AuthGatewayModal from '@/components/AuthGatewayModal';

export default function WalletPage() {
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Withdrawal Drawer state
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(1000);
  const [withdrawMethod, setWithdrawMethod] = useState<'ORANGE_MONEY' | 'MOOV_MONEY'>('ORANGE_MONEY');
  const [withdrawPhone, setWithdrawPhone] = useState('+226 70 00 00 00');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);

  const fetchWallet = () => {
    fetch('/api/v1/wallet')
      .then((res) => res.json())
      .then((data) => {
        setWalletData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleWithdrawConfirm = async () => {
    setIsProcessingWithdraw(true);
    try {
      const res = await fetch('/api/v1/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawAmount,
          method: withdrawMethod,
          destinationPhone: withdrawPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsWithdrawOpen(false);
        fetchWallet(); // Refresh ledger & balance from DB
      } else {
        alert(data.error || 'Erreur lors du retrait');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau');
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  const isAuthenticated = walletData?.authenticated === true && walletData?.wallet !== null;
  const balance = walletData?.wallet?.availableBalance ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header title="Portefeuille" />

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Main Semantic Title */}
        <header className="pt-4 pb-3 border-b border-surface-container-high/60 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                Portefeuille Étudiant & Royalties Pédagogiques
              </h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Rémunération solidaire des partages de cours, corrigés d’examens et synthèses d’amphi au Burkina Faso.
              </p>
            </div>
            {isAuthenticated && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary-fixed/40 px-3 py-1 rounded-full border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                Ledger Actif
              </span>
            )}
          </div>
        </header>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <span className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></span>
            <p className="text-sm font-semibold text-on-surface-variant">
              Vérification de la session financière sécurisée...
            </p>
          </div>
        ) : !isAuthenticated ? (
          /* UNCONNECTED VISITOR: Genuine Login Incentive (No Hardcoded Fake Data!) */
          <section aria-labelledby="auth-required-heading" className="max-w-2xl mx-auto my-8 w-full">
            <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xl border border-outline-variant/40 flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[34px]">lock</span>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-secondary bg-secondary-fixed/40 px-3 py-1 rounded-full">
                  Accès Sécurisé Réservé
                </span>
                <h2 id="auth-required-heading" className="text-2xl font-extrabold text-on-surface">
                  Connexion Requise pour Accéder au Portefeuille
                </h2>
                <p className="text-sm text-on-surface-variant leading-relaxed max-w-lg mx-auto">
                  Pour consulter votre solde amphi en FCFA, suivre les royalties issues du téléchargement de vos corrigés
                  et effectuer des retraits directs par Orange Money ou Moov Money, vous devez être authentifié avec votre compte étudiant officiel.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="py-3 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                  <span>Comptes Étudiants (DB)</span>
                </button>

                <Link
                  href="/connexion"
                  className="py-3 px-4 rounded-xl bg-surface-container text-on-surface font-bold text-xs sm:text-sm border border-outline-variant/40 hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Connexion Manuelle</span>
                </Link>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 w-full flex items-center justify-center gap-2 text-xs text-on-surface-variant">
                <span>Pas encore inscrit ?</span>
                <Link href="/inscription" className="font-bold text-primary hover:underline">
                  Créer mon compte étudiant avec mon INE →
                </Link>
              </div>
            </div>
          </section>
        ) : (
          /* CONNECTED STUDENT: Real Wallet & Real Database Ledger */
          <div className="w-full lg:grid lg:grid-cols-12 lg:gap-8 pt-2">
            {/* Left Column: FinTech Card & Metrics (5 cols on desktop) */}
            <aside aria-labelledby="wallet-card-heading" className="lg:col-span-5 flex flex-col gap-5">
              {/* Status Chip */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="text-[11px] font-bold text-primary uppercase font-mono">
                    Compte Sécurisé • {walletData.wallet?.cfPayId}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[15px] text-primary">
                    verified_user
                  </span>
                  <span>Compensé & Garanti</span>
                </div>
              </div>

              {/* Virtual FinTech Card */}
              <section aria-labelledby="wallet-card-heading" className="relative w-full rounded-3xl bg-gradient-to-br from-primary via-tertiary-container to-primary-container p-6 text-on-primary shadow-xl overflow-hidden border-2 border-primary/40 ring-1 ring-primary/20">
                <svg
                  className="absolute -right-10 -bottom-10 w-48 h-48 opacity-15 pointer-events-none"
                  fill="none"
                  viewBox="0 0 160 160"
                >
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeDasharray="12 8" strokeWidth="8"></circle>
                  <circle cx="80" cy="80" r="46" stroke="currentColor" strokeWidth="4"></circle>
                  <path d="M40 80H120M80 40V120" stroke="currentColor" strokeLinecap="round" strokeWidth="6"></path>
                </svg>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-secondary-fixed">
                      account_balance_wallet
                    </span>
                    <h2 id="wallet-card-heading" className="text-xs text-primary-fixed uppercase tracking-wider font-bold">
                      Solde Disponible Amphi
                    </h2>
                  </div>
                  <button
                    aria-label={isBalanceHidden ? 'Afficher le solde' : 'Masquer le solde'}
                    className="w-8 h-8 rounded-full bg-surface-container-lowest/15 flex items-center justify-center active:scale-95 transition-transform"
                    onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isBalanceHidden ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>

                <div className="mt-4 mb-3 relative z-10">
                  <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight flex items-baseline gap-1.5">
                    {isBalanceHidden ? (
                      <span className="tracking-widest">••••••••</span>
                    ) : (
                      <span>{balance.toLocaleString('fr-FR')}</span>
                    )}
                    <span className="text-lg font-bold text-primary-fixed">FCFA</span>
                  </div>
                  <p className="text-[11px] text-primary-fixed-dim mt-0.5">
                    Valeur instantanée compensée sur votre numéro Orange / Moov
                  </p>
                </div>

                <div className="pt-3 border-t border-surface-container-lowest/15 flex items-center justify-between relative z-10 text-xs">
                  <div>
                    <span className="text-[10px] text-primary-fixed-dim uppercase tracking-wider block">
                      Titulaire du Compte
                    </span>
                    <span className="font-bold text-white truncate max-w-[200px] block mt-0.5">
                      {walletData.wallet?.holderName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-primary-fixed-dim uppercase tracking-wider block">
                      ID CF-PAY
                    </span>
                    <span className="font-mono font-bold text-white text-[11px]">
                      {walletData.wallet?.cfPayId}
                    </span>
                  </div>
                </div>
              </section>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsWithdrawOpen(true)}
                  className="py-3 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 active:scale-98 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  <span>Retirer des gains</span>
                </button>
                <Link
                  href="/publier"
                  className="py-3 px-4 rounded-xl bg-surface-container text-on-surface font-bold text-xs sm:text-sm border-2 border-outline-variant/40 flex items-center justify-center gap-2 hover:bg-surface-container-high active:scale-98 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Publier un cours</span>
                </Link>
              </div>

              {/* KPIs Grid */}
              <section aria-labelledby="kpis-heading" className="grid grid-cols-3 gap-2 bg-surface-container-lowest p-4 rounded-2xl border-2 border-outline-variant/40 shadow-xs">
                <h2 id="kpis-heading" className="sr-only">Indicateurs de Vente</h2>
                <div className="flex flex-col text-center">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Gains Mois</span>
                  <span className="text-sm font-extrabold text-primary font-mono mt-1">
                    {walletData.kpis?.monthGains?.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <div className="flex flex-col text-center border-x border-outline-variant/40 px-1">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Téléchargements</span>
                  <span className="text-sm font-extrabold text-on-surface font-mono mt-1">
                    {walletData.kpis?.paidDownloads}
                  </span>
                </div>
                <div className="flex flex-col text-center">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Commission</span>
                  <span className="text-sm font-extrabold text-secondary font-mono mt-1">
                    {walletData.kpis?.platformFeePercent}%
                  </span>
                </div>
              </section>
            </aside>

            {/* Right Column: Weekly Sales & Ledger (7 cols on desktop) */}
            <div className="lg:col-span-7 flex flex-col gap-5 mt-6 lg:mt-0">
              {/* Weekly Performance Bar Chart */}
              <section aria-labelledby="analytics-heading" className="bg-surface-container-lowest p-5 rounded-2xl border-2 border-outline-variant/40 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">trending_up</span>
                    <h2 id="analytics-heading" className="text-sm font-bold text-on-surface">
                      Ventes Hebdomadaires & Royalties
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-secondary">
                    +{walletData.kpis?.weeklyGrowthPercent}% vs S-1
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4 px-2">
                  {walletData.weeklySales?.map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[10px] font-mono font-bold text-on-surface-variant">
                        {item.amount > 0 ? `${(item.amount / 1000).toFixed(1)}k` : '0'}
                      </span>
                      <div
                        className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                          item.isHighlighted
                            ? item.color === 'secondary'
                              ? 'bg-secondary'
                              : 'bg-primary'
                            : 'bg-surface-container-high'
                        }`}
                        style={{ height: `${item.height}%` }}
                      ></div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Transactions Ledger */}
              <section aria-labelledby="ledger-heading" className="bg-surface-container-lowest p-5 rounded-2xl border-2 border-outline-variant/40 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                    <h2 id="ledger-heading" className="text-sm font-bold text-on-surface">
                      Grand Livre des Transactions ({walletData.ledgerEntries?.length || 0})
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                    Double-entry ledger
                  </span>
                </div>

                {walletData.ledgerEntries?.length === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center py-8">
                    Aucune transaction enregistrée pour le moment.
                  </p>
                ) : (
                  <div className="flex flex-col divide-y divide-surface-container-high">
                    {walletData.ledgerEntries?.map((entry: any) => (
                      <article key={entry.id} className="py-3 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              entry.type === 'CREDIT'
                                ? 'bg-primary-container/20 text-primary'
                                : 'bg-error-container/20 text-error'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {entry.type === 'CREDIT' ? 'download_done' : 'outbox'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-on-surface truncate">
                              {entry.description || 'Transaction pédagogique'}
                            </h3>
                            <p className="text-[10px] text-on-surface-variant truncate mt-0.5">
                              {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-mono text-xs font-black shrink-0 ${
                            entry.type === 'CREDIT' ? 'text-primary' : 'text-error'
                          }`}
                        >
                          {entry.type === 'CREDIT' ? '+' : '-'}
                          {entry.amount?.toLocaleString('fr-FR')} F
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Withdrawal Drawer Modal */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border-2 border-primary/30 ring-1 ring-primary/15 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
                <span>Retrait Mobile Money Instantané</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsWithdrawOpen(false)}
                className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                  Montant à retirer (FCFA)
                </label>
                <input
                  type="number"
                  min="500"
                  max={balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-[10px] text-on-surface-variant mt-1 block">
                  Solde disponible : {balance.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                  Opérateur Mobile Money Burkinabè
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('ORANGE_MONEY')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      withdrawMethod === 'ORANGE_MONEY'
                        ? 'border-secondary bg-secondary-fixed/30 text-secondary'
                        : 'border-outline-variant text-on-surface'
                    }`}
                  >
                    <span>Orange Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('MOOV_MONEY')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      withdrawMethod === 'MOOV_MONEY'
                        ? 'border-primary bg-primary-fixed/30 text-primary'
                        : 'border-outline-variant text-on-surface'
                    }`}
                  >
                    <span>Moov Flooz</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                  Numéro Bénéficiaire (+226)
                </label>
                <input
                  type="tel"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessingWithdraw || withdrawAmount <= 0 || withdrawAmount > balance}
              onClick={handleWithdrawConfirm}
              className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isProcessingWithdraw ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Transfert en cours...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Confirmer le Retrait Instantané</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Auth Gateway Modal */}
      <AuthGatewayModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onUserLoggedIn={() => {
          setShowAuthModal(false);
          fetchWallet();
        }}
      />

      <BottomNavigation />
    </div>
  );
}
