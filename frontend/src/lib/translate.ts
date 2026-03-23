import { Lang } from "./i18n";

const cache = new Map<string, string>();

/**
 * Translate text using MyMemory free API
 * Free: 5000 chars/day without key
 */
export async function translateText(
  text: string,
  from: string,
  to: string
): Promise<string> {
  if (!text || from === to) return text;

  const cacheKey = `${from}:${to}:${text}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    const langPair = `${from}|${to}`;
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${langPair}`
    );
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (translated && translated !== text) {
      cache.set(cacheKey, translated);
      return translated;
    }
    return text;
  } catch {
    return text;
  }
}

/**
 * Hook-friendly: translate multiple fields at once
 */
export async function translateFields(
  fields: Record<string, string>,
  targetLang: Lang
): Promise<Record<string, string>> {
  if (targetLang === "uz") return fields;

  const langMap: Record<string, string> = { uz: "uz", ru: "ru", en: "en" };
  const to = langMap[targetLang] || "en";

  const entries = Object.entries(fields);
  const results = await Promise.all(
    entries.map(async ([key, value]) => {
      const translated = await translateText(value, "uz", to);
      return [key, translated] as [string, string];
    })
  );

  return Object.fromEntries(results);
}
