import type { BusinessProfile, Campaign, DailyActivity, Lead, SocialAccount, UserSettings } from "@/lib/types";

const now = new Date().toISOString();

export const mockSettings: UserSettings = {
  id: "settings-demo",
  user_id: "demo-user",
  default_daily_review_limit: 35,
  ai_model: "gpt-4o-mini",
  notes: "Modo demo hasta conectar Supabase.",
  created_at: now,
  updated_at: now
};

export const mockBusinessProfile: BusinessProfile = {
  id: "business-demo",
  user_id: "demo-user",
  business_name: "Demo Growth Studio",
  offer: "Sistema de prospección y contenido para negocios que venden servicios online.",
  target_audience: "Dueños de negocios, coaches, consultores y founders que necesitan más conversaciones calificadas.",
  ideal_customer: "Perfil activo, con oferta clara, audiencia definida y señales de inversión en crecimiento.",
  target_locations: ["España", "México", "Latinoamérica"],
  target_industries: ["Fitness coaching", "B2B SaaS", "Consultoría", "Agencias"],
  good_lead_signals: ["vende servicios online", "publica contenido", "menciona crecimiento", "tiene oferta clara"],
  bad_lead_signals: ["sin actividad reciente", "perfil personal sin negocio", "solo entretenimiento", "empleado sin decisión"],
  approximate_ticket: "500-3000 USD",
  outreach_goal: "Iniciar conversación manual y validar fit antes de proponer una llamada.",
  tone: "Directo, profesional y consultivo.",
  notes: "Completa este perfil con tu negocio real para mejorar el ranking.",
  created_at: now,
  updated_at: now
};

export const mockCampaigns: Campaign[] = [
  {
    id: "campaign-1",
    user_id: "demo-user",
    name: "Coaches fitness LATAM",
    platform: "Instagram",
    niche: "Fitness coaching",
    location: "Mexico",
    keywords: ["coach", "fitness", "online"],
    hashtags: ["#fitnesscoach", "#vidafit"],
    target_profile_type: "Entrenadores independientes",
    daily_review_limit: 30,
    created_at: now,
    updated_at: now
  },
  {
    id: "campaign-2",
    user_id: "demo-user",
    name: "Founders B2B SaaS",
    platform: "LinkedIn",
    niche: "B2B SaaS",
    location: "Spain",
    keywords: ["founder", "sales", "SaaS"],
    hashtags: ["#saas", "#b2b"],
    target_profile_type: "Fundadores y growth leads",
    daily_review_limit: 25,
    created_at: now,
    updated_at: now
  }
];

export const mockSocialAccounts: SocialAccount[] = [
  {
    id: "account-1",
    user_id: "demo-user",
    name: "Perfil personal LinkedIn",
    platform: "LinkedIn",
    url: "https://www.linkedin.com/",
    notes: "Usar solo para revisión manual.",
    created_at: now,
    updated_at: now
  }
];

export const mockLeads: Lead[] = [
  {
    id: "lead-1",
    user_id: "demo-user",
    campaign_id: "campaign-1",
    name: "Mariana Torres",
    platform: "Instagram",
    url: "https://www.instagram.com/",
    niche: "Fitness coaching",
    location: "Guadalajara, Mexico",
    bio: "Coach fitness online. Ayudo a mujeres ocupadas a entrenar desde casa con planes simples.",
    keywords_detected: ["coach", "online", "entrenar"],
    hashtags_related: ["#fitnesscoach", "#entrenamientoencasa"],
    relevance_score: 91,
    fit_reason: "La bio menciona coaching online y audiencia alineada con la campaña.",
    approach_suggestion: "Comentar una publicacion reciente sobre entrenamiento en casa antes de contactar.",
    category: "Alta prioridad",
    status: "Guardado",
    notes: "Revisar contenido de reels.",
    created_at: now,
    updated_at: now
  },
  {
    id: "lead-2",
    user_id: "demo-user",
    campaign_id: "campaign-2",
    name: "Daniel Ruiz",
    platform: "LinkedIn",
    url: "https://www.linkedin.com/",
    niche: "B2B SaaS",
    location: "Madrid, Spain",
    bio: "Founder at revenue ops SaaS. Building tools for small sales teams.",
    keywords_detected: ["Founder", "SaaS", "sales"],
    hashtags_related: ["#b2b", "#revops"],
    relevance_score: 84,
    fit_reason: "Founder de SaaS B2B con foco en equipos comerciales.",
    approach_suggestion: "Abrir con una observacion concreta sobre revenue operations.",
    category: "Alta prioridad",
    status: "Nuevo",
    notes: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "lead-3",
    user_id: "demo-user",
    campaign_id: "campaign-1",
    name: "Fit Life Studio",
    platform: "Facebook",
    url: "https://www.facebook.com/",
    niche: "Fitness coaching",
    location: "Bogota, Colombia",
    bio: "Centro de entrenamiento presencial con clases grupales.",
    keywords_detected: ["entrenamiento", "clases"],
    hashtags_related: ["#fitness"],
    relevance_score: 52,
    fit_reason: "Relacionado con fitness, pero el perfil parece mas local que online.",
    approach_suggestion: "Revisar manualmente si ofrecen programas remotos.",
    category: "Nutricion",
    status: "Revisado",
    notes: null,
    created_at: now,
    updated_at: now
  }
];

export const mockDailyActivity: DailyActivity = {
  id: "daily-1",
  user_id: "demo-user",
  activity_date: new Date().toISOString().slice(0, 10),
  reviewed_count: 18,
  opened_count: 22,
  followed_manual_count: 5,
  created_at: now,
  updated_at: now
};
