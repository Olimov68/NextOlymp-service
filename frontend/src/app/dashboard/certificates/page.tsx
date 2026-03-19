"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  Calendar,
  Shield,
  Hash,
  Download,
  Copy,
  Check,
  FileX,
} from "lucide-react";
import {
  listCertificates,
  downloadMyCertificatePDF,
  type Certificate,
} from "@/lib/user-api";
import { toast } from "sonner";

function getGradeColor(grade: string) {
  switch (grade) {
    case "A+":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400";
    case "A":
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
    case "B+":
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400";
    case "B":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
    case "C+":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400";
    case "C":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
}

function CertificateCard({ cert }: { cert: Certificate }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isOlympiad =
    cert.certificate_type === "olympiad" || cert.source_type === "olympiad";
  const isMockRasch =
    cert.certificate_type === "mock_rasch" || cert.source_type === "mock_test";
  const isRevoked = cert.status === "revoked";
  const isActive = cert.status === "active" || !cert.status;

  const copyCode = async () => {
    const code = cert.verification_code || cert.certificate_number;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Nusxalandi!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nusxalab bo'lmadi");
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadMyCertificatePDF(cert.id);
      toast.success("PDF yuklab olindi");
    } catch {
      toast.error("PDF yuklab olib bo'lmadi");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card
      className={`border-0 shadow-sm hover:shadow-md transition-shadow ${
        isRevoked ? "opacity-75" : ""
      }`}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex items-center gap-2">
            {/* Status badge */}
            <Badge
              className={`border-0 ${
                isRevoked
                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
              }`}
            >
              {isRevoked ? "Bekor qilingan" : "Faol"}
            </Badge>
            {/* Type badge */}
            <Badge
              className={`border-0 ${
                isOlympiad
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
              }`}
            >
              {isOlympiad ? "Olimpiada" : "Mock test"}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground mb-1">{cert.title}</h3>
        {cert.source_title && (
          <p className="text-sm text-muted-foreground mb-3">
            {cert.source_title}
          </p>
        )}

        {/* Grade for mock_rasch */}
        {isMockRasch && cert.grade && (
          <div className="mb-3 flex items-center gap-2">
            <Badge
              className={`border-0 text-lg font-bold px-3 py-1 ${getGradeColor(cert.grade)}`}
            >
              {cert.grade}
            </Badge>
            {cert.scaled_score > 0 && (
              <span className="text-sm text-muted-foreground">
                Scaled: {cert.scaled_score}
              </span>
            )}
          </div>
        )}

        {/* Score */}
        {isOlympiad && cert.score > 0 && (
          <div className="mb-3 p-2 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ball:</span>
              <span className="font-semibold text-foreground">
                {cert.score}
                {cert.max_score ? `/${cert.max_score}` : ""} ({cert.percentage}
                %)
              </span>
            </div>
          </div>
        )}

        {isMockRasch && cert.percentage > 0 && !cert.grade && (
          <div className="mb-3 p-2 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Natija:</span>
              <span className="font-semibold text-foreground">
                {cert.percentage}%
              </span>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm">
          {/* Certificate number */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">
              {cert.certificate_number || cert.verification_code}
            </span>
          </div>

          {/* Verification code with copy */}
          {cert.verification_code && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span className="font-mono text-xs flex-1">
                {cert.verification_code}
              </span>
              <button
                onClick={copyCode}
                className="p-1 rounded hover:bg-muted transition-colors"
                title="Nusxalash"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}

          {/* Issued date */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(cert.issued_at || cert.created_at).toLocaleDateString(
              "uz-UZ"
            )}
          </div>

          {/* Valid until */}
          {cert.valid_until && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Amal qilish muddati:{" "}
                {new Date(cert.valid_until).toLocaleDateString("uz-UZ")}
              </span>
            </div>
          )}
        </div>

        {/* Download PDF button */}
        {!isRevoked && (
          <div className="mt-4 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {downloading ? "Yuklanmoqda..." : "PDF yuklash"}
            </Button>
          </div>
        )}

        {/* Revoked notice */}
        {isRevoked && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <FileX className="h-3.5 w-3.5" />
              <span>Sertifikat bekor qilingan - yuklash mumkin emas</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCertificates()
      .then((data) => setCertificates(Array.isArray(data) ? data : []))
      .catch(() => setCertificates([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sertifikatlar</h1>
        <p className="text-muted-foreground mt-1">
          Olimpiada va mock testlardagi yutuqlaringiz uchun sertifikatlar
        </p>
      </div>

      {certificates.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Hozircha sertifikat yo&apos;q
            </p>
            <p className="text-sm text-muted-foreground">
              Olimpiada va mock testlarda qatnashib, sertifikat oling
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <CertificateCard key={cert.id} cert={cert} />
          ))}
        </div>
      )}
    </div>
  );
}
