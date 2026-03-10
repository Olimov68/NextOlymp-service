"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOlympiads } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Atom, FlaskConical, Leaf, Code } from "lucide-react";

const subjectIcons: Record<string, React.ReactNode> = {
  Mathematics: <BookOpen className="h-6 w-6" />,
  Physics: <Atom className="h-6 w-6" />,
  Chemistry: <FlaskConical className="h-6 w-6" />,
  Biology: <Leaf className="h-6 w-6" />,
  Informatics: <Code className="h-6 w-6" />,
};

const subjectColors: Record<string, string> = {
  Mathematics: "bg-blue-50 text-blue-600",
  Physics: "bg-purple-50 text-purple-600",
  Chemistry: "bg-green-50 text-green-600",
  Biology: "bg-orange-50 text-orange-600",
  Informatics: "bg-pink-50 text-pink-600",
};

export function OlympiadsSection() {
  const { data: olympiads, isLoading } = useQuery({
    queryKey: ["olympiads"],
    queryFn: fetchOlympiads,
  });

  return (
    <section id="olympiads" className="py-20 bg-gray-50/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm text-amber-700 mb-4">
            🏆 Olympiads
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Olimpiadalar</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            {"Barcha fan olimpiadalariga qatnashing va o'z bilimingizni sinab ko'ring"}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-gray-200 mb-4" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {olympiads?.map((o) => (
              <Card key={o.id} className="hover:shadow-lg transition-shadow border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${subjectColors[o.subject] || "bg-gray-50 text-gray-600"}`}>
                      {subjectIcons[o.subject] || <BookOpen className="h-6 w-6" />}
                    </div>
                    <Badge variant={o.price === 0 ? "default" : "secondary"} className={o.price === 0 ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-orange-100 text-orange-700 hover:bg-orange-100"}>
                      {o.price === 0 ? "Bepul" : "Pullik"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{o.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Fan: {o.subject}
                    </div>
                    {o.startDate && (
                      <div className="flex items-center gap-2">
                        📅 Sana: {new Date(o.startDate).toLocaleDateString("uz-UZ")}
                        {o.endDate && ` - ${new Date(o.endDate).toLocaleDateString("uz-UZ")}`}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{o.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
