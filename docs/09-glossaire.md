# 09 — Glossaire métier

| Terme | Définition |
|---|---|
| **Exploitant** | Entité (foncière, opérateur, bailleur, entreprise, collectivité) qui gère un ou plusieurs parkings. C'est notre client B2B. |
| **Automobiliste** | Utilisateur final qui réserve / paye une place. Notre client B2C indirect. |
| **Foncière** | Société propriétaire d'un parc immobilier qui exploite ses parkings. Ex : Indigo, Effia, Q-Park. |
| **Yield management** | Tarification dynamique adaptée à la demande, l'occupation, l'horaire ou l'événement. Concept emprunté à l'aérien et l'hôtellerie. |
| **LAPI** | Lecture Automatique de Plaques d'Immatriculation. Caméra + logiciel reconnaissant les plaques pour gérer l'accès sans contact. |
| **Barrière** | Équipement physique d'entrée/sortie. Marques principales : Skidata, Came, Nice, FAAC, Magnetic. |
| **Borne** | Borne de paiement, d'interphonie, ou borne de recharge VE selon contexte. |
| **Place horaire** | Place vendue à la durée d'usage ponctuelle (heure, jour). |
| **Place abonnée** | Place louée à un usager récurrent, généralement au mois ou à l'année. |
| **Tenant** | Espace logique isolé dans le SaaS = un exploitant. Toutes les données sont cloisonnées par `tenantId`. |
| **PMR** | Personne à Mobilité Réduite. Places dédiées (en France : ≥ 2 % des places, normes d'accès strictes). |
| **VE** | Véhicule Électrique. Places avec borne de recharge — souvent gérées séparément. |
| **ZFE** | Zone à Faibles Émissions. Réglementation française restreignant l'accès aux véhicules polluants. Impact futur sur le pricing parking. |
| **MaaS** | Mobility as a Service. Approche intégrée transports + parking. Source de partenariats potentiels. |
| **RGPD** | Règlement Général sur la Protection des Données. La plaque d'immatriculation y est qualifiée de donnée personnelle. |
| **PCI-DSS** | Norme de sécurité des données de carte de paiement. Délégué à Stripe via tokenisation. |
| **RGS** | Référentiel Général de Sécurité (France). S'applique aux services numériques utilisés par l'administration. |
| **SecNumCloud** | Qualification ANSSI pour services cloud à exigences fortes (régalien). |
| **Stripe Connect** | Produit Stripe pour plateformes — gère les comptes connectés (un par exploitant) et les reversements. |
| **Stripe Billing** | Produit Stripe pour la facturation récurrente (abonnements). |
| **MQTT** | Protocole IoT léger pub/sub. Pivot de notre couche d'orchestration hardware. |
| **Agent local** | Service Bingo'z déployé sur un mini-PC dans le parking, qui orchestre les équipements et garantit le fonctionnement offline. |
| **FNMS** | Fédération Nationale des Métiers du Stationnement. Référentiel professionnel français. |
| **CAC** | Coût d'Acquisition Client. Long dans ce secteur (cycle de vente B2B 3 à 12 mois). |
| **LTV** | Lifetime Value. À optimiser pour rentabiliser le CAC. |
