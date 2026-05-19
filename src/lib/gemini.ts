const MODEL = 'gemini-3.1-flash-lite';
const BASE   = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface PlaceSuggestion {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  betweenStop: string;       // e.g. "Stop 1 and Stop 2"
  estimatedStayMinutes: number;
}

// ── API key resolution — env variable takes priority ─────────────────────────
export function getGeminiKey(): string {
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim() ?? '';
}

// ── Extract JSON array from Gemini's text (may be wrapped in markdown fences) ─
function extractJSON(text: string): unknown[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (match) return JSON.parse(match[0]);
  return JSON.parse(text);
}

// ── Main API call ─────────────────────────────────────────────────────────────

// Parse "Please retry in X.Xs." from error message
function parseRetryDelay(message: string): number {
  const match = message.match(/retry in ([\d.]+)s/i);
  return match ? Math.ceil(parseFloat(match[1])) * 1000 : 12000;
}

export async function getSuggestions(
  stops: Array<{ name: string; address: string; lat: number; lng: number; stayDuration: number }>,
  country: string,
  apiKey: string,
  _retry = 0,
): Promise<PlaceSuggestion[]> {
  if (!apiKey) throw new Error('Gemini API key is required');
  if (stops.length < 2) throw new Error('At least 2 stops needed for suggestions');

  const stopsText = stops
    .map((s, i) => {
      const h = Math.floor(s.stayDuration / 60);
      const m = s.stayDuration % 60;
      const dur = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
      return `Stop ${i + 1}: ${s.name} (${s.address}) — ${dur} stay`;
    })
    .join('\n');

  const prompt = `You are a local travel expert for ${country}.

A traveler has this optimized route:
${stopsText}

Suggest exactly 3 interesting places they could add to enrich this trip.
Requirements:
- Each place must be physically close to the existing route (minimal detour)
- Mix categories: food, culture, nature, or shopping
- Be specific — real places with accurate coordinates in ${country}

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "name": "Place name",
    "address": "Full street address",
    "lat": 00.000000,
    "lng": 000.000000,
    "description": "1-2 sentences: what makes this place special and the best time to visit",
    "betweenStop": "Stop N and Stop M",
    "estimatedStayMinutes": 60
  }
]`;

  const res = await fetch(`${BASE}?key=${apiKey}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message: string = (err as any)?.error?.message ?? `Gemini API error ${res.status}`;

    // Rate-limit (429) — auto-retry once after the suggested delay
    if (res.status === 429 && _retry < 2) {
      const delay = parseRetryDelay(message);
      await new Promise(r => setTimeout(r, delay));
      return getSuggestions(stops, country, apiKey, _retry + 1);
    }

    throw new Error(message);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  const raw = extractJSON(text) as Array<Record<string, unknown>>;

  return raw
    .map((s, i) => ({
      id:                   `gemini-${Date.now()}-${i}`,
      name:                 String(s.name ?? ''),
      address:              String(s.address ?? ''),
      lat:                  Number(s.lat ?? 0),
      lng:                  Number(s.lng ?? 0),
      description:          String(s.description ?? ''),
      betweenStop:          String(s.betweenStop ?? ''),
      estimatedStayMinutes: Number(s.estimatedStayMinutes ?? 60),
    }))
    .filter(s => s.name && Math.abs(s.lat) > 0.001 && Math.abs(s.lng) > 0.001);
}
