"use client";

import { useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Award,
  Calendar,
  Hash,
  User,
  BookOpen,
  GraduationCap,
  Loader2,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://nextolymp.uz/api/v1";

interface VerifyCertificateResult {
  id: number;
  full_name: string;
  certificate_type: string;
  source_type: string;
  source_title: string;
  subject: string;
  class: number;
  score: number;
  max_score: number;
  percentage: number;
  scaled_score: number;
  grade: string;
  certificate_number: string;
  verification_code: string;
  issued_at: string;
  valid_until: string;
  status: string;
}

function getGradeColor(grade: string) {
  switch (grade) {
    case "A+":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400";
    case "A":
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
    case "B":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
    case "C":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
}

function CertificateResultCard({ cert }: { cert: VerifyCertificateResult }) {
  const isRevoked = cert.status === "revoked";
  const isOlympiad =
    cert.certificate_type === "olympiad" || cert.source_type === "olympiad";
  const isMockRasch =
    cert.certificate_type === "mock_rasch" || cert.source_type === "mock_test";

  if (isRevoked) {
    return (
      <Card className="border-orange-300 dark:border-orange-700 shadow-lg max-w-xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-xl font-bold text-orange-700 dark:text-orange-400 mb-2">
            Sertifikat bekor qilingan
          </h2>
          <p className="text-muted-foreground mb-4">
            Ushbu sertifikat bekor qilingan va haqiqiy emas.
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="font-medium">Ism:</span> {cert.full_name}
            </p>
            <p>
              <span className="font-medium">Sertifikat raqami:</span>{" "}
              <span className="font-mono">{cert.certificate_number}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-300 dark:border-green-700 shadow-lg max-w-xl mx-auto">
      <CardContent className="p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-green-700 dark:text-green-400 mb-1">
            Sertifikat haqiqiy
          </h2>
          <p className="text-sm text-muted-foreground">
            Ushbu sertifikat NextOlymp tomonidan tasdiqlangan
          </p>
        </div>

        {/* Full Name */}
        <div className="text-center mb-6">
          <p className="text-2xl font-bold text-foreground">{cert.full_name}</p>
        </div>

        {/* Type Badge */}
        <div className="flex justify-center mb-6">
          <Badge
            className={`border-0 text-sm px-3 py-1 ${
              isOlympiad
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
            }`}
          >
            {isOlympiad ? "Olimpiada sertifikati" : "Mock test sertifikati"}
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 mb-6">
          {cert.source_title && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Test nomi</p>
                <p className="text-sm font-medium text-foreground">
                  {cert.source_title}
                </p>
              </div>
            </div>
          )}

          {cert.subject && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Fan / Sinf</p>
                <p className="text-sm font-medium text-foreground">
                  {cert.subject}
                  {cert.class ? ` / ${cert.class}-sinf` : ""}
                </p>
              </div>
            </div>
          )}

          {/* Score info */}
          {isOlympiad && cert.score > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Award className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Natija</p>
                <p className="text-sm font-medium text-foreground">
                  {cert.score}/{cert.max_score} ({cert.percentage}%)
                </p>
              </div>
            </div>
          )}

          {isMockRasch && (
            <>
              {cert.grade && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Award className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Baho</p>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`border-0 text-base font-bold px-3 py-0.5 ${getGradeColor(cert.grade)}`}
                      >
                        {cert.grade}
                      </Badge>
                      {cert.scaled_score > 0 && (
                        <span className="text-sm text-muted-foreground">
                          (Scaled: {cert.scaled_score})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {cert.percentage > 0 && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Award className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Foiz</p>
                    <p className="text-sm font-medium text-foreground">
                      {cert.percentage}%
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Certificate Details */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="h-3.5 w-3.5" />
            <span>Sertifikat raqami:</span>
            <span className="font-mono font-medium text-foreground">
              {cert.certificate_number}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Berilgan sana:</span>
            <span className="font-medium text-foreground">
              {new Date(cert.issued_at).toLocaleDateString("uz-UZ")}
            </span>
          </div>
          {cert.valid_until && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Amal qilish muddati:</span>
              <span className="font-medium text-foreground">
                {new Date(cert.valid_until).toLocaleDateString("uz-UZ")}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyCertificatePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyCertificateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);

    try {
      const res = await axios.get(
        `${API_URL}/certificates/verify/${encodeURIComponent(trimmed)}`
      );
      setResult(res.data?.data ?? res.data);
    } catch (err: unknown) {
      const apiErr = err as { response?: { status?: number } };
      if (apiErr.response?.status === 404) {
        setError("Sertifikat topilmadi");
      } else {
        setError("Xatolik yuz berdi. Qayta urinib ko'ring.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">NextOlymp</h1>
              <p className="text-xs text-muted-foreground">
                Sertifikat tekshirish
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sertifikatni tekshirish
          </h1>
          <p className="text-muted-foreground">
            Sertifikat raqami yoki tasdiqlash kodini kiriting
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleVerify} className="max-w-md mx-auto mb-10">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Sertifikat raqami yoki kodni kiriting..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 text-base"
            />
            <Button
              type="submit"
              disabled={loading || !code.trim()}
              size="lg"
              className="h-10 px-6"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-1.5">Tekshirish</span>
            </Button>
          </div>
        </form>

        {/* Results */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && result && <CertificateResultCard cert={result} />}

        {!loading && error && searched && (
          <Card className="border-red-300 dark:border-red-700 shadow-lg max-w-xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <ShieldX className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                {error}
              </h2>
              <p className="text-muted-foreground">
                Iltimos, sertifikat raqami yoki kodini tekshirib, qayta urinib
                ko&apos;ring.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        {!searched && (
          <div className="max-w-xl mx-auto mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Haqiqiy</p>
                <p className="text-xs text-muted-foreground">
                  Sertifikat tasdiqlangan
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <ShieldAlert className="h-6 w-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">
                  Bekor qilingan
                </p>
                <p className="text-xs text-muted-foreground">
                  Sertifikat amal qilmaydi
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <ShieldX className="h-6 w-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">
                  Topilmadi
                </p>
                <p className="text-xs text-muted-foreground">
                  Noto&apos;g&apos;ri kod kiritilgan
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
