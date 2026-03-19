"use client";

import { useEffect, useState, useRef } from "react";
import {
  getCertTemplates,
  createCertTemplate,
  updateCertTemplate,
  deleteCertTemplate,
  uploadImage,
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
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface FieldLayout {
  x: number;
  y: number;
  fontSize: number;
  fontColor: string;
  textAlign: string;
  fontWeight: string;
  visible: boolean;
}

interface CertTemplate {
  id: number;
  name: string;
  type: string;
  description: string;
  page_size: string;
  orientation: string;
  background_image: string;
  logo_image: string;
  is_active: boolean;
  layout: Record<string, FieldLayout>;
  created_at: string;
}

const LAYOUT_FIELDS = [
  "full_name",
  "subject",
  "class_name",
  "score",
  "scaled_score",
  "max_score",
  "percentage",
  "grade",
  "rank",
  "issued_at",
  "valid_until",
  "certificate_number",
  "verification_code",
  "qr_code",
  "title",
];

const defaultFieldLayout: FieldLayout = {
  x: 0,
  y: 0,
  fontSize: 14,
  fontColor: "#000000",
  textAlign: "center",
  fontWeight: "normal",
  visible: true,
};

function makeDefaultLayout(): Record<string, FieldLayout> {
  const layout: Record<string, FieldLayout> = {};
  for (const f of LAYOUT_FIELDS) {
    layout[f] = { ...defaultFieldLayout };
  }
  return layout;
}

const emptyForm = {
  name: "",
  type: "olympiad" as string,
  description: "",
  page_size: "A4" as string,
  orientation: "landscape" as string,
  background_image: "",
  logo_image: "",
  is_active: true,
  layout: makeDefaultLayout(),
};

const certTypes = ["olympiad", "mock_rasch"];
const pageSizes = ["A4", "Letter"];
const orientations = ["landscape", "portrait"];
const textAligns = ["left", "center", "right"];
const fontWeights = ["normal", "bold"];

function typeBadge(type: string) {
  if (type === "olympiad")
    return (
      <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">
        olympiad
      </Badge>
    );
  return (
    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
      mock_rasch
    </Badge>
  );
}

export default function CertificateTemplatesPage() {
  const [items, setItems] = useState<CertTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>(
    {}
  );
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCertTemplates();
      setItems(normalizeList<CertTemplate>(res));
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setExpandedFields({});
    setShowDialog(true);
  };

  const openEdit = (item: CertTemplate) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      type: item.type || "olympiad",
      description: item.description || "",
      page_size: item.page_size || "A4",
      orientation: item.orientation || "landscape",
      background_image: item.background_image || "",
      logo_image: item.logo_image || "",
      is_active: item.is_active ?? true,
      layout: item.layout && Object.keys(item.layout).length > 0
        ? { ...makeDefaultLayout(), ...item.layout }
        : makeDefaultLayout(),
    });
    setExpandedFields({});
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      const payload: Record<string, unknown> = { ...form };
      if (editingId) {
        await updateCertTemplate(editingId, payload);
      } else {
        await createCertTemplate(payload);
      }
      setShowDialog(false);
      fetchData();
    } catch (e: unknown) {
      alert(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Xatolik"
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCertTemplate(id);
      setDeleteConfirmId(null);
      fetchData();
    } catch (e: unknown) {
      alert(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Xatolik"
      );
    }
  };

  const handleImageUpload = async (
    file: File,
    field: "background_image" | "logo_image",
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const res = await uploadImage(file);
      setForm((prev) => ({ ...prev, [field]: res.url }));
    } catch {
      alert("Rasm yuklashda xatolik");
    }
    setUploading(false);
  };

  const updateFieldLayout = (
    fieldName: string,
    key: keyof FieldLayout,
    value: string | number | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        [fieldName]: {
          ...prev.layout[fieldName],
          [key]: value,
        },
      },
    }));
  };

  const toggleFieldExpand = (fieldName: string) => {
    setExpandedFields((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sertifikat shablonlari</h1>
        <Button
          onClick={openCreate}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" /> Shablon yaratish
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-accent">
              <TableHead>Nomi</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>Sahifa o&apos;lchami</TableHead>
              <TableHead>Yo&apos;nalish</TableHead>
              <TableHead>Faol</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Yuklanmoqda...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Shablon topilmadi
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-border hover:bg-accent"
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{typeBadge(item.type)}</TableCell>
                  <TableCell>{item.page_size || "A4"}</TableCell>
                  <TableCell>{item.orientation || "landscape"}</TableCell>
                  <TableCell>
                    {item.is_active ? (
                      <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                        Ha
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30">
                        Yo&apos;q
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => setDeleteConfirmId(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Shablonni o&apos;chirish</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Haqiqatan ham bu shablonni o&apos;chirmoqchimisiz? Bu amalni qaytarib
            bo&apos;lmaydi.
          </p>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              Bekor qilish
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() =>
                deleteConfirmId && handleDelete(deleteConfirmId)
              }
            >
              Ha, o&apos;chirish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Shablonni tahrirlash" : "Yangi shablon yaratish"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nomi</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="bg-muted border-border"
                  placeholder="Shablon nomi"
                />
              </div>
              <div>
                <Label>Turi</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => v && setForm({ ...form, type: v })}
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
                <Label>Sahifa o&apos;lchami</Label>
                <Select
                  value={form.page_size}
                  onValueChange={(v) => v && setForm({ ...form, page_size: v })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizes.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Yo&apos;nalish</Label>
                <Select
                  value={form.orientation}
                  onValueChange={(v) =>
                    v && setForm({ ...form, orientation: v })
                  }
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orientations.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Label>Faol</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) =>
                    setForm({ ...form, is_active: v })
                  }
                />
              </div>
              <div className="col-span-2">
                <Label>Tavsif</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="bg-muted border-border"
                  placeholder="Shablon tavsifi"
                />
              </div>
            </div>

            {/* Image uploads */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fon rasmi</Label>
                <input
                  ref={bgInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      handleImageUpload(file, "background_image", setUploadingBg);
                  }}
                />
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploadingBg}
                    onClick={() => bgInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {uploadingBg ? "Yuklanmoqda..." : "Yuklash"}
                  </Button>
                  {form.background_image && (
                    <span className="text-xs text-green-400 truncate max-w-[200px]">
                      Yuklangan
                    </span>
                  )}
                </div>
              </div>
              <div>
                <Label>Logo rasmi</Label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      handleImageUpload(file, "logo_image", setUploadingLogo);
                  }}
                />
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {uploadingLogo ? "Yuklanmoqda..." : "Yuklash"}
                  </Button>
                  {form.logo_image && (
                    <span className="text-xs text-green-400 truncate max-w-[200px]">
                      Yuklangan
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Layout JSON section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Maydon joylashuvi (Layout)</h3>
              <div className="space-y-2">
                {LAYOUT_FIELDS.map((fieldName) => {
                  const field = form.layout[fieldName] || {
                    ...defaultFieldLayout,
                  };
                  const isExpanded = expandedFields[fieldName];
                  return (
                    <Card
                      key={fieldName}
                      className="bg-muted/50 border-border"
                    >
                      <button
                        onClick={() => toggleFieldExpand(fieldName)}
                        className="flex items-center justify-between w-full px-4 py-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <span className="font-mono text-sm font-medium">
                            {fieldName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.visible}
                            onCheckedChange={(v) =>
                              updateFieldLayout(fieldName, "visible", v)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs text-muted-foreground">
                            {field.visible ? "Ko'rinadi" : "Yashirin"}
                          </span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">X</Label>
                            <Input
                              type="number"
                              value={field.x}
                              onChange={(e) =>
                                updateFieldLayout(
                                  fieldName,
                                  "x",
                                  Number(e.target.value)
                                )
                              }
                              className="bg-muted border-border h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Y</Label>
                            <Input
                              type="number"
                              value={field.y}
                              onChange={(e) =>
                                updateFieldLayout(
                                  fieldName,
                                  "y",
                                  Number(e.target.value)
                                )
                              }
                              className="bg-muted border-border h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Font hajmi</Label>
                            <Input
                              type="number"
                              value={field.fontSize}
                              onChange={(e) =>
                                updateFieldLayout(
                                  fieldName,
                                  "fontSize",
                                  Number(e.target.value)
                                )
                              }
                              className="bg-muted border-border h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Font rangi</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={field.fontColor}
                                onChange={(e) =>
                                  updateFieldLayout(
                                    fieldName,
                                    "fontColor",
                                    e.target.value
                                  )
                                }
                                className="w-8 h-8 rounded cursor-pointer border-0"
                              />
                              <Input
                                value={field.fontColor}
                                onChange={(e) =>
                                  updateFieldLayout(
                                    fieldName,
                                    "fontColor",
                                    e.target.value
                                  )
                                }
                                className="bg-muted border-border h-8 text-sm flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Tekislash</Label>
                            <Select
                              value={field.textAlign}
                              onValueChange={(v) =>
                                v && updateFieldLayout(
                                  fieldName,
                                  "textAlign",
                                  v
                                )
                              }
                            >
                              <SelectTrigger className="bg-muted border-border h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {textAligns.map((a) => (
                                  <SelectItem key={a} value={a}>
                                    {a}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Font qalinligi</Label>
                            <Select
                              value={field.fontWeight}
                              onValueChange={(v) =>
                                v && updateFieldLayout(
                                  fieldName,
                                  "fontWeight",
                                  v
                                )
                              }
                            >
                              <SelectTrigger className="bg-muted border-border h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fontWeights.map((w) => (
                                  <SelectItem key={w} value={w}>
                                    {w}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {editingId ? "Saqlash" : "Yaratish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
