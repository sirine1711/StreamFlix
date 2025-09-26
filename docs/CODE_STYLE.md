# Guide de style (Cr1.3 – Clarté du code)

Objectif: un code propre, maintenable, compréhensible rapidement par tout développeur.

## Indentation & Espacement
- Indentation: 2 espaces (HTML/CSS/JS)
- Longueur de ligne: 100–120 caractères max
- Une ligne vide entre blocs logiques (fonctions, sections CSS)

## Nommage
- Variables/constantes JS: `camelCase` (ex: `currentPage`, `isLoading`)
- Fonctions JS: `camelCase` verbales (ex: `fillRow`, `buildHeroFromTrending`)
- Alias français: autorisés en parallèle pour la lisibilité (ex: `remplirLigne` → `fillRow`)
- Classes CSS: `kebab-case` (ex: `nav-container`, `row-wrap`); alias français permissifs en plus (ex: `carte`, `vignette`).
- IDs: explicites et uniques (ex: `row-originals-page`).

## Commentaires
- JS: commentaire au-dessus d’un bloc/fonction pour expliquer l’intention, pas ce que fait chaque ligne
- JSDoc recommandé pour les fonctions utilitaires et publiques
- CSS: commenter les sections (Navbar, Hero, Grid, Cards, Footer) et les hacks éventuels

## HTML
- Attributs d’accessibilité: `aria-label`, `aria-current`, rôles sémantiques utilisés
- Ordre recommandé: `meta`, `title`, liens de ressources, `link` CSS puis `script` en fin de body (ou `defer`)
- Pas d’inlines styles sauf exceptions locales (préférer classes)

## CSS
- Mobile-first, puis media queries croissantes
- Regrouper par composants: Navbar, Hero, Sections, Grid, Cards, Footer
- Utiliser variables CSS pour couleurs, espace, typos, transitions
- Pas de !important sauf cas d’override volontaire et commenté

## JavaScript
- Pas d’accès direct au DOM partout: helper `qs/qsa`
- Découper en fonctions courtes et nommées pour chaque responsabilité (render navbar, fill row, init hero)
- Gestion des erreurs: try/catch sur I/O (fetch), logs clairs
- Performance: lazy-load images, IntersectionObserver, éviter reflows inutiles
- File protocol: pas d’API clé côté public en production (déplacer côté serveur si besoin)

## Structure projet
- Root: pages HTML, `styles.css`, `app.js`, `README.md`
- `docs/`: documentation (guide style, archi)
- (Optionnel) `assets/`: images et médias statiques

## Outils
- `.editorconfig`: unifier indentations et fins de ligne
- `.prettierrc`: formater automatiquement JS/CSS/HTML

## Revue & PR
- Petits changements atomiques, description claire (quoi/pourquoi)
- Respect des conventions ci-dessus
