export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-gray-50/50">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm text-sky-700 mb-4">
            ℹ️ Biz haqimizda
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Biz haqimizda</h2>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm space-y-4 text-gray-600 leading-relaxed">
          <p>
            <strong className="text-gray-900">NextOly</strong> — bu xalqaro akademik olimpiadalarni onlayn formatda tashkil etish va o&apos;tkazish uchun yaratilgan zamonaviy platforma.
          </p>
          <p>
            Biz 2023-yilda O&apos;zbekistonda tashkil topgan bo&apos;lib, bugungi kunga qadar 20 dan ortiq mamlakatda faoliyat yuritmoqdamiz. Platformamiz orqali 75,000 dan ortiq o&apos;quvchi turli fan olimpiadalarida ishtirok etgan.
          </p>
          <p>
            Bizning maqsadimiz — har bir iqtidorli o&apos;quvchiga geografik joylashuvidan qat&apos;i nazar, xalqaro darajadagi olimpiadalarda qatnashish imkoniyatini yaratish.
          </p>
          <p>
            Platforma matematik, fizika, kimyo, biologiya va informatika fanlariga ixtisoslashgan bo&apos;lib, kelgusida yangi fanlar ham qo&apos;shilishi rejalashtirilgan.
          </p>
        </div>
      </div>
    </section>
  );
}
