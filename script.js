window.addEventListener('DOMContentLoaded', () => {
  // --- Supabase & EmailJS ---
  const SUPABASE_URL = 'https://usatdvopaaxrxjiqhgju.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYXRkdm9wYWF4cnhqaXFoZ2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUzNDUsImV4cCI6MjA3NTEwMTM0NX0.D52GPw5yZUJWN1oZD_sop7F7nU9WZLM5OMof1TI3IMc';
  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
    let contenu="";
    periodesFermees.forEach(p=>{
      const options={ day:"numeric", month:"long" };
      let debut=new Date(p.debut).toLocaleDateString("fr-FR",options).replace(/^1 /,"1er ");
      let fin=new Date(p.fin).toLocaleDateString("fr-FR",options).replace(/^1 /,"1er ");
      contenu += `Du ${debut} au ${fin}<br>`;
    });
    encartFermeture.innerHTML = contenu;
  }
  afficherEncartFermeture();

  // --- Noms chiens dynamiques ---
  const nbChienInput = document.querySelector('input[name="nb_chien"]');
  const nomsChiensContainer = document.getElementById("nomsChiensContainer");
  function updateNomsChiens() {
    let nb=parseInt(nbChienInput.value)||1;
    if(nb<1) nb=1;
    nbChienInput.value=nb;
    nomsChiensContainer.innerHTML="";
    for(let i=1;i<=nb;i++){
      const label=document.createElement("label");
      label.textContent= nb===1?"Nom du chien":`Nom du chien ${i}`;
      const input=document.createElement("input");
      input.type="text"; input.name=`nom_chien_input_${i}`; input.required=true;
      nomsChiensContainer.appendChild(label); nomsChiensContainer.appendChild(input);
    }
  }
  nbChienInput.addEventListener("input", updateNomsChiens);
  updateNomsChiens();

  // --- Dates & heures simplifiées ---
  const dateArriveeInput=document.getElementById("dateArrivee");
  const dateDepartInput=document.getElementById("dateDepart");
  const heureArriveeSelect=document.getElementById("heureArrivee");
  const heureDepartSelect=document.getElementById("heureDepart");
  const todayStr = new Date().toISOString().split("T")[0];
  dateArriveeInput.value=todayStr; dateDepartInput.value=todayStr;
  dateArriveeInput.min=todayStr; dateDepartInput.min=todayStr;

  const horaires = {
    arrivee: { /* même que ton code */ },
    depart: { /* même que ton code */ }
  };

  function parseTime(dateStr,timeStr){ /* ... */ }
  function generateCreneaux(dateStr,plages){ /* ... */ }
  function getDayType(dateStr){ /* ... */ }
  function updateHeures(){ /* ... */ }

  dateArriveeInput.addEventListener("change", ()=>{ /* ... */ });
  dateDepartInput.addEventListener("change", updateHeures);
  heureArriveeSelect.addEventListener("change", updateHeures);
  updateHeures();

  // --- Popup & format date ---
  function formatDateFrancais(dateStr, heureStr){ /* ... */ }
  function showPopup(message){ /* ... */ }

  // --- Soumission formulaire ---
  const form=document.getElementById("reservationForm");
  form.addEventListener("submit", async e=>{
    e.preventDefault();
    const formData=new FormData(form);
    const reservation={ /* ... */ };
    for(let i=1;i<=reservation.nb_chien;i++) reservation.nom_chien.push(formData.get(`nom_chien_input_${i}`));
    reservation.nom_chien=reservation.nom_chien.join(",");

    try{
      const {error}=await supabaseClient.from("reservations").insert([reservation]);
      if(error){ alert("Erreur en base : "+error.message); return; }
    } catch(err){ alert("Erreur en base : "+(err.message||err)); return; }

    const messageHtml=`Votre réservation a été enregistrée avec succès<br>
    du <strong>${formatDateFrancais(reservation.date_arrivee,reservation.heure_arrivee)}</strong><br>
    au <strong>${formatDateFrancais(reservation.date_depart,reservation.heure_depart)}</strong>
    <br>Nous vous tiendrons informé(e) dès que possible de la disponibilité.`;
    showPopup(messageHtml);

    const emailParams = { /* ... */ };
    try{ await emailjs.send("service_22ypgkl","template_i2nke5k",emailParams); } 
    catch(err){ alert("Erreur lors de l'envoi du mail : " + (err.text||err)); }

    form.reset(); dateArriveeInput.value=todayStr; dateDepartInput.value=todayStr;
    updateNomsChiens(); updateHeures();
  });
});
