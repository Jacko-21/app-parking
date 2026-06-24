# 02 — Cible et proposition de valeur

## Deux populations d'utilisateurs

L'application sert deux audiences distinctes mais imbriquées :

### A. L'exploitant (utilisateur primaire — B2B)

C'est le **client payant**. Le SaaS lui sert à piloter son ou ses parkings.

Personas pressentis :
- **Directeur d'exploitation** d'une foncière ou d'un opérateur — vue agrégée, KPIs, ROI.
- **Gestionnaire de site** — opérations quotidiennes, abonnés, résolution d'incidents.
- **Gardien / agent** — interface tactile simple, scan plaque, validation accès.
- **Responsable commercial** d'un parking d'entreprise — gestion des places allouées aux salariés / visiteurs.
- **Syndic / bailleur** — facturation des places aux résidents, suivi des impayés.

### B. L'automobiliste (utilisateur final — B2C dans un cadre B2B2C)

Il n'achète **pas** notre SaaS. Il achète une place via le SaaS de l'exploitant. Son expérience reste un **levier de différenciation majeur** :

- Réservation rapide (web ou mobile)
- Paiement sans friction (Apple/Google Pay, carte, virement pour pros)
- Accès sans contact (LAPI, QR code, scan)
- Reçu / facture automatique
- Modification / annulation simple

> **Implication produit :** l'app exploitant n'a de valeur que si l'expérience automobiliste qu'elle génère est meilleure que celle des plateformes tierces (Yespark, Onepark) — sinon l'exploitant continuera à dépendre de ces canaux.

## Valeur livrée à l'exploitant — formulation court terme

| Avant | Avec Bingo'z Parking |
|---|---|
| 40–60 % de taux de remplissage | Visibilité temps réel + leviers de yield pour viser 70–80 % |
| Tarif fixe horaire/journalier/mensuel | Tarification dynamique configurable |
| Réservations dispersées sur 3–5 canaux | Inbox unifiée, vision consolidée |
| Encaissements et factures à la main | Automatisation complète, reversement Stripe |
| Pas de données fiables | Tableau de bord, rapports, exports comptables |
| Pannes barrières découvertes par plainte | Alertes proactives, monitoring IoT |

## Valeur livrée à l'automobiliste

| Avant | Avec Bingo'z Parking |
|---|---|
| Cherche une place, paye au gardien, attend un reçu | Réserve à l'avance, paie en 1 clic, accède en LAPI |
| Doit installer l'app de chaque exploitant | Web-first, app native facultative |
| Subit la commission des plateformes (prix gonflé) | Tarif direct exploitant — potentiellement moins cher |

## Bénéfices business mesurables (à valider en user research)

- Taux de remplissage : +15 à 25 points
- Réduction du temps administratif : -50 % sur la gestion des abonnés
- Part des ventes en direct (vs plateformes tierces) : objectif > 60 %
- NPS automobiliste : > 50

Ces chiffres sont des **hypothèses** à confronter aux 8–10 interviews exploitants à mener (cf `08-roadmap.md`).
