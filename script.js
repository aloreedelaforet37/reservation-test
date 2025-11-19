window.addEventListener('DOMContentLoaded', () => {
  // --- Supabase & EmailJS ---
  const SUPABASE_URL = 'https://usatdvopaaxrxjiqhgju.supabase.co';
  const SUPABASE_ANON_KEY = '...';
  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  emailjs.init("t6YY80T3DDql9uy32");

  // --- Fermetures ---
  const encartFermeture = document.getElementById("encartFermeture");
  const periodesFermees = [
    { debut: "2025-12-20", fin: "2025-12-26" },
    { debut: "2026-02-22", fin: "2026-02-28" },
    // ...
  ];
  function afficherEncartFermeture() { /*...*/ }
  afficherEncartFermeture();

  // --- Noms chiens dynamiques ---
  const nbChienInput = document.querySelector('input[name="nb_chien"]');
  const nomsChiensContainer = document.getElementById("nomsChiensContainer");
  function updateNomsChiens() { /*...*/ }
  nbChienInput.addEventListener("input", updateNomsChiens);
  updateNomsChiens();

  // --- Dates & heures ---
  const dateArriveeInput=document.getElementById("dateArrivee");
  const dateDepartInput=document.getElementById("dateDepart");
  const heureArriveeSelect=document.getElementById("heureArrivee");
  const heureDepartSelect=document.getElementById("heureDepart");
  const todayStr = new Date().toISOString().split("T")[0];
  dateArriveeInput.value=todayStr; dateDepartInput.value=todayStr;
  dateArriveeInput.min=todayStr; dateDepartInput.min=todayStr;
  
  // ... Tout le reste de ton JS ...
});
