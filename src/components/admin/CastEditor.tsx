"use client";

import { Plus, Trash2, User } from "lucide-react";

export interface CastMember {
  name: string;
  character?: string;
  image?: string;
  order?: number;
}

interface Props {
  cast: CastMember[];
  onChange: (cast: CastMember[]) => void;
}

/** Shared cast (name + photo) editor used by both the Movie and Anime admin forms. */
export default function CastEditor({ cast, onChange }: Props) {
  const update = (i: number, key: keyof CastMember, value: string) => {
    const next = cast.slice();
    next[i] = { ...next[i], [key]: value };
    onChange(next);
  };

  const remove = (i: number) => onChange(cast.filter((_, idx) => idx !== i));

  const add = () => onChange([...cast, { name: "", character: "", image: "" }]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-300">Cast</label>
        <button type="button" onClick={add} className="text-xs text-sarrows-red hover:text-red-400 flex items-center gap-1 font-medium">
          <Plus className="w-3.5 h-3.5" /> Add Cast Member
        </button>
      </div>

      {cast.length === 0 && (
        <p className="text-xs text-gray-600 mb-2">No cast yet. Auto-filled from search, or add manually.</p>
      )}

      <div className="space-y-2">
        {cast.map((c, i) => (
          <div key={i} className="flex items-center gap-2 bg-white/[0.03] border border-sarrows-border rounded-lg p-2">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-none bg-white/5 flex items-center justify-center">
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <input
              type="text"
              value={c.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder="Actor / VA name"
              className="input-field flex-1 py-1.5 text-sm"
            />
            <input
              type="text"
              value={c.character || ""}
              onChange={(e) => update(i, "character", e.target.value)}
              placeholder="Role / character"
              className="input-field flex-1 py-1.5 text-sm"
            />
            <input
              type="url"
              value={c.image || ""}
              onChange={(e) => update(i, "image", e.target.value)}
              placeholder="Photo URL"
              className="input-field flex-1 py-1.5 text-sm"
            />
            <button type="button" onClick={() => remove(i)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition flex-none">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
