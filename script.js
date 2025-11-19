// script.js
window.addEventListener('DOMContentLoaded', () => {
  // --- Supabase ---
  const SUPABASE_URL = 'https://usatdvopaaxrxjiqhgju.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYXRkdm9wYWF4cnhqaXFoZ2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUzNDUsImV4cCI6MjA3NTEwMTM0NX0.D52GPw5yZUJWN1oZD_sop7F7nU9WZLM5OMof1TI3IMc';
  const supabaseClient = supabase ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  // --- EmailJS (uniquement si nécessaire) ---
  if (typeof emailjs !== "undefined") {
    emailjs.init("t6YY80T3DDql9uy32");
  }

  // --- Fonction popup ---
  function showPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
      <div class="popup-content">
        ${message}
        <button id="closePopup">OK</button>
      </div>`;
    document.body.appendChild(popup);
    const btn = document.getElementById('closePopup');
    if (btn) btn.addEventListener('click', () => popup.remove());
  }

  // --- Encarts fermetures (si présent) ---
  const encartFermeture = document.getElementById("encartFermeture");
  const periodesFermees = [
    { debut: "2025-12-20", fin: "2025-12-26" },
    { debut: "2026-02-22", fin: "2026-02-28" },
    { debut: "2026-04-18", fin: "2026-04-26" },
    { debut: "2026-05-27", fin: "2026-05-31" },
    { debut: "2026-07-03", fin: "2026-07-23" },
    { debut: "2026-10-16", fin: "2026-10-24" },
    { debut: "2026-12-19", fin: "2026-12-27" }
  ];
  function afficherEncartFermeture() {
    if (!encartFermeture) return;
    let contenu = "";
    periodesFermees.forEach(p => {
      const options = { day:"numeric", month:"long" };
      let debut = new Date(p.debut).toLocaleDateString("fr-FR", options).replace(/^1 /,"1er ");
      let fin = new Date(p.fin).toLocaleDateString("fr-FR", options).replace(/^1 /,"1er ");
      contenu += `Du ${debut} au ${fin}<br>`;
    });
    encartFermeture.innerHTML = contenu;
  }
  afficherEncartFermeture();

  // --- Gestion formulaire réservation (si présent) ---
  const formReservation = document.getElementById("reservationForm");
  if (formReservation && supabaseClient) {
    const nbChienInput = document.querySelector('input[name="nb_chien"]');
    const nomsChiensContainer = document.getElementById("nomsChiensContainer");
    const dateArriveeInput = document.getElementById("dateArrivee");
    const dateDepartInput = document.getElementById("dateDepart");
    const heureArriveeSelect = document.getElementById("heureArrivee");
    const heureDepartSelect = document.getElementById("heureDepart");
    const todayStr = new Date().toISOString().split("T")[0];

    // --- Fonctions pour les chiens ---
    function updateNomsChiens() {
      if (!nbChienInput || !nomsChiensContainer) return;
      let nb = parseInt(nbChienInput.value) || 1;
      if (nb < 1) nb = 1;
      nbChienInput.value = nb;
      nomsChiensContainer.innerHTML = "";
      for (let i = 1; i <= nb; i++) {
        const label = document.createElement("label");
        label.textContent = nb === 1 ? "Nom du chien" : `Nom du chien ${i}`;
        const input = document.createElement("input");
        input.type = "text"; input.name = `nom_chien_input_${i}`; input.required = true;
        nomsChiensContainer.appendChild(label); nomsChiensContainer.appendChild(input);
      }
    }
    if (nbChienInput) {
      nbChienInput.addEventListener("input", updateNomsChiens);
      updateNomsChiens();
    }

    // --- Dates & heures simplifiées ---
    if (dateArriveeInput) dateArriveeInput.value = todayStr;
    if (dateDepartInput) dateDepartInput.value = todayStr;
    if (dateArriveeInput) dateArriveeInput.min = todayStr;
    if (dateDepartInput) dateDepartInput.min = todayStr;

    // --- Soumission réservation ---
    formReservation.addEventListener("submit", async e => {
      e.preventDefault();
      if (!supabaseClient) return;

      const formData = new FormData(formReservation);
      const reservation = {
        nom_proprietaire: formData.get("nom_proprietaire"),
        email: formData.get("email"),
        nb_chien: parseInt(formData.get("nb_chien")) || 1,
        nom_chien: [],
        date_arrivee: formData.get("date_arrivee"),
        heure_arrivee: formData.get("heure_arrivee"),
        date_depart: formData.get("date_depart"),
        heure_depart: formData.get("heure_depart"),
        remarque: formData.get("remarque")
      };
      for (let i = 1; i <= reservation.nb_chien; i++) {
        reservation.nom_chien.push(formData.get(`nom_chien_input_${i}`));
      }
      reservation.nom_chien = reservation.nom_chien.join(",");

      try {
        const { error } = await supabaseClient.from("reservations").insert([reservation]);
        if (error) throw error;
        showPopup("Votre réservation a été enregistrée avec succès !");
        formReservation.reset();
        if (dateArriveeInput) dateArriveeInput.value = todayStr;
        if (dateDepartInput) dateDepartInput.value = todayStr;
        updateNomsChiens();
      } catch(err) {
        showPopup("Erreur en base : " + (err.message || err));
      }
    });
  }

  // --- Gestion formulaire animal (si présent) ---
  const formAnimal = document.getElementById("animalForm");
  if (formAnimal && supabaseClient) {
    formAnimal.addEventListener("submit", async e => {
      e.preventDefault();
      const proprietaire = document.getElementById('proprietaire')?.value.trim();
      const email = document.getElementById('email')?.value.trim();
      const nom_animal = document.getElementById('nom_animal')?.value.trim();

      if (!proprietaire || !email || !nom_animal) {
        showPopup("Veuillez remplir tous les champs.");
        return;
      }

try {
  const { data, error } = await supabaseClient
    .from('demande_formulaire')
    .insert([{ date_soumission: new Date().toISOString(), proprietaire, email, nom_animal, transfere: false }]);

  if (error) {
    console.error("Supabase error:", error);
    showPopup("Erreur lors de l'enregistrement : " + error.message);
    return;
  }

  showPopup("Votre demande a été enregistrée !");
  form.reset();

} catch(err) {
  showPopup("Erreur inattendue : " + (err.message || err));
}

    });
  }

});
