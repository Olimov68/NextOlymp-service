const partners = [
  "UNICEF", "British Council", "Samsung", "Google Education",
  "Khan Academy", "UNESCO", "Coursera", "MIT OpenCourseWare",
];

export function PartnersSection() {
  return (
    <section id="partners" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm text-teal-700 mb-4">
            🤝 Hamkorlar
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Hamkorlar</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Xalqaro hamkorlarimiz va qo&apos;llab-quvvatlovchilar
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {partners.map((p) => (
            <div
              key={p}
              className="flex h-24 items-center justify-center rounded-xl border bg-white shadow-sm text-gray-600 font-semibold hover:shadow-md transition-shadow"
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
