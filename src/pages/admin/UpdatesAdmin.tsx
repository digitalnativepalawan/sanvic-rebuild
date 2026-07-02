import { useState } from "react";
import type { LocalUpdate, UpdateCategory, UpdateSeverity } from "@/types";
import { updatesStore } from "@/services/placesService";
import { AdminSection, RowActions, StatusDot, FormButtons } from "./AdminShell";
import { Field, TextInput, TextArea, Select, Toggle } from "./fields";
import { timeAgo } from "@/lib/utils";

const CATEGORIES: { value: UpdateCategory; label: string }[] = [
  { value: "beach", label: "Beach conditions" },
  { value: "sunset", label: "Sunset" },
  { value: "food", label: "Food" },
  { value: "travel", label: "Roads & travel" },
  { value: "island-hopping", label: "Island hopping" },
  { value: "event", label: "Event" },
  { value: "weather", label: "Weather" },
  { value: "tip", label: "Local tip" },
];

const SEVERITIES: { value: UpdateSeverity; label: string }[] = [
  { value: "info", label: "Info" },
  { value: "good", label: "Good" },
  { value: "watch", label: "Watch" },
  { value: "alert", label: "Alert" },
];

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time; store ISO strings.
const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : undefined);

function UpdateForm({
  draft,
  commit,
  cancel,
}: {
  draft: LocalUpdate;
  commit: (u: LocalUpdate) => void;
  cancel: () => void;
}) {
  const [u, setU] = useState<LocalUpdate>(draft);
  const set = <K extends keyof LocalUpdate>(key: K, value: LocalUpdate[K]) =>
    setU((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        commit(u);
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <Field label="Title" className="sm:col-span-2">
        <TextInput value={u.title} onChange={(e) => set("title", e.target.value)} required />
      </Field>
      <Field label="Body" className="sm:col-span-2">
        <TextArea value={u.body} onChange={(e) => set("body", e.target.value)} required />
      </Field>
      <Field label="Category">
        <Select
          value={u.category}
          onChange={(e) => set("category", e.target.value as UpdateCategory)}
          options={CATEGORIES}
        />
      </Field>
      <Field label="Severity">
        <Select
          value={u.severity}
          onChange={(e) => set("severity", e.target.value as UpdateSeverity)}
          options={SEVERITIES}
        />
      </Field>
      <Field label="Location / barangay">
        <TextInput
          value={u.location ?? ""}
          onChange={(e) => set("location", e.target.value || undefined)}
        />
      </Field>
      <Field label="Source">
        <TextInput value={u.source} onChange={(e) => set("source", e.target.value)} />
      </Field>
      <Field label="Image URL">
        <TextInput
          value={u.imageUrl ?? ""}
          onChange={(e) => set("imageUrl", e.target.value || undefined)}
          placeholder="/images/… or https://…"
        />
      </Field>
      <Field label="Valid from">
        <TextInput
          type="datetime-local"
          value={toLocalInput(u.validFrom)}
          onChange={(e) => set("validFrom", fromLocalInput(e.target.value))}
        />
      </Field>
      <Field label="Valid until">
        <TextInput
          type="datetime-local"
          value={toLocalInput(u.validUntil)}
          onChange={(e) => set("validUntil", fromLocalInput(e.target.value))}
        />
      </Field>
      <div className="sm:col-span-2">
        <Toggle checked={u.isActive} onChange={(v) => set("isActive", v)} label="Active" />
      </div>
      <div className="sm:col-span-2">
        <FormButtons onCancel={cancel} />
      </div>
    </form>
  );
}

export function UpdatesAdmin() {
  return (
    <AdminSection
      store={updatesStore}
      title="Pulse — local updates"
      addLabel="Add update"
      makeNew={() => ({
        id: crypto.randomUUID(),
        title: "",
        body: "",
        category: "tip" as UpdateCategory,
        severity: "info" as UpdateSeverity,
        source: "SANVIC conditions desk",
        isActive: true,
        createdAt: new Date().toISOString(),
      })}
      renderRow={(u, edit) => {
        const expired = u.validUntil ? new Date(u.validUntil).getTime() < Date.now() : false;
        return (
          <div className="flex flex-wrap items-center gap-2">
            <StatusDot active={u.isActive && !expired} />
            <span className="min-w-0 flex-1 truncate">
              <span className="font-medium text-mist-100">{u.title || "(untitled)"}</span>
              <span className="ml-2 text-xs text-mist-400">
                {u.category} · {u.severity} · {timeAgo(u.createdAt)}
                {expired && <span className="text-sand-300"> · expired</span>}
              </span>
            </span>
            <RowActions
              onEdit={edit}
              active={u.isActive}
              onToggleActive={() => void updatesStore.upsert({ ...u, isActive: !u.isActive })}
              onDelete={() => {
                if (confirm(`Delete update "${u.title}"?`)) void updatesStore.remove(u.id);
              }}
            />
          </div>
        );
      }}
      renderForm={(draft, commit, cancel) => (
        <UpdateForm draft={draft} commit={commit} cancel={cancel} />
      )}
    />
  );
}
