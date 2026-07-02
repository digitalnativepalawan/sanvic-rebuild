// Lightweight anonymous session. No login required — a stable per-device id
// lets trips/saves persist locally now and sync to Supabase later
// (saved_places.user_session_id / trips.user_session_id).

const SESSION_KEY = "sanvic.session_id";

export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "ephemeral";
  }
}
