import { Card, CardContent } from "@/components/ui/card";

const team = [
  {
    name: "Shahboz Toshqulov",
    role: "Co-founder & CEO",
    desc: "Education technology entrepreneur with 10+ years in academic olympiads.",
    initials: "ST",
    color: "bg-blue-600",
  },
  {
    name: "Asilbek Olimov",
    role: "Co-founder & CTO",
    desc: "Software engineer and former international olympiad champion.",
    initials: "AO",
    color: "bg-indigo-600",
  },
  {
    name: "Nilufar Rashidova",
    role: "Academic Director",
    desc: "PhD in Mathematics, lead organizer of national olympiads.",
    initials: "NR",
    color: "bg-purple-600",
  },
  {
    name: "Bobur Xasanov",
    role: "Head of Design",
    desc: "UI/UX designer specializing in educational platforms.",
    initials: "BX",
    color: "bg-teal-600",
  },
  {
    name: "Zulfiya Yusupova",
    role: "Community Manager",
    desc: "Connects students, schools and institutions across 20 countries.",
    initials: "ZY",
    color: "bg-green-600",
  },
  {
    name: "Jasur Mirzayev",
    role: "Content Lead",
    desc: "Develops olympiad problems and educational materials.",
    initials: "JM",
    color: "bg-amber-600",
  },
];

export function TeamSection() {
  return (
    <section id="team" className="py-20 bg-gray-50/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm text-purple-700 mb-4">
            👥 Team
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Bizning Jamoa</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            NextOly platformasi ortidagi jamoamiz bilan tanishing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member) => (
            <Card key={member.name} className="hover:shadow-lg transition-shadow border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${member.color} text-white font-bold`}>
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-blue-600">{member.role}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{member.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
