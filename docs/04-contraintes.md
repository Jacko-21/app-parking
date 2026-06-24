# 04 — Contraintes et limites à dépasser

## Contraintes techniques

### Intégration matérielle (difficulté principale)

**Barrières :** Skidata, Came, Nice, FAAC, Magnetic — chacun son protocole propriétaire.

**LAPI (Lecture Automatique de Plaques d'Immatriculation) :** Survision (français), Genetec AutoVu, Quercus, Hikvision.

**Choix structurant à faire :**
- Tout intégrer (lourd, mais devient une barrière à l'entrée)
- Se limiter à 2–3 partenaires initiaux (recommandé pour l'amorçage)

**Décision de phasage arrêtée le 2026-05-07 :** le MVP démarre en software-only. Les intégrations LAPI, barrières et agents locaux sont préparées architecturalement mais développées plus tard.

**Connectivité parkings souterrains :** prévoir un fonctionnement **offline-first** sur terminaux locaux. L'agent IoT dans le parking doit pouvoir fonctionner plusieurs heures sans réseau et resynchroniser ensuite.

### Pattern d'architecture cible pour la phase agent local

```
[Cloud Bingo'z]  ←── MQTT/HTTPS ──→  [Agent local parking]  ←── protocoles propriétaires ──→  [Barrières / LAPI / bornes]
```

L'agent local est une cible de phase ultérieure. Il :
- Bufferise les événements en cas de coupure réseau
- Traduit chaque protocole propriétaire en événements normalisés
- Garantit la décision d'ouverture en autonomie (latence < 500 ms attendue)

---

## Contraintes réglementaires

### RGPD

- La **plaque d'immatriculation est une donnée personnelle** (jurisprudence française claire).
- Toute fonctionnalité touchant aux plaques doit prévoir :
  - Base légale (consentement, exécution du contrat, intérêt légitime)
  - Durée de conservation explicite
  - Droits d'accès, rectification, effacement
  - Journalisation des accès
  - Anonymisation après expiration

### PCI-DSS

- Résolu par délégation à **Stripe** (tokenisation côté client).
- **Aucune** donnée de carte ne transite ni n'est stockée chez nous en clair.

### Conservation fiscale

- Transactions à conserver **10 ans** en France.
- Prévoir une politique d'archivage froid (S3-compatible) avec immutabilité (object lock).

### Accessibilité PMR

- Parcours réservation web/mobile : conformité WCAG 2.2 AA minimum.
- Bornes physiques (si on en propose) : hauteurs, contrastes, audio.

### Secteur public

- Si clients publics : **RGS** (Référentiel Général de Sécurité), **hébergement souverain souvent demandé** → OVH, Scaleway, Outscale plutôt qu'AWS.
- SecNumCloud envisageable pour cibles régaliennes.

---

## Contraintes business

| Contrainte | Implication |
|---|---|
| Cycle de vente B2B parking : **3 à 12 mois** | Trésorerie longue à porter, nécessité d'un funnel marketing entrant |
| **Décideur multiple** : DG, DSI, exploitation | Argumentaires différenciés à préparer |
| Adoption freinée par les habitudes (gardien de 55 ans + cahier ne migre pas du jour au lendemain) | UX d'une simplicité radicale + service d'implémentation packagé |
| **CAC élevé** | Modèle économique doit supporter un long payback |

> **Conséquence produit majeure :** onboarding extrêmement guidé + offre **hybride SaaS + services** (installation, formation, support sur site). Le SaaS pur sans services marche mal dans ce secteur.

---

## Limite du modèle SaaS pur

Vendre uniquement du logiciel à l'abonnement, sans services associés, est un **piège connu** dans ce secteur. Prévoir dès le départ :

- Forfait d'**implémentation** (audit du parking, paramétrage, formation)
- **Support sur site** ou télémaintenance avec SLA
- Catalogue d'**accessoires hardware** (recommandés ou revendus) si on choisit le software-only

---

## Concurrence des géants intégrés

Skidata et Flowbird vont **défendre leur base installée**. Pour gagner :

- Être *radicalement* meilleur en UX
- Être plus ouvert (API-first, webhooks, intégrations)
- Installation 10× plus rapide que la leur
- Prix transparent et plus bas sur les segments cibles

**Combat latéral :** ne pas attaquer leurs gros comptes, viser les exploitants qu'ils négligent.
