# 10 — Démarrage développement

> Socle initial créé le `2026-05-07`.

---

## Pré-requis

- Node.js installé.
- `pnpm` installé ou activé.
- PostgreSQL disponible localement lorsque le développement BDD commence.

L'environnement actuel dispose de Node.js, mais `pnpm` n'est pas encore installé.

---

## Installer les dépendances

```bash
pnpm install
```

Si `pnpm` n'est pas disponible :

```bash
npm install -g pnpm
pnpm install
```

---

## Commandes principales

```bash
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Sous PowerShell Windows, si l'exécution des scripts `.ps1` est bloquée, utiliser l'exécutable `.cmd` :

```bash
pnpm.cmd dev
pnpm.cmd test
pnpm.cmd lint
pnpm.cmd typecheck
pnpm.cmd build
```

URLs locales :

- Web : `http://localhost:3000`
- API : `http://localhost:3001`
- Santé API : `http://localhost:3001/health`

---

## Structure créée

```text
apps/
  web/       # Next.js — interface exploitant + réservation responsive
  api/       # NestJS — API principale
packages/
  domain/    # Logique métier pure et tests Vitest
  database/  # Schéma Prisma PostgreSQL
  hardware/  # Contrats abstraits pour accès futurs
  config/    # Presets partagés
```

---

## Priorité de développement

1. Stabiliser le domaine `@bingoz/domain`.
2. Connecter `apps/api` à PostgreSQL via Prisma.
3. Remplacer les données démo de `apps/web` par les endpoints API.
4. Ajouter l'onboarding tenant + premier parking.
5. Ajouter la création de réservation manuelle.

Les intégrations LAPI, barrières et agents locaux restent hors MVP.
