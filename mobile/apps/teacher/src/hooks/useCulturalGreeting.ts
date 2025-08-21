import { useState, useEffect } from 'react';

interface CulturalGreeting {
  greeting: string;
  timeOfDay: string;
}

export function useCulturalGreeting(language: 'en' | 'ru' | 'uz' = 'en'): CulturalGreeting {
  const [greeting, setGreeting] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    updateGreeting();
    
    // Update greeting every hour
    const interval = setInterval(updateGreeting, 3600000);
    
    return () => clearInterval(interval);
  }, [language]);

  const updateGreeting = () => {
    const currentHour = new Date().getHours();
    const { greeting: greetingText, timeOfDay: timeText } = getCulturalGreeting(currentHour, language);
    
    setGreeting(greetingText);
    setTimeOfDay(timeText);
  };

  const getCulturalGreeting = (hour: number, lang: 'en' | 'ru' | 'uz'): CulturalGreeting => {
    // Islamic greeting with cultural respect
    const greetings = {
      en: {
        morning: 'As-salamu alaykum, Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening',
        timeOfDay: {
          morning: 'May Allah bless your day',
          afternoon: 'Hope your day is going well',
          evening: 'Wishing you a peaceful evening',
        }
      },
      ru: {
        morning: 'Ас-саляму алейкум, Доброе утро',
        afternoon: 'Добрый день',
        evening: 'Добрый вечер',
        timeOfDay: {
          morning: 'Пусть Аллах благословит ваш день',
          afternoon: 'Надеюсь, ваш день проходит хорошо',
          evening: 'Желаю вам мирного вечера',
        }
      },
      uz: {
        morning: 'Assalomu alaykum, Xayrli tong',
        afternoon: 'Xayrli kun',
        evening: 'Xayrli kech',
        timeOfDay: {
          morning: 'Alloh kuningizni muborak qilsin',
          afternoon: 'Kuningiz yaxshi o\'tayotganiga umid qilaman',
          evening: 'Sizga tinch kech tilayman',
        }
      }
    };

    const messages = greetings[lang];

    if (hour >= 5 && hour < 12) {
      return {
        greeting: messages.morning,
        timeOfDay: messages.timeOfDay.morning,
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: messages.afternoon,
        timeOfDay: messages.timeOfDay.afternoon,
      };
    } else {
      return {
        greeting: messages.evening,
        timeOfDay: messages.timeOfDay.evening,
      };
    }
  };

  return { greeting, timeOfDay };
}