/**
 * StreamFlix - Application JavaScript
 * 
 * Fonctionnalités interactives modernes:
 * - Navigation mobile responsive
 * - Contrôles de défilement horizontal
 * - Intégration API TMDB optimisée
 * - Gestion d'états avec ES6+
 * - Compatibilité cross-browser
 * - Validation et gestion d'erreurs
 * 
 * @version 2.0
 * @author StreamFlix Team
 */

/**
 * Module principal - IIFE pour éviter la pollution globale
 * Utilise les dernières spécifications ECMAScript
 */
(function () {
  'use strict'; // Mode strict pour sécurité
  // =====================
  // CONFIGURATION & CONSTANTS
  // =====================
  
  // Configuration TMDB avec validation
  const CONFIG = Object.freeze({
    TMDB: {
      KEY: 'e4b90327227c88daac14c0bd0c1f93cd',
      BASE: 'https://api.themoviedb.org/3',
      IMG: 'https://image.tmdb.org/t/p',
      TIMEOUT: 10000, // 10s timeout
      RETRY_ATTEMPTS: 3
    },
    CACHE: {
      TTL: 5 * 60 * 1000, // 5 minutes
      MAX_SIZE: 100
    },
    UI: {
      DEBOUNCE_DELAY: 300,
      ANIMATION_DURATION: 250,
      ITEMS_PER_PAGE: 15
    }
  });
  
  // Cache intelligent pour optimiser les performances
  const apiCache = new Map();
  
  // =====================
  // UTILITAIRES MODERNES ES6+
  // =====================
  // Alias pour compatibilité avec le code existant
  const TMDB = CONFIG.TMDB;

  // Sélecteurs DOM optimisés avec validation
  const qs = (selector, root = document) => {
    try {
      return root.querySelector(selector);
    } catch (error) {
      console.warn(`Invalid selector: ${selector}`, error);
      return null;
    }
  };
  
  const qsa = (selector, root = document) => {
    try {
      return Array.from(root.querySelectorAll(selector));
    } catch (error) {
      console.warn(`Invalid selector: ${selector}`, error);
      return [];
    }
  };
  
  // Utilitaires fonctionnels ES6+
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };
  
  const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };
  
  // Validation des données avec destructuring
  const validateItem = (item) => {
    const { id, title, name, overview, release_date, first_air_date } = item || {};
    return !!(id && (title || name) && overview && (release_date || first_air_date));
  };


  // =====================
  // SYSTÈME DE NOTIFICATIONS
  // =====================
  
  // Gestionnaire de notifications avec file d'attente
  const showToast = (message, type = 'info', duration = 3000) => {
    try {
      let host = document.querySelector('.toast-host');
      if (!host) {
        host = document.createElement('div');
        host.className = 'toast-host';
        host.style.position = 'fixed';
        host.style.right = '12px';
        host.style.bottom = '12px';
        host.style.display = 'grid';
        host.style.gap = '8px';
        host.style.zIndex = '2147483647';
        document.body.appendChild(host);
        // After setting up, try to prime if page is short
        maybePrime();
      }
      function maybePrime() {
        if (done || loading) return;
        const needMore = document.body.offsetHeight < (window.innerHeight * 1.5);
        if (needMore && primeAttempts < 2) {
          primeAttempts++;
          loadMore();
        }
      }
      const el = document.createElement('div');
      el.textContent = message;
      el.className = `toast toast-${type}`;
      el.setAttribute('role', 'status');
      el.style.background = 'var(--glass)';
      el.style.backdropFilter = 'blur(8px)';
      el.style.border = '1px solid rgba(255,255,255,0.15)';
      el.style.color = 'var(--text-primary)';
      el.style.padding = '10px 14px';
      el.style.borderRadius = '12px';
      el.style.boxShadow = 'var(--glow-purple)';
      el.style.transition = 'transform .25s ease, opacity .25s ease';
      el.style.transform = 'translateY(6px)';
      el.style.opacity = '0';
      host.appendChild(el);
      requestAnimationFrame(() => { el.style.transform = 'translateY(0)'; el.style.opacity = '1'; });
      setTimeout(() => {
        el.style.transform = 'translateY(6px)';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 250);
      }, duration);
    } catch {}
  }


  function pathActive(href) {
    const p = (location.pathname || '').toLowerCase();
    if (href.includes('#home')) return p.endsWith('index.html') || p.endsWith('/');
    return p.endsWith(href);
  }

  function renderNavbar() {
    const navHost = document.querySelector('.navbar');
    const addTh = (href) => href; // do not modify links; rely on localStorage only
    const menu = [
      { href: addTh('index.html#home'), label: 'Accueil' },
      { href: addTh('films.html'), label: 'Films' },
      { href: addTh('series.html'), label: 'Séries' },
    ];
    const linksHTML = menu.map(m => {
      const isActive = pathActive(m.href);
      const aria = isActive ? ' aria-current="page"' : '';
      return `<li><a class="nav-link${isActive ? ' active' : ''}" href="${m.href}" role="menuitem"${aria}>${m.label}</a></li>`;
    }).join('');

    const html = `
      <div class="nav-container">
        <div class="logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="url(#g1)" stroke="url(#g2)" stroke-width="2"/><path d="M12 10l8 6-8 6V10z" fill="#fff"/><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4C1D95"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#A78BFA"/><stop offset="100%" stop-color="#4C1D95"/></linearGradient></defs></svg>
          <span class="logo-text">StreamFlix</span>
        </div>
        <ul class="nav-menu" role="menubar">${linksHTML}</ul>
        <div class="nav-actions">
          <a class="icon-btn" href="${addTh('search.html')}" aria-label="Rechercher" title="Rechercher"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg></a>
        </div>
      </div>`;

    if (navHost) {
      navHost.innerHTML = html;
    } else {
      const nav = document.createElement('nav');
      nav.className = 'navbar';
      nav.innerHTML = html;
      document.body.insertBefore(nav, document.body.firstChild);
    }
  }
  // Render navbar
  renderNavbar();

  function ensureSkipLink() {
    const body = document.body;
    if (!body) return;
    let skip = document.querySelector('.skip-link');
    if (!skip) {
      skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#main-content';
      skip.textContent = 'Aller au contenu';
      body.insertBefore(skip, body.firstChild);
    }
  }
  function ensureMainId() {
    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main-content';
  }
  ensureSkipLink();
  ensureMainId();


  const tmdbClient = async (path, params = {}, useCache = true) => {
    const cacheKey = `${path}:${JSON.stringify(params)}`;
    
    // Vérification du cache
    if (useCache && apiCache.has(cacheKey)) {
      const cached = apiCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CONFIG.CACHE.TTL) {
        return cached.data;
      }
      apiCache.delete(cacheKey);
    }
    
    // Construction de l'URL avec validation
    const url = new URL(CONFIG.TMDB.BASE + path);
    url.searchParams.set('api_key', CONFIG.TMDB.KEY);
    url.searchParams.set('language', 'fr-FR');
    
    // Ajout des paramètres avec validation
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    
    // Requête avec retry et timeout
    let lastError;
    for (let attempt = 1; attempt <= CONFIG.TMDB.RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TMDB.TIMEOUT);
        
        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'StreamFlix/2.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Mise en cache avec nettoyage automatique
        if (useCache) {
          if (apiCache.size >= CONFIG.CACHE.MAX_SIZE) {
            const firstKey = apiCache.keys().next().value;
            apiCache.delete(firstKey);
          }
          apiCache.set(cacheKey, {
            data,
            timestamp: Date.now()
          });
        }
        
        return data;
        
      } catch (error) {
        lastError = error;
        if (attempt < CONFIG.TMDB.RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError;
  };
  
  // Alias pour compatibilité
  const tmdb = tmdbClient;

  const CUTOFF_DATE = '2025-12-31'; // include titles released/first-aired on or before Dec 31, 2025
  function allowedMovie(it) {
    if (!it) return false;
    if (detectType(it) !== 'movie') return false;
    if (!it.overview || !String(it.overview).trim()) return false;
    const d = (it.release_date || '');
    return d && d <= CUTOFF_DATE;
  }
  function allowedSeries(it) {
    if (!it) return false;
    if (detectType(it) !== 'tv') return false;
    if (!it.overview || !String(it.overview).trim()) return false;
    const d = (it.first_air_date || '');
    return d && d <= CUTOFF_DATE;
  }
  function allowedAny(it) { return allowedMovie(it) || allowedSeries(it); }

  async function fillMixedPopular(rowEl) {
    try {
      const [moviesPopular, seriesPopular] = await Promise.all([
        tmdb('/movie/popular', { region: 'FR', page: 1 }),
        tmdb('/tv/popular', { region: 'FR', page: 1 })
      ]);

      // Filtrer et limiter
      const movies = (moviesPopular.results || []).filter(allowedMovie).slice(0, 8);
      const series = (seriesPopular.results || []).filter(allowedSeries).slice(0, 7);
      
      // Mélanger : 2 films, 1 série, 2 films, 1 série...
      const mixedContent = [];
      let movieIndex = 0, seriesIndex = 0;
      
      for (let i = 0; i < 15; i++) {
        if (i % 3 < 2 && movieIndex < movies.length) {
          // Ajouter un film (positions 0,1,3,4,6,7...)
          mixedContent.push(movies[movieIndex++]);
        } else if (seriesIndex < series.length) {
          // Ajouter une série (positions 2,5,8,11...)
          mixedContent.push(series[seriesIndex++]);
        } else if (movieIndex < movies.length) {
          // Si plus de séries, compléter avec des films
          mixedContent.push(movies[movieIndex++]);
        }
      }

      rowEl.innerHTML = mixedContent.map(it => cardHTML(it)).join('');
      
    } catch (error) {
      console.error('Erreur section Populaires:', error);
      // Fallback : films populaires uniquement
      fillRow(rowEl, () => tmdb('/movie/popular', { region: 'FR' }), { limit: 15 });
    }
  }

  // =====================
  // FONCTIONS SPÉCIALISÉES PAGE RECOMMANDÉ
  // =====================
  
  async function fillRecommendedPersonalized(rowEl) {
    try {
      const [topRatedMovies, popularSeries, upcomingMovies] = await Promise.all([
        tmdb('/movie/top_rated', { region: 'FR', page: 1 }),
        tmdb('/tv/popular', { region: 'FR', page: 1 }),
        tmdb('/movie/upcoming', { region: 'FR', page: 1 })
      ]);

      const movies = (topRatedMovies.results || []).filter(allowedMovie).slice(0, 6);
      const series = (popularSeries.results || []).filter(allowedSeries).slice(0, 5);
      const upcoming = (upcomingMovies.results || []).filter(allowedMovie).slice(0, 4);
      
      // Mélange équilibré
      const mixed = [...movies, ...series, ...upcoming]
        .sort(() => Math.random() - 0.5)
        .slice(0, 15);
      
      rowEl.innerHTML = mixed.map(it => cardHTML(it)).join('');
    } catch (error) {
      console.error('Erreur Pour vous:', error);
      fillRow(rowEl, () => tmdb('/movie/top_rated', { region: 'FR' }), { limit: 15 });
    }
  }
  
  async function fillRecommendedTrending(rowEl) {
    try {
      const [moviesTrending, seriesTrending] = await Promise.all([
        tmdb('/trending/movie/week'),
        tmdb('/trending/tv/week')
      ]);
      
      const movies = (moviesTrending.results || []).filter(allowedMovie).slice(0, 8);
      const series = (seriesTrending.results || []).filter(allowedSeries).slice(0, 7);
      
      // Alternance movies/series
      const mixed = [];
      for (let i = 0; i < 15; i++) {
        if (i % 2 === 0 && movies.length > 0) {
          mixed.push(movies.shift());
        } else if (series.length > 0) {
          mixed.push(series.shift());
        } else if (movies.length > 0) {
          mixed.push(movies.shift());
        }
      }
      
      rowEl.innerHTML = mixed.map(it => cardHTML(it)).join('');
    } catch (error) {
      console.error('Erreur Tendances:', error);
      fillRow(rowEl, () => tmdb('/trending/all/week'), { limit: 15 });
    }
  }
  
  async function fillRecommendedTopRated(rowEl) {
    try {
      const [topMovies, topSeries] = await Promise.all([
        tmdb('/movie/top_rated', { region: 'FR', page: 1 }),
        tmdb('/tv/top_rated', { region: 'FR', page: 1 })
      ]);
      
      const movies = (topMovies.results || []).filter(allowedMovie).slice(0, 8);
      const series = (topSeries.results || []).filter(allowedSeries).slice(0, 7);
      
      // Tri par note décroissante
      const mixed = [...movies, ...series]
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
        .slice(0, 15);
      
      rowEl.innerHTML = mixed.map(it => cardHTML(it)).join('');
    } catch (error) {
      console.error('Erreur Bien notés:', error);
      fillRow(rowEl, () => tmdb('/movie/top_rated', { region: 'FR' }), { limit: 15 });
    }
  }
  
  async function fillRecommendedDiscoveries(rowEl) {
    try {
      const [hiddenGems, nicheSeries] = await Promise.all([
        tmdb('/discover/movie', { 
          sort_by: 'vote_average.desc',
          'vote_count.gte': 100,
          'vote_count.lte': 1000,
          'vote_average.gte': 7.0,
          'primary_release_date.lte': '2025-12-31'
        }),
        tmdb('/discover/tv', {
          sort_by: 'vote_average.desc',
          'vote_count.gte': 50,
          'vote_count.lte': 500,
          'vote_average.gte': 7.5,
          'first_air_date.lte': '2025-12-31'
        })
      ]);
      
      const movies = (hiddenGems.results || []).filter(allowedMovie).slice(0, 8);
      const series = (nicheSeries.results || []).filter(allowedSeries).slice(0, 7);
      
      const mixed = [...movies, ...series]
        .sort(() => Math.random() - 0.5)
        .slice(0, 15);
      
      rowEl.innerHTML = mixed.map(it => cardHTML(it)).join('');
    } catch (error) {
      console.error('Erreur Découvertes:', error);
      fillRow(rowEl, () => tmdb('/discover/movie', { 
        sort_by: 'vote_average.desc',
        'vote_count.gte': 100 
      }), { limit: 15 });
    }
  }
  
  function setupRecommendedToolbar({ rowSelector }) {
    const section = qs('main .section');
    const row = qs(rowSelector);
    if (!section || !row) return;
    
    const buttons = qsa('.btn.btn-ghost', section);
    if (!buttons.length) return;
    
    // Activer le premier bouton par défaut
    buttons[0].classList.add('active');
    
    buttons.forEach((btn, index) => {
      btn.addEventListener('click', async () => {
        // Mise à jour visuelle
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Affichage du contenu selon le bouton
        try {
          switch (index) {
            case 0: // Pour vous
              await fillRecommendedPersonalized(row);
              break;
            case 1: // Tendances
              await fillRecommendedTrending(row);
              break;
            case 2: // Bien notés
              await fillRecommendedTopRated(row);
              break;
            case 3: // Découvertes
              await fillRecommendedDiscoveries(row);
              break;
          }
        } catch (error) {
          console.error('Erreur changement de filtre:', error);
        }
      });
    });
  }

  async function fillRecommendedMix(rowEl) {
    try {
      const [moviesTopRated, seriesPopular, moviesUpcoming, seriesTrending] = await Promise.all([
        tmdb('/movie/top_rated', { region: 'FR', page: 1 }),
        tmdb('/tv/popular', { region: 'FR', page: 1 }),
        tmdb('/movie/upcoming', { region: 'FR', page: 1 }),
        tmdb('/trending/tv/week')
      ]);

      // Filtrer et limiter chaque catégorie
      const topMovies = (moviesTopRated.results || []).filter(allowedMovie).slice(0, 4);
      const popularSeries = (seriesPopular.results || []).filter(allowedSeries).slice(0, 4);
      const upcomingMovies = (moviesUpcoming.results || []).filter(allowedMovie).slice(0, 4);
      const trendingSeries = (seriesTrending.results || []).filter(allowedSeries).slice(0, 3);

      // Mélanger de manière équilibrée : film, série, film, série...
      const mixedContent = [];
      const allMovies = [...topMovies, ...upcomingMovies];
      const allSeries = [...popularSeries, ...trendingSeries];
      
      for (let i = 0; i < 15 && (allMovies.length > 0 || allSeries.length > 0); i++) {
        if (i % 2 === 0 && allMovies.length > 0) {
          // Ajouter un film
          mixedContent.push(allMovies.shift());
        } else if (allSeries.length > 0) {
          // Ajouter une série
          mixedContent.push(allSeries.shift());
        } else if (allMovies.length > 0) {
          // Si plus de séries, ajouter un film
          mixedContent.push(allMovies.shift());
        }
      }

      // Afficher le contenu mélangé
      rowEl.innerHTML = mixedContent.map(it => cardHTML(it)).join('');
      
    } catch (error) {
      console.error('Erreur lors du chargement des recommandations:', error);
      fillRow(rowEl, () => tmdb('/discover/movie', { 
        sort_by: 'vote_average.desc', 
        'vote_count.gte': 500, 
        'primary_release_date.lte': '2025-12-31' 
      }), { limit: 15 });
    }
  }


  function continueCardHTML(it) {
    const title = itemTitle(it);
    const sub = itemSub(it);
    const poster = imgUrl(it.backdrop_path || it.poster_path, 'w780');
    const type = detectType(it);
    const id = it.id;
    const progressKey = `sf_progress_${type}_${id}`;
    let progress = Number(localStorage.getItem(progressKey));
    if (!Number.isFinite(progress)) {
      progress = Math.floor(10 + Math.random() * 30);
      try { localStorage.setItem(progressKey, String(progress)); } catch {}
    }
    return `
      <article class="card" data-id="${id}" data-type="${type}" aria-label="${title}">
        <div class="thumb">
          <img src="${poster}" alt="${title.replace(/"/g, '')}" />
          <div class="progressbar"><div class="bar" style="--progress: ${progress}%"></div></div>
          <div class="overlay">
            <div class="actions">
              <button type="button" class="icon-pill play" aria-label="Lire">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
              </button>
            </div>
            <div class="meta">
              <div class="title">${title}</div>
              <div class="sub">${sub}</div>
            </div>
          </div>
        </div>
      </article>`;
  }

  function imgUrl(path, size = 'w500') {
    if (!path) return 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=800&auto=format&fit=crop';
    return `${TMDB.IMG}/${size}${path}`;
  }

  function itemTitle(it) { return it.title || it.name || it.original_title || it.original_name || 'Sans titre'; }
  function itemSub(it) {
    const y = (it.release_date || it.first_air_date || '').slice(0, 4);
    const vote = (typeof it.vote_average === 'number' && it.vote_average > 0)
      ? `★ ${it.vote_average.toFixed(1)}`
      : '';
    return [y, vote].filter(Boolean).join(' • ');
  }

  function detectType(it, fallback = 'movie') {
    if (it.media_type) return it.media_type;
    if (it.title || it.release_date) return 'movie';
    if (it.name || it.first_air_date) return 'tv';
    return fallback;
  }

  function cardHTML(it, extraBadges = '') {
    const title = itemTitle(it);
    const sub = itemSub(it);
    const poster = imgUrl(it.backdrop_path || it.poster_path, 'w500');
    const type = detectType(it);
    const id = it.id;
    return `
      <article class="card" data-id="${id}" data-type="${type}">
        <div class="thumb">
          ${extraBadges}
          <img loading="lazy" decoding="async" src="${poster}" alt="${title.replace(/"/g, '')}"/>
          <div class="overlay">
            <div class="actions">
              <button type="button" class="icon-pill play" aria-label="Lire">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </button>
            </div>
            <div class="meta"><div class="title">${title}</div><div class="sub">${sub}</div></div>
          </div>
        </div>
      </article>`;
  }

  async function fillRow(rowEl, fetcher, { limit = 15, ranked = false, filter = allowedAny } = {}) {
    try {
      const data = await fetcher();
      const list = (data.results || []).filter(filter).slice(0, limit);
      rowEl.innerHTML = list.map((it, i) => {
        const badge = ranked ? `<span class="rank-badge">${i + 1}</span>` : '';
        return cardHTML(it, badge);
      }).join('');
    } catch (e) {
      console.error('Failed to fill row', e);
    }

  }


  async function buildHeroFromTrending() {
    const hero = qs('.hero-carousel');
    if (!hero) return;
    const slidesWrap = qs('.slides', hero);
    if (!slidesWrap) return;
    try {
      const data = await tmdb('/trending/all/day');
      const items = (data.results || []).filter(allowedAny).slice(0, 5);
      slidesWrap.innerHTML = items.map((it, i) => `
        <article class="slide ${i === 0 ? 'active' : ''}" data-id="${it.id}" data-type="${detectType(it)}" style="--bg:url('${imgUrl(it.backdrop_path || it.poster_path, 'w1280')}')">
          <div class="slide-overlay">
            <div class="badges"><span class="badge primary">Tendance</span></div>
            <h${i === 0 ? '1' : '2'} class="hero-title">${itemTitle(it)}</h${i === 0 ? '1' : '2'}>
            <p class="hero-desc">${(it.overview || '').length > 160 ? it.overview.slice(0, 157) + '…' : (it.overview || 'Découvre le titre du moment')}</p>
            <div class="hero-actions">
              <button class="btn btn-primary"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>Regarder</button>
              <button class="btn btn-ghost">Plus d'infos</button>
            </div>
          </div>
        </article>
      `).join('');
    } catch (e) {
      console.error('Hero build failed', e);
    }
  }

  async function openDetails(id, type) {
    try {
      const path = type === 'tv' ? `/tv/${id}` : `/movie/${id}`;
      const data = await tmdb(path);
      const title = itemTitle(data);
      const overview = data.overview || '';
      const year = (data.release_date || data.first_air_date || '').slice(0, 4);
      const vote = typeof data.vote_average === 'number' ? `★ ${data.vote_average.toFixed(1)}` : '';
      const genres = (data.genres || []).map(g => g.name).join(' • ');
      const hero = imgUrl(data.backdrop_path || data.poster_path, 'w1280');

      const modal = ensureModal();
      const heroEl = qs('.modal-hero', modal);
      const contentEl = qs('.modal-content', modal);
      heroEl.style.background = `center/cover no-repeat url('${hero}')`;
      contentEl.innerHTML = `
        <h2 class="section-title" style="margin:0">${title}</h2>
        <div style="color:#C7CAD4;">${[year, vote, genres].filter(Boolean).join(' • ')}</div>
        <p style="margin-top:8px;color:#E6E8EF;">${overview || 'Pas de description disponible.'}</p>
        <div style="display:flex; gap:10px; margin-top:6px;">
          <button class="btn btn-primary btn-trailer" data-id="${id}" data-type="${type}"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>Lecture (bande‑annonce)</button>
        </div>`;
      showModal();
    } catch (e) {
      console.error('Details failed', e);
    }
  }

  async function findYoutubeTrailer(id, type) {
    const path = type === 'tv' ? `/tv/${id}/videos` : `/movie/${id}/videos`;
    // Try FR then EN as fallback
    const fr = await tmdb(path, { language: 'fr-FR' });
    const en = await tmdb(path, { language: 'en-US' });
    const pick = (arr) => (arr || []).find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
    return pick(fr.results) || pick(en.results) || null;
  }

  async function playTrailerInModal(id, type) {
    const modal = ensureModal();
    const heroEl = qs('.modal-hero', modal);
    if (!modal || !heroEl) return;
    try {
      const v = await findYoutubeTrailer(id, type);
      if (!v) {
        heroEl.innerHTML = '<div style="display:grid;place-items:center;height:100%;color:#C7CAD4">Aucune bande‑annonce trouvée.</div>';
        return;
      }
      const src = `https://www.youtube.com/embed/${v.key}?autoplay=1&rel=0&modestbranding=1`;
      heroEl.innerHTML = `<iframe width="100%" height="100%" src="${src}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    } catch (e) {
      console.error('Trailer failed', e);
    }
  }

  function ensureModal() {
    let modal = qs('#details-modal');
    if (!modal) {
      const div = document.createElement('div');
      div.id = 'details-modal';
      div.setAttribute('role', 'dialog');
      div.setAttribute('aria-modal', 'true');
      div.style.position = 'fixed';
      div.style.inset = '0';
      div.style.display = 'none';
      div.innerHTML = `
        <div class="modal-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.6)"></div>
        <div class="modal-panel" style="position:relative;max-width:960px;margin:5vh auto;background:rgba(20,16,30,.96);border:1px solid rgba(255,255,255,.12);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6)">
          <button class="modal-close icon-btn" aria-label="Fermer" style="position:absolute;top:10px;right:10px;z-index:2">×</button>
          <div class="modal-hero" style="position:relative;height:360px;background:#0e0f15"></div>
          <div class="modal-content" style="padding:16px 16px 20px;display:grid;gap:10px"></div>
        </div>`;
      document.body.appendChild(div);
      modal = div;
      // Close on backdrop/side click or explicit close button
      modal.addEventListener('click', (e) => {
        const clickedClose = !!e.target.closest('.modal-close');
        const insidePanel = !!e.target.closest('.modal-panel');
        const isBackdrop = e.target.classList && e.target.classList.contains('modal-backdrop');
        if (clickedClose || isBackdrop || (!insidePanel && e.target === modal)) {
          hideModal();
        }
      });
      // Close on Escape key
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { hideModal(); }
      });

  // Wishlist functionality removed - using API only
    }
    return modal;
  }

  function showModal() {
    const modal = qs('#details-modal');
    if (modal) modal.style.display = 'flex';
  }

  function hideModal() {
    const modal = qs('#details-modal');
    if (modal) modal.style.display = 'none';
  }

  // Wishlist functionality removed - using API only

  const nav = document.querySelector('.navbar');
  const navMenu = document.querySelector('.nav-menu');
  const links = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
  
  // Navigation toujours visible - plus de menu mobile

  function ensureNavSpacer() {
    const navEl = document.querySelector('.navbar');
    if (!navEl) return;
    const h = navEl.getBoundingClientRect().height || 80;
    let spacer = navEl.nextElementSibling;
    if (!spacer || !spacer.classList || !spacer.classList.contains('nav-spacer')) {
      spacer = document.createElement('div');
      spacer.className = 'nav-spacer';
      navEl.parentNode.insertBefore(spacer, navEl.nextSibling);
    }
    spacer.style.height = `${Math.round(h)}px`;
  }


  // Smooth scroll with offset
  function getOffset() {
    const navRect = nav ? nav.getBoundingClientRect() : { height: 0 };
    // 72-88px typical height; use computed height for safety
    return Math.max(72, navRect.height || 0);
  }

  function smoothScrollTo(el) {
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - getOffset() + 1;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const hash = link.getAttribute('href');
      if (!hash || !hash.startsWith('#')) return;
      const target = document.querySelector(hash);
      if (target) {
        e.preventDefault();
        smoothScrollTo(target);
        // Close mobile menu after navigation
        navMenu && navMenu.classList.remove('open');
      }
    });
  });

  // Scrollspy (active link highlight)
  const sections = links
    .map(l => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  function setActive(hash) {
    links.forEach(l => {
      const active = l.getAttribute('href') === hash;
      l.classList.toggle('active', active);
      if (active) l.setAttribute('aria-current', 'page');
      else l.removeAttribute('aria-current');
    });
  }

  // Use IntersectionObserver for better accuracy
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = '#' + entry.target.id;
          setActive(id);
        }
      });
    }, { rootMargin: '-50% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });

    sections.forEach(sec => observer.observe(sec));
  } else {
    // Fallback on scroll
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + getOffset() + 10;
      let current = sections[0];
      sections.forEach(sec => {
        if (sec.offsetTop <= scrollPos) current = sec;
      });
      if (current && current.id) setActive('#' + current.id);
    });
  }

  // Navbar scrolled state
  function updateNavScrolled() {
    const sc = window.scrollY > 10;
    nav && nav.classList.toggle('scrolled', sc);
    // Keep spacer in sync if navbar height changes on scroll
    ensureNavSpacer();
  }
  updateNavScrolled();
  window.addEventListener('scroll', updateNavScrolled, { passive: true });
  window.addEventListener('resize', ensureNavSpacer);
  // Initial spacer
  ensureNavSpacer();

  // Horizontal row scroll controls
  function scrollByAmount(container, amount) {
    container.scrollBy({ left: amount, behavior: 'smooth' });
  }

  // Delegated handler to ensure arrows work even if sections are added/changed later
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.row-ctrl');
    if (!btn) return;
    ev.preventDefault();

    // Resolve target row: prefer data-scroll; fallback to closest wrapper
    const sel = btn.getAttribute('data-scroll');
    let row = sel ? document.querySelector(sel) : null;
    if (!row) {
      const wrap = btn.closest('.row-wrap');
      row = wrap ? wrap.querySelector('.row') : null;
    }
    if (!row) return;

    const gap = 24; // matches CSS gap var(--space-3)
    const firstCard = row.querySelector('.card');
    const cardW = firstCard ? firstCard.getBoundingClientRect().width : 0;
    const viewportStep = Math.max(240, Math.floor(row.clientWidth * 0.9));
    const step = Math.max(cardW + gap, viewportStep);
    const dir = btn.classList.contains('next') ? 1 : -1;
    scrollByAmount(row, step * dir);
  });

  // Hero carousel (arrows + dots)
  function initHeroCarousel() {
    const hero = document.querySelector('.hero-carousel');
    if (!hero) return;
    const slidesWrap = hero.querySelector('.slides');
    const slides = slidesWrap ? Array.from(slidesWrap.querySelectorAll('.slide')) : [];
    const prev = hero.querySelector('.carousel-ctrl.prev');
    const next = hero.querySelector('.carousel-ctrl.next');
    const dotsWrap = hero.querySelector('.dots');
    if (!slides.length || !dotsWrap) return;

    let index = slides.findIndex(s => s.classList.contains('active'));
    if (index < 0) index = 0;

    function setActive(i) {
      slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
      const dots = Array.from(dotsWrap.querySelectorAll('button'));
      dots.forEach((d, idx) => d.setAttribute('aria-selected', String(idx === i)));
    }

    function go(delta) {
      index = (index + delta + slides.length) % slides.length;
      setActive(index);
    }

    // Build dots
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Aller à la diapo ${i + 1}`);
      b.setAttribute('aria-selected', String(i === index));
      b.addEventListener('click', () => { index = i; setActive(index); });
      dotsWrap.appendChild(b);
    });

    // Arrows
    prev && prev.addEventListener('click', () => go(-1));
    next && next.addEventListener('click', () => go(1));

    // Basic swipe (touch)
    let startX = 0, dx = 0;
    hero.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchmove', (e) => { dx = e.touches[0].clientX - startX; }, { passive: true });
    hero.addEventListener('touchend', () => {
      if (Math.abs(dx) > 40) { go(dx < 0 ? 1 : -1); }
      dx = 0; startX = 0;
    });
  }

  // =====================
  // PAGE INITIALIZATION
  // =====================
  async function initTMDB() {
    // Hero: replace static slides with trending
    await buildHeroFromTrending();
    initHeroCarousel();

    // Home sections
    const rowContinue = qs('#row-continue');
    const rowTop10 = qs('#row-top10');
    const rowNew = qs('#row-new');
    const rowPopular = qs('#row-popular');
    const rowReco = qs('#row-reco');
    const rowAction = qs('#row-action');
    const rowComedy = qs('#row-comedy');
    const rowDocs = qs('#row-docs');
    const rowOriginals = qs('#row-originals');
    const rowKids = qs('#row-kids');

    // Continue Watching from TMDB (movies now playing)
    if (rowContinue) {
      try {
        const data = await tmdb('/movie/now_playing', { region: 'FR' });
        const list = (data.results || []).filter(allowedMovie).slice(0, 12);
        rowContinue.innerHTML = list.map(it => continueCardHTML(it)).join('');
      } catch (e) { console.error('Continue row failed', e); }
    }

    // DIVERSIFICATION DES SECTIONS POUR ÉVITER LES DUPLICATIONS
    
    // Top 10 - Films trending du jour (inchangé)
    rowTop10 && fillRow(rowTop10, () => tmdb('/trending/movie/day'), { limit: 10, ranked: true });
    
    // Nouveautés - Films actuellement en salle (inchangé)
    rowNew && fillRow(rowNew, () => tmdb('/movie/now_playing', { region: 'FR' }), { limit: 15 });
    
    // Populaires - Mix films ET séries populaires pour varier
    if (rowPopular) {
      fillMixedPopular(rowPopular);
    }
    
    // Recommandé - Mix varié films + séries (déjà fait)
    if (rowReco) {
      fillRecommendedMix(rowReco);
    }
    
    // Action - Films d'action avec meilleure note
    rowAction && fillRow(rowAction, () => tmdb('/discover/movie', { 
      with_genres: '28', 
      sort_by: 'vote_average.desc', 
      'vote_count.gte': 200,
      'primary_release_date.lte': '2025-12-31' 
    }), { limit: 15 });
    
    // Comédie - Films de comédie récents (même format que Action)
    rowComedy && fillRow(rowComedy, () => tmdb('/discover/movie', { 
      with_genres: '35', 
      sort_by: 'vote_average.desc', 
      'vote_count.gte': 200,
      'primary_release_date.lte': '2025-12-31' 
    }), { limit: 15 });
    
    // Documentaires - Docs bien notés
    rowDocs && fillRow(rowDocs, () => tmdb('/discover/movie', { 
      with_genres: '99', 
      sort_by: 'vote_average.desc',
      'vote_count.gte': 50,
      'primary_release_date.lte': '2025-12-31' 
    }), { limit: 15 });
    
    // Originaux - Films les mieux notés (différent de populaires)
    rowOriginals && fillRow(rowOriginals, () => tmdb('/movie/top_rated', { 
      region: 'FR',
      'vote_count.gte': 1000 
    }), { limit: 15 });
    
    // Kids - Films familiaux récents
    rowKids && fillRow(rowKids, () => tmdb('/discover/movie', { 
      with_genres: '16,10751', 
      sort_by: 'release_date.desc',
      'vote_average.gte': 6.5,
      'primary_release_date.lte': '2025-12-31' 
    }), { limit: 15 });

    // Category pages (voir tout)
    const path = (location.pathname || '').toLowerCase();
    // Helper: Attach toolbar (buttons under title) to control filters per page
    function setupToolbar({ rowSelector, context }) {
      const section = qs('main .section');
      const row = qs(rowSelector);
      if (!section || !row) return;

      // Default type per context
      let currentType = (context === 'series') ? 'tv' : 'movie';
      let page = 1; // pagination page
      let rankOffset = 0; // for ranked top10 continuation
      let currentMode = 'default';

      function fetcherFor({ type = currentType, mode = 'default', pageParam }) {
        // Build endpoint based on page context and selected mode
        const recentSortMovie = { sort_by: 'release_date.desc', region: 'FR' };
        const recentSortTV = { sort_by: 'first_air_date.desc' };
        switch (context) {
          case 'popular':
            if (type === 'tv') {
              if (mode === 'recent') return () => tmdb('/discover/tv', { ...recentSortTV, page: pageParam, 'first_air_date.lte': '2025-12-31' });
              return () => tmdb('/tv/popular', { page: pageParam });
            }
            // default movies
            if (mode === 'recent') return () => tmdb('/discover/movie', { ...recentSortMovie, page: pageParam, 'primary_release_date.lte': '2025-12-31' });
            return () => tmdb('/movie/popular', { region: 'FR', page: pageParam });
          case 'new':
            if (type === 'tv') {
              if (mode === 'recent') return () => tmdb('/discover/tv', { ...recentSortTV, page: pageParam, 'first_air_date.lte': '2025-12-31' });
              return () => tmdb('/tv/on_the_air', { page: pageParam });
            }
            if (mode === 'recent') return () => tmdb('/discover/movie', { ...recentSortMovie, page: pageParam, 'primary_release_date.lte': '2025-12-31' });
            return () => tmdb('/discover/movie', { region: 'FR', page: pageParam, sort_by: 'release_date.desc', 'primary_release_date.lte': '2025-12-31' });
          case 'top10':
            // Ranked, movies only
            return () => tmdb('/trending/movie/day', { page: pageParam });
          case 'action':
            if (type === 'tv') {
              if (mode === 'recent') return () => tmdb('/discover/tv', { with_genres: '10759', sort_by: 'first_air_date.desc', page: pageParam, 'first_air_date.lte': '2025-12-31' });
              return () => tmdb('/discover/tv', { with_genres: '10759', sort_by: 'popularity.desc', page: pageParam, 'first_air_date.lte': '2025-12-31' });
            }
            if (mode === 'recent') return () => tmdb('/discover/movie', { with_genres: '28', sort_by: 'release_date.desc', page: pageParam, 'primary_release_date.lte': '2025-12-31' });
            return () => tmdb('/discover/movie', { with_genres: '28', sort_by: 'popularity.desc', page: pageParam, 'primary_release_date.lte': '2025-12-31' });
          case 'comedy':
            if (type === 'tv') {
              if (mode === 'recent') return () => tmdb('/discover/tv', { with_genres: '35', sort_by: 'first_air_date.desc', page: pageParam, 'first_air_date.lte': '2025-12-31' });
              return () => tmdb('/discover/tv', { with_genres: '35', sort_by: 'popularity.desc', page: pageParam, 'first_air_date.lte': '2025-12-31' });
            }
            if (mode === 'recent') return () => tmdb('/discover/movie', { with_genres: '35', sort_by: 'release_date.desc', page: pageParam, 'primary_release_date.lte': '2025-12-31' });
            return () => tmdb('/discover/movie', { with_genres: '35', sort_by: 'popularity.desc', page: pageParam, 'primary_release_date.lte': '2025-12-31' });
          case 'docs':
            if (type === 'tv') {
              if (mode === 'recent') return () => tmdb('/discover/tv', { with_genres: '99', sort_by: 'first_air_date.desc', page: pageParam, 'first_air_date.lte': '2025-12-31' });
              return () => tmdb('/discover/tv', { with_genres: '99', sort_by: 'popularity.desc', page: pageParam, 'first_air_date.lte': '2025-12-31' });
            }
            if (mode === 'recent') return () => tmdb('/discover/movie', { with_genres: '99', sort_by: 'release_date.desc', page: pageParam, 'primary_release_date.lte': '2025-12-31' });
            return () => tmdb('/discover/movie', { with_genres: '99', sort_by: 'popularity.desc', page: pageParam, 'primary_release_date.lte': '2025-12-31' });
          case 'recommended':
            if (type === 'tv') {
              if (mode === 'recent') return () => tmdb('/discover/tv', { ...recentSortTV, 'vote_count.gte': 100, page: pageParam, 'first_air_date.lte': '2025-12-31' });
              return () => tmdb('/discover/tv', { sort_by: 'popularity.desc', 'vote_count.gte': 200, page: pageParam, 'first_air_date.lte': '2025-12-31' });
            }
            if (mode === 'recent') return () => tmdb('/discover/movie', { ...recentSortMovie, 'vote_count.gte': 100, page: pageParam, 'primary_release_date.lte': '2025-12-31' });
            return () => tmdb('/discover/movie', { sort_by: 'popularity.desc', 'vote_count.gte': 300, page: pageParam, 'primary_release_date.lte': '2025-12-31' });
          case 'series':
            // Use TV endpoints for series context with date constraint
            if (mode === 'trending') return () => tmdb('/trending/tv/day', { page: pageParam });
            if (mode === 'recent') return () => tmdb('/discover/tv', { sort_by: 'first_air_date.desc', page: pageParam, 'first_air_date.lte': '2025-12-31' });
            return () => tmdb('/discover/tv', { sort_by: 'popularity.desc', page: pageParam, 'first_air_date.lte': '2025-12-31' });
          case 'films':
            if (mode === 'trending') return () => tmdb('/trending/movie/day', { page: pageParam });
            if (mode === 'recent') return () => tmdb('/discover/movie', { ...recentSortMovie, page: pageParam, 'primary_release_date.lte': '2025-12-31' });
            return () => tmdb('/movie/popular', { region: 'FR', page: pageParam });
          case 'kids':
            if (type === 'tv') {
              if (mode === 'recent') return () => tmdb('/discover/tv', { with_genres: '16,10762', sort_by: 'first_air_date.desc', page: pageParam, 'first_air_date.lte': '2025-12-31' });
              return () => tmdb('/discover/tv', { with_genres: '16,10762', sort_by: 'popularity.desc', page: pageParam, 'first_air_date.lte': '2025-12-31' });
            }
            if (mode === 'recent') return () => tmdb('/discover/movie', { with_genres: '16,10751', sort_by: 'release_date.desc', page: pageParam, 'primary_release_date.lte': '2025-12-31' });
            return () => tmdb('/discover/movie', { with_genres: '16,10751', sort_by: 'popularity.desc', page: pageParam, 'primary_release_date.lte': '2025-12-31' });
          default:
            return () => tmdb('/trending/movie/day', { page: pageParam });
        }
      }

      function apply({ type = currentType, mode = 'default' }) {
        currentType = type; // persist selection
        currentMode = mode; // persist mode (default/recent/others)
        page = 1; // reset pagination
        rankOffset = 0;
        // Mixed handling and special cases
        if (context === 'top10' && type === 'mix') {
          // Trending all already mixes movie+tv
          tmdb('/trending/all/day', { page }).then(data => {
            const ranked = true;
            const results = (data.results || []).slice(0, 10);
            row.innerHTML = results.map((it, i) => {
              const badge = ranked ? `<span class="rank-badge">${i + 1}</span>` : '';
              return cardHTML(it, badge);
            }).join('');
            const wrap = (row.closest('.section') || document).querySelector('.load-more-wrap');
            if (wrap) wrap.remove();
          }).catch(e => console.error('Top10 mix failed', e));
          return;
        }
        // Special handling for Top 10 when filtering by type: filter client-side
        if (context === 'top10' && (type === 'movie' || type === 'tv')) {
          tmdb('/trending/all/day', { page }).then(data => {
            const ranked = true;
            const results = (data.results || []).filter(it => (it.media_type || (detectType(it))) === type).slice(0, 10);
            row.innerHTML = results.map((it, i) => {
              const badge = ranked ? `<span class=\"rank-badge\">${i + 1}</span>` : '';
              return cardHTML(it, badge);
            }).join('');
            const wrap = (row.closest('.section') || document).querySelector('.load-more-wrap');
            if (wrap) wrap.remove();
          }).catch(e => console.error('Top10 filter failed', e));
          return;
        }
        if (type === 'mix') {
          // Fetch movie + tv endpoints per context and merge
          const isRecent = mode === 'recent';
          const reqs = [];
          if (context === 'popular' || context === 'films' || context === 'series' || context === 'recommended') {
            // popular/recommended mix: popularity desc
            if (isRecent) {
              reqs.push(tmdb('/discover/movie', { sort_by: 'release_date.desc', region: 'FR', page }));
              reqs.push(tmdb('/discover/tv', { sort_by: 'first_air_date.desc', page }));
            } else {
              reqs.push(tmdb('/movie/popular', { region: 'FR', page }));
              reqs.push(tmdb('/tv/popular', { page }));
            }
          } else if (context === 'new') {
            // new mix: now playing + on the air (or recent sort)
            if (isRecent) {
              reqs.push(tmdb('/discover/movie', { sort_by: 'release_date.desc', region: 'FR', page }));
              reqs.push(tmdb('/discover/tv', { sort_by: 'first_air_date.desc', page }));
            } else {
              reqs.push(tmdb('/movie/now_playing', { region: 'FR', page }));
              reqs.push(tmdb('/tv/on_the_air', { page }));
            }
          } else if (context === 'action') {
            const movieParams = isRecent ? { with_genres: '28', sort_by: 'release_date.desc', page } : { with_genres: '28', sort_by: 'popularity.desc', page };
            const tvParams = isRecent ? { with_genres: '10759', sort_by: 'first_air_date.desc', page } : { with_genres: '10759', sort_by: 'popularity.desc', page };
            reqs.push(tmdb('/discover/movie', movieParams));
            reqs.push(tmdb('/discover/tv', tvParams));
          } else if (context === 'comedy') {
            const movieParams = isRecent ? { with_genres: '35', sort_by: 'release_date.desc', page } : { with_genres: '35', sort_by: 'popularity.desc', page };
            const tvParams = isRecent ? { with_genres: '35', sort_by: 'first_air_date.desc', page } : { with_genres: '35', sort_by: 'popularity.desc', page };
            reqs.push(tmdb('/discover/movie', movieParams));
            reqs.push(tmdb('/discover/tv', tvParams));
          } else if (context === 'docs') {
            const movieParams = isRecent ? { with_genres: '99', sort_by: 'release_date.desc', page } : { with_genres: '99', sort_by: 'popularity.desc', page };
            const tvParams = isRecent ? { with_genres: '99', sort_by: 'first_air_date.desc', page } : { with_genres: '99', sort_by: 'popularity.desc', page };
            reqs.push(tmdb('/discover/movie', movieParams));
            reqs.push(tmdb('/discover/tv', tvParams));
          } else if (context === 'kids') {
            const movieParams = isRecent ? { with_genres: '16,10751', sort_by: 'release_date.desc', page } : { with_genres: '16,10751', sort_by: 'popularity.desc', page };
            const tvParams = isRecent ? { with_genres: '16,10762', sort_by: 'first_air_date.desc', page } : { with_genres: '16,10762', sort_by: 'popularity.desc', page };
            reqs.push(tmdb('/discover/movie', movieParams));
            reqs.push(tmdb('/discover/tv', tvParams));
          }

          Promise.all(reqs).then(([a, b]) => {
            const ar = (a && a.results) ? a.results : [];
            const br = (b && b.results) ? b.results : [];
            let merged = ar.concat(br);
            // Sort by chosen mode
            if (isRecent) {
              merged.sort((x, y) => new Date((y.release_date || y.first_air_date || '')) - new Date((x.release_date || x.first_air_date || '')));
            } else {
              merged.sort((x, y) => (y.popularity || 0) - (x.popularity || 0));
            }
            merged = merged.slice(0, 9);
            row.innerHTML = merged.map(it => cardHTML(it)).join('');
          }).catch(e => console.error('Mix fetch failed', e));
          return;
        }
        // Always compute filter from the current type so Films/Séries boutons affect results
        const currentFilter = () => (currentType === 'tv' ? allowedSeries : (currentType === 'movie' ? allowedMovie : allowedAny));

        // Helper to ensure we always show 9 items for 'recent' by topping up from next pages
        async function fillRecentNine() {
          try {
            const maxPages = 8;
            let collected = [];
            for (let p = 1; p <= maxPages && collected.length < 9; p++) {
              const data = await fetcherFor({ type, mode: 'recent', pageParam: p })();
              const chunk = (data.results || []).filter(currentFilter());
              collected = collected.concat(chunk);
            }
            const slice = collected.slice(0, 9);
            row.innerHTML = slice.map(it => cardHTML(it)).join('');
          } catch (e) {
            console.error('Failed to fill recent 9', e);
            // Fallback to simple single page fill
            const fetcher = fetcherFor({ type, mode: 'recent', pageParam: 1 });
            await fillRow(row, fetcher, { limit: 9, filter });
          }
        }

        if (mode === 'recent') {
          fillRecentNine().then(() => createInfiniteScroll());
        } else {
          const fetcher = fetcherFor({ type, mode, pageParam: page });
          fillRow(row, fetcher, { limit: (context === 'top10' ? 10 : 12), ranked: context === 'top10', filter: currentFilter() });
          createInfiniteScroll();
        }
      }

      // Initial state already filled above; hook up toolbar buttons
      const btns = qsa('.btn.btn-ghost', section);
      btns.forEach(b => {
        const label = (b.textContent || '').trim().toLowerCase();
        b.addEventListener('click', () => {
          if (label.includes('tous')) {
            if (context === 'series') {
              // Series: Tous = Trending TV (different from Populaire)
              apply({ type: 'tv', mode: 'trending' });
            } else if (context === 'films') {
              // Films: Tous = Trending Movies (different from Populaires)
              apply({ type: 'movie', mode: 'trending' });
            } else {
              // Sur les autres pages (populaires, nouveautés, recommandés, etc.), Tous = mix
              apply({ type: 'mix', mode: 'default' });
            }
          } else if (label.includes('film')) {
            // Films page: rester en films; Séries page: Originals peut basculer en films, Series page reste séries; autres pages: films
            if (context === 'series') {
              const isOriginals = (location.pathname || '').toLowerCase().endsWith('originals.html');
              apply({ type: isOriginals ? 'movie' : 'tv', mode: 'default' });
            }
            else if (context === 'films') apply({ type: 'movie', mode: 'default' });
            else apply({ type: 'movie', mode: 'default' });
          } else if (label.includes('série')) {
            // Séries page: rester en séries; Films page: rester en films; autres pages: séries
            if (context === 'series') apply({ type: 'tv', mode: 'default' });
            else if (context === 'films') apply({ type: 'movie', mode: 'default' });
            else apply({ type: 'tv', mode: 'default' });
          } else if (label.includes('récent')) {
            apply({ type: currentType, mode: 'recent' });
          } else if (label.includes('semaine')) {
            // Treat "Cette semaine" as recent
            apply({ type: currentType, mode: 'recent' });
          } else if (context === 'kids' && label.includes('animation')) {
            // Kids: focus on animation
            // switch to mixed type to broaden results
            currentType = 'mix'; currentMode = 'default'; page = 1; done = false;
            row.innerHTML = '';
            // Fetch animation genres
            (async () => {
              const [a, b] = await Promise.all([
                tmdb('/discover/movie', { with_genres: '16', sort_by: 'popularity.desc', page: 1 }),
                tmdb('/discover/tv', { with_genres: '16,10762', sort_by: 'popularity.desc', page: 1 })
              ]);
              const ar = (a && a.results) ? a.results : [];
              const br = (b && b.results) ? b.results : [];
              const merged = ar.concat(br).sort((x,y)=>(y.popularity||0)-(x.popularity||0)).slice(0,12);
              row.innerHTML = merged.map(it => cardHTML(it)).join('');
              createInfiniteScroll();
            })();
          } else if (label.includes('popul')) {
            apply({ type: currentType, mode: 'default' });
          } else if (context === 'kids' && label.includes('famille')) {
            // Kids: focus on family content
            currentType = 'mix'; currentMode = 'default'; page = 1; done = false;
            row.innerHTML = '';
            (async () => {
              const [a, b] = await Promise.all([
                tmdb('/discover/movie', { with_genres: '10751', sort_by: 'popularity.desc', page: 1 }),
                tmdb('/discover/tv', { with_genres: '10762', sort_by: 'popularity.desc', page: 1 })
              ]);
              const ar = (a && a.results) ? a.results : [];
              const br = (b && b.results) ? b.results : [];
              const merged = ar.concat(br).sort((x,y)=>(y.popularity||0)-(x.popularity||0)).slice(0,12);
              row.innerHTML = merged.map(it => cardHTML(it)).join('');
              createInfiniteScroll();
            })();
          } else if (context === 'kids' && label.includes('nouveau')) {
            // Kids: recent items
            currentType = 'mix'; currentMode = 'recent'; page = 1; done = false;
            row.innerHTML = '';
            fillRecentNine().then(() => createInfiniteScroll());
          } else if (label.includes('mieux not')) {
            // Highest rated: pick endpoint by context
            const fetcher = () => (context === 'series')
              ? tmdb('/discover/tv', { sort_by: 'vote_average.desc', 'vote_count.gte': 200, 'first_air_date.lte': '2025-12-31' })
              : tmdb('/discover/movie', { sort_by: 'vote_average.desc', 'vote_count.gte': 500, 'primary_release_date.lte': '2025-12-31' });
            const filter = context === 'series' ? allowedSeries : allowedMovie;
            fillRow(row, fetcher, { limit: 9, filter });
          } else {
            apply({ type: currentType, mode: 'default' });
          }
        });
      });

      // Setup infinite scroll sentinel beneath the row
      let infObserver = null; let sentinel = null; let loading = false; let done = false; let primeAttempts = 0;
      function createInfiniteScroll() {
        // Clean any previous sentinel
        const old = section.querySelector('.infinite-sentinel');
        if (old) old.remove();
        sentinel = document.createElement('div');
        sentinel.className = 'infinite-sentinel';
        sentinel.style.cssText = 'height:1px;';
        const rowWrap = row.closest('.row-wrap');
        if (rowWrap && rowWrap.parentNode) {
          rowWrap.parentNode.appendChild(sentinel);
        } else {
          // fallback placement
          section.appendChild(sentinel);
        }
        if (infObserver) { try { infObserver.disconnect(); } catch(e){} }
        if ('IntersectionObserver' in window) {
          infObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting && !loading && !done) {
                loadMore();
              }
            });
          }, { rootMargin: '1200px 0px 1200px 0px', threshold: 0 });
          infObserver.observe(sentinel);
        } else {
          // Fallback: on scroll
          window.addEventListener('scroll', onFallbackScroll, { passive: true });
        }
        // Always have a global fallback in case IO misses
        window.addEventListener('scroll', onFallbackScroll, { passive: true });
        // Immediately check once after layout so first batch can load without interaction
        try { requestAnimationFrame(() => onFallbackScroll()); } catch(e) { onFallbackScroll(); }
      }
      function onFallbackScroll() {
        if (loading || done) return;
        const rect = sentinel && sentinel.getBoundingClientRect();
        const nearSentinel = rect && rect.top < window.innerHeight + 400;
        const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 400);
        if (nearSentinel || nearBottom) loadMore();
      }

      async function loadMore() {
        try {
          loading = true;
          // show loader next to sentinel
          let loader = section.querySelector('.infinite-loader');
          if (!loader) {
            loader = document.createElement('div');
            loader.className = 'infinite-loader';
            loader.style.cssText = 'display:flex;justify-content:center;color:#C7CAD4;margin:10px 0;';
            loader.innerHTML = '<span>Chargement…</span>';
            const rowWrap = row.closest('.row-wrap');
            if (rowWrap && rowWrap.parentNode) rowWrap.parentNode.appendChild(loader);
          }
          page += 1;
          // Maintain ranking for Top 10 when filtering by type
          if (context === 'top10' && (currentType === 'movie' || currentType === 'tv')) {
            // recompute rank offset based on current cards count
            rankOffset = row.querySelectorAll('.card').length;
            const data = await tmdb('/trending/all/day', { page });
            const results = (data.results || []).filter(it => (it.media_type || (detectType(it))) === currentType).slice(0, 9);
            results.forEach((it, i) => {
              const badge = `<span class=\"rank-badge\">${rankOffset + i + 1}</span>`;
              row.insertAdjacentHTML('beforeend', cardHTML(it, badge));
            });
            if (!results.length) done = true;
            return;
          }
          if (currentType === 'mix') {
            const isRecent = currentMode === 'recent';
            let ar = [], br = [];
            try {
              if (context === 'popular' || context === 'films' || context === 'series' || context === 'recommended') {
                if (isRecent) {
                  [ar, br] = await Promise.all([
                    tmdb('/discover/movie', { sort_by: 'release_date.desc', region: 'FR', page }),
                    tmdb('/discover/tv', { sort_by: 'first_air_date.desc', page })
                  ]).then(r => r.map(x => x.results || []));
                } else {
                  [ar, br] = await Promise.all([
                    tmdb('/movie/popular', { region: 'FR', page }),
                    tmdb('/tv/popular', { page })
                  ]).then(r => r.map(x => x.results || []));
                }
              } else if (context === 'new') {
                if (isRecent) {
                  [ar, br] = await Promise.all([
                    tmdb('/discover/movie', { sort_by: 'release_date.desc', region: 'FR', page }),
                    tmdb('/discover/tv', { sort_by: 'first_air_date.desc', page })
                  ]).then(r => r.map(x => x.results || []));
                } else {
                  [ar, br] = await Promise.all([
                    tmdb('/movie/now_playing', { region: 'FR', page }),
                    tmdb('/tv/on_the_air', { page })
                  ]).then(r => r.map(x => x.results || []));
                }
              } else if (context === 'action') {
                const movieParams = isRecent ? { with_genres: '28', sort_by: 'release_date.desc', page } : { with_genres: '28', sort_by: 'popularity.desc', page };
                const tvParams = isRecent ? { with_genres: '10759', sort_by: 'first_air_date.desc', page } : { with_genres: '10759', sort_by: 'popularity.desc', page };
                [ar, br] = await Promise.all([
                  tmdb('/discover/movie', movieParams),
                  tmdb('/discover/tv', tvParams)
                ]).then(r => r.map(x => x.results || []));
              } else if (context === 'comedy') {
                const movieParams = isRecent ? { with_genres: '35', sort_by: 'release_date.desc', page } : { with_genres: '35', sort_by: 'popularity.desc', page };
                const tvParams = isRecent ? { with_genres: '35', sort_by: 'first_air_date.desc', page } : { with_genres: '35', sort_by: 'popularity.desc', page };
                [ar, br] = await Promise.all([
                  tmdb('/discover/movie', movieParams),
                  tmdb('/discover/tv', tvParams)
                ]).then(r => r.map(x => x.results || []));
              } else if (context === 'docs') {
                const movieParams = isRecent ? { with_genres: '99', sort_by: 'release_date.desc', page } : { with_genres: '99', sort_by: 'popularity.desc', page };
                const tvParams = isRecent ? { with_genres: '99', sort_by: 'first_air_date.desc', page } : { with_genres: '99', sort_by: 'popularity.desc', page };
                [ar, br] = await Promise.all([
                  tmdb('/discover/movie', movieParams),
                  tmdb('/discover/tv', tvParams)
                ]).then(r => r.map(x => x.results || []));
              } else if (context === 'kids') {
                const movieParams = isRecent ? { with_genres: '16,10751', sort_by: 'release_date.desc', page } : { with_genres: '16,10751', sort_by: 'popularity.desc', page };
                const tvParams = isRecent ? { with_genres: '16,10762', sort_by: 'first_air_date.desc', page } : { with_genres: '16,10762', sort_by: 'popularity.desc', page };
                [ar, br] = await Promise.all([
                  tmdb('/discover/movie', movieParams),
                  tmdb('/discover/tv', tvParams)
                ]).then(r => r.map(x => x.results || []));
              }
              let merged = (ar || []).concat(br || []);
              if (isRecent) {
                merged.sort((x, y) => new Date((y.release_date || y.first_air_date || '')) - new Date((x.release_date || x.first_air_date || '')));
              } else {
                merged.sort((x, y) => (y.popularity || 0) - (x.popularity || 0));
              }
              merged = merged.slice(0, 9);
              merged.forEach(it => row.insertAdjacentHTML('beforeend', cardHTML(it)));
              if (!merged.length) done = true;
              return;
            } catch (e) {
              console.error('Load more mix failed', e);
            }
          }
          // Use current mode to fetch the next batch
          const fetcher = fetcherFor({ type: currentType, mode: currentMode, pageParam: page });
          const data = await fetcher();
          const list = (data.results || []).slice(0, 12);
          list.forEach(it => { row.insertAdjacentHTML('beforeend', cardHTML(it)); });
          if (!list.length) done = true;
        } catch (e) {
          console.error('Load more failed', e);
        }
        finally {
          loading = false;
          if (done && sentinel) {
            try { infObserver && infObserver.disconnect(); } catch(e){}
            sentinel.remove();
          }
          const loader = section.querySelector('.infinite-loader');
          if (loader && (!sentinel || done)) loader.remove();
        }
      }

      // Initialize infinite scroll immediately on setup
      createInfiniteScroll();
    }

    if (path.endsWith('popular.html')) {
      const row = qs('#row-popular-page');
      if (row) {
        try {
          const [am, at] = await Promise.all([
            tmdb('/movie/popular', { region: 'FR' }),
            tmdb('/tv/popular', {})
          ]);
          const ar = (am && am.results) ? am.results : [];
          const br = (at && at.results) ? at.results : [];
          const merged = ar.concat(br).sort((x, y) => (y.popularity || 0) - (x.popularity || 0)).slice(0, 9);
          row.innerHTML = merged.map(it => cardHTML(it)).join('');
        } catch (e) {
          console.error('Initial popular mix failed', e);
          // fallback movies only
          fillRow(row, () => tmdb('/movie/popular', { region: 'FR' }), { limit: 9 });
        }
      }
      setupToolbar({ rowSelector: '#row-popular-page', context: 'popular' });
    } else if (path.endsWith('new.html')) {
      const row = qs('#row-new-page');
      row && fillRow(row, () => tmdb('/movie/now_playing', { region: 'FR' }), { limit: 9 });
      setupToolbar({ rowSelector: '#row-new-page', context: 'new' });
    } else if (path.endsWith('top10.html')) {
      const row = qs('#row-top10-page');
      // Use movies-only trending for Top 10 page
      if (row) {
        await fillRow(row, () => tmdb('/trending/movie/day'), { limit: 10, ranked: true });
        const section = row.closest('.section');
        const wrap = section && section.querySelector('.load-more-wrap');
        if (wrap) wrap.remove();
      }
      setupToolbar({ rowSelector: '#row-top10-page', context: 'top10' });
    } else if (path.endsWith('action.html')) {
      const row = qs('#row-action-page');
      row && fillRow(row, () => tmdb('/discover/movie', { with_genres: '28', sort_by: 'popularity.desc' }), { limit: 9 });
      setupToolbar({ rowSelector: '#row-action-page', context: 'action' });
    } else if (path.endsWith('comedy.html')) {
      const row = qs('#row-comedy-page');
      row && fillRow(row, () => tmdb('/discover/movie', { with_genres: '35', sort_by: 'popularity.desc' }), { limit: 9 });
      setupToolbar({ rowSelector: '#row-comedy-page', context: 'comedy' });
    } else if (path.endsWith('documentaries.html')) {
      const row = qs('#row-docs-page');
      row && fillRow(row, () => tmdb('/discover/movie', { with_genres: '99', sort_by: 'popularity.desc' }), { limit: 9 });
      setupToolbar({ rowSelector: '#row-docs-page', context: 'docs' });
    } else if (path.endsWith('recommended.html')) {
      const row = qs('#row-reco-page');
      // Chargement initial avec "Pour vous" (mix personnalisé)
      if (row) {
        fillRecommendedPersonalized(row);
      }
      setupRecommendedToolbar({ rowSelector: '#row-reco-page' });
    } else if (path.endsWith('originals.html') || path.endsWith('series.html')) {
      const row = qs('#row-originals-page');
      // Default to Recent for Series: fetch multiple pages if needed to ensure 9 items
      if (row) {
        (async () => {
          try {
            const filter = allowedSeries;
            const maxPages = 8;
            let collected = [];
            for (let p = 1; p <= maxPages && collected.length < 9; p++) {
              const data = await tmdb('/discover/tv', { sort_by: 'first_air_date.desc', page: p, 'first_air_date.lte': '2025-12-31' });
              const chunk = (data.results || []).filter(filter);
              collected = collected.concat(chunk);
            }
            const slice = collected.slice(0, 9);
            row.innerHTML = slice.map(it => cardHTML(it)).join('');
          } catch (e) {
            console.error('Series initial recent fill failed', e);
            // Fallback single page
            fillRow(row, () => tmdb('/discover/tv', { sort_by: 'first_air_date.desc', 'first_air_date.lte': '2025-12-31' }), { limit: 9, filter: allowedSeries });
          }
        })();
      }
      setupToolbar({ rowSelector: '#row-originals-page', context: 'series' });
    } else if (path.endsWith('popular.html') || path.endsWith('films.html')) {
      const row = qs('#row-films-page') || qs('#row-popular-page');
      // Default to Recent for Films: fetch multiple pages if needed to ensure 9 items
      if (row) {
        (async () => {
          try {
            const filter = allowedMovie;
            const maxPages = 8;
            let collected = [];
            for (let p = 1; p <= maxPages && collected.length < 9; p++) {
              const data = await tmdb('/discover/movie', { sort_by: 'release_date.desc', region: 'FR', page: p, 'primary_release_date.lte': '2025-12-31' });
              const chunk = (data.results || []).filter(filter);
              collected = collected.concat(chunk);
            }
            const slice = collected.slice(0, 9);
            row.innerHTML = slice.map(it => cardHTML(it)).join('');
          } catch (e) {
            console.error('Films initial recent fill failed', e);
            // Fallback single page
            fillRow(row, () => tmdb('/discover/movie', { sort_by: 'release_date.desc', region: 'FR', 'primary_release_date.lte': '2025-12-31' }), { limit: 9, filter: allowedMovie });
          }
        })();
      }
      setupToolbar({ rowSelector: '#row-films-page', context: 'films' });
    } else if (path.endsWith('kids.html')) {
      const row = qs('#row-kids-page');
      row && fillRow(row, () => tmdb('/discover/movie', { with_genres: '16,10751', sort_by: 'popularity.desc' }), { limit: 9 });
      setupToolbar({ rowSelector: '#row-kids-page', context: 'kids' });
    }


    // Search page
    if (path.endsWith('search.html')) {
      const input = qs('#q');
      const btn = qs('#btn-search');
      const row = qs('#row-results');
      let sPage = 1;
      let lastQ = '';
      if (row) row.setAttribute('aria-live', 'polite');

      function ensureSearchLoadMore() {
        const section = row ? row.closest('.section') : null;
        if (!section) return;
        let wrap = section.querySelector('.load-more-wrap');
        if (!wrap) {
          wrap = document.createElement('div');
          wrap.className = 'load-more-wrap';
          wrap.style.cssText = 'display:flex;justify-content:center;margin-top:12px;';
          const more = document.createElement('button');
          more.className = 'btn btn-ghost btn-load-more';
          more.textContent = 'Charger plus';
          wrap.appendChild(more);
          const rowWrap = row.closest('.row-wrap');
          if (rowWrap && rowWrap.parentNode) rowWrap.parentNode.appendChild(wrap);
          more.addEventListener('click', loadMoreSearch);
        }
      }

      async function doSearch(q) {
        if (!row) return;
        const qtrim = (q || '').trim();
        if (!qtrim) { 
          row.innerHTML = '';
          const resultsTitle = qs('.section h2.section-title');
          if (resultsTitle) resultsTitle.textContent = 'Résultats';
          return; 
        }
        
        try {
          row.setAttribute('aria-busy', 'true');
          lastQ = qtrim;
          sPage = 1;
          
          const data = await tmdb('/search/multi', { 
            query: qtrim, 
            include_adult: 'false', 
            page: sPage,
            region: 'FR'
          });
          
          const results = (data.results || [])
            .filter(allowedAny)
            .slice(0, 20);
          
          if (results.length === 0) {
            row.innerHTML = `
              <div style="text-align:center;padding:3rem;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:1rem;">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="M21 21l-4.35-4.35"></path>
                </svg>
                <p style="color:var(--text-muted);margin-bottom:0.5rem;font-size:1.1rem;">Aucun résultat</p>
                <p style="color:var(--text-secondary);font-size:0.9rem;">Essayez avec d'autres mots-clés</p>
              </div>`;
          } else {
            row.innerHTML = results.map(it => cardHTML(it)).join('');
            ensureSearchLoadMore();
          }
          
          row.setAttribute('aria-busy', 'false');
          updateResultsCount(data.total_results || results.length, qtrim);
          
        } catch (e) {
          console.error('Search failed', e);
          row.innerHTML = `
            <div style="text-align:center;padding:3rem;color:var(--text-muted);">
              <p>Erreur lors de la recherche</p>
              <p style="font-size:0.9rem;margin-top:0.5rem;">Veuillez réessayer</p>
            </div>`;
          row && row.setAttribute('aria-busy', 'false');
        }
      }

      function updateResultsCount(total, query) {
        const resultsTitle = qs('.section h2.section-title');
        if (resultsTitle) {
          resultsTitle.textContent = `Résultats pour "${query}" (${total})`;
        }
      }
      
      async function loadMoreSearch() {
        try {
          if (!lastQ) return;
          sPage += 1;
          const data = await tmdb('/search/multi', { 
            query: lastQ, 
            include_adult: 'false', 
            page: sPage,
            region: 'FR'
          });
          const results = (data.results || []).filter(allowedAny).slice(0, 20);
          results.forEach(it => { row.insertAdjacentHTML('beforeend', cardHTML(it)); });
        } catch (e) { console.error('Search more failed', e); }
      }

      // Recherche en temps réel avec debounce
      let searchTimeout;
      function debouncedSearch(query) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          if (query.trim().length >= 2) {
            doSearch(query);
          }
        }, 400); // Attendre 400ms après la dernière frappe
      }
      
      // Événements de recherche
      input && input.addEventListener('keydown', (e) => { 
        if (e.key === 'Enter') {
          clearTimeout(searchTimeout);
          doSearch(input.value); 
        }
      });
      
      // Recherche en temps réel
      input && input.addEventListener('input', (e) => {
        const query = e.target.value;
        if (query.length === 0) {
          row.innerHTML = '';
          const resultsTitle = qs('.section h2.section-title');
          if (resultsTitle) resultsTitle.textContent = 'Résultats';
        } else if (query.length >= 2) {
          debouncedSearch(query);
        }
      });
      
      // Focus automatique sur le champ de recherche
      if (input) {
        input.focus();
        // Recherche depuis l'URL si paramètre 'q'
        const urlParams = new URLSearchParams(window.location.search);
        const queryParam = urlParams.get('q');
        if (queryParam) {
          input.value = queryParam;
          doSearch(queryParam);
        }
      }
    }
  }

  // Initialize
  initTMDB();
  // keep existing base interactions below

  // 1) Open details modal when clicking any card (outside of specific buttons)
  document.addEventListener('click', (e) => {
    const targetCard = e.target.closest('article.card');
    if (!targetCard) return;
    // If the click was on a specific control (like play), let that handler run
    if (e.target.closest('.icon-pill')) return;
    const id = targetCard.getAttribute('data-id');
    const type = targetCard.getAttribute('data-type') || 'movie';
    if (id) openDetails(id, type);
  });

  // 2) Persisted progress controls: clicking play increases progress for continue row items only
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.icon-pill.play');
    if (!btn) return;
    const card = btn.closest('article.card');
    const row = card && card.closest('#row-continue');
    if (!row || !card) return; // only manage progress for Continue Watching row
    const id = card.getAttribute('data-id');
    const type = card.getAttribute('data-type') || 'movie';
    if (!id) return;
    const key = `sf_progress_${type}_${id}`;
    let current = Number(localStorage.getItem(key));
    if (!Number.isFinite(current)) current = 0;
    const next = Math.min(100, current + 15);
    try { localStorage.setItem(key, String(next)); } catch {}
    const bar = card.querySelector('.progressbar .bar');
    if (bar) bar.style.setProperty('--progress', `${next}%`);
  });

  // 3) Open details from hero primary button
  document.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.hero .btn.btn-primary, .hero .btn.btn-trailer');
    if (!playBtn) return;
    const slide = playBtn.closest('.slide');
    if (!slide) return;
    const id = slide.getAttribute('data-id');
    const type = slide.getAttribute('data-type') || 'movie';
    if (id) {
      openDetails(id, type).then(() => playTrailerInModal(id, type));
    }
  });

  // 3b) Open details from hero "Plus d'infos" (ghost) button
  document.addEventListener('click', (e) => {
    const infoBtn = e.target.closest('.hero .btn.btn-ghost');
    if (!infoBtn) return;
    const slide = infoBtn.closest('.slide');
    if (!slide) return;
    const id = slide.getAttribute('data-id');
    const type = slide.getAttribute('data-type') || 'movie';
    if (id) {
      openDetails(id, type);
    }
  });

  // 4) Play trailer from modal CTA
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-trailer');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const type = btn.getAttribute('data-type') || 'movie';
    if (id) playTrailerInModal(id, type);
  });

  // 5) Clicking play on any card opens trailer (and updates progress if in continue row)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.icon-pill.play');
    if (!btn) return;
    const card = btn.closest('article.card');
    if (!card) return;
    const id = card.getAttribute('data-id');
    const type = card.getAttribute('data-type') || 'movie';
    if (id) {
      openDetails(id, type).then(() => playTrailerInModal(id, type));
    }
    // Also maintain progress if from continue row
    const row = card.closest('#row-continue');
    if (row) {
      const key = `sf_progress_${type}_${id}`;
      let current = Number(localStorage.getItem(key));
      if (!Number.isFinite(current)) current = 0;
      const next = Math.min(100, current + 15);
      try { localStorage.setItem(key, String(next)); } catch {}
      const bar = card.querySelector('.progressbar .bar');
      if (bar) bar.style.setProperty('--progress', `${next}%`);
    }
  });

})();

