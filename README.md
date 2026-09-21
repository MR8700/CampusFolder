# 🎓 CampusFolder

> **Plateforme Académique & Numérique Universitaire**  
> Architecture moderne Next.js 15 (App Router), Prisma ORM, Tailwind CSS et intégration campus.

---

## 🚀 Vue d'ensemble

**CampusFolder** est une plateforme conçue pour centraliser, valoriser et sécuriser les ressources académiques et administratives universitaires :
- 📚 **Gestion des ressources académiques** : consultation, partage et acquisition de cours, TD, examens.
- 🆔 **Identité & Inscription** : gestion de l'INE (Identifiant National de l'Étudiant), authentification sécurisée.
- 💳 **Portefeuille & Transactions** : gestion des soldes, acquisitions et téléchargements sécurisés.
- 🏢 **Multi-campus / Universités** : structure extensible multi-établissements.

---

## 🛠️ Stack Technique

- **Framework** : [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Base de données & ORM** : [Prisma ORM](https://www.prisma.io/) (PostgreSQL recommandé en production sur Vercel, SQLite en local)
- **Styling** : [Tailwind CSS](https://tailwindcss.com/)
- **Déploiement cible** : [Vercel](https://vercel.com/)

---

## ⚙️ Démarrage Local

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration des variables d'environnement
Copiez `.env.example` vers `.env` :
```bash
cp .env.example .env
```
Renseignez votre `DATABASE_URL` ainsi que vos identifiants d'envoi d'emails.

### 3. Initialisation de la Base de Données
```bash
# Générer le client Prisma
npm run prisma:generate

# Synchroniser le schéma
npm run prisma:push

# (Optionnel) Peupler la base avec les données de test / référentiel
npm run prisma:seed
```

### 4. Lancement du serveur de développement
```bash
npm run dev
```
Rendez-vous sur [http://localhost:3005](http://localhost:3005).

---

## 🌐 Déploiement sur Vercel & Automatisation Base de Données

### Base de données en Production
Vercel exécutant des fonctions serverless (stateless), la base de données de production doit être hébergée dans le cloud :
- **Fournisseur recommandé** : Supabase, Neon Serverless Postgres, ou Vercel Postgres.
- Renseignez la variable d'environnement `DATABASE_URL` dans les paramètres de votre projet Vercel.

### Automatisation du build & indexation
Dans `package.json`, le script `postinstall` :
```json
"postinstall": "prisma generate"
```
garantit que le client Prisma est régénéré automatiquement à chaque build sur Vercel. Les index définis dans `prisma/schema.prisma` sont automatiquement synchronisés avec `prisma db push` ou `prisma migrate deploy`.
