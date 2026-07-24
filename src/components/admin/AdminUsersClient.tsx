"use client";

import { useState } from "react";
import { Shield, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  users: any[];
}

export default function AdminUsersClient({ users: initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`Change role to ${newRole}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers(users.map((u) => u._id === userId ? { ...u, role: newRole } : u));
      }
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5 pt-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Users</h1>
        <p className="text-gray-500 text-sm mt-0.5">{users.length} registered accounts</p>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user._id}
            className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.04]"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-none"
              style={{
                background: user.role === "admin" ? "rgba(229,9,20,0.15)" : "rgba(255,255,255,0.06)",
                border: user.role === "admin" ? "1px solid rgba(229,9,20,0.3)" : "1px solid rgba(255,255,255,0.08)",
                color: user.role === "admin" ? "#e50914" : "#9ca3af",
              }}
            >
              {user.nickname?.[0]?.toUpperCase() ?? "?"}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-white text-sm font-semibold leading-tight">{user.nickname}</p>
                {user.role === "admin" && (
                  <span
                    className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(229,9,20,0.15)", color: "#e50914", border: "1px solid rgba(229,9,20,0.25)" }}
                  >
                    Admin
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-[11px] truncate">{user.email}</p>
              <p className="text-gray-700 text-[10px] flex items-center gap-1 mt-0.5">
                <Calendar className="w-2.5 h-2.5 flex-none" />
                {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>

            {/* Role toggle */}
            <button
              onClick={() => toggleRole(user._id, user.role)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition flex-none",
                user.role === "admin"
                  ? "text-red-400 hover:bg-red-500/15"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
              style={
                user.role === "admin"
                  ? { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              <Shield className="w-3 h-3 flex-none" />
              <span className="hidden sm:inline">
                {user.role === "admin" ? "Revoke" : "Make Admin"}
              </span>
            </button>
          </div>
        ))}

        {users.length === 0 && (
          <div className="text-center py-16 text-gray-600 text-sm">No users yet</div>
        )}
      </div>
    </div>
  );
}
