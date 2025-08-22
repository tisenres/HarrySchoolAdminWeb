import moment, { Moment } from 'moment';
import 'moment/locale/ru';
import 'moment/locale/uz-latn';
import { getCurrentLanguage, SupportedLanguage } from './index';

// Hijri calendar support (for future Islamic calendar integration)
interface HijriDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
  formatted: string;
}

// Islamic months in different languages
const islamicMonths = {
  en: [
    'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
    'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
  ],
  ru: [
    'Мухаррам', 'Сафар', 'Раби аль-авваль', 'Раби ас-сани',
    'Джумада аль-авваль', 'Джумада ас-сани', 'Раджаб', 'Шаабан',
    'Рамадан', 'Шавваль', 'Зуль-каада', 'Зуль-хиджа'
  ],
  uz: [
    'Muharram', 'Safar', 'Rabiul-avval', 'Rabius-soniy',
    'Jumadal-avval', 'Jumadas-soniy', 'Rajab', 'Sha\'bon',
    'Ramazon', 'Shavvol', 'Zulqada', 'Zulhijja'
  ]
};

// Prayer times names
const prayerNames = {
  en: {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr', 
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha'
  },
  ru: {
    fajr: 'Фаджр',
    dhuhr: 'Зухр',
    asr: 'Аср', 
    maghrib: 'Магриб',
    isha: 'Иша'
  },
  uz: {
    fajr: 'Bomdod',
    dhuhr: 'Peshin',
    asr: 'Asr',
    maghrib: 'Shom', 
    isha: 'Xufton'
  }
};

// Day names in different languages
const dayNames = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
};

// Month names in different languages
const monthNames = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  ru: [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ],
  uz: [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ]
};

// Set moment locale based on current language
export const setMomentLocale = (language?: SupportedLanguage): void => {
  const lang = language || getCurrentLanguage();
  
  switch (lang) {
    case 'ru':
      moment.locale('ru');
      break;
    case 'uz':
      moment.locale('uz-latn');
      break;
    default:
      moment.locale('en');
      break;
  }
};

// Format date according to current locale
export const formatDate = (
  date: Date | string | number | Moment,
  format?: string,
  language?: SupportedLanguage
): string => {
  const lang = language || getCurrentLanguage();
  const momentDate = moment(date);
  
  // Set locale
  momentDate.locale(lang === 'uz' ? 'uz-latn' : lang);
  
  // Default formats based on language
  const defaultFormats = {
    en: 'MMM D, YYYY',
    ru: 'D MMMM YYYY г.',
    uz: 'D MMMM, YYYY',
  };
  
  return momentDate.format(format || defaultFormats[lang]);
};

// Format time according to current locale
export const formatTime = (
  date: Date | string | number | Moment,
  format?: string,
  language?: SupportedLanguage
): string => {
  const lang = language || getCurrentLanguage();
  const momentDate = moment(date);
  
  momentDate.locale(lang === 'uz' ? 'uz-latn' : lang);
  
  // Default formats (24-hour format preferred in Central Asia)
  const defaultFormats = {
    en: 'h:mm A',
    ru: 'HH:mm',
    uz: 'HH:mm',
  };
  
  return momentDate.format(format || defaultFormats[lang]);
};

// Format date and time together
export const formatDateTime = (
  date: Date | string | number | Moment,
  dateFormat?: string,
  timeFormat?: string,
  language?: SupportedLanguage
): string => {
  const formattedDate = formatDate(date, dateFormat, language);
  const formattedTime = formatTime(date, timeFormat, language);
  
  return `${formattedDate} ${formattedTime}`;
};

// Relative time formatting
export const formatRelativeTime = (
  date: Date | string | number | Moment,
  language?: SupportedLanguage
): string => {
  const lang = language || getCurrentLanguage();
  const momentDate = moment(date);
  
  momentDate.locale(lang === 'uz' ? 'uz-latn' : lang);
  
  return momentDate.fromNow();
};

// Format duration (e.g., lesson duration)
export const formatDuration = (
  minutes: number,
  language?: SupportedLanguage
): string => {
  const lang = language || getCurrentLanguage();
  const duration = moment.duration(minutes, 'minutes');
  
  const hours = Math.floor(duration.asHours());
  const mins = duration.minutes();
  
  const translations = {
    en: {
      hours: hours === 1 ? 'hour' : 'hours',
      minutes: mins === 1 ? 'minute' : 'minutes',
      and: 'and'
    },
    ru: {
      hours: hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов',
      minutes: mins === 1 ? 'минута' : mins < 5 ? 'минуты' : 'минут',
      and: 'и'
    },
    uz: {
      hours: 'soat',
      minutes: 'daqiqa',
      and: 'va'
    }
  };
  
  const t = translations[lang];
  
  if (hours > 0 && mins > 0) {
    return `${hours} ${t.hours} ${t.and} ${mins} ${t.minutes}`;
  } else if (hours > 0) {
    return `${hours} ${t.hours}`;
  } else {
    return `${mins} ${t.minutes}`;
  }
};

// Format academic year
export const formatAcademicYear = (
  startYear: number,
  language?: SupportedLanguage
): string => {
  const lang = language || getCurrentLanguage();
  const endYear = startYear + 1;
  
  const formats = {
    en: `${startYear}-${endYear} Academic Year`,
    ru: `${startYear}-${endYear} учебный год`,
    uz: `${startYear}-${endYear} o'quv yili`
  };
  
  return formats[lang];
};

// Format grade/class level
export const formatGradeLevel = (
  grade: number,
  language?: SupportedLanguage
): string => {
  const lang = language || getCurrentLanguage();
  
  const formats = {
    en: `Grade ${grade}`,
    ru: `${grade} класс`,
    uz: `${grade}-sinf`
  };
  
  return formats[lang];
};

// Get day name
export const getDayName = (
  date: Date | string | number | Moment,
  language?: SupportedLanguage
): string => {
  const lang = language || getCurrentLanguage();
  const dayIndex = moment(date).day();
  
  return dayNames[lang][dayIndex];
};

// Get month name
export const getMonthName = (
  monthIndex: number,
  language?: SupportedLanguage
): string => {
  const lang = language || getCurrentLanguage();
  
  return monthNames[lang][monthIndex];
};

// Islamic date formatting (placeholder for future Hijri implementation)
export const formatIslamicDate = (
  gregorianDate: Date | string | number | Moment,
  language?: SupportedLanguage
): string => {
  const lang = language || getCurrentLanguage();
  
  // Placeholder for actual Hijri conversion
  // In real implementation, this would use moment-hijri or similar library
  const hijriPlaceholder = {
    year: 1445,
    month: 0, // Muharram
    day: 15,
    monthName: islamicMonths[lang][0],
    formatted: `15 ${islamicMonths[lang][0]} 1445`
  };
  
  return hijriPlaceholder.formatted;
};

// Prayer time formatting
export const formatPrayerTime = (
  prayerName: keyof typeof prayerNames.en,
  time: string | Date,
  language?: SupportedLanguage
): string => {
  const lang = language || getCurrentLanguage();
  const formattedTime = formatTime(time, undefined, lang);
  const prayerDisplayName = prayerNames[lang][prayerName];
  
  return `${prayerDisplayName}: ${formattedTime}`;
};

// School schedule time formatting
export const formatClassTime = (
  startTime: Date | string,
  endTime: Date | string,
  language?: SupportedLanguage
): string => {
  const start = formatTime(startTime, undefined, language);
  const end = formatTime(endTime, undefined, language);
  
  return `${start} - ${end}`;
};

// Format time range for lessons
export const formatLessonDuration = (
  startTime: Date | string,
  durationMinutes: number,
  language?: SupportedLanguage
): string => {
  const start = moment(startTime);
  const end = moment(start).add(durationMinutes, 'minutes');
  
  return formatClassTime(start.toDate(), end.toDate(), language);
};

// Calendar week formatting
export const formatWeekRange = (
  startOfWeek: Date | string | number | Moment,
  language?: SupportedLanguage
): string => {
  const start = moment(startOfWeek).startOf('week');
  const end = moment(start).endOf('week');
  
  const lang = language || getCurrentLanguage();
  
  const formats = {
    en: `${formatDate(start, 'MMM D', lang)} - ${formatDate(end, 'MMM D, YYYY', lang)}`,
    ru: `${formatDate(start, 'D MMM', lang)} - ${formatDate(end, 'D MMM YYYY г.', lang)}`,
    uz: `${formatDate(start, 'D MMM', lang)} - ${formatDate(end, 'D MMM, YYYY', lang)}`
  };
  
  return formats[lang];
};

// Exam/assignment due date formatting with urgency
export const formatDueDate = (
  dueDate: Date | string | number | Moment,
  language?: SupportedLanguage
): { text: string; urgency: 'high' | 'medium' | 'low' } => {
  const due = moment(dueDate);
  const now = moment();
  const hoursUntilDue = due.diff(now, 'hours');
  const lang = language || getCurrentLanguage();
  
  let urgency: 'high' | 'medium' | 'low' = 'low';
  let text: string;
  
  if (hoursUntilDue < 0) {
    urgency = 'high';
    const overdue = {
      en: 'Overdue',
      ru: 'Просрочено',
      uz: 'Muddati o\'tgan'
    };
    text = overdue[lang];
  } else if (hoursUntilDue < 24) {
    urgency = 'high';
    const today = {
      en: 'Due today',
      ru: 'Срок сегодня',
      uz: 'Bugun muddati'
    };
    text = `${today[lang]} (${formatTime(due, undefined, lang)})`;
  } else if (hoursUntilDue < 48) {
    urgency = 'medium';
    const tomorrow = {
      en: 'Due tomorrow',
      ru: 'Срок завтра', 
      uz: 'Ertaga muddati'
    };
    text = `${tomorrow[lang]} (${formatTime(due, undefined, lang)})`;
  } else {
    urgency = 'low';
    text = formatDate(due, undefined, lang);
  }
  
  return { text, urgency };
};

// Age formatting based on birthdate
export const calculateAge = (
  birthDate: Date | string | number,
  language?: SupportedLanguage
): string => {
  const age = moment().diff(moment(birthDate), 'years');
  const lang = language || getCurrentLanguage();
  
  const formats = {
    en: `${age} years old`,
    ru: age === 1 ? '1 год' : age < 5 ? `${age} года` : `${age} лет`,
    uz: `${age} yoshda`
  };
  
  return formats[lang];
};

// Initialize moment with current language
setMomentLocale();

export default {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatDuration,
  formatAcademicYear,
  formatGradeLevel,
  getDayName,
  getMonthName,
  formatIslamicDate,
  formatPrayerTime,
  formatClassTime,
  formatLessonDuration,
  formatWeekRange,
  formatDueDate,
  calculateAge,
  setMomentLocale
};