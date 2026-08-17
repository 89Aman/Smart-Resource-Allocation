export const environment = {
  production: false,

  // ── Firebase SDK config (project: sahaay-18eb3) ──────────────
  firebase: {
    projectId: 'sahaay-18eb3',
    appId: '1:193319651907:web:cbee5cdc37caed816362f6',
    storageBucket: 'sahaay-18eb3.firebasestorage.app',
    apiKey: 'AIzaSyABkk7cr5LBBpkN7zd8fIx_P38q3LtAhY4',
    authDomain: 'sahaay-18eb3.firebaseapp.com',
    messagingSenderId: '193319651907',
    measurementId: 'G-X12M3Q4G1Z',
  },

  // ── Firebase Cloud Messaging ─────────────────────────────────
  // Obtain from: Firebase Console → Project Settings → Cloud Messaging
  //              → Web Push certificates → Key pair → Copy
  vapidKey: 'BMOzRqdJ5T4w2JcoDmjrP4juRu14WG6IyH4Qdg0KMuxQ-1KNJYZMLpeAnFcS8W2becXp8aeDOMcn5Co_26NhGeQ',

  // ── Clerk Authentication ────────────────────────────────────
  // From: Clerk Dashboard → API Keys → Publishable key
  clerkPublishableKey: 'pk_test_Y2xhc3NpYy1zbHVnLTkyLmNsZXJrLmFjY291bnRzLmRldiQ',
  clerkDomain: 'https://classic-slug-92.clerk.accounts.dev',

  // ── Vertex AI / Cloud Functions ──────────────────────────────
  functionsRegion: 'us-west1',
  vertexAiProject: 'sahaay-26007',

  // ── Google Maps JS API ───────────────────────────────────────
  // Obtain from: Google Cloud Console → APIs & Services → Credentials
  mapsApiKey: 'AIzaSyDa4UfBq4fjQ8499Efw6wuZbmvLaiFaBKE',

  // ── Supabase Configuration ────────────────────────────────────
  supabase: {
    url: 'https://yduhtnmktudiyjjftjnw.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkdWh0bm1rdHVkaXlqamZ0am53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNTA2NDIsImV4cCI6MjA1NTkyNjY0Mn0.placeholder',
  },
};

