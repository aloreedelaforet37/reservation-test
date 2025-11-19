// script.js
window.addEventListener('DOMContentLoaded', () => {
  // --- Supabase ---
  const SUPABASE_URL = 'https://usatdvopaaxrxjiqhgju.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYXRkdm9wYWF4cnhqaXFoZ2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUzNDUsImV4cCI6MjA3NTEwMTM0NX0.D52GPw5yZUJWN1oZD_sop7F7nU9WZLM5OMof1TI3IMc';
  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- EmailJS (si utilisé) ---
  if (typeof emailjs !== "undefined") emailjs.init("t6YY80T3DDql9uy32");

  // --- Popup ---
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

  // --- Encarts fermetures ---
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
  if (encartFermeture) {
    let contenu = "";
    periodesFermees.forEach(p => {
      const options = { day:"numeric", month:"long" };
      let debut = new Date(p.debut).toLocaleDateString("fr-FR", options).replace(/^1 /,"1er ");
      let fin = new Date(p.fin).toLocaleDateString("fr-FR", options).replace(/^1 /,"1er ");
      contenu += `Du ${debut} au ${fin}<br>`;
    });
    encartFermeture.innerHTML = contenu;
  }

  // --- Formulaire animal ---
  const formAnimal = document.getElementById("animalForm");
  if (formAnimal) {
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

        if (error) throw error;

        showPopup("Votre demande a été enregistrée !");
        formAnimal.reset();

      } catch(err) {
        showPopup("Erreur lors de l'enregistrement : " + (err.message || err));
      }
    });
  }

  // --- Formulaire réservation (optionnel) ---
  const formReservation = document.getElementById("reservationForm");
  if (formReservation) {
    const todayStr = new Date().toISOString().split("T")[0];
    formReservation.addEventListener("submit", async e => {
      e.preventDefault();
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
        showPopup("Votre réservation a été enregistrée !");
        formReservation.reset();
      } catch(err) {
        showPopup("Erreur en base : " + (err.message || err));
      }
    });
  }
});
