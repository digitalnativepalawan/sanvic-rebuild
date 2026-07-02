import { useState } from "react";
import type { Place, PlaceCategory } from "@/types";
import { placesStore } from "@/services/placesService";
import { CATEGORIES } from "@/data/categories";
import { AdminSection, RowActions, StatusDot, FormButtons } from "./AdminShell";
import { Field, TextInput, TextArea, Select, Toggle } from "./fields";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function PlaceForm({
  draft,
  commit,
  cancel,
}: {
  draft: Place;
  commit: (p: Place) => void;
  cancel: () => void;
}) {
  const [p, setP] = useState<Place>(draft);
  const set = <K extends keyof Place>(key: K, value: Place[K]) =>
    setP((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        commit({ ...p, slug: p.slug || slugify(p.name) });
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <Field label="Name">
        <TextInput value={p.name} onChange={(e) => set("name", e.target.value)} required />
      </Field>
      <Field label="Slug (URL id)">
        <TextInput
          value={p.slug}
          onChange={(e) => set("slug", e.target.value)}
          placeholder={slugify(p.name) || "auto from name"}
        />
      </Field>
      <Field label="Category">
        <Select
          value={p.category}
          onChange={(e) => set("category", e.target.value as PlaceCategory)}
          options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
        />
      </Field>
      <Field label="Barangay">
        <TextInput value={p.barangay} onChange={(e) => set("barangay", e.target.value)} />
      </Field>
      <Field label="Short reason (card copy)" className="sm:col-span-2">
        <TextInput value={p.shortReason} onChange={(e) => set("shortReason", e.target.value)} />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <TextArea value={p.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field label="Latitude">
        <TextInput
          type="number"
          step="any"
          value={p.latitude}
          onChange={(e) => set("latitude", Number(e.target.value))}
          required
        />
      </Field>
      <Field label="Longitude">
        <TextInput
          type="number"
          step="any"
          value={p.longitude}
          onChange={(e) => set("longitude", Number(e.target.value))}
          required
        />
      </Field>
      <Field label="Image URL">
        <TextInput
          value={p.imageUrl ?? ""}
          onChange={(e) => set("imageUrl", e.target.value || undefined)}
          placeholder="/images/… or https://…"
        />
      </Field>
      <Field label="Gallery URLs (comma-separated)">
        <TextInput
          value={p.gallery?.join(", ") ?? ""}
          onChange={(e) =>
            set(
              "gallery",
              e.target.value
                ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                : undefined,
            )
          }
        />
      </Field>
      <Field label="Rating (0–5)">
        <TextInput
          type="number"
          step="0.1"
          min="0"
          max="5"
          value={p.rating ?? ""}
          onChange={(e) =>
            set("rating", e.target.value === "" ? undefined : Number(e.target.value))
          }
        />
      </Field>
      <Field label="Price level (1–4)">
        <TextInput
          type="number"
          min="1"
          max="4"
          value={p.priceLevel ?? ""}
          onChange={(e) =>
            set(
              "priceLevel",
              e.target.value === "" ? undefined : (Number(e.target.value) as Place["priceLevel"]),
            )
          }
        />
      </Field>
      <Field label="Travel time from Poblacion (minutes)">
        <TextInput
          type="number"
          min="0"
          value={p.travelMinutesFromPoblacion ?? ""}
          onChange={(e) =>
            set(
              "travelMinutesFromPoblacion",
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
          placeholder="blank if boat-only"
        />
      </Field>
      <Field label="Travel note (if not a simple road trip)">
        <TextInput
          value={p.travelNote ?? ""}
          onChange={(e) => set("travelNote", e.target.value || undefined)}
          placeholder="e.g. 30–45 min by boat from Port Barton"
        />
      </Field>
      <Field label="Best time">
        <TextInput
          value={p.bestTime ?? ""}
          onChange={(e) => set("bestTime", e.target.value || undefined)}
        />
      </Field>
      <Field label="Best season">
        <TextInput
          value={p.bestSeason ?? ""}
          onChange={(e) => set("bestSeason", e.target.value || undefined)}
        />
      </Field>
      <Field label="Booking / contact URL">
        <TextInput
          value={p.bookingUrl ?? ""}
          onChange={(e) => set("bookingUrl", e.target.value || undefined)}
          placeholder="https://…"
        />
      </Field>
      <Field label="Tags (comma-separated)">
        <TextInput
          value={p.tags.join(", ")}
          onChange={(e) =>
            set("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
          }
        />
      </Field>
      <div className="flex items-center gap-5 sm:col-span-2">
        <Toggle checked={p.isFeatured} onChange={(v) => set("isFeatured", v)} label="Featured" />
        <Toggle checked={p.isActive} onChange={(v) => set("isActive", v)} label="Active" />
      </div>
      <div className="sm:col-span-2">
        <FormButtons onCancel={cancel} />
      </div>
    </form>
  );
}

export function PlacesAdmin() {
  return (
    <AdminSection
      store={placesStore}
      title="Places"
      addLabel="Add place"
      makeNew={() => ({
        id: crypto.randomUUID(),
        name: "",
        slug: "",
        category: "beaches" as PlaceCategory,
        description: "",
        shortReason: "",
        latitude: 10.53,
        longitude: 119.28,
        barangay: "",
        tags: [],
        isFeatured: false,
        isActive: true,
      })}
      renderRow={(p, edit) => (
        <div className="flex flex-wrap items-center gap-2">
          <StatusDot active={p.isActive} />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium text-mist-100">{p.name || "(unnamed)"}</span>
            <span className="ml-2 text-xs text-mist-400">
              {p.category} · {p.barangay}
              {p.isFeatured && " · featured"}
            </span>
          </span>
          <RowActions
            onEdit={edit}
            active={p.isActive}
            onToggleActive={() => void placesStore.upsert({ ...p, isActive: !p.isActive })}
            onDelete={() => {
              if (confirm(`Delete "${p.name}" permanently? Deactivate is usually safer.`))
                void placesStore.remove(p.id);
            }}
          />
        </div>
      )}
      renderForm={(draft, commit, cancel) => (
        <PlaceForm draft={draft} commit={commit} cancel={cancel} />
      )}
    />
  );
}
