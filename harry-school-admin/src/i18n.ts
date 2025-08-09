import { getRequestConfig } from 'next-intl/server';
import enMessages from '../messages/en.json';

export const locales = ['en', 'ru', 'uz'] as const;
export const defaultLocale = 'en' as const;

export type Locale = typeof locales[number];

export default getRequestConfig(async ({ locale }) => {
  return {
    messages: enMessages
  };
});

// This function is not needed when using next-intl with app router
// The locale is handled automatically by the middleware and routing