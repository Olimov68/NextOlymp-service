"use client";

import { useEffect, useState } from "react";
import {
  getCertificates,
  createCertificate,
  getCertTemplates,
  regenerateCertificate,
  revokeCertificate,
  downloadCertificatePDF,
} from "@/lib/superadmin-api";
import { normalizeList } from "@/lib/normalizeList";
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
import {
  Plus,
  Search,
  Download,
  RefreshCw,
  XCircle,
  MoreHorizontal,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface Certificate {
  id: number;
  user_id: number;
  user_name: string;
  certificate_type: string;
  subject_name: string;
  score: number;
  scaled_score: number;
  max_score: number;
  percentage: number;
  grade: string;
  rank: number;
  status: string;
  issued_at: string;
  created_at: string;
  title: string;
  full_name: string;
  class_name: string;
  source_type: string;
  source_id: number;
  certificate_number: string;
  verification_code: string;
  template_id: number;
  valid_until: string;
}

interface CertTemplate {
  id: number;
  name: string;
  type: string;
}

const emptyForm = {
  user_id: 0,
  certificate_type: "olympiad" as string,
  template_id: 0,
  source_type: "olympiad" as string,
  source_id: 0,
  title: "",
  full_name: "",
  class_name: "",
  subject_name: "",
  score: 0,
  max_score: 0,
  percentage: 0,
  scaled_score: 0,
  grade: "",
  valid_years: 0,
};

const certTypes = ["olympiad", "mock_rasch"];
const sourceTypes = ["olympiad", "mock_test"];
const gradeOptions = ["A+", "A", "B", "C", "D"];
const statusOptions = ["active", "revoked"];

// Rasman baholash mezoni: T = 50 + 10Z
function calcGrade(tScore: number): string {
  if (tScore >= 70) return "A+";
  if (tScore >= 65) return "A";
  if (tScore >= 60) return "B+";
  if (tScore >= 55) return "B";
  if (tScore >= 50) return "C+";
  if (tScore >= 46) return "C";
  return ""; // 46 dan past — sertifikat berilmaydi
}

function typeBadge(type: string) {
  if (type === "olympiad")
    return <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">olympiad</Badge>;
  return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">mock_rasch</Badge>;
}

function statusBadge(status: string) {
  if (status === "active")
    return <Badge className="bg-green-600/20 text-green-400 border-green-600/30">active</Badge>;
  return <Badge className="bg-red-600/20 text-red-400 border-red-600/30">revoked</Badge>;
}

function gradeBadge(grade: string) {
  const map: Record<string, string> = {
    "A+": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    A: "bg-green-600/20 text-green-400 border-green-600/30",
    "B+": "bg-teal-600/20 text-teal-400 border-teal-600/30",
    B: "bg-blue-600/20 text-blue-400 border-blue-600/30",
    "C+": "bg-orange-600/20 text-orange-300 border-orange-600/30",
    C: "bg-yellow-600/20 text-yellow-300 border-yellow-600/30",
  };
  if (!grade) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30">Olmagan</Badge>;
  return <Badge className={map[grade] || "bg-gray-600/20 text-gray-400 border-gray-600/30"}>{grade}</Badge>;
}

export default function CertificatesPage() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [certTypeFilter, setCertTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [templates, setTemplates] = useState<CertTemplate[]>([]);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);
  const [revokeConfirmId, setRevokeConfirmId] = useState<number | null>(null);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCertificates({
        page,
        page_size: limit,
        search: search || undefined,
        certificate_type: certTypeFilter || undefined,
        status: statusFilter || undefined,
        grade: gradeFilter || undefined,
      });
      const list = normalizeList<Certificate>(res);
      setItems(list);
      setTotal(res.pagination?.total || res?.data?.total || 0);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  const fetchTemplates = async () => {
    try {
      const res = await getCertTemplates();
      setTemplates(normalizeList<CertTemplate>(res));
    } catch {
      setTemplates([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, certTypeFilter, statusFilter, gradeFilter]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = async () => {
    try {
      const payload: Record<string, unknown> = {
        user_id: Number(form.user_id),
        certificate_type: form.certificate_type,
        source_type: form.source_type,
        source_id: Number(form.source_id),
        title: form.title,
        full_name: form.full_name,
        class_name: form.class_name,
        subject_name: form.subject_name,
        score: Number(form.score),
        max_score: Number(form.max_score),
        percentage: Number(form.percentage),
        scaled_score: Number(form.scaled_score),
        grade: form.grade,
        valid_years: Number(form.valid_years),
      };
      // template_id faqat tanlangan bo'lsa yuboriladi
      if (Number(form.template_id) > 0) {
        payload.template_id = Number(form.template_id);
      }
      await createCertificate(payload);
      setShowCreate(false);
      setForm(emptyForm);
      fetchData();
    } catch (e: unknown) {
      alert(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Xatolik"
      );
    }
  };

  const handleRegenerate = async (id: number) => {
    try {
      await regenerateCertificate(id);
      setActionMenuId(null);
      fetchData();
    } catch (e: unknown) {
      alert(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Xatolik"
      );
    }
  };

  const handleRevoke = async (id: number) => {
    try {
      await revokeCertificate(id);
      setRevokeConfirmId(null);
      setActionMenuId(null);
      fetchData();
    } catch (e: unknown) {
      alert(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Xatolik"
      );
    }
  };

  const handleDownload = async (id: number) => {
    try {
      await downloadCertificatePDF(id);
      setActionMenuId(null);
    } catch (e: unknown) {
      alert(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Yuklab olishda xatolik"
      );
    }
  };

  const handleCertTypeChange = (v: string) => {
    const newType = v;
    setForm((prev) => ({
      ...prev,
      certificate_type: newType,
      source_type: newType === "mock_rasch" ? "mock_test" : "olympiad",
      valid_years: newType === "mock_rasch" ? 3 : 0,
      grade: newType === "mock_rasch" ? calcGrade(prev.scaled_score) : "",
    }));
  };

  const handleScaledScoreChange = (val: number) => {
    setForm((prev) => ({
      ...prev,
      scaled_score: val,
      grade: prev.certificate_type === "mock_rasch" ? calcGrade(val) : prev.grade,
    }));
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sertifikatlar</h1>
        <Button
          onClick={() => {
            setShowCreate(true);
            setForm(emptyForm);
            fetchTemplates();
          }}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" /> Sertifikat yaratish
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
          value={certTypeFilter || "all"}
          onValueChange={(v) => {
            setCertTypeFilter(!v || v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[170px] bg-muted border-border">
            <SelectValue placeholder="Turi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha turlar</SelectItem>
            {certTypes.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
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
            <SelectItem value="all">Barcha status</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={gradeFilter || "all"}
          onValueChange={(v) => {
            setGradeFilter(!v || v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[130px] bg-muted border-border">
            <SelectValue placeholder="Daraja" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha daraja</SelectItem>
            {gradeOptions.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-accent">
              <TableHead>ID</TableHead>
              <TableHead>Foydalanuvchi</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>Fan</TableHead>
              <TableHead>Ball/Scaled</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Daraja</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-8 text-muted-foreground"
                >
                  Yuklanmoqda...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-8 text-muted-foreground"
                >
                  Sertifikat topilmadi
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="border-border hover:bg-accent">
                  <TableCell>{item.id}</TableCell>
                  <TableCell className="font-medium">
                    {item.full_name || item.user_name || `ID: ${item.user_id}`}
                  </TableCell>
                  <TableCell>{typeBadge(item.certificate_type)}</TableCell>
                  <TableCell>{item.subject_name || "-"}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {item.score}/{item.max_score}
                      {item.scaled_score ? (
                        <span className="text-muted-foreground ml-1">
                          ({item.scaled_score})
                        </span>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell>{gradeBadge(item.grade)}</TableCell>
                  <TableCell>
                    {item.rank ? `#${item.rank}` : "-"}
                  </TableCell>
                  <TableCell>{statusBadge(item.status || "active")}</TableCell>
                  <TableCell>
                    {item.issued_at
                      ? new Date(item.issued_at).toLocaleDateString()
                      : item.created_at
                      ? new Date(item.created_at).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setActionMenuId(
                            actionMenuId === item.id ? null : item.id
                          )
                        }
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      {actionMenuId === item.id && (
                        <div className="absolute right-0 top-8 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                          <button
                            onClick={() => handleDownload(item.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
                          >
                            <Download className="w-4 h-4" /> PDF yuklash
                          </button>
                          <button
                            onClick={() => handleRegenerate(item.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
                          >
                            <RefreshCw className="w-4 h-4" /> Qayta yaratish
                          </button>
                          {item.status !== "revoked" && (
                            <button
                              onClick={() => {
                                setRevokeConfirmId(item.id);
                                setActionMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left text-red-400"
                            >
                              <XCircle className="w-4 h-4" /> Bekor qilish
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} />

      {/* Revoke Confirm Dialog */}
      <Dialog
        open={revokeConfirmId !== null}
        onOpenChange={() => setRevokeConfirmId(null)}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Sertifikatni bekor qilish</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Haqiqatan ham #{revokeConfirmId} raqamli sertifikatni bekor qilmoqchimisiz?
            Bu amalni qaytarib bo&apos;lmaydi.
          </p>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setRevokeConfirmId(null)}>
              Bekor qilish
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => revokeConfirmId && handleRevoke(revokeConfirmId)}
            >
              Ha, bekor qilish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi sertifikat yaratish</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Foydalanuvchi ID</Label>
              <Input
                type="number"
                value={form.user_id || ""}
                onChange={(e) =>
                  setForm({ ...form, user_id: Number(e.target.value) })
                }
                className="bg-muted border-border"
                placeholder="User ID"
              />
            </div>
            <div>
              <Label>Sertifikat turi</Label>
              <Select
                value={form.certificate_type}
                onValueChange={(v) => v && handleCertTypeChange(v)}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {certTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Shablon</Label>
              <Select
                value={form.template_id ? String(form.template_id) : ""}
                onValueChange={(v) =>
                  setForm({ ...form, template_id: Number(v || 0) })
                }
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Shablon tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} ({t.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Manba turi</Label>
              <Select
                value={form.source_type}
                onValueChange={(v) => v && setForm({ ...form, source_type: v })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sourceTypes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Manba ID</Label>
              <Input
                type="number"
                value={form.source_id || ""}
                onChange={(e) =>
                  setForm({ ...form, source_id: Number(e.target.value) })
                }
                className="bg-muted border-border"
                placeholder="Olimpiada yoki mock test ID"
              />
            </div>
            <div>
              <Label>Sarlavha</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
            <div>
              <Label>To&apos;liq ism</Label>
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className="bg-muted border-border"
              />
            </div>
            <div>
              <Label>Sinf nomi</Label>
              <Input
                value={form.class_name}
                onChange={(e) =>
                  setForm({ ...form, class_name: e.target.value })
                }
                className="bg-muted border-border"
              />
            </div>
            <div className="col-span-2">
              <Label>Fan nomi</Label>
              <Input
                value={form.subject_name}
                onChange={(e) =>
                  setForm({ ...form, subject_name: e.target.value })
                }
                className="bg-muted border-border"
              />
            </div>
            <div>
              <Label>Ball</Label>
              <Input
                type="number"
                value={form.score || ""}
                onChange={(e) =>
                  setForm({ ...form, score: Number(e.target.value) })
                }
                className="bg-muted border-border"
              />
            </div>
            <div>
              <Label>Maksimal ball</Label>
              <Input
                type="number"
                value={form.max_score || ""}
                onChange={(e) =>
                  setForm({ ...form, max_score: Number(e.target.value) })
                }
                className="bg-muted border-border"
              />
            </div>
            <div>
              <Label>Foiz</Label>
              <Input
                type="number"
                value={form.percentage || ""}
                onChange={(e) =>
                  setForm({ ...form, percentage: Number(e.target.value) })
                }
                className="bg-muted border-border"
              />
            </div>
            {form.certificate_type === "mock_rasch" && (
              <div>
                <Label>Scaled Score</Label>
                <Input
                  type="number"
                  value={form.scaled_score || ""}
                  onChange={(e) =>
                    handleScaledScoreChange(Number(e.target.value))
                  }
                  className="bg-muted border-border"
                />
              </div>
            )}
            <div>
              <Label>Grade {form.certificate_type === "mock_rasch" && "(auto)"}</Label>
              {form.certificate_type === "mock_rasch" ? (
                <Input
                  value={form.grade}
                  readOnly
                  className="bg-muted border-border opacity-70"
                />
              ) : (
                <Select
                  value={form.grade || "none"}
                  onValueChange={(v) => setForm({ ...form, grade: !v || v === "none" ? "" : v })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Daraja" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanlang</SelectItem>
                    {gradeOptions.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>
                Amal qilish muddati (yil){" "}
                {form.certificate_type === "mock_rasch" && "(default: 3)"}
              </Label>
              <Input
                type="number"
                value={form.valid_years}
                onChange={(e) =>
                  setForm({ ...form, valid_years: Number(e.target.value) })
                }
                className="bg-muted border-border"
              />
            </div>
          </div>
          <Button
            onClick={handleCreate}
            className="w-full bg-orange-500 hover:bg-orange-600 mt-4"
          >
            Yaratish
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
