import type { LeadAnalysis, LeadCategory, Platform } from "@/lib/types";

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function categoryForScore(score: number): LeadCategory {
  if (score >= 85) return "Alta prioridad";
  if (score >= 70) return "Buen encaje";
  if (score >= 50) return "Nutricion";
  if (score >= 30) return "Baja prioridad";
  return "No encaja";
}

export function inferPlatform(url: string, fallback: Platform): Platform {
  const value = url.toLowerCase();
  if (value.includes("linkedin.com")) return "LinkedIn";
  if (value.includes("facebook.com") || value.includes("fb.com")) return "Facebook";
  if (value.includes("instagram.com")) return "Instagram";
  return fallback;
}

export function analyzeLeadLocally(input: {
  bio?: string | null;
  name?: string;
  location?: string | null;
  campaign?: {
    niche?: string;
    location?: string | null;
    keywords?: string[];
    hashtags?: string[];
    target_profile_type?: string | null;
  } | null;
}): LeadAnalysis {
  const bio = `${input.name ?? ""} ${input.bio ?? ""}`.toLowerCase();
  const campaign = input.campaign;
  const keywords = campaign?.keywords ?? [];
  const hashtags = campaign?.hashtags ?? [];
  const detected = keywords.filter((keyword) => bio.includes(keyword.toLowerCase()));
  const relatedHashtags = hashtags.filter((tag) => bio.includes(tag.toLowerCase().replace("#", "")));
  const nicheMatch = campaign?.niche ? bio.includes(campaign.niche.toLowerCase()) : false;
  const locationMatch = campaign?.location && input.location ? input.location.toLowerCase().includes(campaign.location.toLowerCase()) : false;

  const score = clampScore(35 + detected.length * 13 + relatedHashtags.length * 10 + (nicheMatch ? 18 : 0) + (locationMatch ? 10 : 0));
  const category = categoryForScore(score);

  return {
    relevance_score: score,
    fit_reason:
      detected.length > 0
        ? `Coincide con ${detected.slice(0, 3).join(", ")} y requiere validación manual antes de seguir o contactar.`
        : "Tiene relación parcial con la campaña, pero faltan señales claras en la bio.",
    approach_suggestion:
      score >= 70
        ? "Revisar publicaciones recientes y abrir con una observación específica sobre su contenido."
        : "Revisar manualmente si el perfil tiene actividad y encaje antes de guardar.",
    category,
    keywords_detected: detected,
    hashtags_related: relatedHashtags
  };
}
