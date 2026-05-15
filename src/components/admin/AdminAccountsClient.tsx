"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  Filter,
  ChevronDown,
  Users,
  ExternalLink,
} from "lucide-react";
import type { Account, AccountInsert, Ecosystem, AccountCategory } from "@/lib/database.types";

const ECOSYSTEMS: { value: Ecosystem; label: string; color: string }[] = [
  { value: "ronin", label: "Ronin", color: "bg-sky-400/15 text-sky-400 border-sky-400/20" },
  { value: "immutable", label: "Immutable", color: "bg-purple-400/15 text-purple-400 border-purple-400/20" },
  { value: "abstract", label: "Abstract", color: "bg-emerald-400/15 text-emerald-400 border-emerald-400/20" },
  { value: "other", label: "Other", color: "bg-muted text-muted-foreground border-border" },
];

const CATEGORIES: { value: AccountCategory; label: string; icon: string }[] = [
  { value: "official_game", label: "Official Game", icon: "🎮" },
  { value: "ecosystem", label: "Ecosystem", icon: "🌐" },
  { value: "founder", label: "Founder", icon: "👤" },
  { value: "creator", label: "Creator", icon: "✍️" },
  { value: "analytics", label: "Analytics", icon: "📊" },
  { value: "media", label: "Media", icon: "📰" },
  { value: "guild", label: "Guild", icon: "🏰" },
  { value: "influencer", label: "Influencer", icon: "📣" },
];

const PRESET_ACCOUNTS: Array<{
  username: string;
  display_name: string;
  ecosystem: Ecosystem;
  category: AccountCategory;
  priority: number;
}> = [
  // ── RONIN ──────────────────────────────────────────────────────
  { username: "Ronin_Network",    display_name: "Ronin",                    ecosystem: "ronin", category: "ecosystem",    priority: 10 },
  { username: "SkyMavisHQ",       display_name: "Sky Mavis",                ecosystem: "ronin", category: "ecosystem",    priority: 10 },
  { username: "Jihoz_Axie",       display_name: "Jihoz",                    ecosystem: "ronin", category: "founder",      priority: 10 },
  { username: "trungfinity",      display_name: "trungfinity.ron",          ecosystem: "ronin", category: "founder",      priority: 9  },
  { username: "AxieInfinity",     display_name: "Axie Infinity",            ecosystem: "ronin", category: "official_game",priority: 10 },
  { username: "pixels_online",    display_name: "Pixels",                   ecosystem: "ronin", category: "official_game",priority: 10 },
  { username: "playwildforest",   display_name: "Wild Forest",              ecosystem: "ronin", category: "official_game",priority: 9  },
  { username: "playcambria",      display_name: "Cambria",                  ecosystem: "ronin", category: "official_game",priority: 8  },
  { username: "Moku_HQ",          display_name: "Moku: Grand Arena",        ecosystem: "ronin", category: "official_game",priority: 8  },
  { username: "fableborne",       display_name: "Fableborne",               ecosystem: "ronin", category: "official_game",priority: 8  },
  { username: "ApeironNFT",       display_name: "Apeiron",                  ecosystem: "ronin", category: "official_game",priority: 7  },
  { username: "PixelHeroesMMO",   display_name: "Pixel Heroes Adventure",   ecosystem: "ronin", category: "official_game",priority: 7  },
  { username: "kaidrochronicle",  display_name: "Kaidro",                   ecosystem: "ronin", category: "official_game",priority: 7  },
  { username: "ROL_Genesis",      display_name: "Ragnarok: Monster World",  ecosystem: "ronin", category: "official_game",priority: 7  },
  { username: "LumiterraGame",    display_name: "Lumiterra",                ecosystem: "ronin", category: "official_game",priority: 7  },
  { username: "yellowpantherx",   display_name: "Yellow Panther",           ecosystem: "ronin", category: "creator",      priority: 9  },
  { username: "0xRoosta",         display_name: "0xRoosta",                 ecosystem: "ronin", category: "creator",      priority: 8  },
  { username: "imdrkc",           display_name: "imdrkc",                   ecosystem: "ronin", category: "creator",      priority: 7  },
  { username: "Ryann_AF",         display_name: "Ryann",                    ecosystem: "ronin", category: "creator",      priority: 7  },
  { username: "themlpx",          display_name: "themlpx",                  ecosystem: "ronin", category: "creator",      priority: 7  },
  { username: "nixeniego",        display_name: "nixeniego",                ecosystem: "ronin", category: "creator",      priority: 6  },
  { username: "TheRoninRadio",    display_name: "The Ronin Radio",          ecosystem: "ronin", category: "media",        priority: 8  },

  // ── IMMUTABLE ──────────────────────────────────────────────────
  { username: "Immutable",        display_name: "Immutable",                ecosystem: "immutable", category: "ecosystem",    priority: 10 },
  { username: "0xferg",           display_name: "Robbie Ferguson",          ecosystem: "immutable", category: "founder",      priority: 10 },
  { username: "GodsUnchained",    display_name: "Gods Unchained",           ecosystem: "immutable", category: "official_game",priority: 10 },
  { username: "GuildOfGuardian",  display_name: "Guild of Guardians",       ecosystem: "immutable", category: "official_game",priority: 9  },
  { username: "illuviumio",       display_name: "Illuvium",                 ecosystem: "immutable", category: "official_game",priority: 9  },
  { username: "MightMagicFates",  display_name: "Might & Magic: Fates",     ecosystem: "immutable", category: "official_game",priority: 9  },
  { username: "Olderfall",        display_name: "Olderfall",                ecosystem: "immutable", category: "official_game",priority: 8  },
  { username: "RavenQuestGame",   display_name: "RavenQuest",               ecosystem: "immutable", category: "official_game",priority: 8  },
  { username: "PlayElumia",       display_name: "Legends of Elumia",        ecosystem: "immutable", category: "official_game",priority: 8  },
  { username: "NomSteadGame",     display_name: "NomStead",                 ecosystem: "immutable", category: "official_game",priority: 8  },
  { username: "MedievalEmpires",  display_name: "Medieval Empires",         ecosystem: "immutable", category: "official_game",priority: 7  },
  { username: "blockchaingamer",  display_name: "Blockchain Gamer",         ecosystem: "immutable", category: "creator",      priority: 9  },
  { username: "P2EGamerX",        display_name: "P2E Gamer X",              ecosystem: "immutable", category: "creator",      priority: 8  },
  { username: "ReadyPlayerRich",  display_name: "Ready Player Rich",        ecosystem: "immutable", category: "creator",      priority: 8  },
  { username: "Brycent_",         display_name: "Brycent",                  ecosystem: "immutable", category: "creator",      priority: 8  },

  // ── ABSTRACT ───────────────────────────────────────────────────
  { username: "AbstractChain",    display_name: "Abstract",                 ecosystem: "abstract", category: "ecosystem",    priority: 10 },
  { username: "Abstract_Eco",     display_name: "Abstract Ecosystem",       ecosystem: "abstract", category: "ecosystem",    priority: 10 },
  { username: "LucaNetz",         display_name: "Luca Netz",                ecosystem: "abstract", category: "founder",      priority: 10 },
  { username: "masoncags",        display_name: "Mason (Head of Ecosystem)",ecosystem: "abstract", category: "ecosystem",    priority: 9  },
  { username: "0xCygaar",         display_name: "cygaar",                   ecosystem: "abstract", category: "ecosystem",    priority: 9  },
  { username: "pudgypenguins",    display_name: "Pudgy Penguins",           ecosystem: "abstract", category: "official_game",priority: 10 },
  { username: "playgigaverse",    display_name: "Gigaverse",                ecosystem: "abstract", category: "official_game",priority: 9  },
  { username: "onchainheroes",    display_name: "Onchain Heroes",           ecosystem: "abstract", category: "official_game",priority: 9  },
  { username: "RoachRacingClub",  display_name: "Roach Racing Club",        ecosystem: "abstract", category: "official_game",priority: 7  },
  { username: "play_ember",       display_name: "Playember",                ecosystem: "abstract", category: "official_game",priority: 7  },
  { username: "unchained_game",   display_name: "Unchained",                ecosystem: "abstract", category: "official_game",priority: 8  },
  { username: "TollanUniverse",   display_name: "Tollan Universe",          ecosystem: "abstract", category: "official_game",priority: 8  },
  { username: "MoodyMights",      display_name: "Moody Mights",             ecosystem: "abstract", category: "official_game",priority: 7  },
  { username: "GMB_AOB",          display_name: "GMB_AOB",                  ecosystem: "abstract", category: "creator",      priority: 9  },
  { username: "Abstract_OW",      display_name: "Abstract_OW",              ecosystem: "abstract", category: "creator",      priority: 8  },
  { username: "Neslie_eth",       display_name: "Neslie",                   ecosystem: "abstract", category: "creator",      priority: 8  },
  { username: "marcellovtv",      display_name: "Marcello",                 ecosystem: "abstract", category: "creator",      priority: 8  },
  { username: "0xAbhiP",          display_name: "0xAbhiP",                  ecosystem: "abstract", category: "creator",      priority: 8  },
  { username: "shivst3r",         display_name: "shivst3r",                 ecosystem: "abstract", category: "creator",      priority: 7  },
  { username: "SultanXchain",     display_name: "SultanXchain",             ecosystem: "abstract", category: "creator",      priority: 7  },
  { username: "enftsar",          display_name: "enftsar",                  ecosystem: "abstract", category: "creator",      priority: 7  },
  { username: "Joobs155",         display_name: "Joobs155",                 ecosystem: "abstract", category: "creator",      priority: 7  },
  { username: "ChopperuaCrypto",  display_name: "ChopperuaCrypto",          ecosystem: "abstract", category: "creator",      priority: 7  },
  { username: "abstractdaily_",   display_name: "Abstract Daily",           ecosystem: "abstract", category: "media",        priority: 8  },
  { username: "Abstract_Hzn",     display_name: "Abstract Horizon",         ecosystem: "abstract", category: "media",        priority: 8  },
];

function getEcoAvatar(ecosystem: string | null | undefined): string {
  if (ecosystem === "ronin") return "bg-sky-400/20 text-sky-400";
  if (ecosystem === "immutable") return "bg-purple-400/20 text-purple-400";
  if (ecosystem === "abstract") return "bg-emerald-400/20 text-emerald-400";
  return "bg-primary/15 text-primary";
}

const CATEGORY_COLORS: Record<string, string> = {
  official_game: "bg-green-400/15 text-green-400",
  ecosystem: "bg-blue-400/15 text-blue-400",
  founder: "bg-amber-400/15 text-amber-400",
  creator: "bg-pink-400/15 text-pink-400",
  analytics: "bg-cyan-400/15 text-cyan-400",
  media: "bg-orange-400/15 text-orange-400",
  guild: "bg-violet-400/15 text-violet-400",
  influencer: "bg-rose-400/15 text-rose-400",
};

const EMPTY_FORM: Partial<AccountInsert> = {
  username: "",
  display_name: "",
  ecosystem: undefined,
  category: undefined,
  priority: 5,
  active: true,
  notes: "",
  follower_count: undefined,
  avatar_url: "",
};

interface Props {
  initialAccounts: Account[];
}

export function AdminAccountsClient({ initialAccounts }: Props) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [search, setSearch] = useState("");
  const [filterEco, setFilterEco] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<Partial<AccountInsert>>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showBulkPresets, setShowBulkPresets] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const matchSearch =
        !search ||
        a.username.toLowerCase().includes(search.toLowerCase()) ||
        (a.display_name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchEco = filterEco === "all" || a.ecosystem === filterEco;
      const matchCat = filterCat === "all" || a.category === filterCat;
      const matchActive =
        filterActive === "all" ||
        (filterActive === "active" ? a.active : !a.active);
      return matchSearch && matchEco && matchCat && matchActive;
    });
  }, [accounts, search, filterEco, filterCat, filterActive]);

  function openAdd() {
    setEditAccount(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowDialog(true);
  }

  function openEdit(account: Account) {
    setEditAccount(account);
    setForm({
      username: account.username,
      display_name: account.display_name ?? "",
      ecosystem: account.ecosystem ?? undefined,
      category: account.category ?? undefined,
      priority: account.priority,
      active: account.active,
      notes: account.notes ?? "",
      follower_count: account.follower_count ?? undefined,
      avatar_url: account.avatar_url ?? "",
    });
    setError(null);
    setShowDialog(true);
  }

  function closeDialog() {
    setShowDialog(false);
    setEditAccount(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username?.trim()) {
      setError("Username is required");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (editAccount) {
        const res = await fetch(`/api/sources/${editAccount.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const updated: Account = await res.json();
        setAccounts((prev) => prev.map((a) => (a.id === editAccount.id ? updated : a)));
      } else {
        const res = await fetch("/api/sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const created: Account = await res.json();
        setAccounts((prev) => [created, ...prev]);
      }
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/sources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(account: Account) {
    const res = await fetch(`/api/sources/${account.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !account.active }),
    });
    if (res.ok) {
      const updated: Account = await res.json();
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? updated : a)));
    }
  }

  async function addPresets() {
    const toAdd = PRESET_ACCOUNTS.filter(
      (p) =>
        selectedPresets.has(p.username) &&
        !accounts.some((a) => a.username.toLowerCase() === p.username.toLowerCase())
    );

    setLoading(true);
    const created: Account[] = [];
    for (const preset of toAdd) {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preset),
      });
      if (res.ok) created.push(await res.json());
    }
    setAccounts((prev) => [...created, ...prev]);
    setShowBulkPresets(false);
    setSelectedPresets(new Set());
    setLoading(false);
  }

  const ecoConfig = Object.fromEntries(ECOSYSTEMS.map((e) => [e.value, e]));
  const catConfig = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by username or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <SelectFilter
            value={filterEco}
            onChange={setFilterEco}
            options={[
              { value: "all", label: "All Ecosystems" },
              ...ECOSYSTEMS.map((e) => ({ value: e.value, label: e.label })),
            ]}
          />
          <SelectFilter
            value={filterCat}
            onChange={setFilterCat}
            options={[
              { value: "all", label: "All Categories" },
              ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
            ]}
          />
          <SelectFilter
            value={filterActive}
            onChange={setFilterActive}
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />

          <button
            onClick={() => setShowBulkPresets(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:border-border/60 transition-colors"
          >
            <Users className="size-4" />
            Presets
          </button>

          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 flex-wrap text-xs text-muted-foreground">
        <span>{filtered.length} of {accounts.length} accounts</span>
        <span>·</span>
        <span>{accounts.filter((a) => a.active).length} active</span>
        {Object.entries(
          accounts.reduce<Record<string, number>>((acc, a) => {
            if (a.ecosystem) acc[a.ecosystem] = (acc[a.ecosystem] ?? 0) + 1;
            return acc;
          }, {})
        ).map(([eco, count]) => (
          <span key={eco}>· {count} {eco}</span>
        ))}
      </div>

      {/* Grouped by category view */}
      {filterCat === "all" && filterEco === "all" && !search ? (
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const catAccounts = filtered.filter((a) => a.category === cat.value);
            if (catAccounts.length === 0) return null;
            return (
              <div key={cat.value}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{cat.icon}</span>
                  <h3 className="font-medium text-foreground">{cat.label}</h3>
                  <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                    {catAccounts.length}
                  </span>
                </div>
                <AccountTable
                  accounts={catAccounts}
                  ecoConfig={ecoConfig}
                  catConfig={catConfig}
                  onEdit={openEdit}
                  onDelete={(id) => setDeleteConfirm(id)}
                  onToggle={toggleActive}
                />
              </div>
            );
          })}
          {/* Uncategorized */}
          {(() => {
            const uncat = filtered.filter((a) => !a.category);
            if (uncat.length === 0) return null;
            return (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">❓</span>
                  <h3 className="font-medium text-foreground">Uncategorized</h3>
                  <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                    {uncat.length}
                  </span>
                </div>
                <AccountTable
                  accounts={uncat}
                  ecoConfig={ecoConfig}
                  catConfig={catConfig}
                  onEdit={openEdit}
                  onDelete={(id) => setDeleteConfirm(id)}
                  onToggle={toggleActive}
                />
              </div>
            );
          })()}
        </div>
      ) : (
        <AccountTable
          accounts={filtered}
          ecoConfig={ecoConfig}
          catConfig={catConfig}
          onEdit={openEdit}
          onDelete={(id) => setDeleteConfirm(id)}
          onToggle={toggleActive}
        />
      )}

      {accounts.length === 0 && (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Users className="size-10 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="font-medium text-foreground">No accounts yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Add X accounts to start tracking ecosystems
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowBulkPresets(true)}
              className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:border-primary/30 transition-colors"
            >
              Load presets
            </button>
            <button
              onClick={openAdd}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Add manually
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      {showDialog && (
        <Dialog title={editAccount ? `Edit @${editAccount.username}` : "Add Account"} onClose={closeDialog}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Username *">
                <input
                  type="text"
                  value={form.username ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.replace(/^@/, "") }))}
                  placeholder="e.g. Ronin_Network"
                  className={INPUT_CLASS}
                  disabled={!!editAccount}
                />
              </Field>
              <Field label="Display Name">
                <input
                  type="text"
                  value={form.display_name ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                  placeholder="e.g. Ronin Network"
                  className={INPUT_CLASS}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Ecosystem">
                <select
                  value={form.ecosystem ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, ecosystem: (e.target.value || undefined) as Ecosystem | undefined }))}
                  className={INPUT_CLASS}
                >
                  <option value="">Select ecosystem...</option>
                  {ECOSYSTEMS.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Category">
                <select
                  value={form.category ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, category: (e.target.value || undefined) as AccountCategory | undefined }))}
                  className={INPUT_CLASS}
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Priority (1–10)">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.priority ?? 5}
                  onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value) }))}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Follower Count">
                <input
                  type="number"
                  value={form.follower_count ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, follower_count: e.target.value ? parseInt(e.target.value) : undefined }))}
                  placeholder="optional"
                  className={INPUT_CLASS}
                />
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Why are you tracking this account?"
                rows={2}
                className={INPUT_CLASS + " resize-none"}
              />
            </Field>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active-check"
                checked={form.active ?? true}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="size-4 rounded"
              />
              <label htmlFor="active-check" className="text-sm text-foreground cursor-pointer">
                Active — include in scraping pipeline
              </label>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={closeDialog} className={BTN_SECONDARY}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className={BTN_PRIMARY}>
                {loading ? "Saving..." : editAccount ? "Save Changes" : "Add Account"}
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <Dialog title="Delete Account" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-muted-foreground mb-6">
            This will permanently remove the account and stop tracking it. This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteConfirm(null)} className={BTN_SECONDARY}>
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              disabled={loading}
              className="px-4 py-2 bg-destructive/15 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/25 transition-colors"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Dialog>
      )}

      {/* Bulk Presets Dialog */}
      {showBulkPresets && (
        <Dialog title="Add Preset Accounts" onClose={() => setShowBulkPresets(false)}>
          <p className="text-sm text-muted-foreground mb-4">
            Select accounts to add. Already tracked accounts are grayed out.
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
            {PRESET_ACCOUNTS.map((preset) => {
              const alreadyAdded = accounts.some(
                (a) => a.username.toLowerCase() === preset.username.toLowerCase()
              );
              return (
                <label
                  key={preset.username}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    alreadyAdded
                      ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                      : selectedPresets.has(preset.username)
                      ? "border-primary/50 bg-primary/10"
                      : "border-border bg-card hover:border-border/60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPresets.has(preset.username)}
                    disabled={alreadyAdded}
                    onChange={(e) => {
                      setSelectedPresets((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(preset.username);
                        else next.delete(preset.username);
                        return next;
                      });
                    }}
                    className="size-4 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">@{preset.username}</span>
                      {alreadyAdded && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                          already added
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{preset.display_name}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{preset.ecosystem}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{preset.category.replace("_", " ")}</span>
                      <span className="text-[10px] text-muted-foreground">· Priority {preset.priority}</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const available = new Set(
                  PRESET_ACCOUNTS.filter(
                    (p) => !accounts.some((a) => a.username.toLowerCase() === p.username.toLowerCase())
                  ).map((p) => p.username)
                );
                setSelectedPresets(available);
              }}
              className="text-sm text-primary hover:underline"
            >
              Select all available
            </button>
            <div className="flex gap-3">
              <button onClick={() => setShowBulkPresets(false)} className={BTN_SECONDARY}>
                Cancel
              </button>
              <button
                onClick={addPresets}
                disabled={loading || selectedPresets.size === 0}
                className={BTN_PRIMARY}
              >
                {loading ? "Adding..." : `Add ${selectedPresets.size} accounts`}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function AccountTable({
  accounts,
  ecoConfig,
  catConfig,
  onEdit,
  onDelete,
  onToggle,
}: {
  accounts: Account[];
  ecoConfig: Record<string, { label: string; color: string }>;
  catConfig: Record<string, { label: string; icon: string }>;
  onEdit: (a: Account) => void;
  onDelete: (id: string) => void;
  onToggle: (a: Account) => void;
}) {
  if (accounts.length === 0) {
    return (
      <div className="text-center py-6 bg-card border border-border rounded-xl text-sm text-muted-foreground">
        No accounts match your filters
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {accounts.map((account) => {
          const eco = account.ecosystem ? ecoConfig[account.ecosystem] : null;
          const cat = account.category ? catConfig[account.category] : null;
          return (
            <div key={account.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`size-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${getEcoAvatar(account.ecosystem)}`}>
                    {account.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">@{account.username}</p>
                    {account.display_name && <p className="text-xs text-muted-foreground">{account.display_name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onEdit(account)} className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 className="size-3.5" />
                  </button>
                  <button onClick={() => onDelete(account.id)} className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {eco && <span className={`text-xs px-2 py-0.5 rounded-full border ${eco.color}`}>{eco.label}</span>}
                {cat && <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[account.category ?? ""] ?? "bg-muted text-muted-foreground"}`}>{cat.label}</span>}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${account.priority >= 8 ? "bg-green-400" : account.priority >= 5 ? "bg-amber-400" : "bg-muted-foreground"}`}
                      style={{ width: `${account.priority * 10}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{account.priority}/10</span>
                </div>
                <button onClick={() => onToggle(account)} className="flex items-center gap-1.5 text-xs">
                  {account.active ? (
                    <><CheckCircle2 className="size-3.5 text-green-400" /><span className="text-green-400">Active</span></>
                  ) : (
                    <><XCircle className="size-3.5 text-muted-foreground" /><span className="text-muted-foreground">Inactive</span></>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Account</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Ecosystem</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Priority</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {accounts.map((account) => {
              const eco = account.ecosystem ? ecoConfig[account.ecosystem] : null;
              const cat = account.category ? catConfig[account.category] : null;
              return (
                <tr key={account.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`size-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${getEcoAvatar(account.ecosystem)}`}>
                        {account.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-foreground">@{account.username}</p>
                          <a href={`https://x.com/${account.username}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                        {account.display_name && <p className="text-xs text-muted-foreground">{account.display_name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {eco ? <span className={`text-xs px-2 py-0.5 rounded-full border ${eco.color}`}>{eco.label}</span> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {cat ? <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[account.category ?? ""] ?? "bg-muted text-muted-foreground"}`}>{cat.label}</span> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${account.priority >= 8 ? "bg-green-400" : account.priority >= 5 ? "bg-amber-400" : "bg-muted-foreground"}`} style={{ width: `${account.priority * 10}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{account.priority}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => onToggle(account)} className="flex items-center gap-1.5 text-xs">
                      {account.active ? (
                        <><CheckCircle2 className="size-3.5 text-green-400" /><span className="text-green-400">Active</span></>
                      ) : (
                        <><XCircle className="size-3.5 text-muted-foreground" /><span className="text-muted-foreground">Inactive</span></>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(account)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <Edit2 className="size-3.5" />
                      </button>
                      <button onClick={() => onDelete(account.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

const INPUT_CLASS =
  "w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors";

const BTN_PRIMARY =
  "px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50";

const BTN_SECONDARY =
  "px-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors";
