"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  blockAdmin,
  unblockAdmin,
  getPermissions,
  getStaffPermissions,
  assignPermissions,
} from "@/lib/superadmin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ShieldOff,
  Shield,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { normalizeList } from "@/lib/normalizeList";

// ============================================
// Types
// ============================================
interface Admin {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
  permission_ids?: number[];
}

interface Permission {
  id: number;
  code: string;
  name: string;
  module: string;
}

// ============================================
// Permission Module Config
// ============================================
const PERMISSION_MODULES = [
  {
    key: "olympiads",
    label: "Olimpiadalar",
    actions: [
      { key: "view", label: "Ko'rish" },
      { key: "create", label: "Yaratish" },
      { key: "update", label: "Tahrirlash" },
      { key: "delete", label: "O'chirish" },
      { key: "publish", label: "Nashr qilish" },
    ],
  },
  {
    key: "mock_tests",
    label: "Mock testlar",
    actions: [
      { key: "view", label: "Ko'rish" },
      { key: "create", label: "Yaratish" },
      { key: "update", label: "Tahrirlash" },
      { key: "delete", label: "O'chirish" },
      { key: "publish", label: "Nashr qilish" },
    ],
  },
  {
    key: "news",
    label: "Yangiliklar",
    actions: [
      { key: "view", label: "Ko'rish" },
      { key: "create", label: "Yaratish" },
      { key: "update", label: "Tahrirlash" },
      { key: "delete", label: "O'chirish" },
      { key: "publish", label: "Nashr qilish" },
    ],
  },
  {
    key: "results",
    label: "Natijalar",
    actions: [
      { key: "view", label: "Ko'rish" },
      { key: "update", label: "Tahrirlash" },
      { key: "export", label: "Export" },
    ],
  },
  {
    key: "certificates",
    label: "Sertifikatlar",
    actions: [
      { key: "view", label: "Ko'rish" },
      { key: "create", label: "Yaratish" },
      { key: "update", label: "Tahrirlash" },
      { key: "delete", label: "O'chirish" },
      { key: "export", label: "Export" },
    ],
  },
  {
    key: "users",
    label: "Foydalanuvchilar",
    actions: [
      { key: "view", label: "Ko'rish" },
      { key: "create", label: "Yaratish" },
      { key: "update", label: "Tahrirlash" },
      { key: "delete", label: "O'chirish" },
      { key: "block", label: "Bloklash" },
    ],
  },
];

// Module badge colors
const MODULE_COLORS: Record<string, string> = {
  olympiads: "bg-blue-600",
  mock_tests: "bg-purple-600",
  news: "bg-green-600",
  results: "bg-yellow-600",
  certificates: "bg-pink-600",
  users: "bg-cyan-600",
};

// ============================================
// Form State
// ============================================
interface AdminForm {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  role: string;
}

const emptyForm: AdminForm = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
  role: "admin",
};

// ============================================
// Permission Selector Component
// ============================================
function PermissionSelector({
  allPermissions,
  selectedPermissions,
  onToggle,
  onToggleModule,
  onToggleAll,
}: {
  allPermissions: Permission[];
  selectedPermissions: Set<number>;
  onToggle: (id: number) => void;
  onToggleModule: (moduleKey: string, selectAll: boolean) => void;
  onToggleAll: (selectAll: boolean) => void;
}) {
  // Build code->id map
  const codeToId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of allPermissions) {
      map[p.code] = p.id;
    }
    return map;
  }, [allPermissions]);

  // Check if all permissions are selected
  const allSelected = allPermissions.length > 0 && allPermissions.every((p) => selectedPermissions.has(p.id));

  // Check module status
  const getModulePermIds = useCallback(
    (moduleKey: string) => {
      return allPermissions.filter((p) => p.module === moduleKey).map((p) => p.id);
    },
    [allPermissions]
  );

  const isModuleAllSelected = useCallback(
    (moduleKey: string) => {
      const ids = getModulePermIds(moduleKey);
      return ids.length > 0 && ids.every((id) => selectedPermissions.has(id));
    },
    [getModulePermIds, selectedPermissions]
  );

  return (
    <div className="space-y-3">
      {/* Full Access toggle */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
        <Checkbox
          checked={allSelected}
          onCheckedChange={() => onToggleAll(!allSelected)}
          className="border-border data-[checked]:bg-orange-500 data-[checked]:border-orange-500"
        />
        <span className="font-semibold text-white">To&apos;liq ruxsat (Full Access)</span>
      </div>

      {/* Module cards */}
      <ScrollArea className="h-[400px] pr-3">
        <div className="space-y-3">
          {PERMISSION_MODULES.map((mod) => {
            const moduleAllSelected = isModuleAllSelected(mod.key);
            return (
              <div key={mod.key} className="border border-border rounded-lg overflow-hidden">
                {/* Module header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/80">
                  <span className="font-medium text-foreground">{mod.label}</span>
                  <button
                    type="button"
                    onClick={() => onToggleModule(mod.key, !moduleAllSelected)}
                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    {moduleAllSelected ? "Bekor qilish" : "Hammasini tanlash"}
                  </button>
                </div>
                {/* Permissions grid */}
                <div className="px-4 py-3 flex flex-wrap gap-x-5 gap-y-2.5">
                  {mod.actions.map((action) => {
                    const code = `${mod.key}.${action.key}`;
                    const permId = codeToId[code];
                    if (permId === undefined) return null;
                    const isChecked = selectedPermissions.has(permId);
                    return (
                      <label
                        key={code}
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => onToggle(permId)}
                          className="border-border data-[checked]:bg-orange-500 data-[checked]:border-orange-500"
                        />
                        <span className="text-sm text-muted-foreground">{action.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// Permission Viewer Component (read-only)
// ============================================
function PermissionViewer({
  adminName,
  permissionIds,
  allPermissions,
}: {
  adminName: string;
  permissionIds: number[];
  allPermissions: Permission[];
}) {
  const permSet = useMemo(() => new Set(permissionIds), [permissionIds]);

  const codeToId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of allPermissions) {
      map[p.code] = p.id;
    }
    return map;
  }, [allPermissions]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {adminName} uchun ruxsatlar
      </p>
      <ScrollArea className="h-[400px] pr-3">
        <div className="space-y-3">
          {PERMISSION_MODULES.map((mod) => {
            const modulePerms = mod.actions
              .map((a) => ({ ...a, code: `${mod.key}.${a.key}` }))
              .filter((a) => codeToId[a.code] !== undefined);
            const hasAny = modulePerms.some((a) => permSet.has(codeToId[a.code]));

            return (
              <div key={mod.key} className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/80">
                  <span className="font-medium text-foreground">{mod.label}</span>
                  {hasAny && (
                    <Badge className={`${MODULE_COLORS[mod.key] || "bg-gray-600"} text-[10px]`}>
                      Ruxsat berilgan
                    </Badge>
                  )}
                </div>
                <div className="px-4 py-3 flex flex-wrap gap-x-5 gap-y-2.5">
                  {modulePerms.map((action) => {
                    const permId = codeToId[action.code];
                    const granted = permSet.has(permId);
                    return (
                      <div
                        key={action.code}
                        className="flex items-center gap-2"
                      >
                        {granted ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span
                          className={`text-sm ${granted ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {action.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================
export default function AdminsPage() {
  // Admin list state
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  // All permissions from API
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  // Dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [viewPermsAdmin, setViewPermsAdmin] = useState<Admin | null>(null);
  const [viewPermsIds, setViewPermsIds] = useState<number[]>([]);
  const [viewPermsLoading, setViewPermsLoading] = useState(false);

  // Form state
  const [form, setForm] = useState<AdminForm>({ ...emptyForm });
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [formLoading, setFormLoading] = useState(false);
  const [editPermsLoading, setEditPermsLoading] = useState(false);

  // ============================================
  // Load all permissions on mount
  // ============================================
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const res = await getPermissions();
        const perms: Permission[] = normalizeList(res);
        setAllPermissions(perms);
      } catch {
        console.error("Failed to load permissions");
      }
      setPermissionsLoaded(true);
    };
    loadPermissions();
  }, []);

  // ============================================
  // Fetch admins
  // ============================================
  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdmins({
        page,
        page_size: limit,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      const list = normalizeList(res);
      setAdmins(list);
      setTotal(res.pagination?.total || res.total || res?.data?.total || 0);
    } catch {
      setAdmins([]);
    }
    setLoading(false);
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // ============================================
  // Permission helpers
  // ============================================
  const getAdminModuleTags = useCallback(
    (admin: Admin): string[] => {
      if (!admin.permissions && !admin.permission_ids) return [];
      const permIds = admin.permission_ids || admin.permissions?.map((p) => p.id) || [];
      const permIdSet = new Set(permIds);
      const modules: string[] = [];
      for (const mod of PERMISSION_MODULES) {
        const hasAny = allPermissions
          .filter((p) => p.module === mod.key)
          .some((p) => permIdSet.has(p.id));
        if (hasAny) modules.push(mod.key);
      }
      return modules;
    },
    [allPermissions]
  );

  const handleTogglePermission = useCallback((id: number) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleModule = useCallback(
    (moduleKey: string, selectAll: boolean) => {
      const modulePermIds = allPermissions
        .filter((p) => p.module === moduleKey)
        .map((p) => p.id);
      setSelectedPermissions((prev) => {
        const next = new Set(prev);
        if (selectAll) {
          modulePermIds.forEach((id) => next.add(id));
        } else {
          modulePermIds.forEach((id) => next.delete(id));
        }
        return next;
      });
    },
    [allPermissions]
  );

  const handleToggleAll = useCallback(
    (selectAll: boolean) => {
      if (selectAll) {
        setSelectedPermissions(new Set(allPermissions.map((p) => p.id)));
      } else {
        setSelectedPermissions(new Set());
      }
    },
    [allPermissions]
  );

  // ============================================
  // Create Admin
  // ============================================
  const handleCreate = async () => {
    // Validation
    if (!form.first_name.trim() || !form.last_name.trim()) {
      alert("Ism va familiya kiritilishi shart");
      return;
    }
    if (form.username.trim().length < 3) {
      alert("Username kamida 3 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (!form.email.trim()) {
      alert("Email kiritilishi shart");
      return;
    }
    if (form.password.length < 8) {
      alert("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (form.password !== form.confirm_password) {
      alert("Parollar mos kelmaydi");
      return;
    }

    setFormLoading(true);
    try {
      const payload: Record<string, unknown> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        confirm_password: form.confirm_password,
        role: form.role,
        full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
      };

      if (form.role === "admin") {
        payload.permission_ids = Array.from(selectedPermissions);
      }

      await createAdmin(payload);
      setShowCreate(false);
      setForm({ ...emptyForm });
      setSelectedPermissions(new Set());
      setSearch("");
      setRoleFilter("");
      setStatusFilter("");
      await fetchAdmins();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Xatolik yuz berdi");
    }
    setFormLoading(false);
  };

  // ============================================
  // Edit Admin
  // ============================================
  const openEditDialog = async (admin: Admin) => {
    setEditAdmin(admin);
    const nameParts = (admin.full_name || "").split(" ");
    setForm({
      first_name: admin.first_name || nameParts[0] || "",
      last_name: admin.last_name || nameParts.slice(1).join(" ") || "",
      username: admin.username || "",
      email: admin.email || "",
      phone: admin.phone || "",
      password: "",
      confirm_password: "",
      role: admin.role || "admin",
    });

    // Load existing permissions
    if (admin.role === "admin") {
      setEditPermsLoading(true);
      try {
        const res = await getStaffPermissions(admin.id);
        const ids: number[] = res?.permission_ids || res?.data?.permission_ids || [];
        setSelectedPermissions(new Set(ids));
      } catch {
        setSelectedPermissions(new Set());
      }
      setEditPermsLoading(false);
    } else {
      setSelectedPermissions(new Set());
    }
  };

  const handleUpdate = async () => {
    if (!editAdmin) return;

    if (!form.first_name.trim() || !form.last_name.trim()) {
      alert("Ism va familiya kiritilishi shart");
      return;
    }
    if (!form.email.trim()) {
      alert("Email kiritilishi shart");
      return;
    }
    if (form.password && form.password.length < 8) {
      alert("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (form.password && form.password !== form.confirm_password) {
      alert("Parollar mos kelmaydi");
      return;
    }

    setFormLoading(true);
    try {
      const payload: Record<string, unknown> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
      };

      if (form.password) {
        payload.password = form.password;
        payload.confirm_password = form.confirm_password;
      }

      if (form.role === "admin") {
        payload.permission_ids = Array.from(selectedPermissions);
      }

      await updateAdmin(editAdmin.id, payload);

      // Also assign permissions separately
      if (form.role === "admin") {
        try {
          await assignPermissions(editAdmin.id, {
            permission_ids: Array.from(selectedPermissions),
          });
        } catch {
          // Permission assignment may fail if already included in update
        }
      }

      setEditAdmin(null);
      setForm({ ...emptyForm });
      setSelectedPermissions(new Set());
      fetchAdmins();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err?.response?.data?.message || "Xatolik yuz berdi");
    }
    setFormLoading(false);
  };

  // ============================================
  // View Permissions
  // ============================================
  const openViewPermissions = async (admin: Admin) => {
    setViewPermsAdmin(admin);
    setViewPermsLoading(true);
    try {
      const res = await getStaffPermissions(admin.id);
      const ids: number[] = res?.permission_ids || res?.data?.permission_ids || [];
      setViewPermsIds(ids);
    } catch {
      setViewPermsIds([]);
    }
    setViewPermsLoading(false);
  };

  // ============================================
  // Delete Admin
  // ============================================
  const handleDelete = async (id: number) => {
    if (!confirm("Adminni o'chirishni xohlaysizmi?")) return;
    try {
      await deleteAdmin(id);
      fetchAdmins();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err?.response?.data?.message || "Xatolik yuz berdi");
    }
  };

  // ============================================
  // Block/Unblock
  // ============================================
  const handleBlock = async (id: number, blocked: boolean) => {
    try {
      if (blocked) await unblockAdmin(id);
      else await blockAdmin(id);
      fetchAdmins();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err?.response?.data?.message || "Xatolik yuz berdi");
    }
  };

  const totalPages = Math.ceil(total / limit);

  // ============================================
  // Render
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Adminlar</h1>
        <Button
          onClick={() => {
            setForm({ ...emptyForm });
            setSelectedPermissions(new Set());
            setShowCreate(true);
          }}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" /> Admin qo&apos;shish
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 bg-muted border-border"
          />
        </div>
        <Select
          value={roleFilter || "all"}
          onValueChange={(v) => {
            setRoleFilter(!v || v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px] bg-muted border-border">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="superadmin">Superadmin</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => {
            setStatusFilter(!v || v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px] bg-muted border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="blocked">Bloklangan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-accent">
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>To&apos;liq ism</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ruxsatlar</TableHead>
              <TableHead className="w-[140px]">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                  Yuklanmoqda...
                </TableCell>
              </TableRow>
            ) : admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Admin topilmadi
                </TableCell>
              </TableRow>
            ) : (
              admins.map((a) => {
                const moduleTags = getAdminModuleTags(a);
                return (
                  <TableRow key={a.id} className="border-border hover:bg-accent/50">
                    <TableCell className="text-muted-foreground">{a.id}</TableCell>
                    <TableCell className="font-medium">{a.username}</TableCell>
                    <TableCell>{a.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{a.email || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={a.role === "superadmin" ? "destructive" : "secondary"}
                      >
                        {a.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          a.status === "active" ? "bg-green-600" : "bg-red-600"
                        }
                      >
                        {a.status === "active" ? "Faol" : "Bloklangan"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a.role === "superadmin" ? (
                        <Badge className="bg-orange-600 text-[10px]">
                          To&apos;liq ruxsat
                        </Badge>
                      ) : moduleTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {moduleTags.map((mk) => {
                            const mod = PERMISSION_MODULES.find((m) => m.key === mk);
                            return (
                              <Badge
                                key={mk}
                                className={`${MODULE_COLORS[mk] || "bg-gray-600"} text-[10px]`}
                              >
                                {mod?.label || mk}
                              </Badge>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Ruxsat yo&apos;q</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {a.role !== "superadmin" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Ruxsatlarni ko'rish"
                            onClick={() => openViewPermissions(a)}
                          >
                            <Eye className="w-4 h-4 text-blue-400" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Tahrirlash"
                          onClick={() => openEditDialog(a)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title={a.status === "blocked" ? "Blokdan chiqarish" : "Bloklash"}
                          onClick={() => handleBlock(a.id, a.status === "blocked")}
                        >
                          {a.status === "blocked" ? (
                            <Shield className="w-4 h-4 text-green-400" />
                          ) : (
                            <ShieldOff className="w-4 h-4 text-yellow-400" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="O'chirish"
                          onClick={() => handleDelete(a.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Jami: {total}</span>
          <div className="flex gap-2 items-center">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border-border"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1 text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="border-border"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Create Admin Dialog */}
      {/* ============================================ */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi admin yaratish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Ism <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="bg-muted border-border"
                  placeholder="Ism"
                />
              </div>
              <div>
                <Label>
                  Familiya <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="bg-muted border-border"
                  placeholder="Familiya"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <Label>
                Username <span className="text-red-400">*</span>
              </Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="bg-muted border-border"
                placeholder="Kamida 3 ta belgi"
              />
            </div>

            {/* Email */}
            <div>
              <Label>
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-muted border-border"
                placeholder="email@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <Label>Telefon</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-muted border-border"
                placeholder="+998 90 123 45 67"
              />
            </div>

            {/* Password fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Parol <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="bg-muted border-border"
                  placeholder="Kamida 8 ta belgi"
                />
              </div>
              <div>
                <Label>
                  Parol tasdiqlash <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  className="bg-muted border-border"
                  placeholder="Parolni takrorlang"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <Label>Rol</Label>
              <Select
                value={form.role}
                onValueChange={(v) => {
                  if (v) setForm({ ...form, role: v });
                }}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Permissions (only for admin role) */}
            {form.role === "admin" && permissionsLoaded && (
              <div>
                <Label className="mb-2 block">Ruxsatlar</Label>
                <PermissionSelector
                  allPermissions={allPermissions}
                  selectedPermissions={selectedPermissions}
                  onToggle={handleTogglePermission}
                  onToggleModule={handleToggleModule}
                  onToggleAll={handleToggleAll}
                />
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleCreate}
              disabled={formLoading}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {formLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yaratish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* Edit Admin Dialog */}
      {/* ============================================ */}
      <Dialog open={!!editAdmin} onOpenChange={(open) => { if (!open) { setEditAdmin(null); setForm({ ...emptyForm }); setSelectedPermissions(new Set()); } }}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adminni tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Ism <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <Label>
                  Familiya <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            {/* Email */}
            <div>
              <Label>
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            {/* Phone */}
            <div>
              <Label>Telefon</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            {/* Password fields (optional for edit) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Yangi parol</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="bg-muted border-border"
                  placeholder="Bo'sh qoldiring"
                />
              </div>
              <div>
                <Label>Parol tasdiqlash</Label>
                <Input
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  className="bg-muted border-border"
                  placeholder="Bo'sh qoldiring"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <Label>Rol</Label>
              <Select
                value={form.role}
                onValueChange={(v) => {
                  if (v) setForm({ ...form, role: v });
                }}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Permissions (only for admin role) */}
            {form.role === "admin" && permissionsLoaded && (
              <div>
                <Label className="mb-2 block">Ruxsatlar</Label>
                {editPermsLoading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Ruxsatlar yuklanmoqda...
                  </div>
                ) : (
                  <PermissionSelector
                    allPermissions={allPermissions}
                    selectedPermissions={selectedPermissions}
                    onToggle={handleTogglePermission}
                    onToggleModule={handleToggleModule}
                    onToggleAll={handleToggleAll}
                  />
                )}
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleUpdate}
              disabled={formLoading}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {formLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Saqlash
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* View Permissions Dialog */}
      {/* ============================================ */}
      <Dialog open={!!viewPermsAdmin} onOpenChange={(open) => { if (!open) setViewPermsAdmin(null); }}>
        <DialogContent className="bg-card border-border max-w-xl">
          <DialogHeader>
            <DialogTitle>Ruxsatlar</DialogTitle>
          </DialogHeader>
          {viewPermsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Yuklanmoqda...
            </div>
          ) : (
            <PermissionViewer
              adminName={viewPermsAdmin?.full_name || ""}
              permissionIds={viewPermsIds}
              allPermissions={allPermissions}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
