"use client";

import { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";

interface Props {
  genres: any[];
  onUpdate: (genres: any[]) => void;
}

export default function GenreManager({ genres, onUpdate }: Props) {
  const [newGenre, setNewGenre] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenre.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/admin/genres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGenre.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onUpdate([...genres, data.genre]);
      setNewGenre("");
    } catch { setError("Something went wrong"); }
    finally { setAdding(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this genre?")) return;
    await fetch(`/api/admin/genres/${id}`, { method: "DELETE" });
    onUpdate(genres.filter((g) => g._id !== id));
  };

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Tag className="w-5 h-5 text-sarrows-red" /> Genre Management
      </h2>
      <form onSubmit={add} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newGenre}
          onChange={(e) => setNewGenre(e.target.value)}
          placeholder="New genre name..."
          className="input-field flex-1"
        />
        <button type="submit" disabled={adding} className="btn-primary flex items-center gap-1 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <div className="space-y-2">
        {genres.map((g) => (
          <div key={g._id} className="flex items-center justify-between bg-sarrows-card border border-sarrows-border rounded-lg px-4 py-2.5">
            <span className="text-white text-sm font-medium">{g.name}</span>
            <button onClick={() => remove(g._id)} className="text-gray-500 hover:text-red-400 transition">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {genres.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-8">No genres yet</p>
        )}
      </div>
    </div>
  );
}
