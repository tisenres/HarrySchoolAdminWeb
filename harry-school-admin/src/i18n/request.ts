import { getRequestConfig } from 'next-intl/server';
import enMessages from '../../messages/en.json';
import ruMessages from '../../messages/ru.json';
import uzMessages from '../../messages/uz.json';

export default getRequestConfig(async ({ locale }) => {
  const validLocales = ['en', 'ru', 'uz'];
  const validLocale = validLocales.includes(locale) ? locale : 'en';
  
  const messages = {
    en: enMessages,
    ru: ruMessages,
    uz: uzMessages
  }[validLocale as 'en' | 'ru' | 'uz'];

  return {
    locale: validLocale,
    messages
  };
});