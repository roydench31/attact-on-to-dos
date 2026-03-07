"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

const PRESET_COLORS = [
  "#8b1a1a", // blood
  "#c0622a", // rust
  "#6b7c42", // wings
  "#c9a227", // gold
  "#2a5a8b", // blue
  "#6b2a8b", // purple
  "#6b6b6b", // fog
];

interface TagSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function TagSelector({ selectedIds, onChange }: TagSelectorProps) {
  const { data: tags = [], refetch } = api.tag.getAll.useQuery();
  const createTag = api.tag.create.useMutation({ onSuccess: () => void refetch() });

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[3]!);
  const [showCreate, setShowCreate] = useState(false);

  function toggleTag(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    createTag.mutate(
      { name: newTagName.trim(), color: newTagColor },
      {
        onSuccess: (tag) => {
          onChange([...selectedIds, tag.id]);
          setNewTagName("");
          setShowCreate(false);
        },
      },
    );
  }

  return (
    <div>
      <label className="mb-1 block font-military text-xs tracking-widest text-aot-fog">
        TAGS
      </label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const selected = selectedIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className="flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs transition"
              style={{
                backgroundColor: selected ? tag.color + "33" : "transparent",
                border: `1px solid ${tag.color}`,
                color: selected ? tag.color : "#6b6b6b",
              }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-sm border border-aot-slate px-2 py-0.5 text-xs text-aot-fog transition hover:border-aot-gold hover:text-aot-gold"
        >
          + New Tag
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateTag} className="mt-2 flex items-center gap-2">
          <input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name"
            className="flex-1 border border-aot-slate bg-aot-iron px-2 py-1 text-xs text-aot-bone outline-none focus:border-aot-gold"
          />
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewTagColor(c)}
                className="h-5 w-5 rounded-sm"
                style={{
                  backgroundColor: c,
                  outline: newTagColor === c ? `2px solid ${c}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={createTag.isPending}
            className="bg-aot-wings px-2 py-1 font-military text-xs text-aot-parchment disabled:opacity-50"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
