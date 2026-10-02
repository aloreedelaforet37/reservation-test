// script.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(reg => reg.update());

  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  });
}
window.addEventListener('DOMContentLoaded', () => {

  // --- Supabase ---
  const SUPABASE_URL = 'https://eugfinnwotdhdtjuywew.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Z2Zpbm53b3RkaGR0anV5d2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzg4MDIsImV4cCI6MjEwNjE1NDgwMn0.Kg0JLyVjp2NCe0BF8MKQxx5Rz8ZfxkaIDE3y50jZUQs';
  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
    persistSession: false,
    autoRefreshToken: false
  }
  });

  // --- EmailJS ---
  if (typeof emailjs !== "undefined") emailjs.init("t6YY80T3DDql9uy32");

  const todayStr = new Date().toISOString().split("T")[0];
  const emailAloree = "a.l.oree.de.la.foret.37@gmail.com";

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

  // Affiche le message d'attente
  function showWaiting() {
  const waiting = document.createElement('div');
  waiting.id = 'waitingPopup';
  waiting.className = 'popup';
  waiting.innerHTML = `
    <div class="popup-content">
      <strong>Enregistrement en cours...</strong><br><br>
      Merci de patienter 🐾
    </div>`;
  document.body.appendChild(waiting);
}

  // Cache le message d'attente
function hideWaiting() {
  const waiting = document.getElementById('waitingPopup');
  if (waiting) waiting.remove();
}

  // --- Email d'alerte période fermée/complète ---
  async function sendAlertEmail(reservation) {
    if (typeof emailjs === "undefined") return;
    try {
      await emailjs.send("service_22ypgkl", "template_r0e2mju", {
        to_email: emailAloree,
        from_name: reservation.nom_proprietaire,
        from_email: emailAloree,
        subject: "Réservation pour " + reservation.nom_chien + " a été enregistrée, mais dans une période complète ou de fermeture",
        nomChiens: reservation.nom_chien,
        date_arrivee: `Du ${formatDateFR(reservation.date_arrivee)} à ${reservation.heure_arrivee.replace(":", "h")}`,
        date_depart: `Au ${formatDateFR(reservation.date_depart)} à ${reservation.heure_depart.replace(":", "h")}`,
        remarque: reservation.remarque
      });
    } catch(e) {
      console.log("Email d'alerte non envoyé :", e);
    }
  }

  // --- WhatsApp d'alerte période fermée/complète ---
  async function sendAlertWhatsApp(reservation) {
    const texte = encodeURIComponent(
      `⚠️ Tentative de réservation sur période fermée/complète\n` +
      `🐶 Chien(s) : ${reservation.nom_chien}\n` +
      `👤 Propriétaire : ${reservation.nom_proprietaire}\n` +
      `📅 Arrivée : ${formatDateFR(reservation.date_arrivee)} à ${reservation.heure_arrivee.replace(":", "h")}\n` +
      `📅 Départ : ${formatDateFR(reservation.date_depart)} à ${reservation.heure_depart.replace(":", "h")}\n` +
      `📝 Remarque : ${reservation.remarque}`
    );
    try {
      await fetch(`https://api.callmebot.com/whatsapp.php?phone=33627363788&text=${texte}&apikey=1089744`, { mode: "no-cors" });
    } catch(e) {
      console.log("WhatsApp d'alerte non envoyé :", e);
    }
  }

  // --- Périodes de fermeture ---
  const periodesFermees = [
    { debut: "2026-10-16", fin: "2026-10-24" },
    { debut: "2026-12-19", fin: "2026-12-27" }
  ];

  const datesCompletes = [
    { debut: "2026-09-25", fin: "2026-10-06" },
    { debut: "2026-10-28", fin: "2026-11-01" }
  ];

  // Dates isolées non disponibles (arrivée ou départ), sans bloquer les séjours qui les traversent
  const datesIndisponibles = [
    "2026-11-11"
  ];

  // Chiens bloqués sur une période donnée, même si la période n'est pas "complète"
  const chiensNonAutorises = [
    { nom: "Doog", debut: "2026-11-01", fin: "2026-11-05" },
    { nom: "Toutatis", debut: "2026-11-01", fin: "2050-12-31" }
  ];

  // Chiens exceptionnellement autorisés sur une période marquée complète
  const chiensAutorises = [
    { nom: "Ma", debut: "2026-09-24", fin: "2026-09-27" }
  ];

  // Chiens exceptionnellement autorisés à réserver au-delà de la limite de 6 mois
  const chiensSansLimiteAvance = ["Ma"]; // ← liste des noms concernés

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

  function isIndisponible(dateStr) {
    return datesIndisponibles.includes(dateStr);
  }

  // --- Fonctions chiens autorisés / non autorisés ---
  function isChienAutorise(nom, debut, fin) {
    return chiensAutorises.some(c =>
      c.nom.toLowerCase() === nom.toLowerCase().trim() &&
      new Date(c.debut) <= new Date(debut) &&
      new Date(c.fin) >= new Date(fin)
    );
  }

  function isChienNonAutoriseSurPeriode(nom, dateArriveeStr, dateDepartStr) {
    const dA = new Date(dateArriveeStr);
    const dD = new Date(dateDepartStr);
    return chiensNonAutorises.some(c => {
      if (c.nom.toLowerCase() !== nom.toLowerCase().trim()) return false;
      const d1 = new Date(c.debut);
      const d2 = new Date(c.fin);
      return dA <= d2 && dD >= d1; // chevauchement
    });
  }

  // Tiens compte de la liste des chiens non bloqué dans la limite des 6 mois
  function isChienSansLimiteAvance(nom) {
  return chiensSansLimiteAvance.some(n => n.toLowerCase() === nom.toLowerCase().trim());
}

  // Remplace isComplet() pour les dates d'arrivée/départ : tient compte des chiens autorisés
  // L'autorisation est comparée à la date demandée, pas à toute la période complète déclarée
  function dateEstCompletePourChiens(dateStr, noms) {
    if (!isComplet(dateStr)) return false;
    return !noms.every(n => isChienAutorise(n, dateStr, dateStr));
  }

  function joinNoms(noms) {
    const copie = [...noms];
    if (copie.length === 0) return "chien inconnu";
    if (copie.length === 1) return copie[0];
    if (copie.length === 2) return copie.join(" et ");
    const last = copie.pop();
    return copie.join(", ") + " et " + last;
  }
  /*
  //*************************************************
  // DEBUT NEW
  function getNomsChiens() {
    return [...document.querySelectorAll("#nomsChiensContainer input:checked")]
      .map(i => i.dataset.nom);
  }
  // FIN NEW
  //*************************************************
  */
  function getNomsChiens(formData) {
    const nb = parseInt(formData.get("nb_chien")) || 1;
    const noms = [];
    for (let i = 1; i <= nb; i++) {
      const n = formData.get(`nom_chien_input_${i}`);
      if (n) noms.push(n.trim());
    }
    return noms;
  }
  /*
  //*************************************************
  // DEBUT NEW
  function getIdsChiens() {
    return [...document.querySelectorAll("#nomsChiensContainer input:checked")]
      .map(i => i.value);
  }
  // FIN NEW
  //*************************************************
  */
function crossesClosure(dateA, dateD, noms) {
  const dA = new Date(dateA);
  const dD = new Date(dateD);

  // Vérif périodes de fermeture
  const traversePeriode = periodesFermees.some(p => {
    const f1 = new Date(p.debut);
    const f2 = new Date(p.fin);
    return dA < f1 && dD > f2;
  });

  // Vérif périodes complètes (sauf si tous les chiens de la réservation sont autorisés sur le séjour demandé)
  const contientDateComplete = datesCompletes.some(p => {
    const d1 = new Date(p.debut);
    const d2 = new Date(p.fin);
    const chevauche = dA <= d2 && dD >= d1;
    if (!chevauche) return false;
    return !noms.every(n => isChienAutorise(n, dateA, dateD));
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
    /*
    //*************************************************
    // DEBUT NEW
    // --- Authentification OTP ---
    const COLONNE_NOM_CHIEN = "nom";   // adapte au nom réel de la colonne dans dogs
    const etapeEmail = document.getElementById("etapeEmail");
    const etapeCode = document.getElementById("etapeCode");
    let clientConnecte = null, chiensClient = [], emailOtp = "", minuteurOtp = null;

    function montrerEtape(etape) {   // "email" | "code" | "form"
      etapeEmail.hidden = etape !== "email";
      etapeCode.hidden = etape !== "code";
      formReservation.hidden = etape !== "form";
    }

    function compteurRenvoi(secondes) {
      clearInterval(minuteurOtp);
      const b = document.getElementById("btnRenvoyer");
      let reste = secondes;
      b.disabled = true;
      b.textContent = `Renvoyer le code (${reste} s)`;
      minuteurOtp = setInterval(() => {
        reste--;
        if (reste <= 0) {
          clearInterval(minuteurOtp);
          b.disabled = false;
          b.textContent = "Renvoyer le code";
        } else b.textContent = `Renvoyer le code (${reste} s)`;
      }, 1000);
    }

    async function envoyerCode() {
      emailOtp = document.getElementById("emailAuth").value.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(emailOtp)) return showPopup("Adresse e-mail invalide.");
      const btn = document.getElementById("btnEnvoyerCode");
      btn.disabled = true;
      const { error } = await supabaseClient.auth.signInWithOtp({
        email: emailOtp, options: { shouldCreateUser: true }
      });
      btn.disabled = false;
      if (error) {
        return showPopup(error.status === 429
          ? "Trop de demandes, réessayez dans une minute."
          : "L'envoi du code a échoué, réessayez dans un instant.");
      }
      document.getElementById("codeOtp").value = "";
      montrerEtape("code");
      compteurRenvoi(60);
    }

    async function verifierCode() {
      const token = document.getElementById("codeOtp").value.replace(/\s/g, "");
      if (token.length < 6) return showPopup("Saisissez le code reçu par e-mail.");
      const { error } = await supabaseClient.auth.verifyOtp({ email: emailOtp, token, type: "email" });
      if (error) return showPopup("Code incorrect ou expiré. Vérifiez-le ou demandez-en un nouveau.");
      await chargerClient();
    }

    async function refuserConnexion(texte) {
      await supabaseClient.auth.signOut();
      montrerEtape("email");
      showPopup(texte);
    }

    async function chargerClient() {
      const { data: c, error } = await supabaseClient.from("clients").select("*").maybeSingle();
      if (error) return refuserConnexion("Impossible de retrouver votre fiche. Contactez-nous directement.");
      if (!c) return refuserConnexion("Aucune fiche client n'est associée à cette adresse. Contactez-nous pour créer votre dossier.");

      const { data: chiens, error: e2 } = await supabaseClient
        .from("dogs").select("*").order(COLONNE_NOM_CHIEN);
      if (e2) return refuserConnexion("Impossible de charger vos chiens. Réessayez.");
      if (!chiens.length) return refuserConnexion("Aucun chien n'est enregistré sur votre fiche. Contactez-nous.");

      clientConnecte = c;
      chiensClient = chiens;
      afficherFormulaire();
    }

    function afficherFormulaire() {
      const nom = clientConnecte.nom_proprietaire
        || [clientConnecte.prenom, clientConnecte.nom].filter(Boolean).join(" ");
      const inputNom = formReservation.elements["nom_proprietaire"];
      inputNom.value = nom;
      inputNom.readOnly = !!nom;                       // modifiable si la fiche n'a pas de nom
      formReservation.elements["email"].value = emailOtp;
      document.getElementById("emailSession").textContent = emailOtp;

      nomsChiensContainer.innerHTML = "";
      chiensClient.forEach(d => {
        const l = document.createElement("label");
        l.className = "chien-choix";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = d.id;
        cb.dataset.nom = d[COLONNE_NOM_CHIEN] || "";
        l.append(cb, document.createTextNode(d[COLONNE_NOM_CHIEN] || "Chien sans nom"));
        nomsChiensContainer.append(l);
      });
      if (chiensClient.length === 1) nomsChiensContainer.querySelector("input").checked = true;
      montrerEtape("form");
    }

    document.getElementById("btnEnvoyerCode").onclick = envoyerCode;
    document.getElementById("emailAuth").onkeydown = e => { if (e.key === "Enter") envoyerCode(); };
    document.getElementById("btnValiderCode").onclick = verifierCode;
    document.getElementById("codeOtp").onkeydown = e => { if (e.key === "Enter") verifierCode(); };
    document.getElementById("btnRenvoyer").onclick = envoyerCode;
    document.getElementById("btnChangerEmail").onclick = () => { clearInterval(minuteurOtp); montrerEtape("email"); };
    document.getElementById("btnDeconnexion").onclick = async () => {
      await supabaseClient.auth.signOut();
      clientConnecte = null;
      montrerEtape("email");
    };

    (async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) { emailOtp = session.user.email; await chargerClient(); }
      else montrerEtape("email");
    })();
  // FIN NEW
  //*************************************************
  */
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

      if (isClosed(dateArrivee.value) || isIndisponible(dateArrivee.value)) {
        heureArrivee.innerHTML = '<option value="" disabled selected>Date non disponible</option>';
        heureArrivee.classList.add("select-indisponible");
        return;
      }

      heureArrivee.classList.remove("select-indisponible");

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

      if (isClosed(dateDepart.value) || isIndisponible(dateDepart.value)) {
        heureDepart.innerHTML = '<option value="" disabled selected>Date non disponible</option>';
        heureDepart.classList.add("select-indisponible");
        return;
      }

      heureDepart.classList.remove("select-indisponible");

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
  showWaiting(); // ← affiche la fenêtre d'attente
  btnSubmit.disabled = true;

  // Réinitialiser les couleurs
  dateArrivee.style.color = "";
  dateDepart.style.color = "";

  const formData = new FormData(formReservation);
  const nomsChiens = getNomsChiens(formData);
  /*
  //*************************************************
  // DEBUT NEW
  if (!nomsChiens.length) {
    hideWaiting();
    btnSubmit.disabled = false;
    return showPopup("Sélectionnez au moins un chien.");
  }
  // FIN NEW
  //*************************************************
  */
 
  let erreur = false;

  // Contrôle des dates
  if (isClosed(dateArrivee.value)) {
    showPopup("La date d'arrivée est sur une période de fermeture, n'hésitez pas à réserver sur une autre période.");
    dateArrivee.style.color = "red";
    dateArrivee.focus();
    erreur = true;
  } else if (isIndisponible(dateArrivee.value)) {
    showPopup("Cette date n'est pas disponible pour une arrivée, merci de choisir une autre date.");
    dateArrivee.style.color = "red";
    dateArrivee.focus();
    erreur = true;
  } else if (dateEstCompletePourChiens(dateArrivee.value, nomsChiens)) {
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
    } else if (isIndisponible(dateDepart.value)) {
      showPopup("Cette date n'est pas disponible pour un départ, merci de choisir une autre date.");
      dateDepart.style.color = "red";
      dateDepart.focus();
      erreur = true;
    } else if (dateEstCompletePourChiens(dateDepart.value, nomsChiens)) {
      showPopup("Nous sommes complets le jour de la date de départ, n'hésitez pas à réserver sur une autre période ou à me contacter.");
      dateDepart.style.color = "red";
      dateDepart.focus();
      erreur = true;
    }
  }

  if (!erreur && crossesClosure(dateArrivee.value, dateDepart.value, nomsChiens)) {
    showPopup("Votre séjour ne peut pas traverser une période de fermeture ou de période complète.");
    dateArrivee.style.color = "red";
    dateDepart.style.color = "red";
    dateArrivee.focus();
    erreur = true;
  }

  // Chien(s) non autorisé(s) sur la période demandée
  if (!erreur) {
    const chienBloque = nomsChiens.some(n =>
      isChienNonAutoriseSurPeriode(n, dateArrivee.value, dateDepart.value)
    );
    if (chienBloque) {
      showPopup("Nous sommes complets sur cette période, n'hésitez pas à réserver sur une autre période ou à me contacter.");
      dateArrivee.style.color = "red";
      dateDepart.style.color = "red";
      dateArrivee.focus();
      erreur = true;
    }
  }

  const dateMax = new Date();
  dateMax.setMonth(dateMax.getMonth() + 6);
  const dateMaxStr = dateMax.toISOString().split("T")[0];

  const tousChiensExemptes = nomsChiens.every(n => isChienSansLimiteAvance(n));

if (!erreur && !tousChiensExemptes && dateArrivee.value > dateMaxStr) {
  showPopup("La réservation n'est pas ouverte plus de 6 mois avant la date souhaitée.");
  dateArrivee.style.color = "red";
  dateArrivee.focus();
  erreur = true;
}

if (!erreur && !tousChiensExemptes && dateDepart.value > dateMaxStr) {
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

  if (erreur) {
    // Construit l'objet reservation pour l'email d'alerte (même structure que le mail admin)
    const reservationAlert = {
      nom_proprietaire: formData.get("nom_proprietaire") || "inconnu",
      nom_chien: joinNoms(nomsChiens),
      date_arrivee: formData.get("date_arrivee") || dateArrivee.value,
      heure_arrivee: formData.get("heure_arrivee") || heureArrivee.value || "00:00",
      date_depart: formData.get("date_depart") || dateDepart.value,
      heure_depart: formData.get("heure_depart") || heureDepart.value || "00:00",
      remarque: formData.get("remarque") || ""
    };
    sendAlertEmail(reservationAlert);
    sendAlertWhatsApp(reservationAlert);

    btnSubmit.disabled = false;
    hideWaiting(); // ← masque la fenêtre d'attente
    return;  
  }

  const reservation = {
    nom_proprietaire: formData.get("nom_proprietaire"),
    email: formData.get("email"),
   //   nb_chien: nomsChiens.length,  // NEW
   nb_chien: parseInt(formData.get("nb_chien")) || 1,
    nom_chien: joinNoms(nomsChiens),
    date_arrivee: formData.get("date_arrivee"),
    heure_arrivee: formData.get("heure_arrivee"),
    date_depart: formData.get("date_depart"),
    heure_depart: formData.get("heure_depart"),
    remarque: formData.get("remarque")
  };
   /*
  //*************************************************
  // DEBUT NEW
  try {
    const { data: resa, error } = await supabaseClient.from("reservations_v2").insert({
      client_id: clientConnecte.id,
      date_debut: reservation.date_arrivee,
      date_fin: reservation.date_depart,
      heure_arrivee: reservation.heure_arrivee,
      heure_depart: reservation.heure_depart,
      remarque: reservation.remarque || null
    }).select("id").single();
    if (error) throw error;

    const { error: errLiaison } = await supabaseClient.from("reservation_dogs")
      .insert(getIdsChiens().map(dog_id => ({ reservation_id: resa.id, dog_id })));
    if (errLiaison) {
      await supabaseClient.from("reservations_v2").delete().eq("id", resa.id);
      throw errLiaison;
    }
      //*************************************************
      // FIN NEW
    */
      try {
    const { error } = await supabaseClient.from("reservations").insert([reservation]);
    if (error) throw error;

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

    // Envoi Google Sheets
    try {
      console.log("Données envoyées :", JSON.stringify(reservation));
      const params = encodeURIComponent(JSON.stringify(reservation));
      await fetch(`https://script.google.com/macros/s/AKfycbwJNCfjlvAnSaa-BX93GtM5wwLRdcdeP9weHQfQbuU4u9_Xbs9PfXJawnm3PZplthKG/exec?data=${params}`, {
        method: "GET",
        mode: "no-cors"
      });
    } catch(e) {
      console.log("Google Sheets non mis à jour :", e);
    }

    showPopup(`Votre réservation a bien été enregistrée.<br><br>
      Arrivée : <strong>${formatDateFR(reservation.date_arrivee)} à ${reservation.heure_arrivee.replace(":", "h")}</strong><br>
      Départ : <strong>${formatDateFR(reservation.date_depart)} à ${reservation.heure_depart.replace(":", "h")}</strong>`);

    formReservation.reset();
    dateArrivee.value = todayStr;
    dateDepart.value = todayStr;
    updateNomChiens();
    // afficherFormulaire();   // NEW
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
    hideWaiting(); // ← masque la fenêtre d'attente
    btnSubmit.disabled = false; // ← toujours réactivé, succès ou erreur
  }
});   // fin du addEventListener submit
}     // fin du if (formReservation)
});  // fin du DOMContentLoaded
