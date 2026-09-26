# 📞 Module Appels & Conférences WebRTC Campus Folder

## 1. Fonctionnalités
* **Appels Vocaux & Vidéo :** Session P2P ou de groupe avec WebRTC natif.
* **Sonnerie & Réception :** Bannière d'appel entrant temps réel avec options Accepter / Décliner.
* **Partage d'Écran (`ScreenShareSession`) :** Affichage prioritaire en plein écran avec changement de source à la volée.
* **Chat Pendant l'Appel :** Volet de discussion synchronisé permettant de poser des questions sans couper le flux vidéo.
* **Monétisation de Conférences (`CallOffer` & `CallPurchase`) :** Billetterie avec déduction de portefeuille et versement de 85% à l'hôte.

---

## 2. Abstraction SFU Scalable (`MediaServerProvider`)
L'interface `MediaServerProvider` dans `src/lib/messaging/sfu-provider.ts` permet de basculer en production vers des clusters dédiés :
* **LiveKit Cluster / Mediasoup Nodes :** Support horizontal au-delà de 50 participants sans saturation de la bande passante étudiante.
* **Tokens Courts :** Jetons cryptographiques à durée de vie limitée (TTL 1 heure).
