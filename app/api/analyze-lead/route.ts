import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeLeadLocally } from "@/lib/local-analysis";

const schema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().nullable().optional(),
  campaign: z
    .object({
      niche: z.string(),
      location: z.string().nullable().optional(),
      keywords: z.array(z.string()).default([]),
      hashtags: z.array(z.string()).default([]),
      target_profile_type: z.string().nullable().optional()
    })
    .nullable()
    .optional(),
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
    .optional()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      source: "local",
      analysis: analyzeLeadLocally({
        ...parsed.data,
        businessProfile: parsed.data.businessProfile
      })
    });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined
    });

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Analyze a social profile for private, manual prospecting. Do not recommend automation, scraping, captcha solving, evasion, or mass actions. Return only valid JSON."
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Score this lead from 0 to 100 and explain why it fits the campaign.",
            required_schema: {
              relevance_score: "number 0-100",
              fit_reason: "short Spanish explanation",
              approach_suggestion: "short Spanish manual outreach suggestion",
              category: "Alta prioridad | Buen encaje | Nutricion | Baja prioridad | No encaja",
              keywords_detected: "array of strings",
              hashtags_related: "array of strings"
            },
            profile: {
              name: parsed.data.name,
              bio: parsed.data.bio,
              location: parsed.data.location
            },
            campaign: parsed.data.campaign,
            business_profile: parsed.data.businessProfile,
            scoring_guidance:
              "Prioritize leads that match both the campaign and the business ICP. Penalize bad lead signals. Do not infer private facts not present in the profile text."
          })
        }
      ]
    });

    const raw = completion.choices[0]?.message.content || "{}";
    const analysis = JSON.parse(raw);
    return NextResponse.json({ source: "ai", analysis });
  } catch {
    return NextResponse.json({
      source: "local",
      analysis: analyzeLeadLocally({
        ...parsed.data,
        businessProfile: parsed.data.businessProfile
      })
    });
  }
}
