# 08 — Roadmap (étapes prochaines)

## Phase actuelle : cadrage

État au démarrage de ce dépôt :

- [x] Audit stratégique consolidé sur Notion (`App Parking — Audit & Diagnostic`)
- [x] Export du contexte vers ce dépôt pour usage Codex / Claude Code
- [x] Trancher les 3 décisions structurantes initiales (`docs/06-decisions-bloquantes.md`)
- [ ] User research — interviews 8 à 10 exploitants
- [ ] Spécification fonctionnelle MVP détaillée
- [x] Architecture MVP software-only v0 (`docs/architecture.md`)
- [x] Initialisation du socle monorepo (`apps/web`, `apps/api`, `packages/*`)
- [ ] Architecture technique détaillée (contrats d'API, schéma BDD final, séquences critiques)
- [ ] Plan de développement & roadmap chiffrée

---

## Phase 1 — Pré-développement (4–8 semaines)

| Tâche | Livrable |
|---|---|
| Interviews utilisateurs (8–10 exploitants) | Note de synthèse + insights chiffrés |
| Étude pricing concurrentielle | Tableau de positionnement, fourchette cible |
| Cadrage de l'offre personnalisable | Modules, limites de personnalisation, grille de devis |
| Décisions structurantes arrêtées et documentées | MAJ de `docs/06-decisions-bloquantes.md` |
| Wireframes parcours exploitant + automobiliste | Figma |
| Architecture MVP software-only v0 | `docs/architecture.md` |
| Spécification fonctionnelle MVP | User stories + règles métier + critères d'acceptation |
| Socle technique initial | Monorepo, Next.js, NestJS, domaine, Prisma |

---

## Phase 2 — Développement MVP (3–4 mois après arbitrages)

Itérations 2 semaines, premier client pilote en parallèle.

| Sprint | Focus |
|---|---|
| 1–2 | Mise en place monorepo, auth, multi-tenant, schéma BDD core |
| 3–4 | Onboarding exploitant + paramétrage parking |
| 5–6 | Réservation + paiement Stripe (parcours web automobiliste) |
| 7–8 | Gestion abonnés + facturation |
| 9–10 | Incidents opérationnels + exports comptables + personnalisation légère |
| 11–12 | Tableau de bord + durcissement conformité + tests pilote |

---

## Phase 3 — Pilote terrain (2 mois)

- Déploiement sur 1 site pilote
- Mesure des critères de sortie MVP (`docs/07-scope-mvp.md`)
- Itérations rapides selon retours

---

## Phase 4 — Commercialisation initiale

- 3–5 clients payants en direct
- Embauche commerciale
- Préparation V2 (yield management, app mobile, plateformes tierces, agents locaux)

## Phase 5 — Intégrations hardware et agents locaux

- POC d'intégration LAPI avec 1 partenaire
- POC d'intégration 1 marque de barrière
- Développement agent local offline-first
- Déploiement sur site pilote équipé

---

## Tâches transverses continues

- **Veille concurrentielle active** : levées de fonds, nouveaux entrants, appels d'offres publics, évolutions réglementaires (ZFE, MaaS, RGPD plaques).
- **Conformité** : démarrage Vanta, RGPD register, DPA Stripe.
- **Marketing entrant** : site, SEO, contenu (blog/LinkedIn) pour amorcer le funnel et raccourcir le cycle de vente.
