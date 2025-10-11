# By Voula Beauty

Application full-stack (React + Node.js + MySQL) pour la gestion d&apos;un salon de beauté : réservation de services côté client et administration complète (services, employés, clients, rendez-vous, statistiques).

## Structure

- `docs/` — schéma SQL et spécification de l&apos;API REST.
- `server/` — backend Express avec sessions, Multer et MySQL (`/src` pour le code).
- `client/` — frontend React (Vite) avec React Router et contexte d&apos;authentification.

## Mise en route

### Prérequis

- Node.js 18+
- MySQL 8+

### Base de données

1. Créer une base `by_voula_beauty`.
2. Exécuter le script `docs/database-schema.sql`.
3. Ajouter un compte administrateur dans la table `users` (cf. exemple en bas du script, remplacer le hash par votre propre hash `bcrypt`).

### Backend

```bash
cd server
npm install
cp .env.example .env
# Mettre à jour les variables MySQL et le secret de session
npm run migrate   # crée les tables
npm run seed      # insère un admin + données de démonstration
npm run dev
```

Endpoints exposés sur `http://localhost:4000/api`. Les fichiers uploadés sont stockés dans `server/uploads`.

### Frontend

```bash
cd client
npm install
npm run dev
```

Le frontend se lance sur `http://localhost:5173` et proxy automatiquement l&apos;API (`/api`) et les images (`/uploads`).

## Fonctionnalités clés

- Inscription/connexion (sessions côté serveur, pas de JWT).
- Tableau de bord client avec historique et rendez-vous à venir.
- Réservation : sélection du service, de l&apos;employé, choix de la date/heure selon les disponibilités, création automatique d&apos;un paiement &ldquo;fictif&rdquo;.
- Profil utilisateur : mise à jour des informations et upload d&apos;une photo.
- Administration :
  - Gestion des services (CRUD + image).
  - Gestion des employés (profil, services offerts, horaires, avatar).
  - Gestion des rendez-vous (liste globale, changement de statut).
  - Gestion des clients (fiches + rendez-vous).
  - Dashboard de statistiques (rendez-vous, revenus, services populaires, activité par employé).

## Points d&apos;attention

- Authentification : sessions Express (cookie `connect.sid`). Les requêtes frontend incluent `credentials: 'include'`.
- Uploads : stockés localement (`server/uploads`). Adapter si besoin à un stockage distant.
- Disponibilités : calculées à partir des horaires de l&apos;employé (`employee_schedule`) et des créneaux déjà réservés.
- Paiements : enregistrés automatiquement, sans intégration d&apos;un prestataire de paiement.

## Scripts utiles

- `server:npm run dev` — lance le backend en mode développement.
- `server:npm run migrate` — applique le schéma SQL dans la base configurée.
- `server:npm run seed` — insère un compte admin et des données d'exemple.
- `client:npm run dev` — lance le frontend avec Vite.
- `docs/database-schema.sql` — schéma complet des tables MySQL.
- `docs/api-spec.md` — détail des routes et payloads attendus.
