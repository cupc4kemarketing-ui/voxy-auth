"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Trash2, Pencil, Check, X, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SharedConfigWithAuthor } from "@/types/admin";

const MAX_NAME_LEN = 40;

export function ConfigsPanel({ initialConfigs }: { initialConfigs: SharedConfigWithAuthor[] }) {
  const [configs, setConfigs] = useState(initialConfigs);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return configs;
    const q = search.trim().toLowerCase();
    return configs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        c.share_code.toLowerCase().includes(q),
    );
  }, [configs, search]);

  function handleCopy(shareCode: string) {
    navigator.clipboard.writeText(shareCode);
    toast.success("Share code copied to clipboard.");
  }

  function startRename(config: SharedConfigWithAuthor) {
    setEditingId(config.id);
    setDraftName(config.name);
  }

  function cancelRename() {
    setEditingId(null);
    setDraftName("");
  }

  async function saveRename(config: SharedConfigWithAuthor) {
    const name = draftName.trim();
    if (!name) {
      toast.error("Name can't be empty.");
      return;
    }
    if (name === config.name) {
      cancelRename();
      return;
    }
    setPendingId(config.id);
    try {
      const res = await fetch(`/api/admin/configs/${config.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to rename config.");
        return;
      }
      setConfigs((prev) => prev.map((c) => (c.id === config.id ? { ...c, name } : c)));
      toast.success("Config renamed.");
      cancelRename();
    } catch {
      toast.error("Network error.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(config: SharedConfigWithAuthor) {
    setPendingId(config.id);
    try {
      const res = await fetch(`/api/admin/configs/${config.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setConfigs((prev) => prev.filter((c) => c.id !== config.id));
      toast.success("Config deleted.");
    } catch {
      toast.error("Failed to delete config.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card className="p-6">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, author, or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-xs text-muted-foreground">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Author</th>
              <th className="pb-3 font-medium">Code</th>
              <th className="pb-3 font-medium">Published</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {filtered.map((config) => {
                const editing = editingId === config.id;
                const busy = pendingId === config.id;
                return (
                  <motion.tr
                    key={config.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="py-3 pr-4">
                      {editing ? (
                        <Input
                          autoFocus
                          value={draftName}
                          maxLength={MAX_NAME_LEN}
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename(config);
                            if (e.key === "Escape") cancelRename();
                          }}
                          className="h-8 max-w-[220px] text-xs"
                        />
                      ) : (
                        <span className="font-medium text-foreground/90">{config.name}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{config.author}</td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => handleCopy(config.share_code)}
                        className="flex items-center gap-1.5 font-mono text-xs text-foreground/90 hover:text-accent"
                      >
                        {config.share_code}
                        <Copy className="h-3 w-3 shrink-0" />
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(config.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editing ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-success hover:text-success"
                              disabled={busy}
                              onClick={() => saveRename(config)}
                              title="Save"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              disabled={busy}
                              onClick={cancelRename}
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              disabled={busy}
                              onClick={() => startRename(config)}
                              title="Rename"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-danger hover:text-danger"
                              disabled={busy}
                              onClick={() => handleDelete(config)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {configs.length === 0 ? "No configs published yet." : "No configs found."}
          </p>
        )}
      </div>
    </Card>
  );
}
