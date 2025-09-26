# StreamFlix

> Plateforme de streaming moderne inspirée de Disney+ avec intégration TMDB complète

## Fonctionnalités

### Core Features
- **Design moderne** inspiré de Disney+ avec animations fluides
- **100% Responsive** - Mobile-first design
- **Contenu dynamique** via l'API TMDB (films & séries réels)
- **Navigation intelligente** avec auto-loading et infinite scroll
- **Système de thèmes** (Sombre, Clair, Sépia) avec persistance
- **Recherche avancée** avec résultats en temps réel
- **Modales détaillées** avec bandes-annonces YouTube

### Performance
- **Lazy loading** des images
- **Preconnect** aux APIs critiques
- **Code optimisé** sans dépendances externes
- **Cache intelligent** pour les requêtes TMDB

## Technologies

- **HTML5** sémantique avec accessibilité
- **CSS3** avec variables personnalisées et Grid/Flexbox
- **JavaScript ES6+** vanilla (pas de frameworks)
- **TMDB API** pour le contenu réel
- **YouTube API** pour les bandes-annonces
## Lignes directrices (rapides)

- Mobile-first: concevoir pour ≤ 640px, puis étendre avec des media queries
- Layout: CSS Grid pour les pages « voir tout » (`.grid-page`), Flex pour navbar et actions
- Composants:
  - Cartes média: `.card` (alias FR: `.carte`), `.thumb` (alias: `.vignette`), `.overlay` (alias: `.surcouche`)
  - Navbar: `.navbar`, `.nav-container`, `.nav-menu`, `.nav-link`, `.nav-actions`
- Performance:
  - Vignettes en `w500`, `loading="lazy"` et `decoding="async"`
  - Scroll infini par `IntersectionObserver` + fallback

## TMDB

- L’intégration (clé côté client) se trouve dans `app.js` (`TMDB.KEY`). Prévoir de déplacer la clé côté serveur pour un déploiement public.

## Documentation

- Voir `docs/CODE_STYLE.md` pour les conventions (indentation, commentaires, nommage)

## Licence

Projet pédagogique. À adapter selon vos besoins.
