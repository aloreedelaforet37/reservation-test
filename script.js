// script.js
window.addEventListener('DOMContentLoaded', () => {
  // --- Supabase ---
  const SUPABASE_URL = 'https://usatdvopaaxrxjiqhgju.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYXRkdm9wYWF4cnhqaXFoZ2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUzNDUsImV4cCI6MjA3NTEwMTM0NX0.D52GPw5yZUJWN1oZD_sop7F7nU9WZLM5OMof1TI3IMc';
  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- EmailJS ---
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
    document.getElementById('closePopup').addEventListener('click', () => popup.remove());
  }

  // --- Périodes de fermeture ---
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

  // --- Formulaire réservation ---
  const formReservation = document.getElementById("reservationForm");
  if (formReservation) {

    const dateArrivee = document.getElementById("dateArrivee");
    const dateDepart = document.getElementById("dateDepart");
    const heureArrivee = document.getElementById("heureArrivee");
    const heureDepart = document.getElementById("heureDepart");

    // Préselection aujourd'hui
    const todayStr = new Date().toISOString().split("T")[0];
    dateArrivee.value = todayStr;
    dateDepart.value = todayStr;
    dateArrivee.min = todayStr;
    dateDepart.min = todayStr;

    // Vérifier si une date tombe dans une période fermée
    function isClosed(dateStr) {
      const date = new Date(dateStr);
      return periodesFermees.some(p => {
        const d1 = new Date(p.debut);
        const d2 = new Date(p.fin);
        return date >= d1 && date <= d2;
      });
    }

    // Vérifier si un séjour traverse une fermeture
    function crossesClosure(dateA, dateD) {
      const dA = new Date(dateA);
      const dD = new Date(dateD);
      return periodesFermees.some(p => {
        const f1 = new Date(p.debut);
        const f2 = new Date(p.fin);
        return dA < f1 && dD > f2;
      });
    }

    // Alerte si date fermée
    function checkClosed(dateInput) {
      if (isClosed(dateInput.value)) {
        alert("La pension est fermée à cette date. Merci d'en choisir une autre.");
        dateInput.value = "";
      }
    }

    // --- Horaires par jour ---
    const horaires = {
      lundi: ["09:00", "14:00", "16:00", "17:00"],
      mardi: ["09:00", "14:00", "16:00", "17:00"],
      mercredi: ["09:00", "14:00", "17:00", "18:45"],
      jeudi: ["09:00", "14:00", "17:00", "18:45"],
      vendredi: ["09:00", "14:00", "17:00", "18:45"],
      samedi: ["10:00", "12:00", "17:00", "18:00"],
      dimanche_arrivee: ["17:00", "18:00"],
      dimanche_depart: ["11:00", "12:00", "17:00", "18:00"]
    };

    function jourFR(dateStr) {
      return new Date(dateStr).toLocaleDateString("fr-FR", { weekday: "long" });
    }

    // --- Création SELECT horaires avec PAS DE 15 MIN ---
    function fillHours(selectElem, liste) {
      selectElem.innerHTML = "";
      for (let i = 0; i < liste.length; i += 2) {
        let hour = liste[i];
        const fin = liste[i + 1];
        while (hour <= fin) {
          const opt = document.createElement("option");
          opt.value = hour;
          opt.textContent = hour.replace(":", "h");
          selectElem.appendChild(opt);

          let [h, m] = hour.split(":").map(Number);
          m += 15; // <-- 15 minutes
          if (m >= 60) { h++; m = 0; }
          hour = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
      }
    }

    function updateHoraires() {
      if (!dateArrivee.value || !dateDepart.value) return;

      const jourA = jourFR(dateArrivee.value);
      const jourD = jourFR(dateDepart.value);

      if (jourA === "dimanche") {
        fillHours(heureArrivee, horaires.dimanche_arrivee);
      } else {
        fillHours(heureArrivee, horaires[jourA]);
      }

      if (jourD === "dimanche") {
        fillHours(heureDepart, horaires.dimanche_depart);
      } else {
        fillHours(heureDepart, horaires[jourD]);
      }
    }

    // --- Évents dates ---
    dateArrivee.addEventListener("change", () => {
      checkClosed(dateArrivee);

      dateDepart.min = dateArrivee.value;

      if (dateDepart.value < dateArrivee.value) {
        dateDepart.value = dateArrivee.value;
      }

      if (crossesClosure(dateArrivee.value, dateDepart.value)) {
        alert("Votre séjour ne peut pas traverser une période de fermeture.");
        dateArrivee.value = "";
        return;
      }

      updateHoraires();
    });

    dateDepart.addEventListener("change", () => {
      checkClosed(dateDepart);

      if (dateDepart.value < dateArrivee.value) {
        alert("La date de départ ne peut pas être avant la date d'arrivée.");
        dateDepart.value = dateArrivee.value;
        return;
      }

      if (crossesClosure(dateArrivee.value, dateDepart.value)) {
        alert("Votre séjour ne peut pas traverser une période de fermeture.");
        dateDepart.value = "";
        return;
      }

      updateHoraires();
    });

    updateHoraires();

    // --- Envoi en base + EmailJS ---
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

        // --- Envoi email confirmation via EmailJS ---
        emailjs.send("service_22ypgkl", "template_i2nke5k", {
          to_email: reservation.email,
          nom: reservation.nom_proprietaire,
          chiens: reservation.nom_chien,
          date_arrivee: reservation.date_arrivee,
          heure_arrivee: reservation.heure_arrivee,
          date_depart: reservation.date_depart,
          heure_depart: reservation.heure_depart,
        })
        .then(() => {
          showPopup("Votre réservation a été enregistrée ! Un email de confirmation vous a été envoyé.");
        })
        .catch((err) => {
          console.error("Erreur EmailJS :", err);
          showPopup("Votre réservation a été enregistrée, mais l'email de confirmation n'a pas pu être envoyé.");
        });

        formReservation.reset();

      } catch(err) {
        showPopup("Erreur en base : " + (err.message || err));
      }
    });

  }

});
