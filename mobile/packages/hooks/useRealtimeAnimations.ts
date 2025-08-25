import { useRef, useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { RealtimeAnimationsController, AnimationEvent } from '../components/animations/RealtimeAnimations';

interface AnimationSettings {
  enabled: boolean;
  respectPrayerTimes: boolean;
  showIslamicGreetings: boolean;
  preferredLanguage: 'en' | 'uz' | 'ru' | 'ar';
  celebration_animations: boolean;
  reduced_motion: boolean;
}

interface UseRealtimeAnimationsConfig {
  animationSettings: AnimationSettings;
  onAnimationStart?: (event: AnimationEvent) => void;
  onAnimationComplete?: (event: AnimationEvent) => void;
}

export const useRealtimeAnimations = (config: UseRealtimeAnimationsConfig) => {
  const animationsRef = useRef<any>(null);
  const controller = useRef<RealtimeAnimationsController | null>(null);
  const appState = useRef(AppState.currentState);
  const animationQueue = useRef<AnimationEvent[]>([]);
  const isProcessingQueue = useRef(false);

  useEffect(() => {
    if (animationsRef.current) {
      controller.current = new RealtimeAnimationsController(animationsRef);
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // Process queued animations when app comes to foreground
      processAnimationQueue();
    }
    appState.current = nextAppState;
  };

  const processAnimationQueue = useCallback(async () => {
    if (isProcessingQueue.current || animationQueue.current.length === 0) return;
    
    isProcessingQueue.current = true;

    while (animationQueue.current.length > 0) {
      const event = animationQueue.current.shift();
      if (event && controller.current) {
        await new Promise<void>(resolve => {
          const originalComplete = config.onAnimationComplete;
          const wrappedComplete = (evt: AnimationEvent) => {
            originalComplete?.(evt);
            resolve();
          };
          
          controller.current?.triggerAnimation({
            ...event,
            onComplete: wrappedComplete,
          });
        });
        
        // Small delay between animations to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    isProcessingQueue.current = false;
  }, [config.onAnimationComplete]);

  const triggerAnimation = useCallback((event: AnimationEvent) => {
    if (!config.animationSettings.enabled) return;

    // If app is in background, queue the animation
    if (appState.current !== 'active') {
      animationQueue.current.push(event);
      return;
    }

    controller.current?.triggerAnimation(event);
  }, [config.animationSettings.enabled]);

  // Specific animation triggers
  const celebrateAchievement = useCallback((achievement: {
    type: 'academic' | 'character' | 'helping' | 'islamic_values';
    level: 'bronze' | 'silver' | 'gold' | 'platinum';
    title: string;
    message: string;
    arabic_text?: string;
  }) => {
    if (!config.animationSettings.celebration_animations) return;
    
    controller.current?.celebrateAchievement(achievement);
  }, [config.animationSettings.celebration_animations]);

  const notifyRankingUpdate = useCallback((update: {
    oldRank: number;
    newRank: number;
    improvement: boolean;
    studentName: string;
  }) => {
    controller.current?.notifyRankingUpdate(update);
  }, []);

  const showPrayerReminder = useCallback((prayer: {
    name: string;
    time: string;
    arabic_name: string;
  }) => {
    if (!config.animationSettings.respectPrayerTimes) return;
    
    controller.current?.showPrayerReminder(prayer);
  }, [config.animationSettings.respectPrayerTimes]);

  const showNotification = useCallback((notification: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    culturalContext?: any;
  }) => {
    triggerAnimation({
      type: 'notification',
      data: notification,
      culturalContext: notification.culturalContext,
      intensity: 'medium',
    });
  }, [triggerAnimation]);

  const markAttendance = useCallback((attendance: {
    studentName?: string;
    status: 'present' | 'absent' | 'late';
    message?: string;
  }) => {
    triggerAnimation({
      type: 'attendance',
      data: attendance,
      intensity: attendance.status === 'present' ? 'medium' : 'low',
    });
  }, [triggerAnimation]);

  const completeTask = useCallback((task: {
    title: string;
    message?: string;
    type?: 'homework' | 'assignment' | 'quiz' | 'project';
    islamicValue?: string;
  }) => {
    triggerAnimation({
      type: 'task_complete',
      data: task,
      culturalContext: task.islamicValue ? {
        islamic_content: true,
        greeting_type: 'barakallah' as const,
      } : undefined,
      intensity: 'high',
    });
  }, [triggerAnimation]);

  // Advanced animation functions
  const celebrateIslamicValue = useCallback((value: {
    name: string;
    arabic: string;
    message: string;
    context: 'homework' | 'behavior' | 'helping' | 'study';
  }) => {
    celebrateAchievement({
      type: 'islamic_values',
      level: 'gold',
      title: `${value.name} Achievement!`,
      message: value.message,
      arabic_text: value.arabic,
    });
  }, [celebrateAchievement]);

  const showRamadanGreeting = useCallback(() => {
    if (!config.animationSettings.showIslamicGreetings) return;

    const greetings = {
      en: 'Ramadan Mubarak! May this blessed month bring you peace and spiritual growth.',
      uz: 'Ramazon muborak! Bu muborak oy sizga tinchlik va ma\'naviy o\'sish keltirsin.',
      ru: 'Рамадан Мубарак! Пусть этот благословенный месяц принесет вам мир и духовный рост.',
      ar: 'رمضان مبارك! بارك الله لكم في هذا الشهر الكريم',
    };

    triggerAnimation({
      type: 'celebration',
      subtype: 'ramadan_greeting',
      data: {
        title: 'Ramadan Mubarak! 🌙',
        message: greetings[config.animationSettings.preferredLanguage],
      },
      culturalContext: {
        islamic_content: true,
        prayer_time_sensitive: false,
        arabic_text: 'رمضان مبارك',
        greeting_type: 'salam',
      },
      intensity: 'celebration',
      duration: 4000,
    });
  }, [config.animationSettings.showIslamicGreetings, config.animationSettings.preferredLanguage, triggerAnimation]);

  const showEidGreeting = useCallback((eidType: 'fitr' | 'adha') => {
    if (!config.animationSettings.showIslamicGreetings) return;

    const messages = {
      fitr: {
        en: 'Eid Mubarak! May this joyous occasion bring happiness and blessings.',
        uz: 'Hayit muborak! Bu quvonchli kun baxt va barakalar keltirsin.',
        ru: 'Ураза Байрам Мубарак! Пусть этот радостный день принесет счастье и благословения.',
        ar: 'عيد مبارك! كل عام وأنتم بخير',
      },
      adha: {
        en: 'Eid Al-Adha Mubarak! May your sacrifices be accepted.',
        uz: 'Qurbon hayit muborak! Qurbonlaringiz qabul bo\'lsin.',
        ru: 'Курбан Байрам Мубарак! Пусть ваши жертвы будут приняты.',
        ar: 'عيد الأضحى مبارك! تقبل الله منا ومنكم',
      },
    };

    triggerAnimation({
      type: 'celebration',
      subtype: `eid_${eidType}`,
      data: {
        title: eidType === 'fitr' ? 'Eid Mubarak! 🌙' : 'Eid Al-Adha Mubarak! 🕋',
        message: messages[eidType][config.animationSettings.preferredLanguage],
      },
      culturalContext: {
        islamic_content: true,
        arabic_text: 'عيد مبارك',
        greeting_type: 'barakallah',
      },
      intensity: 'celebration',
      duration: 5000,
    });
  }, [config.animationSettings.showIslamicGreetings, config.animationSettings.preferredLanguage, triggerAnimation]);

  const clearAnimationQueue = useCallback(() => {
    animationQueue.current = [];
  }, []);

  const getQueuedAnimationsCount = useCallback(() => {
    return animationQueue.current.length;
  }, []);

  return {
    // Refs and controllers
    animationsRef,
    controller: controller.current,

    // Basic animation triggers
    triggerAnimation,
    showNotification,
    markAttendance,
    completeTask,

    // Achievement and celebration functions
    celebrateAchievement,
    celebrateIslamicValue,
    notifyRankingUpdate,

    // Islamic/Cultural animations
    showPrayerReminder,
    showRamadanGreeting,
    showEidGreeting,

    // Queue management
    processAnimationQueue,
    clearAnimationQueue,
    getQueuedAnimationsCount,

    // Status
    isProcessingQueue: isProcessingQueue.current,
    queuedAnimationsCount: animationQueue.current.length,
  };
};