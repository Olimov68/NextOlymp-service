"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStats, fetchOlympiads, fetchNews, fetchAnnouncements, fetchUsers } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Users, Medal, Heart, Trophy, Newspaper, Megaphone } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats });
  const { data: olympiads } = useQuery({ queryKey: ["olympiads"], queryFn: fetchOlympiads });
  const { data: news } = useQuery({ queryKey: ["news"], queryFn: fetchNews });
  const { data: announcements } = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements });
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const cards = [
    { label: "Mamlakatlar", value: stats?.countries, icon: Globe, color: "text-blue-600 bg-blue-50" },
    { label: "Ishtirokchilar", value: stats?.students, icon: Users, color: "text-green-600 bg-green-50" },
    { label: "Medallar", value: stats?.medals, icon: Medal, color: "text-amber-600 bg-amber-50" },
    { label: "Ko'ngillilar", value: stats?.volunteers, icon: Heart, color: "text-pink-600 bg-pink-50" },
    { label: "Olimpiadalar", value: olympiads?.length, icon: Trophy, color: "text-purple-600 bg-purple-50" },
    { label: "Yangiliklar", value: news?.length, icon: Newspaper, color: "text-teal-600 bg-teal-50" },
    { label: "E'lonlar", value: announcements?.length, icon: Megaphone, color: "text-indigo-600 bg-indigo-50" },
    { label: "Foydalanuvchilar", value: users?.length, icon: Users, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{card.label}</CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.value != null ? card.value.toLocaleString() : "..."}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
