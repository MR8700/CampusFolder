# 📡 Répertoire des Endpoints API de Communication Campus Folder

## 1. Discussions & Conversations
* `GET /api/v1/conversations` : Liste des discussions de l'utilisateur connecté avec derniers messages et avatars.
* `POST /api/v1/conversations` : Crée un échange direct ou un groupe d'études avec participants.
* `GET /api/v1/conversations/:id` : Récupère les détails, contexte académique et participants d'une discussion.
* `PATCH /api/v1/conversations/:id` : Met à jour le titre, description ou statut muet.
* `DELETE /api/v1/conversations/:id` : Quitte la discussion.

## 2. Messages & Médias
* `GET /api/v1/conversations/:id/messages?cursor=...&limit=30` : Pagination par curseur des messages.
* `POST /api/v1/conversations/:id/messages` : Envoie un message texte, une ressource, une note vocale ou un média.
* `GET /api/v1/conversations/:id/stream` : Flux Server-Sent Events (SSE) temps réel pour la discussion.
* `POST /api/v1/messages/:id/reactions` : Ajoute ou retire une réaction émoji.
* `POST /api/v1/messages/:id/read` : Marque un message et la discussion comme lus.

## 3. Partage de Ressources
* `POST /api/v1/resources/share` : Partage une ressource validée dans une discussion.
* `GET /api/v1/resources/:id/access-check` : Vérifie l'éligibilité de l'utilisateur à ouvrir ou télécharger le document.

## 4. Appels & Conférences WebRTC
* `GET /api/v1/calls` : Liste les appels actifs de l'utilisateur.
* `POST /api/v1/calls` : Initie un appel vocal ou vidéo (direct, groupe, ou masterclass payante).
* `GET /api/v1/calls/:id` : Détails de l'appel et participants connectés.
* `POST /api/v1/calls/:id` : Action sur l'appel (`ACCEPT`, `LEAVE`, `END`).
* `GET /api/v1/calls/:id/signal` : Flux SSE de signalement WebRTC pour la salle d'appel.
* `POST /api/v1/calls/:id/signal` : Envoie une offre SDP, réponse SDP ou candidat ICE.
* `POST /api/v1/calls/:id/screen-share` : Démarre ou arrête une session de partage d'écran.
* `POST /api/v1/calls/:id/purchase` : Achète un ticket d'accès à une conférence payante via le portefeuille.

## 5. Présence & Modération
* `GET /api/v1/presence?userId=...` : Récupère le statut de présence d'un utilisateur.
* `POST /api/v1/presence` : Heartbeat périodique et mise à jour de statut (`ONLINE`, `BUSY`, `IN_CALL`).
* `POST /api/v1/moderation/block` : Bloque ou débloque un utilisateur.
* `POST /api/v1/moderation/report` : Signale un message pour examen par la modération.
