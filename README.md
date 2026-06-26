# 🅿️ Bingo'z Parking — App SaaS pour exploitants

> Système d'exploitation pour la gestion de parking : transformer un actif passif en revenu optimisé.

**Statut :** pré-MVP software-only
**Cible :** propriétaires-exploitants de parking (B2B) et leurs automobilistes finaux (B2B2C)
**Langue de travail :** français

---

## Démarrage rapide (local)

Prérequis : Node 22, pnpm 10, une base PostgreSQL.

```bash
pnpm install
cp .env.example .env            # renseigner DATABASE_URL + AUTH_TOKEN_SECRET
pnpm db:generate                # génère le client Prisma
pnpm --filter @bingoz/database db:migrate   # applique les migrations
pnpm db:seed                    # jeu de données démo (Beaugrenelle)
pnpm dev                        # web (3000) + api (3001)
```

Données de démo créées par le seed :

- **Exploitant** — connexion API `POST /auth/login` : `tenantSlug = beaugrenelle-demo`, `email = admin@beaugrenelle.test`, `password = demo1234`.
- **Tableau de bord** : http://localhost:3000
- **Page publique automobiliste** : http://localhost:3000/parkings/beaugrenelle

Qualité : `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` (tout doit passer).

---

## Pour les assistants IA (Claude Code, Codex, Cursor, etc.)

Ce dépôt est en phase de **pré-MVP software-only**. Avant toute génération de code substantielle :

1. Lire `CLAUDE.md` (Claude Code) ou `AGENTS.md` (Codex / autres agents).
2. Lire `docs/01-contexte-projet.md` pour le cadre business.
3. Respecter les décisions structurantes documentées dans `docs/06-decisions-bloquantes.md`.
4. Toujours répondre, commenter le code et écrire la documentation **en français**.

---

## Structure du dépôt

```
bingoz-parking/
├── README.md                  # Ce fichier — vue d'ensemble
├── CLAUDE.md                  # Instructions pour Claude Code
├── AGENTS.md                  # Instructions pour Codex et autres agents
├── docs/
│   ├── 01-contexte-projet.md
│   ├── 02-cible-proposition-valeur.md
│   ├── 03-benchmark-concurrentiel.md
│   ├── 04-contraintes.md
│   ├── 05-stack-technique.md
│   ├── 06-decisions-bloquantes.md
│   ├── 07-scope-mvp.md
│   ├── 08-roadmap.md
│   ├── 09-glossaire.md
│   ├── 10-demarrage-developpement.md
│   └── architecture.md
├── apps/
│   ├── web/                    # Next.js — interface exploitant + réservation
│   └── api/                    # NestJS — API principale
├── packages/
│   ├── domain/                 # Logique métier pure
│   ├── database/               # Schéma Prisma
│   ├── hardware/               # Contrats abstraits accès futurs
│   └── config/                 # Configuration partagée
├── .gitignore
└── .editorconfig
```

---

## Proposition de valeur (résumé)

Quatre piliers fonctionnels :

1. **Réservation & paiement** — orchestration multi-canal, vision unifiée, paiement intégré.
2. **Yield management dynamique** — tarification adaptée à la demande, fin du tarif fixe.
3. **Gestion des abonnés** — résidentiels, entreprises, ponctuels, dans une seule base.
4. **Analytics & pilotage** — taux de remplissage, marge par place, alertes opérationnelles.

Plus une **couche d'intégration matérielle** (barrières, LAPI, bornes) prévue après le MVP software-only.

---

## Stack technique recommandée (à raffiner)

- **Frontend web :** Next.js (App Router, TypeScript)
- **Mobile automobiliste :** React Native / Expo (si retenu)
- **Backend :** NestJS (TypeScript) ou FastAPI (Python)
- **BDD :** PostgreSQL + Redis
- **Paiement :** Stripe Connect (Stripe Billing pour abonnements)
- **Hébergement :** Scaleway ou OVH (souveraineté française)
- **IoT / hardware :** MQTT (broker EMQX ou HiveMQ)
- **Auth :** Auth0 ou WorkOS (SSO entreprise)

Détails complets dans `docs/05-stack-technique.md`.

---

## Décisions structurantes retenues

Ces décisions cadrent l'architecture, le pricing et le go-to-market pour le lancement. Elles ont été arrêtées le `2026-05-07` et restent révisables après retours terrain documentés.

1. **Segment de tête** — propriétaires-exploitants de parking.
2. **Modèle économique** — application configurable vendue selon les besoins client, avec personnalisation légère.
3. **Stratégie hardware** — software-only au démarrage, puis intégration et développement d'agents locaux plus tard.

Détails dans `docs/06-decisions-bloquantes.md`.

---

## Source de vérité

Ce dépôt est le miroir développeur d'un audit stratégique vivant tenu sur Notion :
**App Parking — Audit & Diagnostic** (page Notion `350e21ab49298121ba71f842a137634a`).

En cas de divergence, **Notion fait foi** sur la stratégie ; **ce dépôt fait foi** sur le code et l'architecture technique.
