// script.js

// --- Supabase ---
const SUPABASE_URL = 'https://usatdvopaaxrxjiqhgju.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYXRkdm9wYWF4cnhqaXFoZ2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUzNDUsImV4cCI6MjA3NTEwMTM0NX0.D52GPw5yZUJWN1oZD_sop7F7nU9WZLM5OMof1TI3IMc';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- EmailJS ---
if (typeof emailjs !== "undefined") emailjs.init("t6YY80T3DDql9uy32");

// --- Popup global ---
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

// --- Form submission handler partagé ---
async function submitForm(form, table, formatDataCallback, emailCallback) {
  const formData = new FormData(form);
  const data = formatDataCallback(formData);

  try {
    const { error } = await supabaseClient.from(table).insert([data]);
    if (error) throw error;

    if (emailCallback) emailCallback(data);

    showPopup("Votre formulaire a bien été enregistré !");
    form.reset();
  } catch (err) {
    showPopup("Erreur lors de l'enregistrement : " + (err.message || err));
  }
}

// --- DOMContentLoaded ---
window.addEventListener('DOMContentLoaded', () => {

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
    let contenu = `<strong>Périodes de fermeture :</strong><br>`;
    periodesFermees.forEach(p => {
      const options = { day: "numeric", month: "long", year: "numeric" };
      let debut = new Date(p.debut).toLocaleDateString("fr-FR", options).replace(/^1 /,"1er ");
      let fin = new Date(p.fin).toLocaleDateString("fr-FR", options).replace(/^1 /,"1er ");
      contenu += `Du ${debut} au ${fin}<br>`;
    });
    encartFermeture.innerHTML = contenu;
  }

  // -------------------------------
  // --- Formulaire Demande Formulaire
  // -------------------------------
  const demandeFormulaireForm = document.getElementById("demandeFormulaireForm");
  if (demandeFormulaireForm) {
    demandeFormulaireForm.addEventListener("submit", (e) => {
      e.preventDefault();

      submitForm(
        demandeFormulaireForm,
        "demande_formulaire",
        (formData) => ({
          date_soumission: new Date().toISOString(),
          proprietaire: formData.get("proprietaire"),
          email: formData.get("email"),
          nom_animal: formData.get("nom_animal"),
          transfere: false
        })
      );
    });
  }

  // -------------------------------
  // --- Formulaire Réservation
  // -------------------------------
  const formReservation = document.getElementById("reservationForm");
  const nomsChiensContainer = document.getElementById("nomsChiensContainer");

  if (formReservation) {
    const dateArrivee = document.getElementById("dateArrivee");
    const dateDepart = document.getElementById("dateDepart");
    const heureArrivee = document.getElementById("heureArrivee");
    const heureDepart = document.getElementById("heureDepart");
    const nbChienInput = formReservation.querySelector('input[name="nb_chien"]');

    // --- Gestion dynamique noms chiens ---
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

    // --- Préselection aujourd'hui ---
    const todayStr = new Date().toISOString().split("T")[0];
    dateArrivee.value = todayStr;
    dateDepart.value = todayStr;
    dateArrivee.min = todayStr;
    dateDepart.min = todayStr;

    // --- Submit réservation ---
    formReservation.addEventListener("submit", (e) => {
      e.preventDefault();

      submitForm(
        formReservation,
        "reservations",
        (formData) => {
          const nbChiens = parseInt(formData.get("nb_chien")) || 1;
          const noms = [];
          for (let i = 1; i <= nbChiens; i++) noms.push(formData.get(`nom_chien_input_${i}`));

          // Formattage nom chiens
          let nom_chien = "";
          if (noms.length === 1) nom_chien = noms[0];
          else if (noms.length === 2) nom_chien = noms.join(" et ");
          else {
            const last = noms.pop();
            nom_chien = noms.join(", ") + " et " + last;
          }

          return {
            nom_proprietaire: formData.get("nom_proprietaire"),
            email: formData.get("email"),
            nb_chien: nbChiens,
            nom_chien: nom_chien,
            date_arrivee: formData.get("date_arrivee"),
            heure_arrivee: formData.get("heure_arrivee"),
            date_depart: formData.get("date_depart"),
            heure_depart: formData.get("heure_depart"),
            remarque: formData.get("remarque")
          };
        },
        (reservation) => {
          // --- EmailJS ---
          if (typeof emailjs !== "undefined") {
            emailjs.send("service_22ypgkl","template_i2nke5k",{
              to_email: reservation.email,
              from_name: "Isabelle - Pension À l'Orée de la Forêt",
              from_email: "a.l.oree.de.la.foret.37@gmail.com",
              subject: "Votre réservation a bien été enregistrée",
              nom: reservation.nom_proprietaire,
              nomChiens: reservation.nom_chien,
              date_arrivee: `Du ${reservation.date_arrivee} à ${reservation.heure_arrivee.replace(":", "h")}`,
              date_depart: `Au ${reservation.date_depart} à ${reservation.heure_depart.replace(":", "h")}`
            })
            .catch(err => console.error("Erreur EmailJS :", err));
          }
        }
      );

      updateNomChiens(); // Réinitialisation des champs
    });
  }
});
