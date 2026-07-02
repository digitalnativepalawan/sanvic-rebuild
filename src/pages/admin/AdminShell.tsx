import { useState, type ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { Plus, RotateCcw } from "lucide-react";
import type { ContentStore } from "@/services/contentService";
import { cn } from "@/lib/utils";

// Generic list + editor scaffolding shared by all admin tabs: renders the
// store's rows, an add button, a per-tab "reset to seed", and hosts the
// entity form when a row is being edited.

export function useStore<T extends { id: string }>(store: ContentStore<T>): T[] {
  return useSyncExternalStore(store.subscribe, store.getAll);
}

export function AdminSection<T extends { id: string }>({
  store,
  title,
  addLabel,
  renderRow,
  renderForm,
  makeNew,
}: {
  store: ContentStore<T>;
  title: string;
  addLabel: string;
  renderRow: (item: T, edit: () => void) => ReactNode;
  renderForm: (draft: T, commit: (item: T) => void, cancel: () => void) => ReactNode;
  makeNew: () => T;
}) {
  const items = useStore(store);
  const [editing, setEditing] = useState<T | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const commit = async (item: T) => {
    setEditing(null);
    const warning = await store.upsert(item);
    setNotice(warning);
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-mist-100">{title}</h2>
        <span className="text-xs text-mist-500">{items.length} rows</span>
        <div className="ml-auto flex gap-2">
          {store.hasLocalEdits() && (
            <button
              onClick={() => {
                if (confirm("Discard all local edits in this section and restore seed content?"))
                  store.resetToSeed();
              }}
              className="chip border border-white/10 bg-white/5 text-mist-400 hover:text-mist-100"
            >
              <RotateCcw size={13} />
              Reset to seed
            </button>
          )}
          <button
            onClick={() => setEditing(makeNew())}
            className="chip border border-tide-400/30 bg-tide-500/15 text-tide-300 hover:bg-tide-500/25"
          >
            <Plus size={13} />
            {addLabel}
          </button>
        </div>
      </div>

      {notice && (
        <p className="rounded-lg border border-sand-300/30 bg-sand-300/10 px-3 py-2 text-xs text-sand-200">
          {notice}
        </p>
      )}

      {editing && (
        <div className="glass rounded-2xl border-tide-400/20 p-4">
          {renderForm(editing, commit, () => setEditing(null))}
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="glass rounded-xl px-3.5 py-2.5">
            {renderRow(item, () => setEditing(item))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function RowActions({
  onEdit,
  active,
  onToggleActive,
  onDelete,
}: {
  onEdit: () => void;
  active: boolean;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        onClick={onEdit}
        className="chip border border-white/10 bg-white/5 text-mist-300 hover:text-mist-100"
      >
        Edit
      </button>
      <button
        onClick={onToggleActive}
        className={cn(
          "chip border",
          active
            ? "border-white/10 bg-white/5 text-mist-400 hover:text-mist-100"
            : "border-tide-400/30 bg-tide-500/10 text-tide-300",
        )}
      >
        {active ? "Deactivate" : "Activate"}
      </button>
      <button
        onClick={onDelete}
        className="chip border border-rose-400/20 bg-rose-500/5 text-rose-300/80 hover:bg-rose-500/15 hover:text-rose-300"
      >
        Delete
      </button>
    </div>
  );
}

export function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        active ? "bg-tide-400" : "bg-white/20",
      )}
      title={active ? "Active" : "Inactive"}
    />
  );
}

export function FormButtons({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex gap-2 pt-1">
      <button
        type="submit"
        className="chip border border-tide-400/40 bg-tide-500/20 px-5 text-tide-300 hover:bg-tide-500/30"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="chip border border-white/10 bg-white/5 text-mist-400 hover:text-mist-100"
      >
        Cancel
      </button>
    </div>
  );
}
