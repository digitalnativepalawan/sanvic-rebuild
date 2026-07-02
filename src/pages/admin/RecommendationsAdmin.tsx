import { useState } from "react";
import type { Recommendation, RecommendationContext } from "@/types";
import { recommendationsStore } from "@/services/recommendationEngine";
import { placesStore } from "@/services/placesService";
import { AdminSection, RowActions, StatusDot, FormButtons, useStore } from "./AdminShell";
import { Field, TextInput, TextArea, Select, Toggle } from "./fields";

// Curates the Today screen: which places get featured, with what copy, in
// which context (time of day / weather / audience), and in what order.

const CONTEXTS: { value: RecommendationContext; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "midday", label: "Midday" },
  { value: "afternoon", label: "Afternoon" },
  { value: "sunset", label: "Sunset" },
  { value: "evening", label: "Evening" },
  { value: "rainy", label: "Rainy weather" },
  { value: "any", label: "Any time" },
];

const WEATHER = [
  { value: "any", label: "Any weather" },
  { value: "clear", label: "Clear" },
  { value: "cloudy", label: "Cloudy" },
  { value: "rain", label: "Rain" },
];

const AUDIENCES = [
  { value: "any", label: "Everyone" },
  { value: "solo", label: "Solo" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
  { value: "nomad", label: "Nomad" },
];

function RecommendationForm({
  draft,
  commit,
  cancel,
}: {
  draft: Recommendation;
  commit: (r: Recommendation) => void;
  cancel: () => void;
}) {
  const [r, setR] = useState<Recommendation>(draft);
  const places = useStore(placesStore);
  const set = <K extends keyof Recommendation>(key: K, value: Recommendation[K]) =>
    setR((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        commit(r);
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <Field label="Place" className="sm:col-span-2">
        <Select
          value={r.placeId}
          onChange={(e) => set("placeId", e.target.value)}
          options={places.map((p) => ({ value: p.id, label: `${p.name} (${p.category})` }))}
        />
      </Field>
      <Field label="Card title" className="sm:col-span-2">
        <TextInput
          value={r.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Best sunset spot tonight"
          required
        />
      </Field>
      <Field label="Reason (why now)" className="sm:col-span-2">
        <TextArea value={r.reason} onChange={(e) => set("reason", e.target.value)} required />
      </Field>
      <Field label="Context (when this shows)">
        <Select
          value={r.contextType}
          onChange={(e) => set("contextType", e.target.value as RecommendationContext)}
          options={CONTEXTS}
        />
      </Field>
      <Field label="Weather condition">
        <Select
          value={r.weatherCondition ?? "any"}
          onChange={(e) =>
            set("weatherCondition", e.target.value as Recommendation["weatherCondition"])
          }
          options={WEATHER}
        />
      </Field>
      <Field label="Audience">
        <Select
          value={r.audience ?? "any"}
          onChange={(e) => set("audience", e.target.value as Recommendation["audience"])}
          options={AUDIENCES}
        />
      </Field>
      <Field label="Priority (lower shows first)">
        <TextInput
          type="number"
          min="1"
          value={r.priority}
          onChange={(e) => set("priority", Number(e.target.value))}
        />
      </Field>
      <div className="sm:col-span-2">
        <Toggle checked={r.isActive} onChange={(v) => set("isActive", v)} label="Active" />
      </div>
      <div className="sm:col-span-2">
        <FormButtons onCancel={cancel} />
      </div>
    </form>
  );
}

export function RecommendationsAdmin() {
  const places = useStore(placesStore);
  const placeName = (id: string) => places.find((p) => p.id === id)?.name ?? "(missing place)";

  return (
    <AdminSection
      store={recommendationsStore}
      title="Today recommendations"
      addLabel="Add recommendation"
      makeNew={() => ({
        id: crypto.randomUUID(),
        placeId: placesStore.getAll()[0]?.id ?? "",
        contextType: "any" as RecommendationContext,
        title: "",
        reason: "",
        priority: 5,
        weatherCondition: "any" as const,
        audience: "any" as const,
        isActive: true,
      })}
      renderRow={(r, edit) => (
        <div className="flex flex-wrap items-center gap-2">
          <StatusDot active={r.isActive} />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium text-mist-100">{r.title || "(untitled)"}</span>
            <span className="ml-2 text-xs text-mist-400">
              {placeName(r.placeId)} · {r.contextType} · p{r.priority}
            </span>
          </span>
          <RowActions
            onEdit={edit}
            active={r.isActive}
            onToggleActive={() =>
              void recommendationsStore.upsert({ ...r, isActive: !r.isActive })
            }
            onDelete={() => {
              if (confirm(`Delete recommendation "${r.title}"?`))
                void recommendationsStore.remove(r.id);
            }}
          />
        </div>
      )}
      renderForm={(draft, commit, cancel) => (
        <RecommendationForm draft={draft} commit={commit} cancel={cancel} />
      )}
    />
  );
}
