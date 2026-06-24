# Architecture technique — MVP software-only

> Version initiale du `2026-05-07`. Ce document décrit l'architecture cible du MVP après les décisions structurantes de `docs/06-decisions-bloquantes.md`.

---

## Objectif

Construire un MVP utilisable par un propriétaire-exploitant de parking sans dépendre d'une intégration barrière, LAPI ou borne.

Le produit doit prouver la valeur logicielle :
- configuration d'un parking ;
- gestion des places, offres, tarifs, abonnés et réservations ;
- paiement et facturation ;
- vision d'exploitation ;
- personnalisation légère selon les besoins client.

Les agents locaux, MQTT, LAPI et intégrations barrières sont prévus plus tard. Le MVP doit simplement garder une architecture compatible avec cette extension.

---

## Principes d'architecture

1. **Multi-tenant strict** : un propriétaire-exploitant = un `tenant`. Toute donnée métier porte un `tenantId` et toute requête serveur filtre par `tenantId`.
2. **Software-only d'abord** : aucune fonctionnalité du MVP ne dépend d'un fournisseur hardware.
3. **Produit configurable, pas sur-mesure infini** : les besoins client sont couverts par modules, paramètres et templates plutôt que par forks de code.
4. **Conformité dès le socle** : RGPD pour les plaques, PCI-DSS délégué à Stripe, conservation fiscale 10 ans pour transactions.
5. **Extension hardware préparée** : les accès sont modélisés comme événements abstraits, compatibles plus tard avec QR code, validation manuelle, LAPI, barrière ou agent local.

---

## Vue d'ensemble MVP

```text
┌────────────────────────────────────────────────────────────────────┐
│ apps/web — Next.js                                                 │
│ Interface exploitant + parcours automobiliste responsive           │
└───────────────┬────────────────────────────────────────────────────┘
                │ REST / Server Actions / Webhooks
                ▼
┌────────────────────────────────────────────────────────────────────┐
│ apps/api — NestJS                                                  │
│ Auth │ Tenants │ Parkings │ Réservations │ Paiements │ Reporting  │
└───────────────┬───────────────────────────┬────────────────────────┘
                │                           │
                ▼                           ▼
┌──────────────────────────────┐    ┌───────────────────────────────┐
│ PostgreSQL 16+               │    │ Stripe                         │
│ Données métier, audit, logs  │    │ Paiements automobilistes       │
└──────────────────────────────┘    │ Connect/Billing si nécessaire │
                                    └───────────────────────────────┘
                │
                ▼
┌──────────────────────────────┐
│ Redis                         │
│ Cache, files BullMQ, sessions │
└──────────────────────────────┘
```

Phase ultérieure :

```text
apps/api ── événements d'accès ── apps/agent-iot ── LAPI / barrières / bornes
```

---

## Applications et packages

### `apps/web`

Application Next.js App Router.

Responsabilités :
- interface exploitant ;
- page de réservation publique par parking ;
- compte automobiliste minimal ;
- écrans d'onboarding ;
- tableaux de bord ;
- formulaires Zod + React Hook Form ;
- UI basée sur Tailwind et shadcn/ui.

Le web reste responsive. Pas d'application mobile native au MVP.

### `apps/api`

API NestJS.

Responsabilités :
- authentification et contexte tenant ;
- règles métier ;
- accès base de données ;
- webhooks Stripe ;
- génération de factures et reçus ;
- exports comptables ;
- audit logs ;
- OpenAPI pour intégrations futures.

### `packages/domain`

Logique métier pure, testée avec Vitest.

Contenu initial :
- disponibilité d'une place ou d'une zone ;
- calcul de prix statique ;
- règles d'annulation ;
- statuts de réservation ;
- politiques d'accès ;
- règles de conservation RGPD.

### `packages/database`

Schéma Prisma ou Drizzle, migrations versionnées et seeds de développement.

Décision à trancher avant implémentation :
- **Prisma** : meilleur démarrage, DX forte, adapté au MVP ;
- **Drizzle** : meilleur contrôle SQL, intéressant si requêtes analytics complexes très tôt.

Recommandation actuelle : **Prisma pour le MVP**, sauf contrainte forte sur les requêtes complexes.

### `packages/config`

Configuration partagée :
- TypeScript strict ;
- ESLint ;
- Prettier ;
- Tailwind ;
- variables d'environnement validées.

### `packages/hardware`

Package vide ou minimal au MVP, limité aux types d'événements d'accès.

Il ne contient pas d'intégration fournisseur au départ. Sa mission est de figer les contrats abstraits qui permettront plus tard d'ajouter un agent local.

---

## Modules métier MVP

| Module | Rôle | Notes |
|---|---|---|
| `Tenant` | Isole chaque propriétaire-exploitant | Filtrage serveur obligatoire par `tenantId` |
| `Utilisateur` | Gère les membres côté exploitant | Rôles : admin, gestionnaire, agent |
| `Parking` | Décrit un site exploité | Adresse, horaires, règles, contact |
| `Zone` | Groupe logique de places | Exemple : niveau -1, abonnés, visiteurs, PMR |
| `Place` | Unité vendable ou attribuable | Type : horaire, abonné, PMR, VE |
| `Offre` | Produit commercial configurable | Horaire, journée, nuit, mois, abonnement |
| `Tarif` | Grille statique de prix | Yield dynamique hors MVP |
| `Automobiliste` | Client final B2B2C | Données minimisées |
| `Véhicule` | Plaque, pays, libellé | Plaque = donnée personnelle RGPD |
| `Réservation` | Créneau, offre, statut, prix | Source directe ou création manuelle |
| `Abonnement` | Usage récurrent | Date début/fin, place ou zone |
| `Paiement` | Suivi Stripe et rapprochement | Pas de carte stockée |
| `Facture` | Reçu, facture, export fiscal | Conservation 10 ans |
| `Accès` | QR, code, validation manuelle | Extension future LAPI/barrière |
| `Incident` | Suivi opérationnel | Pas d'alerte hardware au MVP |
| `AuditLog` | Journalise actions sensibles | RGPD, sécurité, support |

---

## Modèle de données conceptuel

```text
Tenant
  ├─ User
  ├─ Parking
  │   ├─ Zone
  │   │   └─ Space
  │   ├─ Offer
  │   │   └─ PriceRule
  │   ├─ Reservation
  │   │   ├─ Payment
  │   │   ├─ Invoice
  │   │   └─ AccessCredential
  │   ├─ Subscription
  │   └─ Incident
  ├─ Customer
  │   └─ Vehicle
  └─ AuditLog
```

Relations clés :
- un `Tenant` possède plusieurs `Parking` ;
- un `Parking` contient des `Zone`, `Space`, `Offer`, `Reservation` et `Subscription` ;
- une `Reservation` référence un `Customer`, une `Offer`, un créneau, un statut et un prix figé ;
- un `Vehicle` peut porter une plaque, avec règles RGPD explicites ;
- un `AccessCredential` représente un QR code, un code d'accès ou une validation manuelle.

---

## Multi-tenant et sécurité

Le `tenantId` doit être résolu côté serveur à partir de l'utilisateur authentifié, jamais depuis une valeur libre envoyée par le client.

Règles :
- toutes les tables métier portent `tenantId` ;
- les repositories/services prennent un contexte serveur `tenantId` obligatoire ;
- les routes publiques de réservation utilisent un identifiant public de parking, puis résolvent le tenant côté serveur ;
- les logs d'audit enregistrent l'utilisateur, le tenant, l'action, la ressource, l'horodatage et l'adresse IP si pertinente.

---

## Parcours exploitant

### Onboarding

1. Création du tenant.
2. Invitation du premier administrateur.
3. Création du premier parking.
4. Définition des zones et places.
5. Configuration des offres et tarifs statiques.
6. Activation du paiement Stripe si vente en ligne.
7. Publication de la page de réservation.

### Exploitation quotidienne

1. Consultation du calendrier de réservation.
2. Création ou modification d'une réservation manuelle.
3. Gestion des abonnés.
4. Suivi des paiements et factures.
5. Traitement des incidents opérationnels.
6. Export comptable.

---

## Parcours automobiliste

1. Ouvre l'URL publique du parking.
2. Choisit un créneau.
3. Sélectionne une offre disponible.
4. Crée un compte léger ou continue avec email selon la politique du parking.
5. Renseigne son véhicule si nécessaire.
6. Paie via Stripe.
7. Reçoit un reçu, une facture et un moyen d'accès.
8. Présente le QR code, le code d'accès ou se fait valider manuellement.

Le parcours doit intégrer l'accessibilité PMR dès la recherche et l'affichage des places/offres.

---

## Paiement et facturation

Stripe est utilisé pour les paiements automobilistes :
- tokenisation côté client ;
- webhooks signés ;
- pas de stockage de carte ;
- état interne synchronisé depuis les événements Stripe.

Le SaaS vendu au propriétaire-exploitant doit supporter une facturation B2B plus souple :
- devis ou contrat hors ligne au départ ;
- forfait de paramétrage ;
- abonnement récurrent ;
- options de personnalisation légère.

La conservation fiscale des transactions françaises est de 10 ans.

---

## RGPD et données sensibles

La plaque d'immatriculation est une donnée personnelle.

Exigences dès le MVP :
- base légale affichée selon le cas d'usage ;
- durée de conservation configurable par tenant dans une borne raisonnable ;
- journalisation des accès aux données véhicule ;
- export et suppression sur demande ;
- anonymisation ou suppression après expiration ;
- minimisation : ne demander la plaque que si elle sert réellement au parcours.

Les droits RGPD doivent être prévus dans l'architecture même si l'interface complète peut être progressive.

---

## Personnalisation légère

La personnalisation client doit rester dans ces limites :
- modules activables/désactivables ;
- libellés et emails transactionnels paramétrables ;
- règles d'annulation par parking ;
- types d'offres configurables ;
- exports CSV/Pennylane adaptables ;
- branding simple de la page de réservation.

Hors périmètre de personnalisation légère :
- fork d'interface par client ;
- logique métier spécifique non réutilisable ;
- intégration hardware spécifique au MVP ;
- connecteur comptable unique développé pour un seul client sans validation produit.

---

## Préparation des agents locaux futurs

Le MVP ne développe pas `apps/agent-iot`, mais il doit préparer les contrats suivants :

```text
AccessEvent
  id
  tenantId
  parkingId
  reservationId?
  vehicleId?
  source: qr_code | manual | access_code | lapi | barrier | agent
  direction: entry | exit | unknown
  decision: allowed | denied | pending
  occurredAt
  metadata
```

Au MVP, les sources réellement utilisées sont `qr_code`, `access_code` et `manual`.

Plus tard, `lapi`, `barrier` et `agent` pourront alimenter le même journal d'accès sans casser le domaine métier.

---

## Décisions techniques restantes

| Décision | Options | Recommandation actuelle |
|---|---|---|
| Monorepo | Turborepo / Nx / simple pnpm workspaces | pnpm workspaces + Turborepo si plusieurs apps dès le départ |
| ORM | Prisma / Drizzle | Prisma pour accélérer le MVP |
| Auth | Auth0 / WorkOS | Auth0 pour démarrage simple, WorkOS si SSO B2B demandé tôt |
| Web temps réel | WebSocket / SSE / polling | Polling puis SSE si besoin, WebSocket plus tard |
| Mobile | PWA / app native | PWA responsive au MVP |
| Hébergement | Scaleway / OVH | Scaleway ou OVH par défaut |

---

## Prochain livrable recommandé

Créer une spécification fonctionnelle MVP détaillée avec :
- user stories exploitant ;
- user stories automobiliste ;
- règles métier de réservation ;
- statuts de réservation, paiement, abonnement et accès ;
- critères d'acceptation testables.
