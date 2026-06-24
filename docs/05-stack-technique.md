# 05 — Stack technique

> Recommandation préliminaire — à raffiner selon les compétences d'équipe et les décisions structurantes.

---

## Vue d'ensemble

```
┌────────────────────────────────────────────────────────────────┐
│  apps/web (Next.js)        apps/mobile (React Native, opt.)    │
│  apps/site-marketing       apps/admin (Back-office Bingo'z)    │
└──────────────┬───────────────────────────┬─────────────────────┘
               │ REST + WebSockets         │ REST
               ▼                           ▼
┌────────────────────────────────────────────────────────────────┐
│                  apps/api (NestJS) — multi-tenant              │
│  Auth │ Réservation │ Pricing/Yield │ Billing │ Parking Mgmt   │
└────────┬───────────────┬─────────────────┬─────────────────────┘
         │               │                 │
         ▼               ▼                 ▼
   PostgreSQL       Redis (cache,     Stripe Connect / Billing
   (Prisma/Drizzle) queues)
         ▲
         │ MQTT
         │
┌────────┴────────────────────────────────────────────────┐
│  apps/agent-iot — phase ultérieure                      │
│  Bridge MQTT ↔ protocoles propriétaires (offline-first) │
└─────────────────────────────────────────────────────────┘
              │
              ▼
   Barrières (Skidata, Came, …) │ LAPI (Survision, …) │ Bornes
```

---

## Frontend

### Web (interface exploitant + site marketing)

- **Framework :** Next.js 14+ (App Router)
- **Langage :** TypeScript strict
- **UI :** Tailwind CSS + shadcn/ui (extension contrôlée)
- **State :** React Server Components par défaut, Zustand ou Jotai pour l'état client complexe
- **Forms :** React Hook Form + Zod
- **Data fetching :** Server Actions + TanStack Query côté client si besoin
- **i18n :** `next-intl` (FR par défaut, prévoir EN pour rayonnement européen)

### Mobile automobiliste (si retenu)

- **Framework :** React Native + Expo
- **Navigation :** Expo Router
- **Critère d'opportunité :** justifier vs PWA. Une PWA bien faite peut couvrir 80 % du besoin sans coût d'app store.

---

## Backend

### API principale

- **Défaut :** NestJS (TypeScript) — cohérence full-TS, écosystème mature, modules bien typés.
- **Alternative :** FastAPI (Python) — si l'équipe a un fort background data/ML (utile pour le yield management plus tard).
- **REST + OpenAPI** généré, **WebSockets** (ou SSE) pour temps réel (état des places, événements barrières).

### Base de données

- **PostgreSQL 16+** comme stockage principal.
- **ORM :** Prisma (DX excellente) ou Drizzle (plus proche du SQL, meilleur pour requêtes complexes). À trancher.
- **Redis** : cache, sessions, files d'attente (BullMQ).
- **Migrations** : versionnées dans le repo (`prisma migrate` ou `drizzle-kit`).

### Tâches asynchrones

- **BullMQ** (sur Redis) pour : envoi d'emails, génération de factures, synchronisation plateformes tierces, recalcul yield.

---

## Paiement

- **Stripe Connect** en première intention — multi-comptes, reversement automatique par exploitant.
- **Stripe Billing** pour les abonnements (notre modèle SaaS + abonnements parking des résidents).
- **Adyen** en alternative pour clients enterprise européens nécessitant des moyens de paiement spécifiques.

---

## IoT / Hardware

> Phase ultérieure : le MVP démarre en software-only. Cette section décrit la cible technique quand les agents locaux seront développés.

- **MQTT** comme protocole pivot.
- **Broker :** EMQX ou HiveMQ (selon licence et coût).
- **Agent local** : service Node.js ou Go déployé sur un mini-PC dans le parking, pattern offline-first.
- **SDK partenaires :** Skidata, Came, etc. (à choisir 2 partenaires de départ).
- **LAPI :** Survision (français) comme partenaire de départ.

---

## Hébergement

- **Scaleway / OVH** par défaut — souveraineté française anticipée pour collectivités et appels d'offres.
- **AWS / GCP** envisageable pour déploiements internationaux ultérieurs.
- **Conteneurisation :** Docker + Kubernetes (managé : Scaleway Kapsule ou OVH Managed K8s).
- **CDN :** Bunny.net ou Cloudflare (pour assets statiques).

---

## Observabilité et qualité

| Domaine | Outil |
|---|---|
| Erreurs | **Sentry** |
| APM / monitoring | **Datadog** ou **Grafana Cloud** |
| Logs | Loki (Grafana Cloud) ou Datadog Logs |
| Uptime | Better Stack ou UptimeRobot |
| Tests unitaires | Vitest |
| Tests E2E | Playwright |
| Coverage | > 70 % sur logique métier |

---

## Authentification et SSO

- **Auth0** ou **WorkOS** — à trancher selon les exigences SSO des premiers clients.
- **WorkOS** est plus orienté B2B SSO (SAML, OIDC, SCIM). Recommandé si premier client est une foncière ou une grande entreprise.

---

## Conformité

- **Vanta** pour préparer SOC 2 / ISO 27001 — utile dès qu'un client enterprise le demande.

---

## Outils transverses

| Domaine | Outil |
|---|---|
| Gestion produit | **Linear** |
| Design | **Figma** |
| Documentation | **Notion** (stratégie) + repo `docs/` (technique) |
| CI/CD | **GitHub Actions** |
| CRM | **HubSpot** ou **Pipedrive** |
| Comptabilité FR | **Pennylane** |
| Support client | **Crisp** ou **Intercom** |

---

## Décisions techniques à arbitrer

- Monorepo (Turborepo / Nx) vs polyrepo
- Prisma vs Drizzle
- NestJS vs FastAPI (couplé à la composition de l'équipe)
- Auth0 vs WorkOS
- App mobile native vs PWA
- 2 partenaires hardware initiaux à choisir parmi : Skidata, Came, Nice, FAAC, Magnetic
