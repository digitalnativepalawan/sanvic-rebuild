import { useEffect, useState } from "react";
import type { WeatherSnapshot } from "@/types";
import { getWeather } from "@/services/weatherService";

export function useWeather(): WeatherSnapshot | undefined {
  const [weather, setWeather] = useState<WeatherSnapshot>();
  useEffect(() => {
    let alive = true;
    getWeather().then((w) => {
      if (alive) setWeather(w);
    });
    return () => {
      alive = false;
    };
  }, []);
  return weather;
}
