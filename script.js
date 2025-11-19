// --- Supabase GLOBAL ---
// (Accessible pour toutes les pages)
window.supabaseClient = supabase.createClient(
  "https://usatdvopaaxrxjiqhgju.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYXRkdm9wYWF4cnhqaXFoZ2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUzNDUsImV4cCI6MjA3NTEwMTM0NX0.D52GPw5yZUJWN1oZD_sop7F7nU9WZLM5OMof1TI3IMc"
);


window.addEventListener('DOMContentLoaded', () => {
  // --- Supabase & EmailJS ---
  const SUPABASE_URL = 'https://usatdvopaaxrxjiqhgju.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYXRkdm9wYWF4cnhqaXFoZ2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUzNDUsImV4cCI6MjA3NTEwMTM0NX0.D52GPw5yZUJWN1oZD_sop7F7nU9WZLM5OMof1TI3IMc';
  emailjs.init("t6YY80T3DDql9uy32");

  // --- Fermetures ---
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
    let contenu = "";
    periodesFermees.forEach(p => {
      const options = { day: "numeric", month: "long" };
      let debut = new Date(p.debut).toLocaleDateString("fr-FR", options).replace(/^1 /, "1er ");
      let fin = new Date(p.fin).toLocaleDateString("fr-FR", options).replace(/^1 /, "1er ");
      contenu += `Du ${debut} au ${fin}<br>`;
    });
    encartFermeture.innerHTML = contenu;
  }
  afficherEncartFermeture();

  // --- Noms chiens dynamiques ---
  const nbChienInput = document.querySelector('input[name="nb_chien"]');
  const nomsChiensContainer = document.getElementById("nomsChiensContainer");

  function updateNomsChiens() {
    let nb = parseInt(nbChienInput.value) || 1;
    if (nb < 1) nb = 1;
    nbChienInput.value = nb;

    nomsChiensContainer.innerHTML = "";
    for (let i = 1; i <= nb; i++) {
      const label = document.createElement("label");
      label.textContent = nb === 1 ? "Nom du chien" : `Nom du chien ${i}`;

      const input = document.createElement("input");
      input.type = "text";
      input.name = `nom_chien_input_${i}`;
      input.required = true;

      nomsChiensContainer.appendChild(label);
      nomsChiensContainer.appendChild(input);
    }
  }
  nbChienInput.addEventListener("input", updateNomsChiens);
  updateNomsChiens();

  // --- Dates & heures simplifiées ---
  const dateArriveeInput = document.getElementById("dateArrivee");
  const dateDepartInput = document.getElementById("dateDepart");
  const heureArriveeSelect = document.getElementById("heureArrivee");
  const heureDepartSelect = document.getElementById("heureDepart");

  const todayStr = new Date().toISOString().split("T")[0];
  dateArriveeInput.value = todayStr;
  dateDepartInput.value = todayStr;
  dateArriveeInput.min = todayStr;
  dateDepartInput.min = todayStr;

  const horaires = {
    arrivee: {
      semaine: ["09:00", "10:00", "11:00", "17:00", "18:00", "19:00"],
      weekend: ["09:00", "10:00", "11:00"]
    },
    depart: {
      semaine: ["09:00", "10:00", "11:00", "17:00", "18:00", "19:00"],
      weekend: ["09:00", "10:00", "11:00"]
    }
  };

  function getDayType(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDay(); // 0 = dimanche, 6 = samedi
    return (day === 0 || day === 6) ? "weekend" : "semaine";
  }

  function generateCreneaux(dateStr, plages) {
    const type = getDayType(dateStr);
    return plages[type] || [];
  }

  function updateHeures() {
    const dateA = dateArriveeInput.value;
    const dateD = dateDepartInput.value;

    const creneauxA = generateCreneaux(dateA, horaires.arrivee);
    const creneauxD = generateCreneaux(dateD, horaires.depart);

    heureArriveeSelect.innerHTML = creneauxA.map(h => `<option value="${h}">${h}</option>`).join("");
    heureDepartSelect.innerHTML = creneauxD.map(h => `<option value="${h}">${h}</option>`).join("");

    if (dateD === dateA) {
      const hA = heureArriveeSelect.value;
      const filtré = creneauxD.filter(h => h >= hA);
      heureDepartSelect.innerHTML = filtré.map(h => `<option value="${h}">${h}</option>`).join("");
    }
  }

  dateArriveeInput.addEventListener("change", () => {
    if (dateDepartInput.value < dateArriveeInput.value) {
      dateDepartInput.value = dateArriveeInput.value;
    }
    updateHeures();
  });
  dateDepartInput.addEventListener("change", updateHeures);
  heureArriveeSelect.addEventListener("change", updateHeures);

  updateHeures();

  // Format date en français
  function formatDateFrancais(dateStr, heureStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
      .replace(/^1 /, "1er ")
      + " à " + heureStr;
  }

  // Popup
  function showPopup(message) {
    const popup = document.getElementById("popup");
    const popupMessage = document.getElementById("popupMessage");

    popupMessage.innerHTML = message;
    popup.classList.add("show");

    setTimeout(() => popup.classList.remove("show"), 6000);
  }

  // --- Soumission formulaire ---
  const form = document.getElementById("reservationForm");

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const formData = new FormData(form);

    const reservation = {
      nom: formData.get("nom"),
      email: formData.get("email"),
      telephone: formData.get("telephone"),
      nb_chien: parseInt(formData.get("nb_chien"), 10),
      nom_chien: [],
      date_arrivee: formData.get("date_arrivee"),
      heure_arrivee: formData.get("heure_arrivee"),
      date_depart: formData.get("date_depart"),
      heure_depart: formData.get("heure_depart"),
      message: formData.get("message")
    };

    for (let i = 1; i <= reservation.nb_chien; i++) {
      reservation.nom_chien.push(formData.get(`nom_chien_input_${i}`));
    }
    reservation.nom_chien = reservation.nom_chien.join(",");

    // Insertion Supabase
    try {
      const { error } = await supabaseClient
        .from("reservations")
        .insert([reservation]);

      if (error) {
        alert("Erreur en base : " + error.message);
        return;
      }
    } catch (err) {
      alert("Erreur en base : " + (err.message || err));
      return;
    }

    // Popup confirmation
    const messageHtml = `
      Votre réservation a été enregistrée avec succès<br>
      du <strong>${formatDateFrancais(reservation.date_arrivee, reservation.heure_arrivee)}</strong><br>
      au <strong>${formatDateFrancais(reservation.date_depart, reservation.heure_depart)}</strong>
      <br>Nous vous tiendrons informé(e) dès que possible de la disponibilité.
    `;
    showPopup(messageHtml);

    // Email
    const emailParams = {
      nom: reservation.nom,
      email: reservation.email,
      telephone: reservation.telephone,
      nom_chien: reservation.nom_chien,
      nb_chien: reservation.nb_chien,
      date_arrivee: formatDateFrancais(reservation.date_arrivee, reservation.heure_arrivee),
      date_depart: formatDateFrancais(reservation.date_depart, reservation.heure_depart),
      message: reservation.message || ""
    };

    try {
      await emailjs.send("service_22ypgkl", "template_i2nke5k", emailParams);
    } catch (err) {
      alert("Erreur lors de l'envoi du mail : " + (err.text || err));
    }

    form.reset();
    dateArriveeInput.value = todayStr;
    dateDepartInput.value = todayStr;
    updateNomsChiens();
    updateHeures();
  });
});
