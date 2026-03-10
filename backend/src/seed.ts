import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@nextoly.com" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "NextOly",
      username: "admin",
      email: "admin@nextoly.com",
      password: adminPassword,
      role: "admin",
      country: "UZ",
      region: "Toshkent",
      district: "Mirzo Ulug'bek",
      city: "Toshkent",
      grade: "-",
    },
  });
  console.log("Admin created:", admin.username);

  // Create sample users
  const userPassword = await bcrypt.hash("user123", 10);
  const countries = ["UZ", "KZ", "KR", "US", "GB", "DE", "FR", "JP", "CN", "IN"];
  const regions = ["Toshkent", "Samarqand", "Buxoro", "Farg'ona", "Andijon", "Namangan", "Xorazm", "Qashqadaryo", "Surxondaryo", "Navoiy"];
  const firstNames = [
    "Alisher", "Dilnoza", "Bekzod", "Kamola", "Sardor",
    "Nodira", "Javlon", "Malika", "Sherzod", "Gulnora",
    "Timur", "Sevinch", "Rustam", "Mohira", "Oybek",
  ];
  const lastNames = [
    "Karimov", "Sultanova", "Toshmatov", "Mirzayeva", "Rahimov",
    "Usmonova", "Abdullayev", "Xasanova", "Normatov", "Azimova",
    "Ismoilov", "Nazarova", "Kamolov", "Yuldasheva", "Tursunov",
  ];

  const users = [];
  for (let i = 0; i < firstNames.length; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i + 1}@nextoly.com` },
      update: {},
      create: {
        firstName: firstNames[i],
        lastName: lastNames[i],
        username: `student${i + 1}`,
        email: `user${i + 1}@nextoly.com`,
        password: userPassword,
        country: countries[i % countries.length],
        region: regions[i % regions.length],
        district: "Tuman",
        city: "Shahar",
        grade: `${7 + (i % 5)}`,
        role: "user",
      },
    });
    users.push(user);
  }
  console.log(`Created ${users.length} users`);

  // Create stats
  await prisma.stats.deleteMany();
  await prisma.stats.create({
    data: { countries: 20, students: 75234, medals: 1034, volunteers: 210 },
  });
  console.log("Stats created");

  // Create olympiads
  const olympiads = await Promise.all([
    prisma.olympiad.create({
      data: {
        title: "Mathematics Olympiad",
        subject: "Mathematics",
        description: "Xalqaro matematika olimpiadasi. Algebra, geometriya, sonlar nazariyasi va kombinatorika mavzulari bo'yicha savollar.",
        price: 0,
        status: "active",
        startDate: new Date("2025-03-15"),
        endDate: new Date("2025-03-20"),
      },
    }),
    prisma.olympiad.create({
      data: {
        title: "Physics Olympiad",
        subject: "Physics",
        description: "Mexanika, termodinamika, elektr va optika mavzulari bo'yicha xalqaro fizika olimpiadasi.",
        price: 0,
        status: "active",
        startDate: new Date("2025-04-05"),
        endDate: new Date("2025-04-10"),
      },
    }),
    prisma.olympiad.create({
      data: {
        title: "Chemistry Olympiad",
        subject: "Chemistry",
        description: "Organik va noorganik kimyo, analitik kimyo mavzulari bo'yicha olimpiada.",
        price: 15000,
        status: "upcoming",
        startDate: new Date("2025-04-20"),
        endDate: new Date("2025-04-25"),
      },
    }),
    prisma.olympiad.create({
      data: {
        title: "Biology Olympiad",
        subject: "Biology",
        description: "Zoologiya, botanika, genetika va ekologiya mavzulari bo'yicha biologiya olimpiadasi.",
        price: 0,
        status: "upcoming",
        startDate: new Date("2025-05-10"),
        endDate: new Date("2025-05-15"),
      },
    }),
    prisma.olympiad.create({
      data: {
        title: "Informatics Olympiad",
        subject: "Informatics",
        description: "Algoritmlar, dasturlash va ma'lumotlar tuzilmalari bo'yicha informatika olimpiadasi.",
        price: 20000,
        status: "upcoming",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-05"),
      },
    }),
  ]);
  console.log(`Created ${olympiads.length} olympiads`);

  // Create sample questions for Math olympiad
  const mathOlympiad = olympiads[0];
  await prisma.question.createMany({
    data: [
      {
        olympiadId: mathOlympiad.id,
        text: "Agar 2x + 5 = 15 bo'lsa, x ning qiymati nechaga teng?",
        options: JSON.stringify(["3", "5", "7", "10"]),
        correctIdx: 1,
        points: 5,
        orderNum: 1,
      },
      {
        olympiadId: mathOlympiad.id,
        text: "Uchburchakning ichki burchaklari yig'indisi necha gradus?",
        options: JSON.stringify(["90°", "180°", "270°", "360°"]),
        correctIdx: 1,
        points: 5,
        orderNum: 2,
      },
      {
        olympiadId: mathOlympiad.id,
        text: "256 ning kvadrat ildizi nechaga teng?",
        options: JSON.stringify(["12", "14", "16", "18"]),
        correctIdx: 2,
        points: 5,
        orderNum: 3,
      },
    ],
  });
  console.log("Sample questions created");

  // Create results
  const medals = ["Gold", "Gold", "Silver", "Silver", "Silver", "Bronze", "Bronze", "Bronze", "", "", "", "", "", "", ""];
  const subjects = ["mathematics", "physics"];

  for (const subject of subjects) {
    const olympiad = olympiads.find((o) => o.subject.toLowerCase() === subject);
    if (!olympiad) continue;

    for (let i = 0; i < users.length; i++) {
      await prisma.result.create({
        data: {
          userId: users[i].id,
          olympiadId: olympiad.id,
          subject,
          score: Math.max(10, 100 - i * 6 - Math.floor(Math.random() * 5)),
          medal: medals[i] || "",
          country: users[i].country,
        },
      });
    }
  }
  console.log("Results created");

  // Create announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: "Ro'yxatdan o'tish boshlandi",
        description: "2025-yil bahor mavsumi uchun barcha olimpiadalarga ro'yxatdan o'tish boshlandi. Shoshiling, joylar cheklangan!",
      },
      {
        title: "Yangi fanlar qo'shildi",
        description: "Informatika va Biologiya fanlari bo'yicha olimpiadalar ham qo'shildi. Barcha ishtirokchilar uchun yangi imkoniyatlar!",
      },
      {
        title: "Sertifikatlar tayyor",
        description: "O'tgan mavsumdagi barcha ishtirokchilar uchun elektron sertifikatlar tayyor. Shaxsiy kabinetingizdan yuklab oling.",
      },
    ],
  });
  console.log("Announcements created");

  // Create news
  await prisma.news.createMany({
    data: [
      {
        title: "NextOly 20 mamlakat bilan hamkorlikni kengaytirdi",
        description: "Platform endi Markaziy Osiyo, Yevropa va Shimoliy Afrikadagi 20+ mamlakatda faoliyat yuritmoqda.",
        image: "",
      },
      {
        title: "O'quvchilarimiz xalqaro musobaqada g'olib keldi",
        description: "NextOly platformasi orqali tayyorlangan o'quvchilarimiz xalqaro olimpiadada 15 ta medal qo'lga kiritdi.",
        image: "",
      },
      {
        title: "Yangi sertifikat tizimi ishga tushirildi",
        description: "Olimpiada g'oliblariga raqamli va bosma sertifikatlar berilishi yo'lga qo'yildi.",
        image: "",
      },
    ],
  });
  console.log("News created");

  console.log("\nSeed completed successfully!");
  console.log("Admin login: admin / admin123");
  console.log("Student login: student1 / user123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
