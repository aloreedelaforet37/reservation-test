// script.js
window.addEventListener('DOMContentLoaded', () => {

  // --- Supabase ---
  const SUPABASE_URL = 'https://usatdvopaaxrxjiqhgju.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYXRkdm9wYWF4cnhqaXFoZ2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUzNDUsImV4cCI6MjA3NTEwMTM0NX0.D52GPw5yZUJWN1oZD_sop7F7nU9WZLM5OMof1TI3IMc';
  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- EmailJS ---
  if (typeof emailjs !== "undefined") emailjs.init("t6YY80T3DDql9uy32");

  const todayStr = new Date().toISOString().split("T")[0];

  // --- Popup ---
  function showPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
      <div class="popup-content">
        <strong>Information</strong><br><br>
        ${message}
        <button class="closePopup">OK</button>
      </div>`;
    document.body.appendChild(popup);
    popup.querySelector('.closePopup').addEventListener('click', () => popup.remove());
  }

  // --- Périodes de fermeture ---
  const periodesFermees = [
    { debut: "2026-04-19", fin: "2026-04-26" },
    { debut: "2026-05-27", fin: "2026-05-31" },
    { debut: "2026-07-03", fin: "2026-07-23" },
    { debut: "2026-10-16", fin: "2026-10-24" },
    { debut: "2026-12-19", fin: "2026-12-27" }
  ];

  const datesCompletes = [
    { debut: "2026-04-12", fin: "2026-04-18" },
    { debut: "2026-05-08", fin: "2026-05-10" },
    { debut: "2026-05-13", fin: "2026-05-18" },
    { debut: "2026-07-25", fin: "2026-08-24" }
    
  ];

  const encartFermeture = document.getElementById("encartFermeture");

  if (encartFermeture) {
    let contenu = `<strong>Pour information, la pension sera fermée aux périodes suivantes :</strong><br>`;
    periodesFermees.forEach(p => {
      const options = { day: "numeric", month: "long", year: "numeric" };

      let debut = new Date(p.debut).toLocaleDateString("fr-FR", options).replace(/^1 /,"1er ");
      let fin = new Date(p.fin).toLocaleDateString("fr-FR", options).replace(/^1 /,"1er ");

      contenu += `Du ${debut} au ${fin}<br>`;
    });

    encartFermeture.innerHTML = contenu;
  }

  // --- Fonctions fermeture ---
  function isClosed(dateStr) {
    const date = new Date(dateStr);
    return periodesFermees.some(p => {
      const d1 = new Date(p.debut);
      const d2 = new Date(p.fin);
      return date >= d1 && date <= d2;
    });
  }

  function isComplet(dateStr) {
    const date = new Date(dateStr);
    return datesCompletes.some(p => {
      const d1 = new Date(p.debut);
      const d2 = new Date(p.fin);
      return date >= d1 && date <= d2;
    });
}

function crossesClosure(dateA, dateD) {
  const dA = new Date(dateA);
  const dD = new Date(dateD);

  // Vérif périodes de fermeture
  const traversePeriode = periodesFermees.some(p => {
    const f1 = new Date(p.debut);
    const f2 = new Date(p.fin);
    return dA < f1 && dD > f2;
  });

  // Vérif périodes complètes
  const contientDateComplete = datesCompletes.some(p => {
    const d1 = new Date(p.debut);
    const d2 = new Date(p.fin);
    return dA <= d2 && dD >= d1;
  });

  return traversePeriode || contientDateComplete;
}

  // --- Jours fériés ---
function getEasterDate(year) {
  const f = Math.floor,
    G = year % 19,
    C = f(year / 100),
    H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
    I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
    J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
    L = I - J,
    month = 3 + f((L + 40) / 44),
    day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
}

function formatLocalDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
  
  // formate la date eu format "13 mars 2026"
  function formatDateFR(dateStr) {
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Date(dateStr).toLocaleDateString("fr-FR", options);
  }

  function getJoursFeries(year) {

    const jours = [
      `${year}-01-01`,
      `${year}-05-01`,
      `${year}-05-08`,
      `${year}-07-14`,
      `${year}-08-15`,
      `${year}-11-01`,
      `${year}-11-11`,
      `${year}-12-25`
    ];

    const paques = getEasterDate(year);

    const lundiPaques = new Date(paques);
    lundiPaques.setDate(paques.getDate() + 1);

    const ascension = new Date(paques);
    ascension.setDate(paques.getDate() + 39);

    const pentecote = new Date(paques);
    pentecote.setDate(paques.getDate() + 50);

    jours.push(formatLocalDate(lundiPaques));
    jours.push(formatLocalDate(ascension));
    jours.push(formatLocalDate(pentecote));

    return jours;
  }

  function isJourFerie(dateStr) {
    const year = new Date(dateStr).getFullYear();
    return getJoursFeries(year).includes(dateStr);
  }

  // --- Formulaire ---
  const formReservation = document.getElementById("reservationForm");
  const nomsChiensContainer = document.getElementById("nomsChiensContainer");

  if (formReservation) {

    const dateArrivee = document.getElementById("dateArrivee");
    const dateDepart = document.getElementById("dateDepart");
    const heureArrivee = document.getElementById("heureArrivee");
    const heureDepart = document.getElementById("heureDepart");

    const nbChienInput = formReservation.querySelector('input[name="nb_chien"]');

    // --- Noms des chiens dynamiques ---
    function updateNomChiens() {

      const nb = parseInt(nbChienInput.value) || 1;
      nomsChiensContainer.innerHTML = "";

      for (let i = 1; i <= nb; i++) {

        const div = document.createElement("div");
        div.className = "chien-field";

        const label = document.createElement("label");
        label.textContent = nb === 1 ? "Nom du chien" : `Nom chien ${i}`;

        const input = document.createElement("input");
        input.type = "text";
        input.name = `nom_chien_input_${i}`;
        input.required = true;

        div.appendChild(label);
        div.appendChild(input);
        nomsChiensContainer.appendChild(div);
      }
    }

    updateNomChiens();
    nbChienInput.addEventListener("change", updateNomChiens);

    const horairesEte = {
      lundi: [["09:00","14:00"],["17:00","18:45"]],
      mardi: [["09:00","14:00"],["17:00","18:45"]],
      mercredi: [["09:00","14:00"],["17:00","18:45"]],
      jeudi: [["09:00","14:00"],["17:00","18:45"]],
      vendredi: [["09:00","14:00"],["17:00","18:45"]],
      samedi: [["10:00","12:00"],["17:00","18:00"]],
      dimanche_arrivee: [["17:00","18:00"]],
      dimanche_depart: [["11:00","12:00"],["17:00","18:00"]]
    };
    
    const horairesHiver = {
      lundi: [["09:00","14:00"],["16:00","17:00"]],
      mardi: [["09:00","14:00"],["16:00","17:00"]],
      mercredi: [["09:00","14:00"],["17:00","18:45"]],
      jeudi: [["09:00","14:00"],["17:00","18:45"]],
      vendredi: [["09:00","14:00"],["17:00","18:45"]],
      samedi: [["10:00","12:00"],["17:00","18:00"]],
      dimanche_arrivee: [["17:00","18:00"]],
      dimanche_depart: [["11:00","12:00"],["17:00","18:00"]]
    };

function isHeureEte(dateStr) {

  const date = new Date(dateStr);
  const year = date.getFullYear();

  const fevrier = new Date(year, 1, 28);
  const octobre = new Date(year, 9, 31);

  const dernierDimancheFevrier = new Date(fevrier.setDate(28 - fevrier.getDay()));
  const dernierDimancheOctobre = new Date(octobre.setDate(31 - octobre.getDay()));

  return date >= dernierDimancheFevrier && date < dernierDimancheOctobre;
}
    
    function fillHours(selectElem, plages) {

      const oldValue = selectElem.value;
      selectElem.innerHTML = "";

      plages.forEach(([start,end]) => {

        let hour = start;

        while (hour <= end) {

          const opt = document.createElement("option");
          opt.value = hour;
          opt.textContent = hour.replace(":", "h");

          selectElem.appendChild(opt);

          let [h,m] = hour.split(":").map(Number);
          m += 15;

          if (m >= 60) { h++; m = 0; }

          hour = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
        }
      });

      if ([...selectElem.options].some(o => o.value === oldValue)) {
        selectElem.value = oldValue;
      }
    }

    function updateHorairesArrivee() {

      if (isClosed(dateArrivee.value)) {
        heureArrivee.innerHTML = "";
        return;
      }

      if (isJourFerie(dateArrivee.value)) {
        fillHours(heureArrivee,[["17:00","18:00"]]);
        return;
      }

      const jour = new Date(dateArrivee.value).toLocaleDateString("fr-FR",{weekday:"long"});
      const horaires = isHeureEte(dateArrivee.value) ? horairesEte : horairesHiver;
      if (jour === "dimanche") {
        fillHours(heureArrivee,horaires.dimanche_arrivee);
      } else {
        fillHours(heureArrivee, horaires[jour]);
      }
    }

    function updateHorairesDepart() {

      if (isClosed(dateDepart.value)) {
        heureDepart.innerHTML = "";
        return;
      }

      if (isJourFerie(dateDepart.value)) {
        fillHours(heureDepart,[["11:00","12:00"],["17:00","18:00"]]);
        return;
      }

      const jour = new Date(dateDepart.value).toLocaleDateString("fr-FR",{weekday:"long"});
      const horaires = isHeureEte(dateDepart.value) ? horairesEte : horairesHiver;
      if (jour === "dimanche") {
        fillHours(heureDepart,horaires.dimanche_depart);
      } else {
        fillHours(heureDepart, horaires[jour]);
      }
    }

    dateArrivee.value = todayStr;
    dateDepart.value = todayStr;
    dateArrivee.min = todayStr;
    dateDepart.min = todayStr;

    updateHorairesArrivee();
    updateHorairesDepart();

dateArrivee.addEventListener("change", () => {
  dateArrivee.style.color = "";
  dateDepart.min = dateArrivee.value;
  if (!dateDepart.value || dateDepart.value < dateArrivee.value)
    dateDepart.value = dateArrivee.value;
  updateHorairesArrivee();
  updateHorairesDepart();
});

dateDepart.addEventListener("change", () => {
  dateDepart.style.color = "";
  heureDepart.style.color = "";
  if (dateDepart.value < dateArrivee.value)
    dateDepart.value = dateArrivee.value;
  updateHorairesDepart();
});
    
heureDepart.addEventListener("change", () => {
  dateDepart.style.color = "";
  heureDepart.style.color = "";
});

  
// --- Submit réservation ---
formReservation.addEventListener("submit", async e => {
  e.preventDefault();

  const btnSubmit = formReservation.querySelector('button[type="submit"]');
  btnSubmit.disabled = true;

  // Réinitialiser les couleurs
  dateArrivee.style.color = "";
  dateDepart.style.color = "";

  let erreur = false;

  // Contrôle des dates
  if (isClosed(dateArrivee.value)) {
    showPopup("La date d'arrivée est sur une période de fermeture, n'hésitez pas à réserver sur une autre période.");
    dateArrivee.style.color = "red";
    dateArrivee.focus();
    erreur = true;
  } else if (isComplet(dateArrivee.value)) {
    showPopup("Nous sommes complets le jour de la date d'arrivée, n'hésitez pas à réserver sur une autre période ou à me contacter.");
    dateArrivee.style.color = "red";
    dateArrivee.focus();
    erreur = true;
  }

  if (!erreur) {
    if (isClosed(dateDepart.value)) {
      showPopup("La date de départ est sur une période de fermeture, n'hésitez pas à réserver sur une autre période.");
      dateDepart.style.color = "red";
      dateDepart.focus();
      erreur = true;
    } else if (isComplet(dateDepart.value)) {
      showPopup("Nous sommes complets le jour de la date de départ, n'hésitez pas à réserver sur une autre période ou à me contacter.");
      dateDepart.style.color = "red";
      dateDepart.focus();
      erreur = true;
    }
  }

  if (!erreur && crossesClosure(dateArrivee.value, dateDepart.value)) {
    showPopup("Votre séjour ne peut pas traverser une période de fermeture ou de période complète.");
    dateArrivee.style.color = "red";
    dateDepart.style.color = "red";
    dateArrivee.focus();
    erreur = true;
  }

  const dateMax = new Date();
  dateMax.setMonth(dateMax.getMonth() + 6);
  const dateMaxStr = dateMax.toISOString().split("T")[0];

  if (!erreur && dateArrivee.value > dateMaxStr) {
    showPopup("La réservation n'est pas ouverte plus de 6 mois avant la date souhaitée.");
    dateArrivee.style.color = "red";
    dateArrivee.focus();
    erreur = true;
  }

  if (!erreur && dateDepart.value > dateMaxStr) {
    showPopup("La réservation n'est pas ouverte plus de 6 mois avant la date souhaitée.");
    dateDepart.style.color = "red";
    dateDepart.focus();
    erreur = true;
  }

  if (!erreur && dateArrivee.value === dateDepart.value) {
    if (heureDepart.value <= heureArrivee.value) {
      showPopup("L'heure de départ doit être postérieure à l'heure d'arrivée.");
      dateDepart.style.color = "red";
      heureDepart.style.color = "red";
      heureDepart.focus();
      erreur = true;
    }
  }

  if (erreur) return;

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

  for (let i = 1; i <= reservation.nb_chien; i++)
    reservation.nom_chien.push(formData.get(`nom_chien_input_${i}`));

  if (reservation.nom_chien.length === 1) reservation.nom_chien = reservation.nom_chien[0];
  else if (reservation.nom_chien.length === 2) reservation.nom_chien = reservation.nom_chien.join(" et ");
  else {
    const last = reservation.nom_chien.pop();
    reservation.nom_chien = reservation.nom_chien.join(", ") + " et " + last;
  }

  try {
    const { error } = await supabaseClient.from("reservations").insert([reservation]);
    if (error) throw error;

    const emailAloree = "a.l.oree.de.la.foret.37@gmail.com";
    await Promise.all([
      // Email pour le client
      emailjs.send("service_22ypgkl", "template_i2nke5k", {
        to_email: reservation.email,
        from_name: "Isabelle - Pension À l'Orée de la Forêt",
        from_email: emailAloree,
        subject: "Votre réservation pour " + reservation.nom_chien + " a bien été enregistrée",
        nomChiens: reservation.nom_chien,
        date_arrivee: `Du ${formatDateFR(reservation.date_arrivee)} à ${reservation.heure_arrivee.replace(":", "h")}`,
        date_depart: `Au ${formatDateFR(reservation.date_depart)} à ${reservation.heure_depart.replace(":", "h")}`
      }),
      // Email pour moi
      emailjs.send("service_22ypgkl", "template_r0e2mju", {
        to_email: emailAloree,
        from_name: reservation.nom_proprietaire,
        from_email: emailAloree,
        subject: "Nouvelle réservation pour " + reservation.nom_chien,
        nomChiens: reservation.nom_chien,
        date_arrivee: `Du ${formatDateFR(reservation.date_arrivee)} à ${reservation.heure_arrivee.replace(":", "h")}`,
        date_depart: `Au ${formatDateFR(reservation.date_depart)} à ${reservation.heure_depart.replace(":", "h")}`,
        remarque: reservation.remarque
      })
    ]);

    // Envoi WhatsApp (séparé, ne bloque pas en cas d'échec)
    const texte = encodeURIComponent(
      `🐶 Nouvelle réservation pour ${reservation.nom_chien}\n` +
      `👤 Propriétaire : ${reservation.nom_proprietaire}\n` +
      `📧 Email : ${reservation.email}\n` +
      `📅 Arrivée : ${formatDateFR(reservation.date_arrivee)} à ${reservation.heure_arrivee.replace(":", "h")}\n` +
      `📅 Départ : ${formatDateFR(reservation.date_depart)} à ${reservation.heure_depart.replace(":", "h")}\n` +
      `📝 Remarque : ${reservation.remarque}`
    );
    try {
      await fetch(`https://api.callmebot.com/whatsapp.php?phone=33627363788&text=${texte}&apikey=1089744`, { mode: "no-cors" });
    } catch(e) {
      console.log("WhatsApp non envoyé :", e);
    }

    showPopup(`Votre réservation a bien été enregistrée.<br><br>
      Arrivée : <strong>${formatDateFR(reservation.date_arrivee)} à ${reservation.heure_arrivee.replace(":", "h")}</strong><br>
      Départ : <strong>${formatDateFR(reservation.date_depart)} à ${reservation.heure_depart.replace(":", "h")}</strong>`);

    formReservation.reset();
    dateArrivee.value = todayStr;
    dateDepart.value = todayStr;
    updateNomChiens();
    updateHorairesArrivee();
    updateHorairesDepart();

  } catch(err) {
    console.log("Erreur complète :", err);
    const message = err?.message
      || err?.error_description
      || err?.details
      || err?.hint
      || JSON.stringify(err);
    showPopup("Erreur : " + message);
  } finally {
    btnSubmit.disabled = false; // ← toujours réactivé, succès ou erreur
  }
});   // fin du addEventListener submit
}     // fin du if (formReservation)
});  // fin du DOMContentLoaded
