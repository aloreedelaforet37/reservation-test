// supabase/functions/admin-planning/index.ts
//
// Cette fonction tourne côté serveur Supabase. C'est la SEULE
// partie du système qui utilise la service_role key — celle-ci
// n'est jamais envoyée au navigateur.
//
// Déploiement : supabase functions deploy admin-planning
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis
// automatiquement par Supabase, pas besoin de les configurer)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // remplacez par votre domaine GitHub Pages pour plus de sécurité
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Client "public" pour vérifier QUI appelle (via son token de session)
  const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Session invalide' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Client "admin", avec la service_role key — jamais exposé au navigateur
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Vérifie que la personne connectée est bien vous (est_admin = true)
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('est_admin')
    .eq('user_id', user.id)
    .single();

  if (!client?.est_admin) {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { rangeStart, rangeEnd } = await req.json();

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select(`
      id, date_debut, date_fin, heure_arrivee, heure_depart, statut,
      client:clients ( nom ),
      reservation_dogs (
        prix, montant_regle,
        dog:dogs ( nom, sexe )
      )
    `)
    .lte('date_debut', rangeEnd)
    .gte('date_fin', rangeStart);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
