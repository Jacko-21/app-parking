# @bingoz/config

Package réservé aux configurations partagées entre apps et packages
(presets ESLint, base TypeScript, thème Tailwind communs).

Pour l'instant volontairement minimal : le socle TS strict vit dans
`tsconfig.base.json` à la racine et la config ESLint dans `eslint.config.mjs`.
Ce package les factorisera lorsque les besoins de partage le justifieront
(notamment à l'arrivée de `packages/ui` / shadcn).
