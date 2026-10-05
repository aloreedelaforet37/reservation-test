// config.js : propre à CE projet, ne jamais copier d'un projet à l'autre
window.APP_CONFIG = {
  SUPABASE_URL: 'https://eugfinnwotdhdtjuywew.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Z2Zpbm53b3RkaGR0anV5d2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzg4MDIsImV4cCI6MjEwNjE1NDgwMn0.Kg0JLyVjp2NCe0BF8MKQxx5Rz8ZfxkaIDE3y50jZUQs',
  AUTH_OPTIONS: {
    persistSession: false,
    autoRefreshToken: false
  },
  NOTIF_TELEGRAM: false   // ← à ajouter ici (true = envoi activé, false = coupé)
};