import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeLeadLocally, inferPlatform } from "@/lib/local-analysis";
import type { LeadAnalysis, Platform } from "@/lib/types";

const schema = z.object({
  campaign: z.object({
    id: z.string(),
    name: z.string(),
    platform: z.enum(["LinkedIn", "Facebook", "Instagram"]),
    niche: z.string(),
    location: z.string().nullable().optional(),
    keywords: z.array(z.string()).default([]),
    hashtags: z.array(z.string()).default([]),
    target_profile_type: z.string().nullable().optional()
  }),
  businessProfile: z
    .object({
      business_name: z.string().nullable().optional(),
      offer: z.string().nullable().optional(),
      target_audience: z.string().nullable().optional(),
      ideal_customer: z.string().nullable().optional(),
      target_locations: z.array(z.string()).default([]),
      target_industries: z.array(z.string()).default([]),
      good_lead_signals: z.array(z.string()).default([]),
      bad_lead_signals: z.array(z.string()).default([]),
      approximate_ticket: z.string().nullable().optional(),
      outreach_goal: z.string().nullable().optional(),
      tone: z.string().nullable().optional(),
      notes: z.string().nullable().optional()
    })
    .nullable()
    .optional(),
  limit: z.number().min(1).max(25).default(10)
});

type SearchResult = {
  name: string;
  url: string;
  snippet: string;
};

function siteForPlatform(platform: Platform) {
  if (platform === "LinkedIn") return "site:linkedin.com/in OR site:linkedin.com/company";
  if (platform === "Facebook") return "site:facebook.com";
  return "site:instagram.com";
}

function buildQuery(campaign: z.infer<typeof schema>["campaign"]) {
  const terms = [
    siteForPlatform(campaign.platform),
    `"${campaign.niche}"`,
    campaign.location ? `"${campaign.location}"` : "",
    campaign.target_profile_type ? `"${campaign.target_profile_type}"` : "",
    ...campaign.keywords.slice(0, 5).map((keyword) => `"${keyword}"`),
    ...campaign.hashtags.slice(0, 4)
  ].filter(Boolean);

  return terms.join(" ");
}

function platformUrlAllowed(url: string, platform: Platform) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (platform === "LinkedIn") return hostname.endsWith("linkedin.com");
    if (platform === "Facebook") return hostname.endsWith("facebook.com") || hostname.endsWith("fb.com");
    return hostname.endsWith("instagram.com");
  } catch {
    return false;
  }
}

function cleanTitle(title: string) {
  return title
    .replace(/\s*\|\s*LinkedIn.*$/i, "")
    .replace(/\s*-\s*Instagram.*$/i, "")
    .replace(/\s*\|\s*Facebook.*$/i, "")
    .trim();
}

async function analyzeWithAi(input: {
  name: string;
  snippet: string;
  location?: string | null;
  campaign: z.infer<typeof schema>["campaign"];
  businessProfile?: z.infer<typeof schema>["businessProfile"];
  origin: string;
}): Promise<LeadAnalysis> {
  try {
    const response = await fetch(`${input.origin}/api/analyze-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        bio: input.snippet,
        location: input.location,
        campaign: input.campaign,
        businessProfile: input.businessProfile
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.analysis) return result.analysis;
    }
  } catch {
    // Fall back to deterministic local scoring below.
  }

  return analyzeLeadLocally({
    name: input.name,
    bio: input.snippet,
    location: input.location,
    campaign: input.campaign,
    businessProfile: input.businessProfile
  });
}

async function searchSearxng(query: string, limit: number): Promise<SearchResult[]> {
  const endpoint = process.env.SEARXNG_BASE_URL;

  if (!endpoint) return [];

  const url = new URL("/search", endpoint.endsWith("/") ? endpoint : `${endpoint}/`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("categories", "general");
  url.searchParams.set("safesearch", "1");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Search provider returned ${response.status}`);
  }

  const data = await response.json();
  return (data.results ?? []).map((item: { title?: string; url?: string; content?: string }) => ({
    name: item.title ?? "Perfil sin nombre",
    url: item.url ?? "",
    snippet: item.content ?? ""
  }));
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { campaign, businessProfile, limit } = parsed.data;
  const query = buildQuery(campaign);
  const origin = new URL(request.url).origin;

  try {
    const rawResults = await searchSearxng(query, limit * 2);
    const unique = new Map<string, SearchResult>();

    rawResults
      .filter((result) => result.url && platformUrlAllowed(result.url, campaign.platform))
      .forEach((result) => unique.set(result.url, result));

    const analyzed = await Promise.all(
      Array.from(unique.values())
        .slice(0, limit)
        .map(async (result) => {
          const name = cleanTitle(result.name);
          const analysis = await analyzeWithAi({
            name,
            snippet: result.snippet,
            location: campaign.location,
            campaign,
            businessProfile,
            origin
          });

          return {
            name,
            platform: inferPlatform(result.url, campaign.platform),
            url: result.url,
            bio: result.snippet || null,
            location: campaign.location || null,
            niche: campaign.niche,
            keywords_detected: analysis.keywords_detected ?? [],
            hashtags_related: analysis.hashtags_related ?? [],
            relevance_score: Math.max(0, Math.min(100, Number(analysis.relevance_score ?? 0))),
            fit_reason: analysis.fit_reason ?? null,
            approach_suggestion: analysis.approach_suggestion ?? null,
            category: analysis.category ?? null
          };
        })
    );

    return NextResponse.json({
      source: process.env.SEARXNG_BASE_URL ? "searxng" : "manual-query",
      query,
      results: analyzed
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "manual-query",
        query,
        results: [],
        error: error instanceof Error ? error.message : "Search failed"
      },
      { status: 200 }
    );
  }
}
