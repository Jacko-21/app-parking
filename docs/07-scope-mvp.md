# 07 — Scope MVP validé

> Statut au `2026-05-10` : ce périmètre sert de base MVP pour le développement.
> Il respecte les décisions structurantes de `06-decisions-bloquantes.md` :
> propriétaires-exploitants, application configurable avec personnalisation légère,
> et MVP software-only sans dépendance hardware.

---

## Principe de cadrage

Un MVP qui :
- Démontre la **valeur centrale** (réservation + paiement + vision unifiée) sur un parking pilote.
- Est **suffisamment fini** pour qu'un exploitant puisse l'utiliser en production sur un site.
- N'inclut **pas** le yield management dynamique avancé (V2).
- N'inclut **pas** l'intégration hardware, LAPI ou agent local. Ces sujets sont préparés architecturalement mais développés plus tard.

## User stories MVP

### Exploitant

- En tant qu'administrateur exploitant, je veux créer mon tenant et paramétrer un premier parking afin de publier une offre exploitable sans Excel.
- En tant que gestionnaire, je veux configurer zones, places, types de places et tarifs statiques afin de maîtriser l'inventaire vendu.
- En tant que gestionnaire, je veux consulter les réservations et en créer manuellement afin de centraliser téléphone, email et demandes sur place.
- En tant qu'agent, je veux voir les créneaux, statuts et moyens d'accès afin de gérer l'exploitation quotidienne.
- En tant qu'administrateur, je veux suivre paiements, factures, exports et incidents afin de piloter l'activité du parking.

### Automobiliste

- En tant qu'automobiliste, je veux ouvrir une URL publique de parking afin de réserver sans installer d'application native.
- En tant qu'automobiliste, je veux choisir un créneau et obtenir un prix fiable avant paiement.
- En tant qu'automobiliste, je veux payer par carte ou wallet via Stripe afin de recevoir un reçu et un moyen d'accès.
- En tant qu'automobiliste PMR, je veux identifier les offres ou places adaptées dès le parcours de réservation.

---

## Périmètre fonctionnel — MVP

### Côté exploitant (interface web)

- [ ] **Onboarding guidé** : création du compte tenant, paramétrage du premier parking (adresse, plan, places, tarifs), connexion Stripe Connect.
- [ ] **Gestion du parking** : configuration des zones, places, types (horaire, abonné, PMR, recharge).
- [ ] **Tarification** : grilles horaire / journalier / mensuel statiques. (Yield = V2.)
- [ ] **Gestion des abonnés** : ajout/édition d'un abonné, plan tarifaire, place(s) attribuée(s), date de début/fin.
- [ ] **Réservations** : vue calendrier, création manuelle, recherche, annulation.
- [ ] **Encaissements** : suivi des paiements, factures générées automatiquement, exports comptables (CSV + format Pennylane).
- [ ] **Tableau de bord** : taux d'occupation déclaratif / calculé, CA du jour/semaine/mois, alertes opérationnelles.
- [ ] **Gestion des incidents** : création et suivi d'incidents opérationnels, statut, journalisation.
- [ ] **Multi-utilisateurs** : invitation d'un collègue, rôles (admin, gestionnaire, agent).

> **Avancement console exploitant (`2026-06-30`)** — une console web (`/exploitation/*`) relie
> désormais l'interface aux endpoints existants :
>
> - **Configuration / onboarding** : création d'un parking, paramétrage des zones, des places
>   (type, zone, activation), des offres et des grilles tarifaires, puis publication / dépublication.
> - **Réservations** : liste filtrable par statut, création manuelle (devis + disponibilité côté API)
>   et annulation. La vue calendrier reste à faire.
> - **Abonnés** : liste, création, désactivation et suppression d'un contrat (dates de début/fin).
>   L'attribution de place et le plan tarifaire restent à câbler.
> - **Incidents** : ouverture d'un incident et évolution de son statut.
>
> Reste à construire côté exploitant : création de compte tenant en self-service, connexion Stripe
> Connect, encaissements / exports comptables, tableau de bord chiffré et multi-utilisateurs.

### Côté automobiliste (web responsive — pas d'app native au MVP)

- [ ] **Page de réservation par parking** : URL unique par parking, recherche de créneau, sélection.
- [ ] **Compte automobiliste** : création express (email + mot de passe + plaque), Apple/Google Pay.
- [ ] **Paiement** : carte / Apple Pay / Google Pay via Stripe.
- [ ] **Reçu et facture** : envoi par email automatique.
- [ ] **Modification / annulation** simple selon politique de l'exploitant.
- [ ] **Accès au parking** : QR code, code d'accès ou validation manuelle selon le fonctionnement du parking.

## Règles métier MVP

- Toute donnée métier exploitant est isolée par `tenantId` côté serveur ; le client ne choisit jamais librement son tenant en production.
- En développement, l'en-tête `x-tenant-id` peut résoudre le tenant exploitant en attendant Auth0 ou WorkOS.
- Une page publique de réservation résout le tenant depuis le slug du parking publié.
- Un devis vérifie que la fin du créneau est strictement postérieure au début et calcule le prix depuis une règle tarifaire statique.
- Une réservation confirmée, en attente de paiement ou terminée bloque la disponibilité du créneau concerné ; une réservation annulée ou expirée ne bloque pas.
- La plaque d'immatriculation n'est demandée que si elle sert à l'accès ou à l'exploitation du parking.
- La plaque est une donnée personnelle : accès journalisés, durée de conservation explicite, suppression ou anonymisation prévue.
- Les données de carte ne transitent jamais par Bingo'z ; Stripe gère la tokenisation côté client.
- Les transactions et factures françaises sont conservées 10 ans.

---

## Hors scope du MVP (V2+)

- Yield management dynamique
- App mobile native
- Agents locaux IoT offline-first
- Intégration LAPI
- Intégration barrière / borne
- Intégration > 1 marque de barrière
- Module IA / forecasting
- Intégration aux plateformes tierces (Yespark, Onepark) en publication d'inventaire
- SSO entreprise (SAML / SCIM)
- Marketplace d'accessoires hardware
- Module multi-pays / multi-devises

## Critères d'acceptation initiaux

- Le dashboard exploitant affiche des parkings et indicateurs issus de l'API, filtrés par tenant.
- La page publique d'un parking publié affiche les informations et offres depuis l'API sans exposer de `tenantId`.
- Le formulaire de devis public retourne prix, unités facturées et disponibilité sans demander de plaque.
- La création manuelle de réservation côté exploitant persiste une réservation rattachée au tenant, au parking, à l'offre et au client.
- Les tests unitaires couvrent prix, disponibilité, filtrage tenant, publication publique et création de réservation.
- `pnpm.cmd test`, `pnpm.cmd typecheck`, `pnpm.cmd lint` et `pnpm.cmd build` passent avant livraison.

---

## Critères de sortie du MVP

Le MVP est considéré "suffisamment fini" lorsque :

1. Un exploitant pilote peut **basculer 100 % de son activité** d'un parking sur Bingo'z, sans Excel ni cahier en parallèle.
2. **20 transactions automobilistes successives** se déroulent sans incident bloquant.
3. **Réconciliation comptable** mensuelle sans ressaisie manuelle.
4. SLA opérationnel : **99,5 %** de disponibilité sur 30 jours glissants.
5. Documentation utilisateur exploitant complète (Notion ou helpcenter intégré).
