"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAnnouncements } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export function AnnouncementsSection() {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });

  if (isLoading) return null;
  if (!announcements?.length) return null;

  return (
    <section id="announcements" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700 mb-4">
            📢 {"E'lonlar"}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{"E'lonlar"}</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            {"Eng so'nggi e'lonlar va muhim xabarlar"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((a) => (
            <Card key={a.id} className="hover:shadow-lg transition-shadow border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 mb-4">
                  <Megaphone className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{a.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3">{a.description}</p>
                <div className="mt-4 text-xs text-gray-400">
                  {new Date(a.createdAt).toLocaleDateString("uz-UZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
