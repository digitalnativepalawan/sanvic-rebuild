import type { WeatherSnapshot } from "@/types";

// Live weather from Open-Meteo (no API key). Falls back to a seasonal
// default so the app never depends on the network to render.

const SAN_VICENTE = { lat: 10.53, lng: 119.28 };

const FALLBACK: WeatherSnapshot = {
  tempC: 29,
  condition: "clear",
  label: "Typically warm and clear",
  windKmh: 10,
  sunset: "18:05",
  isLive: false,
};

function describe(code: number): { condition: WeatherSnapshot["condition"]; label: string } {
  if (code === 0) return { condition: "clear", label: "Clear skies" };
  if (code <= 2) return { condition: "clear", label: "Mostly sunny" };
  if (code === 3) return { condition: "cloudy", label: "Overcast" };
  if (code <= 48) return { condition: "cloudy", label: "Hazy" };
  if (code <= 67) return { condition: "rain", label: "Rain showers" };
  if (code <= 82) return { condition: "rain", label: "Passing showers" };
  return { condition: "rain", label: "Stormy" };
}

let cache: { at: number; snapshot: WeatherSnapshot } | null = null;

export async function getWeather(): Promise<WeatherSnapshot> {
  if (cache && Date.now() - cache.at < 15 * 60_000) return cache.snapshot;
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${SAN_VICENTE.lat}&longitude=${SAN_VICENTE.lng}` +
      `&current=temperature_2m,weather_code,wind_speed_10m&daily=sunset&forecast_days=1&timezone=Asia%2FManila`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`weather ${res.status}`);
    const json = await res.json();
    const { condition, label } = describe(json.current?.weather_code ?? 0);
    const sunsetIso: string | undefined = json.daily?.sunset?.[0];
    const snapshot: WeatherSnapshot = {
      tempC: Math.round(json.current?.temperature_2m ?? FALLBACK.tempC),
      condition,
      label,
      windKmh: Math.round(json.current?.wind_speed_10m ?? 10),
      sunset: sunsetIso ? sunsetIso.slice(11, 16) : FALLBACK.sunset,
      isLive: true,
    };
    cache = { at: Date.now(), snapshot };
    return snapshot;
  } catch {
    return FALLBACK;
  }
}
