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
  businessProfile?: {
    offer?: string | null;
    target_audience?: string | null;
    ideal_customer?: string | null;
    target_locations?: string[];
    target_industries?: string[];
    good_lead_signals?: string[];
    bad_lead_signals?: string[];
    outreach_goal?: string | null;
    tone?: string | null;
  } | null;
}): LeadAnalysis {
  const bio = `${input.name ?? ""} ${input.bio ?? ""}`.toLowerCase();
  const campaign = input.campaign;
  const businessProfile = input.businessProfile;
  const keywords = campaign?.keywords ?? [];
  const hashtags = campaign?.hashtags ?? [];
  const detected = keywords.filter((keyword) => bio.includes(keyword.toLowerCase()));
  const relatedHashtags = hashtags.filter((tag) => bio.includes(tag.toLowerCase().replace("#", "")));
  const nicheMatch = campaign?.niche ? bio.includes(campaign.niche.toLowerCase()) : false;
  const locationMatch = campaign?.location && input.location ? input.location.toLowerCase().includes(campaign.location.toLowerCase()) : false;
  const industryMatches = (businessProfile?.target_industries ?? []).filter((industry) => bio.includes(industry.toLowerCase()));
  const goodSignalMatches = (businessProfile?.good_lead_signals ?? []).filter((signal) => bio.includes(signal.toLowerCase()));
  const badSignalMatches = (businessProfile?.bad_lead_signals ?? []).filter((signal) => bio.includes(signal.toLowerCase()));
  const audienceMatch = businessProfile?.target_audience ? bio.includes(businessProfile.target_audience.toLowerCase()) : false;

  const score = clampScore(
    35 +
      detected.length * 11 +
      relatedHashtags.length * 8 +
      industryMatches.length * 8 +
      goodSignalMatches.length * 10 +
      (nicheMatch ? 16 : 0) +
      (locationMatch ? 8 : 0) +
      (audienceMatch ? 8 : 0) -
      badSignalMatches.length * 14
  );
  const category = categoryForScore(score);
  const positives = [...detected, ...industryMatches, ...goodSignalMatches].slice(0, 4);

  return {
    relevance_score: score,
    fit_reason:
      positives.length > 0
        ? `Coincide con ${positives.join(", ")} según campaña e ICP; requiere validación manual antes de contactar.`
        : badSignalMatches.length > 0
          ? `Tiene señales negativas para el ICP: ${badSignalMatches.slice(0, 3).join(", ")}.`
          : "Tiene relación parcial con la campaña, pero faltan señales claras del ICP en la bio.",
    approach_suggestion:
      score >= 70
        ? businessProfile?.tone
          ? `Revisar publicaciones recientes y acercarse con tono ${businessProfile.tone.toLowerCase()} basado en una observación específica.`
          : "Revisar publicaciones recientes y abrir con una observación específica sobre su contenido."
        : "Revisar manualmente si el perfil tiene actividad y encaje antes de guardar.",
    category,
    keywords_detected: detected,
    hashtags_related: relatedHashtags
  };
}
