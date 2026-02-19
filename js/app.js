(function () {
  'use strict';

  const PATHS = {
    sanglier: { silhouette: 'assets/wildboar.jpeg', organs: 'assets/wildboar-organs.jpeg' },
    chevreuil: { silhouette: 'assets/deer.jpeg', organs: 'assets/deer-organs.jpeg' }
  };

  var CACHE_WARM_URLS = [
    'index.html',
    'manifest.json',
    'css/style.css',
    'js/app.js',
    'assets/empty-page.jpeg',
    'assets/deer.jpeg',
    'assets/wildboar.jpeg',
    'assets/deer-organs.jpeg',
    'assets/wildboar-organs.jpeg',
    'assets/rotate-smartphone.png'
  ];

  function warmCache() {
    CACHE_WARM_URLS.forEach(function (url) {
      fetch(url, { cache: 'reload' }).catch(function () {});
    });
  }

  let state = {
    view: 'home',
    animal: null,
    impactPercent: null
  };

  const views = {
    home: document.getElementById('view-home'),
    silhouette: document.getElementById('view-silhouette'),
    organs: document.getElementById('view-organs')
  };

  const silhouetteImg = document.getElementById('silhouette-img');
  const organsImg = document.getElementById('organs-img');
  const silhouetteStage = document.getElementById('silhouette-stage');
  const organsStage = document.getElementById('organs-stage');
  const scopeSilhouette = document.getElementById('scope-silhouette');
  const scopeOrgans = document.getElementById('scope-organs');
  const btnValider = document.getElementById('btn-valider');
  const btnRecommencer = document.getElementById('btn-recommencer');
  const silhouetteHelper = document.getElementById('silhouette-helper');

  function setView(name) {
    state.view = name;
    Object.keys(views).forEach(function (key) {
      const el = views[key];
      const hidden = key !== name;
      el.classList.toggle('view-hidden', hidden);
      el.setAttribute('aria-hidden', hidden);
    });
  }

  function positionScope(stage, img, scope, percent) {
    if (!percent) return;
    var stageRect = stage.getBoundingClientRect();
    var imgRect = img.getBoundingClientRect();
    var centerX = (imgRect.left - stageRect.left) + percent.x * imgRect.width;
    var centerY = (imgRect.top - stageRect.top) + percent.y * imgRect.height;
    scope.style.left = centerX + 'px';
    scope.style.top = centerY + 'px';
  }

  function updateScopeVisibility(scope, show) {
    scope.classList.toggle('hidden', !show);
    scope.setAttribute('aria-hidden', !show);
  }

  function showSilhouette(animal) {
    state.animal = animal;
    state.impactPercent = null;
    var paths = PATHS[animal];
    silhouetteImg.src = paths.silhouette;
    silhouetteImg.alt = animal === 'sanglier' ? 'Silhouette sanglier' : 'Silhouette chevreuil';
    updateScopeVisibility(scopeSilhouette, false);
    btnValider.disabled = true;
    if (silhouetteHelper) silhouetteHelper.classList.remove('hidden');
    setView('silhouette');
  }

  function onSilhouetteClick(e) {
    var stage = silhouetteStage;
    var img = silhouetteImg;
    var stageRect = stage.getBoundingClientRect();
    var imgRect = img.getBoundingClientRect();
    var x = e.clientX - imgRect.left;
    var y = e.clientY - imgRect.top;
    if (x < 0 || x > imgRect.width || y < 0 || y > imgRect.height) return;
    state.impactPercent = { x: x / imgRect.width, y: y / imgRect.height };
    positionScope(stage, img, scopeSilhouette, state.impactPercent);
    updateScopeVisibility(scopeSilhouette, true);
    btnValider.disabled = false;
    if (silhouetteHelper) silhouetteHelper.classList.add('hidden');
  }

  function validate() {
    if (!state.impactPercent || !state.animal) return;
    var paths = PATHS[state.animal];
    organsImg.alt = state.animal === 'sanglier' ? 'Anatomie sanglier' : 'Anatomie chevreuil';
    organsImg.onload = function () {
      positionScope(organsStage, organsImg, scopeOrgans, state.impactPercent);
    };
    organsImg.src = paths.organs;
    setView('organs');
    updateScopeVisibility(scopeOrgans, true);
    positionScope(organsStage, organsImg, scopeOrgans, state.impactPercent);
  }

  function recommencer() {
    state.animal = null;
    state.impactPercent = null;
    setView('home');
  }

  function onResize() {
    if (state.view === 'silhouette' && state.impactPercent) {
      positionScope(silhouetteStage, silhouetteImg, scopeSilhouette, state.impactPercent);
    }
    if (state.view === 'organs' && state.impactPercent) {
      positionScope(organsStage, organsImg, scopeOrgans, state.impactPercent);
    }
  }

  document.querySelectorAll('.btn-choice').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var animal = btn.getAttribute('data-animal');
      if (animal && PATHS[animal]) showSilhouette(animal);
    });
  });

  silhouetteStage.addEventListener('click', onSilhouetteClick);
  btnValider.addEventListener('click', validate);
  btnRecommencer.addEventListener('click', recommencer);

  window.addEventListener('resize', onResize);
  if (typeof ResizeObserver !== 'undefined') {
    var ro = new ResizeObserver(function () { onResize(); });
    if (silhouetteStage) ro.observe(silhouetteStage);
    if (organsStage) ro.observe(organsStage);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(function () {
      warmCache();
    }).catch(function () {
      warmCache();
    });
  } else {
    warmCache();
  }

  var rotateOverlay = document.getElementById('rotate-overlay');
  function updateRotateOverlay() {
    var isPortrait = window.innerHeight > window.innerWidth;
    if (rotateOverlay) {
      rotateOverlay.classList.toggle('visible', isPortrait);
      rotateOverlay.setAttribute('aria-hidden', !isPortrait);
    }
    if (isPortrait && typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.lock === 'function') {
      screen.orientation.lock('landscape').catch(function () {});
    }
  }
  updateRotateOverlay();
  window.addEventListener('resize', updateRotateOverlay);
  if (typeof window.matchMedia !== 'undefined') {
    window.matchMedia('(orientation: portrait)').addEventListener('change', updateRotateOverlay);
  }
})();
