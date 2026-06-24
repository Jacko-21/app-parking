# 03 — Benchmark concurrentiel

Le marché se structure en **trois catégories** qui appellent des stratégies distinctes.

---

## A. Plateformes d'intermédiation B2C

Vendent aux automobilistes, prennent une commission à l'exploitant (15–30 %).

| Acteur | Géographie | Positionnement |
|---|---|---|
| Yespark | France | Abonnements résidentiels, ~3000 parkings |
| Onepark | France | Réservation horaire / journalière |
| Zenpark | France | Mixte, en croissance |
| Parclick | Espagne (présent FR) | Horaire / vacances |
| BePark | Belgique | B2B + B2C |
| ParkingMap | — | Recherche / annuaire |

**Lecture stratégique :** ce ne sont pas vraiment des concurrents — ce sont des **canaux** que nos clients exploitants voudront agréger via notre app. Notre produit doit pouvoir **publier les places vers ces plateformes** et **rapatrier les réservations** dans la vue unifiée.

---

## B. Éditeurs hardware + logiciel intégrés (acteurs historiques)

Modèle vertical : barrières + caisses + logiciel. Contrats lourds, UX vieillissante, intégrations difficiles.

| Acteur | Origine |
|---|---|
| Skidata | Autriche — leader mondial |
| Designa | Allemagne |
| Flowbird (ex-Parkeon) | France/Suède |
| HUB Parking | International |
| WPS | Pays-Bas |
| TIBA | Israël |
| Amano | Japon |
| Park Assist | International |

**Lecture stratégique :** **vrai concurrent**. Notre approche : partir de la **couche logicielle moderne** et remonter vers le hardware via API. Combat **latéral**, pas frontal — viser les exploitants mal servis par les gros (petits/moyens parkings, résidentiels, parkings d'entreprise).

---

## C. SaaS modernes pure-player

C'est notre catégorie.

| Acteur | Géographie | Force |
|---|---|---|
| Get My Parking | Inde / global | Amplitude fonctionnelle |
| ParkHub | US | Évènementiel, intégrations |
| Wayleadr | Irlande | Parkings d'entreprise — UX moderne |
| Parkable | NZ / UK | Parkings de bureaux |
| Parkalot | — | Allocation de places |
| SpotHero | US | Côté B2B |

**Constat France :** peu d'acteurs purement SaaS pour exploitants → opportunité, mais signal faible à creuser. Pourquoi le marché n'a-t-il pas été pris ? Probablement : adoption lente, cycle de vente long, intégration hardware complexe.

---

## Cas à étudier en priorité

| Cible | Pour apprendre quoi |
|---|---|
| Wayleadr | UX moderne en SaaS B2B parking |
| Parkable | Modèle parkings d'entreprise / allocation |
| Get My Parking | Profondeur fonctionnelle |
| Skidata | Exigences des exploitants haut de gamme |
| Yespark | Modèle de revenus, économie automobiliste |

## Veille active à mettre en place

- Levées de fonds dans le secteur (signal d'arrivée d'un nouvel entrant)
- Appels d'offres publics — villes, aéroports, gares (révèlent les attentes acheteurs)
- Évolutions réglementaires (ZFE, MaaS, RGPD plaques)
- Publications FNMS et Fédération du Stationnement
