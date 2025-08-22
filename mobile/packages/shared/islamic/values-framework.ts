/**
 * Islamic Values Framework for Educational Content
 * 
 * This framework integrates Islamic values and cultural considerations
 * into the educational management system, providing guidance for
 * character development, educational excellence, and spiritual growth.
 */

export interface IslamicValue {
  name: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  educational_context: string;
  celebration_phrases: string[];
  encouragement_messages: string[];
}

export interface CulturalContext {
  prayer_times: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
  islamic_holidays: string[];
  family_time_hours: string[];
  ramadan_considerations: boolean;
  language_preferences: {
    primary: 'uz' | 'ru' | 'en' | 'ar';
    show_arabic: boolean;
    show_transliteration: boolean;
  };
}

export class IslamicValuesFramework {
  private readonly values: Record<string, IslamicValue> = {
    tawhid: {
      name: 'Tawhid (Unity of Allah)',
      arabic: 'التوحيد',
      transliteration: 'At-Tawheed',
      meaning: 'The oneness and uniqueness of Allah',
      educational_context: 'Foundation for all learning and moral development',
      celebration_phrases: [
        'May Allah bless your dedication to learning!',
        'Your seeking of knowledge is a form of worship!',
        'Subhanallah, what excellent progress!'
      ],
      encouragement_messages: [
        'Remember, seeking knowledge is a path to knowing Allah',
        'Every lesson learned brings you closer to understanding His creation',
        'Study with the intention of serving Allah and humanity'
      ]
    },
    
    akhlaq: {
      name: 'Akhlaq (Good Character)',
      arabic: 'الأخلاق',
      transliteration: 'Al-Akhlaq',
      meaning: 'Beautiful character and moral excellence',
      educational_context: 'Character development through education',
      celebration_phrases: [
        'Your good character is shining bright! Barakallahu feeki!',
        'Masha Allah, your behavior reflects beautiful Islamic values!',
        'May Allah reward your excellent manners!'
      ],
      encouragement_messages: [
        'Good character is the best thing a person can possess',
        'Be kind to your teachers and fellow students',
        'Your character is your true treasure in this world and the next'
      ]
    },
    
    adl: {
      name: 'Adl (Justice)',
      arabic: 'العدل',
      transliteration: 'Al-Adl',
      meaning: 'Justice and fairness in all matters',
      educational_context: 'Fair assessment, equal opportunities, honest evaluation',
      celebration_phrases: [
        'Your fairness and honesty are truly admirable!',
        'Masha Allah, you exemplify justice in your actions!',
        'May Allah reward your commitment to truth!'
      ],
      encouragement_messages: [
        'Always be truthful in your studies and interactions',
        'Help your classmates fairly and without favoritism',
        'Justice begins with being honest with yourself'
      ]
    },
    
    hikmah: {
      name: 'Hikmah (Wisdom)',
      arabic: 'الحكمة',
      transliteration: 'Al-Hikmah',
      meaning: 'Divine wisdom and practical intelligence',
      educational_context: 'Thoughtful learning, wise application of knowledge',
      celebration_phrases: [
        'Subhanallah, what wisdom you have shown!',
        'Your thoughtful approach reflects true understanding!',
        'May Allah increase you in wisdom and knowledge!'
      ],
      encouragement_messages: [
        'Seek knowledge with wisdom and apply it with care',
        'Think deeply about what you learn and how to use it',
        'Wisdom comes from reflecting on Allah\'s creation and guidance'
      ]
    },
    
    taqwa: {
      name: 'Taqwa (God-consciousness)',
      arabic: 'التقوى',
      transliteration: 'At-Taqwa',
      meaning: 'Consciousness and awareness of Allah in all actions',
      educational_context: 'Mindful learning, ethical behavior, spiritual awareness',
      celebration_phrases: [
        'Your God-consciousness in studies is inspiring!',
        'Barakallahu feek for remembering Allah in your learning!',
        'May Allah increase your taqwa and knowledge!'
      ],
      encouragement_messages: [
        'Remember Allah in all your studies and activities',
        'Let your learning be a means of increasing your taqwa',
        'Study with awareness that Allah is watching over you'
      ]
    },
    
    ihsan: {
      name: 'Ihsan (Excellence)',
      arabic: 'الإحسان',
      transliteration: 'Al-Ihsan',
      meaning: 'Excellence in worship and character',
      educational_context: 'Striving for excellence in all academic pursuits',
      celebration_phrases: [
        'Allahu Akbar! What excellence you have achieved!',
        'Your pursuit of ihsan is truly inspiring!',
        'May Allah reward your dedication to excellence!'
      ],
      encouragement_messages: [
        'Strive for excellence in everything you do',
        'Do your best as if Allah is watching - because He is',
        'Excellence in studies is a form of worship when done for Allah'
      ]
    },
    
    ummah: {
      name: 'Ummah (Community)',
      arabic: 'الأمة',
      transliteration: 'Al-Ummah',
      meaning: 'The global Muslim community',
      educational_context: 'Collaborative learning, helping others, community service',
      celebration_phrases: [
        'Your help to your classmates strengthens our ummah!',
        'Barakallahu feek for caring about your community!',
        'May Allah bless your spirit of cooperation!'
      ],
      encouragement_messages: [
        'Help your fellow students succeed alongside you',
        'Your education should benefit the entire ummah',
        'Work together to create a supportive learning environment'
      ]
    },
    
    halal: {
      name: 'Halal (Lawful)',
      arabic: 'الحلال',
      transliteration: 'Al-Halal',
      meaning: 'What is permissible and good according to Islamic law',
      educational_context: 'Ethical learning methods, honest academic practices',
      celebration_phrases: [
        'Your honest approach to learning is truly halal and blessed!',
        'May Allah reward your commitment to halal knowledge!',
        'Barakallahu feek for choosing the righteous path!'
      ],
      encouragement_messages: [
        'Always choose honest and ethical methods in your studies',
        'Seek knowledge through halal means only',
        'Let your learning be pure and blessed by Allah'
      ]
    }
  };

  private readonly celebrationTemplates = {
    academic_achievement: {
      uz: [
        'Tabriklaymiz! Sizning muvaffaqiyatingiz uchun Allohga shukur!',
        'Masha Allah, ajoyib natija! Davom eting!',
        'Barakallahu feekum, sizning mehnatlaringiz mevali!'
      ],
      ru: [
        'Поздравляем! Альхамдулиллах за ваш успех!',
        'Маша Аллах, отличный результат! Продолжайте!',
        'Баракаллаху фикум за ваши старания!'
      ],
      en: [
        'Congratulations! Alhamdulillah for your success!',
        'Masha Allah, excellent achievement! Keep going!',
        'Barakallahu feekum for your dedicated efforts!'
      ],
      ar: [
        'مبروك! الحمد لله على نجاحكم!',
        'ما شاء الله، إنجاز رائع! واصلوا!',
        'بارك الله فيكم على جهودكم!'
      ]
    },
    
    character_development: {
      uz: [
        'Sizning yaxshi xulqlaringiz islamiy qadrlarga mos!',
        'Allah sizni taqvo va ilm bilan mukarramlab qo\'ysin!',
        'Masha Allah, sizning odob-axloqlaringiz a\'lo!'
      ],
      ru: [
        'Ваш прекрасный характер соответствует исламским ценностям!',
        'Да увеличит Аллах вашу богобоязненность и знания!',
        'Маша Аллах, ваши манеры превосходны!'
      ],
      en: [
        'Your beautiful character reflects Islamic values!',
        'May Allah increase you in taqwa and knowledge!',
        'Masha Allah, your manners are excellent!'
      ],
      ar: [
        'أخلاقكم الجميلة تعكس القيم الإسلامية!',
        'زادكم الله تقوى وعلماً!',
        'ما شاء الله، آدابكم ممتازة!'
      ]
    },
    
    helping_others: {
      uz: [
        'Boshqalarga yordam berishingiz uchun Allah sizni mukofotlab qo\'ysin!',
        'Sizning hamdardligingiz ummatni mustahkamlaydi!',
        'Barakallahu feekum, sizning mehr-oqibatingiz uchun!'
      ],
      ru: [
        'Да вознаградит вас Аллах за помощь другим!',
        'Ваше сочувствие укрепляет умму!',
        'Баракаллаху фикум за вашу доброту!'
      ],
      en: [
        'May Allah reward you for helping others!',
        'Your compassion strengthens the ummah!',
        'Barakallahu feekum for your kindness!'
      ],
      ar: [
        'جزاكم الله خيراً لمساعدة الآخرين!',
        'تعاطفكم يقوي الأمة!',
        'بارك الله فيكم على لطفكم!'
      ]
    }
  };

  async generateCelebrationMessage(data: {
    achievement_type: 'academic' | 'character' | 'helping' | 'islamic_values';
    user_language: 'uz' | 'ru' | 'en' | 'ar';
    specific_value?: keyof typeof this.values;
    context?: string;
  }): Promise<string> {
    const { achievement_type, user_language, specific_value, context } = data;
    
    // If specific Islamic value is mentioned, use that
    if (specific_value && this.values[specific_value]) {
      const value = this.values[specific_value];
      const phrases = value.celebration_phrases;
      return phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    // Otherwise, use general templates
    let templateCategory: keyof typeof this.celebrationTemplates;
    
    switch (achievement_type) {
      case 'academic':
        templateCategory = 'academic_achievement';
        break;
      case 'character':
      case 'islamic_values':
        templateCategory = 'character_development';
        break;
      case 'helping':
        templateCategory = 'helping_others';
        break;
      default:
        templateCategory = 'academic_achievement';
    }
    
    const templates = this.celebrationTemplates[templateCategory][user_language];
    const selectedMessage = templates[Math.floor(Math.random() * templates.length)];
    
    return selectedMessage;
  }

  async getValueGuidance(valueName: keyof typeof this.values): Promise<IslamicValue | null> {
    return this.values[valueName] || null;
  }

  async getRandomEncouragement(
    valueName: keyof typeof this.values,
    language: 'uz' | 'ru' | 'en' | 'ar' = 'en'
  ): Promise<string> {
    const value = this.values[valueName];
    if (!value) return 'May Allah bless your efforts in seeking knowledge!';
    
    const messages = value.encouragement_messages;
    return messages[Math.floor(Math.random() * messages.length)];
  }

  async getAllValues(): Promise<Record<string, IslamicValue>> {
    return { ...this.values };
  }

  async getContextualGuidance(context: 'homework' | 'exam' | 'group_work' | 'behavior' | 'attendance'): Promise<{
    primary_value: keyof typeof this.values;
    message: string;
    arabic_phrase: string;
  }> {
    const guidance = {
      homework: {
        primary_value: 'ihsan' as const,
        message: 'Approach your homework with excellence and dedication, as Allah loves those who do their work with ihsan.',
        arabic_phrase: 'وَأَحْسِنُوا إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ'
      },
      exam: {
        primary_value: 'taqwa' as const,
        message: 'Take your exams with consciousness of Allah, being honest and trusting in His guidance.',
        arabic_phrase: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا'
      },
      group_work: {
        primary_value: 'ummah' as const,
        message: 'Work together with your classmates like a strong community, supporting each other\'s success.',
        arabic_phrase: 'وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ'
      },
      behavior: {
        primary_value: 'akhlaq' as const,
        message: 'Show beautiful character in all your interactions, following the example of Prophet Muhammad (PBUH).',
        arabic_phrase: 'وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ'
      },
      attendance: {
        primary_value: 'adl' as const,
        message: 'Be just and responsible in your attendance, honoring your commitments to learning.',
        arabic_phrase: 'وَأَوْفُوا بِالْعَهْدِ إِنَّ الْعَهْدَ كَانَ مَسْئُولًا'
      }
    };

    return guidance[context];
  }

  async isPrayerTimeSensitive(): Promise<boolean> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Approximate prayer times (would be better to use a proper library)
    const prayerTimes = [
      { name: 'Fajr', hour: 5, minute: 30 },
      { name: 'Dhuhr', hour: 12, minute: 30 },
      { name: 'Asr', hour: 16, minute: 0 },
      { name: 'Maghrib', hour: 19, minute: 0 },
      { name: 'Isha', hour: 20, minute: 30 }
    ];
    
    // Check if current time is within 15 minutes of any prayer time
    for (const prayer of prayerTimes) {
      const prayerTimeMinutes = prayer.hour * 60 + prayer.minute;
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const timeDiff = Math.abs(currentTimeMinutes - prayerTimeMinutes);
      
      if (timeDiff <= 15) {
        return true;
      }
    }
    
    return false;
  }

  async isFamilyTime(): Promise<boolean> {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Family time considerations: early morning, lunch, evening
    const familyHours = [
      { start: 6, end: 8 },   // Morning family time
      { start: 12, end: 14 }, // Lunch family time
      { start: 18, end: 21 }  // Evening family time
    ];
    
    return familyHours.some(period => 
      currentHour >= period.start && currentHour < period.end
    );
  }

  async isRamadanPeriod(): Promise<boolean> {
    // This would typically check against a proper Islamic calendar
    // For now, return false - would need proper implementation
    return false;
  }

  async getGreeting(language: 'uz' | 'ru' | 'en' | 'ar' = 'en'): Promise<{
    greeting: string;
    arabic: string;
    meaning: string;
  }> {
    const greetings = {
      uz: {
        greeting: 'Assalomu alaykum va rahmatullohi va barakatuh',
        arabic: 'السلام عليكم ورحمة الله وبركاته',
        meaning: 'Peace be upon you and Allah\'s mercy and blessings'
      },
      ru: {
        greeting: 'Ас-саляму алейкум ва рахматуллахи ва баракатух',
        arabic: 'السلام عليكم ورحمة الله وبركاته',
        meaning: 'Мир вам и милость Аллаха и Его благословения'
      },
      en: {
        greeting: 'As-salamu alaikum wa rahmatullahi wa barakatuh',
        arabic: 'السلام عليكم ورحمة الله وبركاته',
        meaning: 'Peace be upon you and Allah\'s mercy and blessings'
      },
      ar: {
        greeting: 'السلام عليكم ورحمة الله وبركاته',
        arabic: 'السلام عليكم ورحمة الله وبركاته',
        meaning: 'السلام عليكم ورحمة الله وبركاته'
      }
    };

    return greetings[language];
  }
}