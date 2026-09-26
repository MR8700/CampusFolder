# 💬 Module Messagerie & Partage de Ressources Campus Folder

## 1. Fonctionnalités Clés
1. **Discussions Directes (P2P) :** Entre étudiants, délégués et enseignants.
2. **Groupes Académiques & Promotions :** Canaux dédiés aux promotions universitaires (ex: Licence 3 SEG, Master Droit).
3. **Conversations Contextualisées (`ConversationContext`) :** Discussion rattachée à un document ou un module académique.
4. **Partage de Ressources Académiques :**
   * *Ressources Gratuites :* Carte interactive avec boutons `[Ouvrir]` et `[Télécharger]`.
   * *Ressources Payantes :* Carte avec prix en FCFA, boutons `[Voir]` et `[Acheter]`, déblocage instantané via solde portefeuille.
5. **Notes Vocales Interactives :**
   * Enregistrement mobile-first avec l'API `MediaRecorder` (codec Opus).
   * Visualiseur de forme d'onde dynamique (`Waveform`).
   * Vitesses de lecture (1x, 1.25x, 1.5x, 2x).
6. **Media Viewer Natif :**
   * Support complet des PDF, images, audios, vidéos locales et vidéos YouTube intégrées.

---

## 2. Cycle de Vie d'un Message
```text
Client Input 
  ──> Validation Permissions (canSendMessages)
  ──> Vérification Blocage (UserBlock)
  ──> Transaction DB (Message + Attachments + VoiceMessage)
  ──> Émission RealTimeBus (message.created)
  ──> Diffusion SSE à tous les membres connectés
  ──> Mise à jour Accusé de lecture (MessageReadReceipt)
```
