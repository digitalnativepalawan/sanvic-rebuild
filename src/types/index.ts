// Domain types. These mirror the Supabase schema in supabase/migrations —
// keep the two in sync so switching from seed data to live data is a
// service-layer change only.

export type PlaceCategory =
  | "beaches"
  | "islands"
  | "food"
  | "stays"
  | "nature"
  | "culture"
  | "work"
  | "events";

export type PriceLevel = 1 | 2 | 3 | 4;

export interface Place {
  id: string;
  name: string;
  slug: string;
  category: PlaceCategory;
  description: string;
  shortReason: string;
  latitude: number;
  longitude: number;
  barangay: string;
  address?: string;
  imageUrl?: string;
  gallery?: string[];
  rating?: number;
  priceLevel?: PriceLevel;
  bestTime?: string;
  bestSeason?: string;
  /** Minutes by road/boat from Poblacion. Undefined = it IS Poblacion / n.a. */
  travelMinutesFromPoblacion?: number;
  /** How you get there when it isn't a simple road trip, e.g. "by boat from Port Barton" */
  travelNote?: string;
  /** External booking / contact link for stays, tours, restaurants. */
  bookingUrl?: string;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
}

export interface Barangay {
  id: string;
  name: string;
  slug: string;
  description?: string;
  /** Label anchor point on the map. */
  latitude: number;
  longitude: number;
  labelVisible: boolean;
  sortOrder: number;
  isActive: boolean;
}

export type RecommendationContext =
  | "morning"
  | "midday"
  | "afternoon"
  | "sunset"
  | "evening"
  | "rainy"
  | "any";

export interface Recommendation {
  id: string;
  placeId: string;
  contextType: RecommendationContext;
  title: string;
  reason: string;
  priority: number;
  weatherCondition?: "clear" | "cloudy" | "rain" | "any";
  audience?: "solo" | "couple" | "family" | "nomad" | "any";
  isActive: boolean;
}

export type UpdateCategory =
  | "beach"
  | "sunset"
  | "food"
  | "travel"
  | "island-hopping"
  | "event"
  | "weather"
  | "tip";

export type UpdateSeverity = "info" | "good" | "watch" | "alert";

export interface LocalUpdate {
  id: string;
  title: string;
  body: string;
  category: UpdateCategory;
  location?: string;
  severity: UpdateSeverity;
  source: string;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
  imageUrl?: string;
}

export type TripDay = "today" | "tomorrow" | "later";

export interface TripItem {
  id: string;
  placeId: string;
  day: TripDay;
  sortOrder: number;
  note?: string;
  plannedTime?: string;
  createdAt: string;
}

export interface WeatherSnapshot {
  tempC: number;
  condition: "clear" | "cloudy" | "rain";
  label: string;
  windKmh: number;
  sunset?: string; // "18:05" local time
  isLive: boolean; // false = seasonal fallback, no network
}

export type TimeOfDay = "morning" | "midday" | "afternoon" | "sunset" | "evening";

/** Structured answer from Tala — message plus things the UI can act on. */
export interface TalaResponse {
  message: string;
  places: Place[];
  /** Slug of a place the map should focus if the user jumps to Explore. */
  mapFocus?: string;
  suggestions?: string[];
}

export interface TalaMessage {
  id: string;
  role: "user" | "tala";
  content: string;
  places?: Place[];
  suggestions?: string[];
  createdAt: string;
}
