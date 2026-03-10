export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                NO
              </div>
              <span className="text-xl font-bold text-white">NextOly</span>
            </div>
            <p className="text-sm">
              Xalqaro akademik olimpiadalarni tashkil etish va ularda ishtirok etish uchun professional platforma.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Platforma</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#olympiads" className="hover:text-white transition-colors">Olimpiadalar</a></li>
              <li><a href="#results" className="hover:text-white transition-colors">Natijalar</a></li>
              <li><a href="#news" className="hover:text-white transition-colors">Yangiliklar</a></li>
              <li><a href="#announcements" className="hover:text-white transition-colors">{"E'lonlar"}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{"Ma'lumot"}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="hover:text-white transition-colors">Biz haqimizda</a></li>
              <li><a href="#team" className="hover:text-white transition-colors">Jamoa</a></li>
              <li><a href="#rules" className="hover:text-white transition-colors">Nizomlar</a></li>
              <li><a href="#partners" className="hover:text-white transition-colors">Hamkorlar</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{"Bog'lanish"}</h3>
            <ul className="space-y-2 text-sm">
              <li>info@nextoly.com</li>
              <li>+998 90 123 45 67</li>
              <li>Toshkent, O&apos;zbekiston</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          &copy; {new Date().getFullYear()} NextOly. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  );
}
