// Page active dans le menu
const page = document.body.className.replace('page-', '');
document.querySelectorAll('.nav-principale a').forEach(a => {
  if (a.dataset.page === page) { a.classList.add('actif'); a.setAttribute('aria-current', 'page'); }
});

// Tiroir de menu
const burger = document.querySelector('.burger');
const tiroir = document.getElementById('tiroir');
burger.addEventListener('click', () => {
  const ouvert = tiroir.hidden;
  tiroir.hidden = !ouvert;
  burger.setAttribute('aria-expanded', ouvert);
  burger.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !tiroir.hidden) { tiroir.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.focus(); }
});

// Taille du texte : trois paliers qui agrandissent le texte seul, sans toucher à la mise en page
const paliers = [
  { classe: '', libelle: 'normale' },
  { classe: 'texte-grand', libelle: 'grande' },
  { classe: 'texte-tres-grand', libelle: 'très grande' },
];
const boutonTaille = document.querySelector('[data-taille]');
let palier = 0;
try { palier = Math.min(Number(localStorage.getItem('hea-texte')) || 0, paliers.length - 1); } catch {}
const appliquerTaille = annoncer => {
  const racinePage = document.documentElement;
  paliers.forEach(p => p.classe && racinePage.classList.remove(p.classe));
  if (paliers[palier].classe) racinePage.classList.add(paliers[palier].classe);
  const suivant = paliers[(palier + 1) % paliers.length].libelle;
  boutonTaille.setAttribute('aria-label', `Taille du texte : ${paliers[palier].libelle}. Passer en taille ${suivant}`);
  boutonTaille.setAttribute('aria-pressed', palier > 0);
  boutonTaille.dataset.palier = palier;
  boutonTaille.textContent = palier === 2 ? 'A' : 'A+';
  if (annoncer && window.annoncerTaille) window.annoncerTaille('Taille du texte : ' + paliers[palier].libelle);
};
appliquerTaille(false);
boutonTaille.addEventListener('click', () => {
  palier = (palier + 1) % paliers.length;
  appliquerTaille(true);
  try { localStorage.setItem('hea-texte', palier); } catch {}
});

// Carrousel d'accueil : défile seul
const carrousel = document.querySelector('.carrousel');
if (carrousel && carrousel.querySelectorAll('.diapo').length > 1) {
  const DUREE = 5500;
  const diapos = [...carrousel.querySelectorAll('.diapo')];
  const points = carrousel.querySelector('.carrousel__points');
  let courant = 0, minuterie, enPause = false;
  carrousel.style.setProperty('--duree', DUREE + 'ms');
  diapos.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Diapositive ${i + 1} sur ${diapos.length}`);
    b.addEventListener('click', () => { aller(i); relancer(); });
    points.appendChild(b);
  });
  const aller = i => {
    courant = (i + diapos.length) % diapos.length;
    diapos.forEach((d, k) => { d.classList.toggle('active', k === courant); d.setAttribute('aria-hidden', k !== courant); });
    [...points.children].forEach((b, k) => {
      b.setAttribute('aria-current', k === courant);
      b.classList.remove('charge');
      if (k === courant && !enPause) { void b.offsetWidth; b.classList.add('charge'); }
    });
  };
  const relancer = () => {
    clearInterval(minuterie);
    if (!enPause && !document.hidden) minuterie = setInterval(() => aller(courant + 1), DUREE);
    aller(courant);
  };
  carrousel.querySelector('.carrousel__fleche--g').addEventListener('click', () => { aller(courant - 1); relancer(); });
  carrousel.querySelector('.carrousel__fleche--d').addEventListener('click', () => { aller(courant + 1); relancer(); });
  // Pause discrète pour la navigation au clavier : le défilement s'arrête tant que le focus est dans le carrousel
  carrousel.addEventListener('focusin', () => { enPause = true; relancer(); });
  carrousel.addEventListener('focusout', e => { if (!carrousel.contains(e.relatedTarget)) { enPause = false; relancer(); } });
  document.addEventListener('visibilitychange', relancer);
  relancer();
}

// Copier un numéro Mobile Money
const toast = document.querySelector('.toast');
const annoncer = msg => {
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2200);
};
window.annoncerTaille = annoncer;
document.querySelectorAll('.copier').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copie); annoncer('Numéro copié : ' + b.dataset.copie); }
  catch { annoncer('Numéro : ' + b.dataset.copie); }
}));

// Visionneuse de galerie
document.querySelectorAll('.galerie img, .mini-galerie img').forEach(img => img.addEventListener('click', () => {
  const v = document.createElement('div');
  v.className = 'visionneuse';
  v.setAttribute('role', 'dialog');
  v.setAttribute('aria-label', img.alt);
  v.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
  const fermer = () => { v.remove(); document.removeEventListener('keydown', echap); };
  const echap = e => { if (e.key === 'Escape') fermer(); };
  v.addEventListener('click', fermer);
  document.addEventListener('keydown', echap);
  document.body.appendChild(v);
}));

document.querySelectorAll('.annee').forEach(s => s.textContent = new Date().getFullYear());


// Apparition des blocs et compteurs animés au défilement
document.documentElement.classList.add('js');
const sansAnimation = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Chaque section du site reçoit ses animations : on marque les blocs à faire apparaître
const aAnimer = [
  ['.titre-section, .mission__entete, .etroit > h2, .etroit > .intro, .etroit > p, .citation, .bandeau-page .conteneur', 'monte'],
  ['.tuile, .carte, .stat, .objectif, .obj-carte, .usage, .frise__etape, .produits__grille figure, .engager__carte, .chiffre', 'monte'],
  ['.programme > img, .deux > img, .travail > img, .photo-cadre', 'gauche'],
  ['.programme > div, .deux > div, .travail > div, .carte-don, .don-grille > div:first-child', 'droite'],
  ['.galerie img', 'zoom'],
  ['.appel-don__ligne, .onglets, .pied__grille > div, .impact__devise', 'monte'],
];
aAnimer.forEach(([selecteur, effet]) => document.querySelectorAll(selecteur).forEach(el => {
  if (el.closest('.carrousel') || el.classList.contains('revele')) return;
  el.classList.add('revele', 'revele--' + effet);
}));
// Décalage en cascade entre éléments voisins
document.querySelectorAll('.revele').forEach(el => {
  const freres = [...el.parentElement.children].filter(x => x.classList.contains('revele'));
  el.style.setProperty('--retard', Math.min(freres.indexOf(el), 6) * 90 + 'ms');
});

const compter = el => {
  const fin = Number(el.dataset.compteur), depart = Number(el.dataset.depart || 0);
  if (sansAnimation) { el.textContent = 'milliers' in el.dataset ? fin.toLocaleString('fr-FR') : fin; return; }
  const duree = 1600, t0 = performance.now();
  const pas = t => {
    const p = Math.min(1, (t - t0) / duree), e = 1 - Math.pow(1 - p, 3);
    const v = Math.round(depart + (fin - depart) * e);
    el.textContent = 'milliers' in el.dataset ? v.toLocaleString('fr-FR') : v;
    if (p < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
};
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver(entrees => entrees.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('visible');
    e.target.querySelectorAll('[data-compteur]').forEach(compter);
    obs.unobserve(e.target);
  }), { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.revele').forEach(el => obs.observe(el));
} else {
  document.querySelectorAll('.revele').forEach(el => el.classList.add('visible'));
}

// En-tête : ombre plus marquée dès qu'on fait défiler la page
const entete = document.querySelector('.entete');
const ombre = () => entete.classList.toggle('defile', scrollY > 10);
addEventListener('scroll', ombre, { passive: true });
ombre();


// Newsletter : vérifie les champs puis transmet l'inscription sur le WhatsApp de l'ONG
document.querySelectorAll('.newsletter').forEach(form => form.addEventListener('submit', e => {
  e.preventDefault();
  const nom = form.nom.value.trim(), email = form.email.value.trim();
  const message = form.querySelector('.newsletter__message');
  if (!nom || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    message.textContent = 'Merci d’indiquer votre nom et une adresse e-mail valide.';
    (!nom ? form.nom : form.email).focus();
    return;
  }
  const texte = `Bonjour HEA, je souhaite m'inscrire à la newsletter.\nNom : ${nom}\nEmail : ${email}`;
  window.open('https://wa.me/2290193722222?text=' + encodeURIComponent(texte), '_blank', 'noopener');
  message.textContent = 'Merci ! Envoyez le message WhatsApp qui vient de s’ouvrir pour confirmer votre inscription.';
  form.reset();
}));


// Frise des objectifs : le rail se remplit et les étapes s'allument au défilement
const frise = document.querySelector('.frise-objectifs__corps');
if (frise) {
  const remplissage = frise.querySelector('.frise-objectifs__remplissage');
  const etapes = [...frise.querySelectorAll('[data-etape]')];
  const majFrise = () => {
    const r = frise.getBoundingClientRect(), h = innerHeight;
    const debut = r.top - h * 0.5, fin = r.top + r.height - h * 0.5;
    const p = Math.min(1, Math.max(0, -debut / (fin - debut)));
    remplissage.style.setProperty('--progression', (p * 100) + '%');
    etapes.forEach(e => e.classList.toggle('est-active', sansAnimation || e.getBoundingClientRect().top < h * 0.75));
  };
  addEventListener('scroll', majFrise, { passive: true });
  addEventListener('resize', majFrise);
  majFrise();
}


// Mot de la Présidente : afficher ou replier la suite de la lettre
document.querySelectorAll('.mot-presidente__bouton').forEach(b => b.addEventListener('click', () => {
  const suite = document.getElementById(b.getAttribute('aria-controls'));
  const ouvert = suite.hidden;
  suite.hidden = !ouvert;
  b.setAttribute('aria-expanded', ouvert);
  b.textContent = ouvert ? 'Réduire' : 'Lire la suite';
}));


// Film de l'accueil : il démarre quand on arrive dessus et se met en pause quand on le quitte.
// Les navigateurs refusent la lecture automatique avec le son : on démarre alors en muet
// et on propose « Activer le son ». Une pause faite par le visiteur est respectée.
const film = document.querySelector('[data-lecture-auto]');
if (film && !sansAnimation) {
  const boutonSon = film.parentElement.querySelector('.film-accueil__son');
  let pauseParScript = false, pauseVisiteur = false;
  film.addEventListener('pause', () => { if (pauseParScript) pauseParScript = false; else pauseVisiteur = true; });
  film.addEventListener('play', () => { pauseVisiteur = false; });
  film.addEventListener('volumechange', () => { if (!film.muted) boutonSon.hidden = true; });
  const lancer = async () => {
    if (pauseVisiteur || !film.paused) return;
    try {
      film.muted = false;
      await film.play();
    } catch {
      film.muted = true;
      try { await film.play(); boutonSon.hidden = false; } catch { /* lecture refusée : le visiteur garde le bouton lecture */ }
    }
  };
  // Visible à moitié : on lance ; sorti de l'écran : on met en pause.
  let etaitVisible = false;
  const verifierFilm = () => {
    const r = film.getBoundingClientRect();
    const visible = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height;
    if (visible >= 0.5 && !etaitVisible) { etaitVisible = true; lancer(); }
    else if (visible < 0.2 && etaitVisible) {
      etaitVisible = false;
      if (!film.paused) { pauseParScript = true; film.pause(); }
    }
  };
  addEventListener('scroll', verifierFilm, { passive: true });
  addEventListener('resize', verifierFilm);
  verifierFilm();
  boutonSon.addEventListener('click', () => { film.muted = false; boutonSon.hidden = true; film.play(); });
}
