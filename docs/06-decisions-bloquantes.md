# 06 — Décisions structurantes

> Statut au `2026-05-07` : les trois décisions de cadrage initial ont été arrêtées pour lancer la conception produit. Elles restent révisables après user research ou retour terrain, mais les agents IA **ne doivent pas les modifier implicitement**.

## Décisions retenues

1. **Segment de tête** : propriétaires-exploitants de parking.
2. **Modèle économique** : application configurable vendue selon les besoins client, avec personnalisation légère.
3. **Stratégie hardware** : software-only au démarrage, puis intégration et développement d'agents locaux plus tard.

---

## 6.1 Choix du segment de tête

On ne peut pas adresser foncières + résidentiel + entreprise + collectivités en parallèle.

### Options

| Segment | Pour | Contre |
|---|---|---|
| Foncières / opérateurs (Indigo, Effia, Q-Park) | Gros volume par contrat, rentabilité long terme | Cycle de vente très long, exigences SI lourdes, en concurrence frontale Skidata |
| Parkings d'entreprise | Décideur unique (DG / DRH), douleur claire (allocation places salariés), cycle plus court | Marché plus petit en valeur unitaire |
| Résidentiels privés (bailleurs, copros) | Volume potentiel élevé, douleur impayés bien identifiée | Décideur fragmenté (syndic), faible apetit techno |
| Collectivités locales | Tickets gros, rayonnement | Cycle long, appels d'offres, exigences souverainetés très fortes |
| Hôtels, centres co., copropriétés | Cycle court, décideur unique | Petits tickets, scaling lent |

### Intuition initiale avant décision

**Parkings d'entreprise + résidentiels privés.** Cycle plus court, décideur identifiable, douleur claire. À valider via les 8–10 interviews de la phase user research.

### Décision arrêtée le 2026-05-07

**Propriétaires-exploitants de parking.** La cible prioritaire regroupe les acteurs qui possèdent ou contrôlent l'actif parking et en assurent directement l'exploitation ou la rentabilisation.

Cette cible peut inclure des exploitants indépendants, hôtels, centres commerciaux, copropriétés, bailleurs, foncières ou propriétaires privés dès lors que le décideur a la main sur l'exploitation du parking.

À ce stade, on évite de construire d'abord pour les collectivités ou les très grands opérateurs nationaux si cela impose appels d'offres longs, intégrations SI lourdes ou exigences hardware immédiates.

### Impact sur l'architecture

- **Modèle de données** : partir d'un socle commun `tenant → parking → zones → places → offres → réservations`, avec configuration par parking plutôt qu'un modèle figé entreprise/résidentiel.
- **Parcours UX** : privilégier une interface exploitant configurable, capable de couvrir vente ponctuelle, abonnés, accès manuel/QR et exports.
- **Go-to-market** : approche directe auprès de propriétaires-exploitants avec offre d'implémentation et personnalisation légère.

---

## 6.2 Modèle économique

### Options

| Modèle | Description | Avantage | Limite |
|---|---|---|---|
| Abonnement par parking | Forfait mensuel selon taille | Simple à pricer, prévisible | Mal aligné si parking peu utilisé |
| Abonnement par place | Tarif × nombre de places | Aligné sur la taille de l'actif | Friction à la signature pour gros parkings |
| Commission sur transactions | % sur chaque transaction | Aligné sur la valeur créée | Revenu volatile, complexité de billing |
| Hybride | Forfait base + commission au-delà | Stabilité + upside | Complexité commerciale et technique |

### Impact

- **Architecture** : un modèle commission impose un comptage transactionnel propre, des webhooks Stripe rigoureux, et un système de réconciliation.
- **Pricing concurrentiel** : à benchmarker face à Skidata (forfait élevé) et SaaS modernes (par place).

### Décision arrêtée le 2026-05-07

**Application configurable vendue selon les besoins client, avec personnalisation légère.**

Le modèle de départ n'est pas un pur abonnement standardisé ni une commission transactionnelle obligatoire. L'offre doit rester productisée : socle commun, modules activables, paramétrage par parking, exports et adaptations limitées. Les développements spécifiques ne doivent pas créer de forks client difficiles à maintenir.

La tarification commerciale pourra combiner :
- un forfait de mise en place / paramétrage ;
- un abonnement récurrent selon la taille, les modules et le niveau de support ;
- des options de personnalisation légère facturées au projet.

À ce stade, Stripe reste pertinent pour les paiements automobilistes et la facturation future, mais le billing du SaaS doit aussi supporter des devis, contrats et factures B2B personnalisés.

---

## 6.3 Stratégie hardware

### Options

| Stratégie | Description | Pour | Contre |
|---|---|---|---|
| **Software-only** | On s'intègre à l'existant via SDK / API | Vitesse de mise sur le marché, pas de stock, marges SaaS | Dépendance aux SDK partenaires, intégration parfois bloquée |
| **Full-stack** | On propose aussi du matériel (barrières, bornes, lecteurs) | Contrôle total, marges hardware, barrière à l'entrée | Capex, logistique, SAV, compétences industrielles |
| **Hybride** | Software-only + accessoires sélectionnés (LAPI, terminal local) | Compromis, contrôle des points clés | Complexité opérationnelle |

### Impact structurant

- **Software-only** : architecture pure cloud + agent IoT léger. Équipe entièrement logicielle.
- **Full-stack** : besoin compétences hardware, supply chain, certifications CE / NF, SAV. Toute autre dimension du business est affectée.

### Recommandation préliminaire avant décision

**Software-only au démarrage**, avec un **agent local Bingo'z** envisageable ensuite pour lever la dépendance aux fournisseurs sur la couche d'orchestration. Réévaluer le full-stack après 12–18 mois si la traction le justifie.

### Décision arrêtée le 2026-05-07

**Software-only au démarrage, puis intégration et développement d'agents locaux plus tard.**

Le MVP ne doit pas dépendre d'une intégration barrière, LAPI ou borne. Il doit d'abord prouver la valeur logicielle : gestion du parking, réservations, paiements, abonnés, exploitation quotidienne, reporting et personnalisation légère.

L'architecture doit toutefois rester compatible avec une future couche agent local :
- séparation nette entre logique métier cloud et événements d'accès ;
- modèle d'événements extensible pour QR code, validation manuelle, LAPI et barrière ;
- pas de dépendance forte à un fournisseur hardware dans le domaine métier.

Les agents locaux offline-first, MQTT, LAPI et intégrations barrières deviennent une phase ultérieure, après validation du produit software-only.

---

## Comment ces décisions évolueront

1. User research (8–10 propriétaires-exploitants) → confirme/infirme le segment.
2. Étude pricing concurrentielle → cadre les fourchettes de forfait, abonnement et personnalisation.
3. MVP software-only → valide la valeur métier avant de financer l'agent local.
4. POC d'intégration hardware ultérieur avec 1 partenaire LAPI et 1 marque de barrière → valide la faisabilité agent local.
5. Toute révision majeure est documentée ici, dans une section datée.

---

## Révision du 2026-06-25 — vision produit/service, beachhead et user research

> Session de cadrage avec le fondateur. Ces points précisent (sans les annuler) les décisions du 2026-05-07. Ils restent révisables après user research.

### R1 — Modèle clarifié : « logiciel + exploitation clé-en-main »

La décision 6.2 (application configurable) est complétée d'un **second volet assumé** : en plus du SaaS, Bingo'z proposera une **offre d'exploitation déléguée du parking en option** — gérer l'exploitation à la place du client (ex. remplacer des salariés en congés, prendre en charge l'opérationnel).

- Le **logiciel reste le produit principal** ; l'exploitation déléguée est un **upsell**, vendu aux clients qui le souhaitent.
- Différenciant central retenu : **« logiciel + exploitation clé-en-main »**, positionnement qu'aucun pur éditeur SaaS (Wayleadr, Yespark, Skidata) ne tient. Cela répond aussi à la mise en garde de `04-contraintes.md` (le SaaS pur sans services est un piège dans ce secteur).

**Implications à traiter (ne pas pricer le service comme du SaaS) :**
- Modèle financier : séparer marge logicielle (élevée, scalable) et marge service (faible, linéaire avec le staffing).
- Go-to-market, RH et **responsabilité juridique** de l'exploitation : périmètre et assurances à cadrer avant de vendre le service.
- Architecture : le service s'appuie sur le même produit ; pas de fork. Le volet exploitation peut servir de **terrain de validation** du logiciel (dogfooding).

### R2 — Beachhead resserré : parkings de centre commercial

La cible 6.1 (propriétaires-exploitants) était trop large (6 sous-segments hétérogènes). **Beachhead retenu pour les 12 premiers mois : les parkings de centre commercial.**

- Terrain concret d'observation/pilote : le **parking du centre Beaugrenelle** (Paris 15e).
- Critère de choix : accès terrain immédiat + décideur identifiable + cycle plus court que les foncières nationales.
- Conséquence : user stories, argumentaire et user research sont **priorisés sur ce segment** (pas sur les 6 catégories).

### R3 — User research = jalon n°1 bloquant

Le fondateur exploite un **lavage auto**, pas un parking : la douleur est observée, pas vécue. Donc **avant** la spec fonctionnelle détaillée :

- Mener **8 à 10 interviews** d'exploitants de parkings de centre commercial (Beaugrenelle et similaires).
- Valider les deux volets (logiciel ET appétence pour l'exploitation déléguée).
- Tant que ces interviews ne sont pas faites, le cadrage reste hypothétique.

