# 🏛️ Architecture du Système de Communication & Collaboration Campus Folder

## 1. Vue d'Ensemble
Campus Folder est une plateforme académique mobile-first où **la ressource académique (cours, TD, corrigé, audio, vidéo) est l'objet central**, enrichie par un système complet de communication directe, de travail de groupe, de notes vocales et de conférences vidéo WebRTC.

```text
┌──────────────────────────────────────────────────────────┐
│                      CAMPUS FOLDER                       │
└────────────────────────────┬─────────────────────────────┘
                             │
     ┌───────────────────────┼────────────────────────┐
     │                       │                        │
     ▼                       ▼                        ▼
Identity / Auth        Resource Core           Messaging & Calls
     │                       │                        │
  Profils             Stockage & Accès         Discussion Directe
  INE & Rôles         Vérification Droits      Groupes Promo & UFR
     │                       │                 Ressource Contextuelle
  Portefeuille        Commerce & Ledger               │
  Revenus & Soldes    Orange Money / Moov             ▼
                      Commission 15% / 85%       Calling Engine
                                                      │
                                             ┌────────┼────────┐
                                             ▼        ▼        ▼
                                           Audio    Vidéo   Écran
                                                      │
                                                      ▼
                                           Signaling & SFU Cluster
                                           (MediaServerProvider)
```

---

## 2. Piliers d'Architecture

### A. Modular Monolith
Le projet conserve l'architecture Next.js 15 (App Router, React 19) et Prisma ORM afin d'éviter la complexité prématurée de micro-services distincts. Les frontières logiques sont isolées dans :
* `src/lib/messaging/` : Services métier (Messagerie, Partage, Vocaux, Présence, Appels, Modération, SFU).
* `src/app/api/v1/` : Route Handlers REST & flux SSE temps réel.
* `src/components/messaging/` : Composants UI réutilisables (Lecteur multimédia, Enregistreur vocal, Sélecteur de ressources, Module d'appel WebRTC).

### B. Modèle de Données Sans Duplication
* `User` : Réutilisation stricte de l'entité utilisateur existante (INE, profils, rôles, wallet).
* `AcademicResource` : Les documents partagés dans le chat font référence aux ressources validées du référentiel sans duplication.
* `Entitlement` & `AccessPolicy` : Aucune fuite de document payant. Le chat ne contourne jamais la politique de monétisation.
* `Wallet` & `LedgerEntry` : Rémunération automatique des auteurs lors d'achats de ressources ou de tickets de conférences (85% auteur / 15% plateforme).

---

## 3. Flux Temps Réel & Signalement WebRTC
* **Server-Sent Events (SSE) :** Flux HTTP streaming bidirectionnel et résilient (`/api/v1/conversations/[id]/stream`), fonctionnant sur architectures Serverless Vercel sans dépendance externe bloquante.
* **Event Bus Interne (`RealTimeBus`) :** Gestionnaire d'événements mémoire découplé, prêt pour branchement Redis Pub/Sub en environnement multi-instances.
* **Signalement WebRTC (`/api/v1/calls/[id]/signal`) :** Échange des offres, réponses SDP et candidats ICE pour établir les flux audio/vidéo et le partage d'écran.
