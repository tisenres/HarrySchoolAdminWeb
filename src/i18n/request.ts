import { getRequestConfig } from 'next-intl/server';

const validLocales = ['en', 'ru', 'uz'] as const;
type Locale = typeof validLocales[number];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validLocale = validLocales.includes(locale as Locale) ? locale as Locale : 'en';
  
  // Dynamic import only the required locale messages
  // This reduces bundle size as only the needed locale is loaded
  let messages;
  try {
    messages = (await import(`../../messages/${validLocale}.json`)).default;
  } catch (error) {
    console.warn(`Failed to load messages for locale ${validLocale}, falling back to English`);
    messages = (await import(`../../messages/en.json`)).default;
  }

  return {
    locale: validLocale,
    messages,
    // Optional: Add timezone and other locale-specific configs
    timeZone: validLocale === 'uz' ? 'Asia/Tashkent' : 'UTC',
  };
});