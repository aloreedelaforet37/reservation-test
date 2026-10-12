// config.js : propre à CE projet, ne jamais copier d'un projet à l'autre
window.APP_CONFIG = {
  SUPABASE_URL: 'https://usatdvopaaxrxjiqhgju.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYXRkdm9wYWF4cnhqaXFoZ2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjUzNDUsImV4cCI6MjA3NTEwMTM0NX0.D52GPw5yZUJWN1oZD_sop7F7nU9WZLM5OMof1TI3IMc',
  AUTH_OPTIONS: {
    persistSession: false,
    autoRefreshToken: false
  },
  NOTIF_TELEGRAM: false,   // ← à ajouter ici (true = envoi activé, false = coupé)
  NOTIF_EMAIL: false
};
