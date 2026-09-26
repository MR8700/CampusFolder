# 🛡️ Sécurité & Modération Académique Campus Folder

## 1. Principes de Sécurité
1. **Contrôle d'Accès aux Fichiers Payants :**  
   Les URL maîtresses des documents ne sont jamais envoyées publiquement dans les payloads de messages. L'ouverture requiert un jeton cryptographique émis par le modèle `Entitlement`.
2. **Autorisations Serveur Strictes :**  
   Les permissions d'envoi (`canSendMessages`, `canSendMedia`, `canStartCalls`) sont systématiquement vérifiées côté serveur dans `MessagingService` et `CallingService`.
3. **Protection Anti-Abus & Blocage :**  
   Le modèle `UserBlock` empêche les utilisateurs bloqués d'initier un chat direct ou d'envoyer des notifications à leur victime.
4. **Signalements et Audit :**  
   Le modèle `MessageReport` et la table `ActivityLog` enregistrent les infractions relatives à l'intégrité académique, au harcèlement ou à la fraude.
