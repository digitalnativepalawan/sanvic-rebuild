import type { LocalUpdate } from "@/types";

// Seed content for Pulse (Local Updates). Intentional, product-demo-quality
// signals — not fake social posts. Mirrors the `local_updates` table.
// Dates are generated relative to "now" so the demo always feels current.

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

export const LOCAL_UPDATES: LocalUpdate[] = [
  {
    id: "u-longbeach-conditions",
    title: "Long Beach: calm and clear",
    body: "Gentle water on the central stretch this morning, light onshore breeze after lunch. Good swimming until mid-afternoon; the New Agutaya section is quietest.",
    category: "beach",
    location: "Long Beach",
    severity: "good",
    source: "SANVIC conditions desk",
    createdAt: hoursAgo(2),
    validUntil: hoursFromNow(10),
  },
  {
    id: "u-sunset-window",
    title: "Tonight's sunset window",
    body: "Sun drops around 6:05pm with a mostly open western horizon. Best positions: anywhere on Long Beach, or Bato ni Ningning if you leave Poblacion by 4:45pm.",
    category: "sunset",
    location: "West coast",
    severity: "info",
    source: "SANVIC conditions desk",
    createdAt: hoursAgo(3),
    validUntil: hoursFromNow(8),
  },
  {
    id: "u-island-hopping-status",
    title: "Island hopping: boats running",
    body: "Port Barton tours departing normally. Morning departures recommended — afternoon chop has been picking up near German Island this week. Bring cash for environmental fees.",
    category: "island-hopping",
    location: "Port Barton",
    severity: "good",
    source: "Boat operators' association",
    createdAt: hoursAgo(5),
    validUntil: hoursFromNow(20),
    imageUrl: "/images/island-boats-aerial.jpg",
  },
  {
    id: "u-road-update",
    title: "Poblacion–Port Barton road: clear",
    body: "The inland road is dry and passable end to end. Vans running on schedule, about 1h20 door to door. Last van back to Poblacion leaves Port Barton at 4pm.",
    category: "travel",
    location: "San Vicente–Port Barton road",
    severity: "info",
    source: "Transport terminal",
    createdAt: hoursAgo(8),
    validUntil: hoursFromNow(30),
  },
  {
    id: "u-market-tip",
    title: "Food tip: tuna panga at the market grills",
    body: "Boats came in heavy with tuna this week — the market grill stalls have panga (jaw) at local prices through the weekend. Lunch crowd clears it by 1pm.",
    category: "food",
    location: "Poblacion market",
    severity: "good",
    source: "Local contributor",
    createdAt: hoursAgo(22),
    validUntil: hoursFromNow(60),
    imageUrl: "/images/street-food-skewers.jpg",
  },
  {
    id: "u-quiet-note",
    title: "Quiet right now: Alimanguan stretch",
    body: "The northern beaches are near-empty on weekdays this month. If you want the sand to yourself, this is the window before the holiday season starts.",
    category: "tip",
    location: "Alimanguan",
    severity: "info",
    source: "SANVIC conditions desk",
    createdAt: hoursAgo(30),
  },
  {
    id: "u-pamuayan-flow",
    title: "Pamuayan Falls flowing well",
    body: "This week's evening rain has the falls at their best flow of the month. Trail is a little slick in two spots — wear grippy footwear.",
    category: "tip",
    location: "Pamuayan",
    severity: "good",
    source: "Local guides",
    createdAt: hoursAgo(40),
    imageUrl: "/images/kayak-lagoon.jpg",
  },
  {
    id: "u-fiesta-heads-up",
    title: "Heads up: barangay fiesta preparations",
    body: "New Agutaya starts fiesta preparations next week — expect evening music near the barangay hall and busier eateries. Great time to try lechon if your trip overlaps.",
    category: "event",
    location: "New Agutaya",
    severity: "info",
    source: "Barangay bulletin",
    createdAt: hoursAgo(50),
  },
];
