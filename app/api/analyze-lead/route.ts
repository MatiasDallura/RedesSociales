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
      analysis: analyzeLeadLocally(parsed.data)
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
            campaign: parsed.data.campaign
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
      analysis: analyzeLeadLocally(parsed.data)
    });
  }
}
