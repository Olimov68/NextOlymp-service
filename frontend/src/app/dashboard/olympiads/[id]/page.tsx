"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOlympiad } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, BookOpen, FileText } from "lucide-react";

export default function OlympiadDetailPage() {
  const params = useParams();
  const { t } = useI18n();
  const id = Number(params.id);

  const { data: olympiad, isLoading } = useQuery({
    queryKey: ["olympiad", id],
    queryFn: () => fetchOlympiad(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-gray-400 p-8 text-center">{t("common.loading")}</div>;
  }

  if (!olympiad) {
    return <div className="text-gray-400 p-8 text-center">Olimpiada topilmadi</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{olympiad.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {olympiad.subject}
                </div>
                {olympiad.startDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(olympiad.startDate).toLocaleDateString()} - {olympiad.endDate ? new Date(olympiad.endDate).toLocaleDateString() : ""}
                  </div>
                )}
              </div>
            </div>
            <Badge className={`${olympiad.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"} border-0`}>
              {t(`olympiads.status.${olympiad.status}`) || olympiad.status}
            </Badge>
          </div>

          {olympiad.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Tavsif
              </h3>
              <p className="text-gray-600 leading-relaxed">{olympiad.description}</p>
            </div>
          )}

          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              Narx:{" "}
              {olympiad.price === 0 ? (
                <span className="text-green-600 font-medium">{t("olympiads.free")}</span>
              ) : (
                <span className="text-orange-600 font-medium">{olympiad.price.toLocaleString()} so&apos;m</span>
              )}
            </div>
            {olympiad._count && (
              <div className="text-sm text-gray-500">
                Savollar: <span className="font-medium">{olympiad._count.questions}</span>
              </div>
            )}
          </div>

          {olympiad.status === "active" && (
            <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
              Olimpiadaga kirish
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
