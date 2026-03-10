import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

const organizers = [
  {
    name: "NextOly Foundation",
    desc: "Xalqaro olimpiadalar tashkilotchisi va asosiy platforma.",
  },
  {
    name: "O'zbekiston Matematika Jamiyati",
    desc: "Matematika fani bo'yicha olimpiadalar hamkori.",
  },
  {
    name: "Central Asian Academic Council",
    desc: "Markaziy Osiyo mintaqasidagi akademik hamkorlik kengashi.",
  },
];

export function OrganizersSection() {
  return (
    <section id="organizers" className="py-20 bg-gray-50/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700 mb-4">
            🏛️ Tashkilotchilar
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tashkilotchilar</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {organizers.map((org) => (
            <Card key={org.name} className="hover:shadow-lg transition-shadow border-0 shadow-sm text-center">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50">
                  <Building2 className="h-7 w-7 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{org.name}</h3>
                <p className="text-sm text-gray-500">{org.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
