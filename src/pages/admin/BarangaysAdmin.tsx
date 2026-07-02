import { useState } from "react";
import type { Barangay } from "@/types";
import { barangaysStore } from "@/services/barangayService";
import { BARANGAY_BOUNDARIES } from "@/data/barangayBoundaries";
import { AdminSection, RowActions, StatusDot, FormButtons } from "./AdminShell";
import { Field, TextInput, TextArea, Toggle } from "./fields";

// Barangay metadata editor: display names, descriptions, label visibility,
// order, active state. Boundary geometry itself ships as PSA-derived GeoJSON
// (src/data/barangayBoundaries.ts) and moves to the barangay_boundaries
// table when higher-resolution polygons are onboarded — this screen prepares
// for that by matching rows to boundary features by name.

function BarangayForm({
  draft,
  commit,
  cancel,
}: {
  draft: Barangay;
  commit: (b: Barangay) => void;
  cancel: () => void;
}) {
  const [b, setB] = useState<Barangay>(draft);
  const set = <K extends keyof Barangay>(key: K, value: Barangay[K]) =>
    setB((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        commit(b);
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <Field label="Display name">
        <TextInput value={b.name} onChange={(e) => set("name", e.target.value)} required />
      </Field>
      <Field label="Slug">
        <TextInput value={b.slug} onChange={(e) => set("slug", e.target.value)} required />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <TextArea
          value={b.description ?? ""}
          onChange={(e) => set("description", e.target.value || undefined)}
        />
      </Field>
      <Field label="Label latitude">
        <TextInput
          type="number"
          step="any"
          value={b.latitude}
          onChange={(e) => set("latitude", Number(e.target.value))}
        />
      </Field>
      <Field label="Label longitude">
        <TextInput
          type="number"
          step="any"
          value={b.longitude}
          onChange={(e) => set("longitude", Number(e.target.value))}
        />
      </Field>
      <Field label="Display order">
        <TextInput
          type="number"
          value={b.sortOrder}
          onChange={(e) => set("sortOrder", Number(e.target.value))}
        />
      </Field>
      <div className="flex items-center gap-5 sm:col-span-2">
        <Toggle
          checked={b.labelVisible}
          onChange={(v) => set("labelVisible", v)}
          label="Show label on map overview"
        />
        <Toggle checked={b.isActive} onChange={(v) => set("isActive", v)} label="Active" />
      </div>
      <div className="sm:col-span-2">
        <FormButtons onCancel={cancel} />
      </div>
    </form>
  );
}

export function BarangaysAdmin() {
  const boundaryNames = new Set(BARANGAY_BOUNDARIES.features.map((f) => f.properties.name));

  return (
    <AdminSection
      store={barangaysStore}
      title="Barangays"
      addLabel="Add barangay"
      makeNew={() => ({
        id: crypto.randomUUID(),
        name: "",
        slug: "",
        latitude: 10.53,
        longitude: 119.28,
        labelVisible: true,
        sortOrder: barangaysStore.getAll().length + 1,
        isActive: true,
      })}
      renderRow={(b, edit) => (
        <div className="flex flex-wrap items-center gap-2">
          <StatusDot active={b.isActive} />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium text-mist-100">{b.name || "(unnamed)"}</span>
            <span className="ml-2 text-xs text-mist-400">
              #{b.sortOrder}
              {!b.labelVisible && " · label hidden"}
              {!boundaryNames.has(b.name) && (
                <span className="text-sand-300"> · no boundary polygon</span>
              )}
            </span>
          </span>
          <RowActions
            onEdit={edit}
            active={b.isActive}
            onToggleActive={() => void barangaysStore.upsert({ ...b, isActive: !b.isActive })}
            onDelete={() => {
              if (confirm(`Delete barangay "${b.name}"? Deactivate is usually safer.`))
                void barangaysStore.remove(b.id);
            }}
          />
        </div>
      )}
      renderForm={(draft, commit, cancel) => (
        <BarangayForm draft={draft} commit={commit} cancel={cancel} />
      )}
    />
  );
}
