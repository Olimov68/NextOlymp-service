"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

export type Lang = "uz" | "ru" | "en";

const translations: Record<Lang, Record<string, string>> = {
  uz: {
    // Header
    "nav.home": "Bosh sahifa",
    "nav.olympiads": "Olimpiadalar",
    "nav.materials": "Materiallar",
    "nav.announcements": "E'lonlar",
    "nav.news": "Yangiliklar",
    "nav.results": "Natijalar",
    "nav.team": "Jamoa",
    "nav.rules": "Nizomlar",
    "nav.organizers": "Tashkilotchilar",
    "nav.partners": "Hamkorlar",
    "nav.about": "Biz haqimizda",
    "nav.login": "Kirish",
    "nav.register": "Ro'yxatdan o'tish",
    "nav.logout": "Chiqish",
    "nav.profile": "Profil",
    "nav.dashboard": "Kabinet",

    // Hero
    "hero.badge": "Xalqaro Platforma",
    "hero.title": "NextOly — International Online Olympiad",
    "hero.desc": "Xalqaro akademik olimpiadalarni tashkil etish va ularda ishtirok etish uchun professional va xavfsiz platforma.",
    "hero.register": "Ro'yxatdan o'tish",
    "hero.view_olympiads": "Olimpiadalarni ko'rish",

    // Stats
    "stats.countries": "Mamlakatlar",
    "stats.students": "Jami ishtirokchilar",
    "stats.medals": "Berilgan medallar",
    "stats.volunteers": "Ko'ngillilar",

    // Olympiads
    "olympiads.title": "Olimpiadalar",
    "olympiads.desc": "Barcha fan olimpiadalariga qatnashing va o'z bilimingizni sinab ko'ring",
    "olympiads.free": "Bepul",
    "olympiads.paid": "Pullik",
    "olympiads.subject": "Fan",
    "olympiads.date": "Sana",
    "olympiads.current": "Joriy olimpiadalar",
    "olympiads.upcoming": "Kelgusi olimpiadalar",
    "olympiads.subjects": "Fanlar",
    "olympiads.details": "Batafsil",
    "olympiads.status.active": "Faol",
    "olympiads.status.upcoming": "Kutilmoqda",
    "olympiads.status.completed": "Yakunlangan",

    // Announcements
    "announcements.title": "E'lonlar",
    "announcements.desc": "Platformadagi muhim e'lonlar va yangilanishlar",

    // News
    "news.title": "So'nggi Yangiliklar",
    "news.desc": "NextOly platformasidagi eng oxirgi yangiliklar",
    "news.read_more": "Batafsil o'qish",

    // Results
    "results.title": "Natijalar",
    "results.desc": "Olimpiada natijalari va g'oliblar",
    "results.rank": "#",
    "results.name": "Ism",
    "results.country": "Mamlakat",
    "results.score": "Ball",
    "results.medal": "Medal",

    // Auth
    "auth.login": "Kirish",
    "auth.register": "Ro'yxatdan o'tish",
    "auth.username": "Foydalanuvchi nomi",
    "auth.password": "Parol",
    "auth.firstName": "Ism",
    "auth.lastName": "Familiya",
    "auth.email": "Email",
    "auth.region": "Viloyat",
    "auth.district": "Tuman",
    "auth.city": "Shahar",
    "auth.grade": "Sinf",
    "auth.have_account": "Akkauntingiz bormi?",
    "auth.no_account": "Akkauntingiz yo'qmi?",
    "auth.admin_login": "Admin kirish",
    "auth.student_login": "Talaba kirish",

    // Dashboard
    "dashboard.title": "Talaba kabineti",
    "dashboard.olympiads": "Olimpiadalar",
    "dashboard.news": "Yangiliklar",
    "dashboard.results": "Natijalar",
    "dashboard.profile": "Mening profilim",

    // Profile
    "profile.title": "Mening profilim",
    "profile.save": "Saqlash",
    "profile.saved": "Muvaffaqiyatli saqlandi!",

    // Testimonials
    "testimonials.badge": "Fikrlar",
    "testimonials.title": "Ishtirokchilar fikrlari",
    "testimonials.desc": "NextOly platformasi haqida o'quvchilarimizning fikrlari",

    // Team
    "team.title": "Bizning Jamoa",
    "team.desc": "NextOly platformasi ortidagi jamoamiz bilan tanishing",

    // About
    "about.badge": "Biz haqimizda",
    "about.title": "Biz haqimizda",
    "about.p1": "NextOly — bu xalqaro akademik olimpiadalarni onlayn formatda tashkil etish va o'tkazish uchun yaratilgan zamonaviy platforma.",
    "about.p2": "Biz 2023-yilda O'zbekistonda tashkil topgan bo'lib, bugungi kunga qadar 20 dan ortiq mamlakatda faoliyat yuritmoqdamiz. Platformamiz orqali 75,000 dan ortiq o'quvchi turli fan olimpiadalarida ishtirok etgan.",
    "about.p3": "Bizning maqsadimiz — har bir iqtidorli o'quvchiga geografik joylashuvidan qat'i nazar, xalqaro darajadagi olimpiadalarda qatnashish imkoniyatini yaratish.",
    "about.p4": "Platforma matematik, fizika, kimyo, biologiya va informatika fanlariga ixtisoslashgan bo'lib, kelgusida yangi fanlar ham qo'shilishi rejalashtirilgan.",

    // Features
    "features.badge": "Platforma imkoniyatlari",
    "features.title": "Nima uchun NextOly?",
    "features.desc": "Platformamiz zamonaviy texnologiyalar asosida qurilgan bo'lib, xavfsizlik, tezkorlik va qulaylikni ta'minlaydi.",

    // Footer
    "footer.desc": "Xalqaro akademik olimpiadalarni tashkil etish va ularda ishtirok etish uchun professional platforma.",
    "footer.platform": "Platforma",
    "footer.info": "Ma'lumot",
    "footer.contact": "Bog'lanish",
    "footer.rights": "Barcha huquqlar himoyalangan.",

    // Auth extra
    "auth.fill_all": "Barcha maydonlarni to'ldiring",
    "auth.join_platform": "NextOly platformasiga qo'shiling",
    "auth.select_region": "Viloyatni tanlang",
    "auth.select_district": "Tumanni tanlang",
    "auth.select_grade": "Sinfni tanlang",
    "auth.grade_suffix": "sinf",
    "auth.show_password": "Parolni ko'rsatish",

    // Features
    "features.badge": "Platforma imkoniyatlari",
    "features.title": "Nima uchun NextOly?",
    "features.desc": "Zamonaviy texnologiyalar asosida qurilgan xavfsiz va qulay platforma",

    // How it works
    "howit.badge": "Qanday ishlaydi?",
    "howit.title": "3 oddiy qadam",
    "howit.desc": "NextOly platformasida olimpiadaga qatnashish juda oson",

    // Testimonials
    "testimonials.badge": "Ishtirokchilar fikri",
    "testimonials.title": "Ishtirokchilar nima deyishadi?",
    "testimonials.desc": "Platformamiz foydalanuvchilarining haqiqiy fikrlari",

    // Results extra
    "results.no_results": "Natijalar topilmadi",

    // Common
    "common.loading": "Yuklanmoqda...",
    "common.error": "Xatolik yuz berdi",
    "common.save": "Saqlash",
    "common.cancel": "Bekor qilish",
    "common.delete": "O'chirish",
    "common.edit": "Tahrirlash",
    "common.create": "Yaratish",
    "common.search": "Qidirish",
    "common.back": "Ortga",
  },
  ru: {
    "nav.home": "Главная",
    "nav.olympiads": "Олимпиады",
    "nav.materials": "Материалы",
    "nav.announcements": "Объявления",
    "nav.news": "Новости",
    "nav.results": "Результаты",
    "nav.team": "Команда",
    "nav.rules": "Правила",
    "nav.organizers": "Организаторы",
    "nav.partners": "Партнёры",
    "nav.about": "О нас",
    "nav.login": "Войти",
    "nav.register": "Регистрация",
    "nav.logout": "Выйти",
    "nav.profile": "Профиль",
    "nav.dashboard": "Кабинет",

    "hero.badge": "Международная Платформа",
    "hero.title": "NextOly — International Online Olympiad",
    "hero.desc": "Профессиональная и безопасная платформа для организации и участия в международных академических олимпиадах.",
    "hero.register": "Регистрация",
    "hero.view_olympiads": "Смотреть олимпиады",

    "stats.countries": "Страны",
    "stats.students": "Всего участников",
    "stats.medals": "Выданные медали",
    "stats.volunteers": "Волонтёры",

    "olympiads.title": "Олимпиады",
    "olympiads.desc": "Участвуйте во всех предметных олимпиадах и проверьте свои знания",
    "olympiads.free": "Бесплатно",
    "olympiads.paid": "Платно",
    "olympiads.subject": "Предмет",
    "olympiads.date": "Дата",
    "olympiads.current": "Текущие олимпиады",
    "olympiads.upcoming": "Предстоящие олимпиады",
    "olympiads.subjects": "Предметы",
    "olympiads.details": "Подробнее",
    "olympiads.status.active": "Активна",
    "olympiads.status.upcoming": "Ожидается",
    "olympiads.status.completed": "Завершена",

    "announcements.title": "Объявления",
    "announcements.desc": "Важные объявления и обновления на платформе",

    "news.title": "Последние новости",
    "news.desc": "Самые свежие новости платформы NextOly",
    "news.read_more": "Читать далее",

    "results.title": "Результаты",
    "results.desc": "Результаты олимпиад и победители",
    "results.rank": "#",
    "results.name": "Имя",
    "results.country": "Страна",
    "results.score": "Балл",
    "results.medal": "Медаль",

    "auth.login": "Войти",
    "auth.register": "Регистрация",
    "auth.username": "Имя пользователя",
    "auth.password": "Пароль",
    "auth.firstName": "Имя",
    "auth.lastName": "Фамилия",
    "auth.email": "Электронная почта",
    "auth.region": "Область",
    "auth.district": "Район",
    "auth.city": "Город",
    "auth.grade": "Класс",
    "auth.have_account": "Уже есть аккаунт?",
    "auth.no_account": "Нет аккаунта?",
    "auth.admin_login": "Вход для админа",
    "auth.student_login": "Вход для ученика",

    "dashboard.title": "Кабинет ученика",
    "dashboard.olympiads": "Олимпиады",
    "dashboard.news": "Новости",
    "dashboard.results": "Результаты",
    "dashboard.profile": "Мой профиль",

    "profile.title": "Мой профиль",
    "profile.save": "Сохранить",
    "profile.saved": "Успешно сохранено!",

    // Testimonials
    "testimonials.badge": "Отзывы",
    "testimonials.title": "Отзывы участников",
    "testimonials.desc": "Что говорят наши ученики о платформе NextOly",

    "team.title": "Наша Команда",
    "team.desc": "Познакомьтесь с командой, стоящей за платформой NextOly",

    "about.badge": "О нас",
    "about.title": "О нас",
    "about.p1": "NextOly — это современная платформа для организации и проведения международных академических олимпиад в онлайн-формате.",
    "about.p2": "Мы были основаны в 2023 году в Узбекистане и на сегодняшний день работаем более чем в 20 странах. Через нашу платформу более 75 000 учеников приняли участие в различных предметных олимпиадах.",
    "about.p3": "Наша цель — дать возможность каждому талантливому ученику участвовать в олимпиадах международного уровня, независимо от географического расположения.",
    "about.p4": "Платформа специализируется на математике, физике, химии, биологии и информатике, в будущем планируется добавление новых предметов.",

    // Features
    "features.badge": "Возможности платформы",
    "features.title": "Почему NextOly?",
    "features.desc": "Наша платформа построена на современных технологиях, обеспечивая безопасность, скорость и удобство.",

    "footer.desc": "Профессиональная платформа для организации и участия в международных академических олимпиадах.",
    "footer.platform": "Платформа",
    "footer.info": "Информация",
    "footer.contact": "Контакты",
    "footer.rights": "Все права защищены.",

    "auth.fill_all": "Заполните все поля",
    "auth.join_platform": "Присоединяйтесь к платформе NextOly",
    "auth.select_region": "Выберите область",
    "auth.select_district": "Выберите район",
    "auth.select_grade": "Выберите класс",
    "auth.grade_suffix": "класс",
    "auth.show_password": "Показать пароль",

    "features.badge": "Возможности платформы",
    "features.title": "Почему NextOly?",
    "features.desc": "Безопасная и удобная платформа, построенная на современных технологиях",

    "howit.badge": "Как это работает?",
    "howit.title": "3 простых шага",
    "howit.desc": "Участвовать в олимпиаде на платформе NextOly очень просто",

    "testimonials.badge": "Отзывы участников",
    "testimonials.title": "Что говорят участники?",
    "testimonials.desc": "Реальные отзывы пользователей нашей платформы",

    "results.no_results": "Результаты не найдены",

    "common.loading": "Загрузка...",
    "common.error": "Произошла ошибка",
    "common.save": "Сохранить",
    "common.cancel": "Отмена",
    "common.delete": "Удалить",
    "common.edit": "Редактировать",
    "common.create": "Создать",
    "common.search": "Поиск",
    "common.back": "Назад",
  },
  en: {
    "nav.home": "Home",
    "nav.olympiads": "Olympiads",
    "nav.materials": "Materials",
    "nav.announcements": "Announcements",
    "nav.news": "News",
    "nav.results": "Results",
    "nav.team": "Team",
    "nav.rules": "Rules",
    "nav.organizers": "Organizers",
    "nav.partners": "Partners",
    "nav.about": "About Us",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.logout": "Logout",
    "nav.profile": "Profile",
    "nav.dashboard": "Dashboard",

    "hero.badge": "International Platform",
    "hero.title": "NextOly — International Online Olympiad",
    "hero.desc": "A professional and secure platform for organizing and participating in international academic olympiads.",
    "hero.register": "Register",
    "hero.view_olympiads": "View Olympiads",

    "stats.countries": "Countries",
    "stats.students": "Total participants",
    "stats.medals": "Medals awarded",
    "stats.volunteers": "Volunteers",

    "olympiads.title": "Olympiads",
    "olympiads.desc": "Participate in all subject olympiads and test your knowledge",
    "olympiads.free": "Free",
    "olympiads.paid": "Paid",
    "olympiads.subject": "Subject",
    "olympiads.date": "Date",
    "olympiads.current": "Current Olympiads",
    "olympiads.upcoming": "Upcoming Olympiads",
    "olympiads.subjects": "Subjects",
    "olympiads.details": "Details",
    "olympiads.status.active": "Active",
    "olympiads.status.upcoming": "Upcoming",
    "olympiads.status.completed": "Completed",

    "announcements.title": "Announcements",
    "announcements.desc": "Important announcements and updates on the platform",

    "news.title": "Latest News",
    "news.desc": "The latest news from NextOly platform",
    "news.read_more": "Read more",

    "results.title": "Results",
    "results.desc": "Olympiad results and winners",
    "results.rank": "#",
    "results.name": "Name",
    "results.country": "Country",
    "results.score": "Score",
    "results.medal": "Medal",

    "auth.login": "Login",
    "auth.register": "Register",
    "auth.username": "Username",
    "auth.password": "Password",
    "auth.firstName": "First Name",
    "auth.lastName": "Last Name",
    "auth.email": "Email",
    "auth.region": "Region",
    "auth.district": "District",
    "auth.city": "City",
    "auth.grade": "Grade",
    "auth.have_account": "Already have an account?",
    "auth.no_account": "Don't have an account?",
    "auth.admin_login": "Admin login",
    "auth.student_login": "Student login",

    "dashboard.title": "Student Dashboard",
    "dashboard.olympiads": "Olympiads",
    "dashboard.news": "News",
    "dashboard.results": "Results",
    "dashboard.profile": "My Profile",

    "profile.title": "My Profile",
    "profile.save": "Save",
    "profile.saved": "Successfully saved!",

    // Testimonials
    "testimonials.badge": "Testimonials",
    "testimonials.title": "What Our Students Say",
    "testimonials.desc": "Hear from students who have participated through the NextOly platform",

    "team.title": "Our Team",
    "team.desc": "Meet the team behind the NextOly platform",

    "about.badge": "About Us",
    "about.title": "About Us",
    "about.p1": "NextOly is a modern platform designed to organize and conduct international academic olympiads in an online format.",
    "about.p2": "Founded in 2023 in Uzbekistan, we now operate in more than 20 countries. Over 75,000 students have participated in various subject olympiads through our platform.",
    "about.p3": "Our goal is to give every talented student the opportunity to participate in international-level olympiads, regardless of geographical location.",
    "about.p4": "The platform specializes in mathematics, physics, chemistry, biology, and computer science, with plans to add new subjects in the future.",

    // Features
    "features.badge": "Platform Features",
    "features.title": "Why NextOly?",
    "features.desc": "Our platform is built on modern technologies, ensuring security, speed, and convenience.",

    "footer.desc": "A professional platform for organizing and participating in international academic olympiads.",
    "footer.platform": "Platform",
    "footer.info": "Information",
    "footer.contact": "Contact",
    "footer.rights": "All rights reserved.",

    "auth.fill_all": "Please fill in all fields",
    "auth.join_platform": "Join the NextOly platform",
    "auth.select_region": "Select region",
    "auth.select_district": "Select district",
    "auth.select_grade": "Select grade",
    "auth.grade_suffix": "grade",
    "auth.show_password": "Show password",

    "features.badge": "Platform Features",
    "features.title": "Why NextOly?",
    "features.desc": "A secure and convenient platform built on modern technologies",

    "howit.badge": "How It Works?",
    "howit.title": "3 Simple Steps",
    "howit.desc": "Participating in an olympiad on the NextOly platform is very easy",

    "testimonials.badge": "Testimonials",
    "testimonials.title": "What Participants Say?",
    "testimonials.desc": "Real feedback from our platform users",

    "results.no_results": "No results found",

    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.create": "Create",
    "common.search": "Search",
    "common.back": "Back",
  },
};

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "uz",
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Lang;
    if (stored && ["uz", "ru", "en"].includes(stored)) {
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  }, []);

  const t = useCallback(
    (key: string) => translations[lang]?.[key] || translations.uz[key] || key,
    [lang]
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
