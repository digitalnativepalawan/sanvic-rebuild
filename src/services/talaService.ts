import type { Place, TalaResponse, WeatherSnapshot } from "@/types";
import { getPlacesSync } from "@/services/placesService";
import { getTodayRecommendations } from "@/services/recommendationEngine";
import { getTimeOfDay, formatTravelTime } from "@/lib/utils";

// Tala — SANVIC's intelligence layer.
//
// The UI only ever calls `askTala()`, which delegates to a TalaProvider.
// Today that provider is a local, data-aware rules engine over the place
// catalogue + recommendation engine. Swapping in a real model later (a
// Supabase Edge Function calling an LLM, with the catalogue as context) means
// implementing this one interface — no UI changes.

export interface TalaContext {
  weather?: WeatherSnapshot;
}

export interface TalaProvider {
  ask(query: string, context: TalaContext): Promise<TalaResponse>;
}

export const TALA_SUGGESTIONS = [
  "Where should I watch sunset tonight?",
  "Best beach this afternoon?",
  "Where can I eat after swimming?",
  "Quiet place to work today",
  "What should I do if it rains?",
  "Plan a slow day near Poblacion",
];

type Intent = {
  match: RegExp;
  respond: (query: string, ctx: TalaContext) => TalaResponse;
};

const places = () => getPlacesSync();
const bySlug = (slug: string): Place | undefined => places().find((p) => p.slug === slug);
const byCategory = (cat: Place["category"]) => places().filter((p) => p.category === cat);

function placeLine(p: Place): string {
  const travel = formatTravelTime(p.travelMinutesFromPoblacion, p.travelNote);
  return travel ? `${p.shortReason} (${travel}.)` : p.shortReason;
}

const INTENTS: Intent[] = [
  {
    match: /sunset|golden hour|dusk/i,
    respond: (_q, ctx) => {
      const beach = bySlug("long-beach")!;
      const view = bySlug("bato-ni-ningning")!;
      const sunset = ctx.weather?.sunset ?? "around 6pm";
      return {
        message:
          `Tonight the sun sets ${ctx.weather?.sunset ? `at ${sunset}` : sunset}. Long Beach faces due west, so anywhere on the sand gives you a clean horizon. ` +
          `If you want it from above, Bato ni Ningning turns the whole coastline gold — leave Poblacion by 4:45pm and bring a light for the way down.`,
        places: [beach, view],
        mapFocus: beach.slug,
        suggestions: ["Where can I eat after sunset?", "Is the viewpoint hard to reach?"],
      };
    },
  },
  {
    match: /rain|storm|bad weather|wet/i,
    respond: () => {
      const cafe = bySlug("poblacion-cafe-corner")!;
      const falls = bySlug("pamuayan-falls")!;
      const market = bySlug("poblacion-market-eateries")!;
      return {
        message:
          "Coastal rain here usually passes within a few hours, so think in windows. While it falls: a café in Poblacion or hot food under the market roof. " +
          "Once it eases, Pamuayan Falls is actually at its best — light rain feeds the flow. Skip boat trips until the sea settles.",
        places: [cafe, market, falls],
        mapFocus: cafe.slug,
        suggestions: ["Quiet place to work today", "Best beach tomorrow morning?"],
      };
    },
  },
  {
    match: /work|laptop|wifi|remote|call|meeting/i,
    respond: () => {
      const town = bySlug("poblacion-cafe-corner")!;
      const pb = bySlug("port-barton-garden-cafes")!;
      return {
        message:
          "Two honest options. Poblacion Café Corner has the town's steadiest signal, espresso, and outlets — best for calls. " +
          "In Port Barton, the garden cafés a street back from the beach are shadier and calmer, but power can flicker, so save often and swim at lunch.",
        places: [town, pb],
        mapFocus: town.slug,
        suggestions: ["Good food near Poblacion?", "Best beach for after work?"],
      };
    },
  },
  {
    match: /eat|food|restaurant|hungry|dinner|lunch|breakfast|kinilaw|seafood/i,
    respond: (q) => {
      const afterSwim = /swim|beach|after/i.test(q);
      const grill = bySlug("long-beach-grill-row")!;
      const market = bySlug("poblacion-market-eateries")!;
      const jamba = bySlug("jambalaya-cafe")!;
      return {
        message: afterSwim
          ? "Stay in your sandals: Long Beach Grill Row is right on the sand — kinilaw and grilled squid made to order. " +
            "If you're on the Port Barton side, Jambalaya Café is the dependable beachfront kitchen after a swim or a tour."
          : "For the real thing, eat where the fishermen do: the market eateries in Poblacion grill the morning's catch at local prices — go before 1pm. " +
            "For a beachfront table, Long Beach Grill Row at golden hour is the move.",
        places: afterSwim ? [grill, jamba] : [market, grill, jamba],
        mapFocus: afterSwim ? grill.slug : market.slug,
        suggestions: ["Best sunset spot tonight?", "Food tips in Port Barton?"],
      };
    },
  },
  {
    match: /island|boat|hop|snorkel|turtle|tour/i,
    respond: () => {
      const german = bySlug("german-island")!;
      const inalad = bySlug("inaladelan-island")!;
      const boayan = bySlug("boayan-island")!;
      return {
        message:
          "Island hopping runs from Port Barton: German Island for the turtle reef, Inaladelan for hammocks and the easiest picnic day, plus a sandbar stop if the tide cooperates. " +
          "Book morning departures — the water is calmest before noon. For the remote option, Boayan needs an arranged boat and a calm-sea day, so plan it two days out.",
        places: [german, inalad, boayan],
        mapFocus: german.slug,
        suggestions: ["Where do I book boats?", "What should I pack for the islands?"],
      };
    },
  },
  {
    match: /quiet|empty|alone|crowd|peace|secret/i,
    respond: () => {
      const alim = bySlug("alimanguan-beach")!;
      const white = bySlug("white-beach-port-barton")!;
      return {
        message:
          "For genuine solitude, head north: the Alimanguan stretch is near-empty on weekdays — wide sand, fishing boats, nobody selling anything. " +
          "Closer to Port Barton, White Beach is a 15-minute walk from the village and most people never make it.",
        places: [alim, white],
        mapFocus: alim.slug,
        suggestions: ["Quiet place to work today", "Best sunset spot tonight?"],
      };
    },
  },
  {
    match: /stay|sleep|hotel|resort|hostel|accommodation|book/i,
    respond: () => {
      const gardens = bySlug("long-beach-garden-stays")!;
      const bay = bySlug("port-barton-bayfront-stays")!;
      return {
        message:
          "Pick your rhythm. Long Beach garden stays: cottages, hammocks, and real silence with the 14-km beach out front — best for couples and slow travelers. " +
          "Port Barton bayfront: steps from the boats and the food — best if tours and a bit of social energy are the plan. Book ahead December to April.",
        places: [gardens, bay],
        mapFocus: gardens.slug,
        suggestions: ["What's the vibe in Port Barton?", "Best beach near my stay?"],
      };
    },
  },
  {
    match: /waterfall|falls|fresh ?water|hike|jungle/i,
    respond: () => {
      const pam = bySlug("pamuayan-falls")!;
      const baguio = bySlug("little-baguio-falls")!;
      return {
        message:
          "Two freshwater escapes: Pamuayan Falls near Port Barton — short forest walk, cold plunge pool, best after light rain. " +
          "Little Baguio Falls on the inland Poblacion side is the quieter, tiered one. Grippy sandals for both.",
        places: [pam, baguio],
        mapFocus: pam.slug,
        suggestions: ["What should I do if it rains?", "Easy trip from Poblacion?"],
      };
    },
  },
  {
    match: /slow day|relax|chill|easy|poblacion|plan.*day|itinerary/i,
    respond: () => {
      const market = bySlug("poblacion-market-eateries")!;
      const beach = bySlug("long-beach")!;
      const grill = bySlug("long-beach-grill-row")!;
      return {
        message:
          "A slow day near Poblacion: market breakfast where the fishermen eat, then the quiet New Agutaya stretch of Long Beach for a swim and a long walk. " +
          "Nap through peak heat, then take a beachfront table at the Grill Row for kinilaw as the sun drops. Save all three and it becomes your plan in Trip.",
        places: [market, beach, grill],
        mapFocus: beach.slug,
        suggestions: ["Best sunset spot tonight?", "Add a viewpoint to my day"],
      };
    },
  },
  {
    match: /beach/i,
    respond: (_q, ctx) => {
      const time = getTimeOfDay();
      const recs = getTodayRecommendations(time, ctx.weather, 5);
      const beachRec = recs.find((r) => r.place.category === "beaches");
      const long = bySlug("long-beach")!;
      const pick = beachRec?.place ?? long;
      const others = byCategory("beaches").filter((p) => p.id !== pick.id).slice(0, 2);
      return {
        message: `Right now: ${pick.name}. ${beachRec?.reason ?? placeLine(pick)} ${
          others.length
            ? `Also worth knowing: ${others.map((p) => p.name).join(" and ")}.`
            : ""
        }`,
        places: [pick, ...others],
        mapFocus: pick.slug,
        suggestions: ["Where can I eat after swimming?", "Quietest beach around?"],
      };
    },
  },
  {
    match: /hello|^hi\b|hey|kumusta|mabuhay/i,
    respond: () => ({
      message:
        "Mabuhay — I'm Tala, your San Vicente guide. I know the beaches, boats, food, falls, and what's good right now. Ask me anything, or try one of these.",
      places: [],
      suggestions: TALA_SUGGESTIONS.slice(0, 4),
    }),
  },
];

class LocalTalaProvider implements TalaProvider {
  async ask(query: string, context: TalaContext): Promise<TalaResponse> {
    // Small delay so responses feel considered rather than canned.
    await new Promise((r) => setTimeout(r, 350));

    for (const intent of INTENTS) {
      if (intent.match.test(query)) return intent.respond(query, context);
    }

    // Direct place-name lookup before giving up.
    const named = places().find((p) => query.toLowerCase().includes(p.name.toLowerCase()));
    if (named) {
      return {
        message: `${named.name} — ${named.description} ${named.bestTime ? `Best time: ${named.bestTime.toLowerCase()}.` : ""}`,
        places: [named],
        mapFocus: named.slug,
        suggestions: ["How do I get there?", "What's nearby?"],
      };
    }

    const time = getTimeOfDay();
    const recs = getTodayRecommendations(time, context.weather, 3);
    return {
      message:
        "I'm not sure about that one yet — my knowledge covers San Vicente's beaches, islands, food, stays, falls, and work spots. Here's what I'd point you to right now:",
      places: recs.map((r) => r.place),
      suggestions: TALA_SUGGESTIONS.slice(0, 3),
    };
  }
}

let provider: TalaProvider = new LocalTalaProvider();

/** Future: swap in a Supabase Edge Function / LLM-backed provider. */
export function setTalaProvider(p: TalaProvider): void {
  provider = p;
}

export function askTala(query: string, context: TalaContext = {}): Promise<TalaResponse> {
  return provider.ask(query, context);
}
