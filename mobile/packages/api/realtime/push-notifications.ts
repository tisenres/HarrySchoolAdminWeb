/**
 * Harry School CRM - Push Notifications Service with Expo
 * Handles native push notifications with cultural integration and Islamic values
 * 
 * Features intelligent scheduling and culturally-aware delivery
 */

import { EventEmitter } from 'events';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealtimeEvent, RealtimeSubscriptionsService } from './subscriptions';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const culturalSettings = await getCulturalSettings();
    
    // Check if we should show notification based on cultural context
    if (culturalSettings.respectPrayerTimes && await isDuringPrayerTime()) {
      // Delay notification until after prayer
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: !culturalSettings.quietMode,
      shouldSetBadge: true,
    };
  },
});

// Types and Interfaces
export interface PushNotificationConfig {
  projectId: string;
  organizationId: string;
  userId: string;
  userRole: 'student' | 'teacher' | 'admin';
  culturalSettings: CulturalNotificationSettings;
  deviceSettings: DeviceNotificationSettings;
}

export interface CulturalNotificationSettings {
  respectPrayerTimes: boolean;
  islamicGreetings: boolean;
  arabicText: boolean;
  familyTimeRespect: boolean;
  ramadanAdjustments: boolean;
  quietMode: boolean;
  languagePreference: 'en' | 'uz' | 'ru' | 'ar';
  culturalThemes: boolean;
}

export interface DeviceNotificationSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  criticalAlertsEnabled: boolean;
  scheduledDelivery: boolean;
  batchingEnabled: boolean;
  maxDailyNotifications: number;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  content: LocalizedContent;
  islamicElements?: IslamicElements;
  scheduling: SchedulingConfig;
  sound?: string;
  category?: string;
}

export interface LocalizedContent {
  en: { title: string; body: string; subtitle?: string };
  uz: { title: string; body: string; subtitle?: string };
  ru: { title: string; body: string; subtitle?: string };
  ar: { title: string; body: string; subtitle?: string };
}

export interface IslamicElements {
  greeting: string; // "Assalamu Alaikum", etc.
  dua?: string;     // Islamic prayer/supplication
  arabicText?: string;
  islamicIcon?: string;
}

export interface SchedulingConfig {
  immediate: boolean;
  delayMinutes?: number;
  respectPrayerTimes: boolean;
  batchable: boolean;
  expiryHours?: number;
}

export type NotificationType = 
  | 'task_assigned'
  | 'achievement_earned'
  | 'ranking_updated'
  | 'attendance_marked'
  | 'lesson_reminder'
  | 'islamic_reminder'
  | 'prayer_time'
  | 'parent_message'
  | 'system_announcement'
  | 'cultural_event'
  | 'homework_due'
  | 'feedback_received';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface ScheduledNotification {
  id: string;
  template: NotificationTemplate;
  data: any;
  scheduledFor: Date;
  attempts: number;
  culturalDelay?: boolean;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
}

export interface NotificationBatch {
  id: string;
  notifications: ScheduledNotification[];
  batchType: 'daily_summary' | 'study_session' | 'islamic_reminders' | 'achievements';
  scheduledFor: Date;
  culturalTheme?: string;
}

export interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  userId: string;
  organizationId: string;
  lastUpdated: Date;
  active: boolean;
}

// Push Notifications Service
export class PushNotificationsService extends EventEmitter {
  private config: PushNotificationConfig;
  private realtimeService: RealtimeSubscriptionsService;
  private pushToken: string | null = null;
  private templates: Map<string, NotificationTemplate> = new Map();
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private notificationBatches: Map<string, NotificationBatch> = new Map();
  private subscriptionId: string | null = null;
  private schedulerTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(
    config: PushNotificationConfig, 
    realtimeService: RealtimeSubscriptionsService
  ) {
    super();
    this.config = config;
    this.realtimeService = realtimeService;
    this.initializeService();
  }

  // Service Initialization
  private async initializeService(): Promise<void> {
    try {
      // Check device compatibility
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return;
      }

      // Request permissions
      await this.requestPermissions();
      
      // Register for push notifications
      await this.registerForPushNotifications();
      
      // Load notification templates
      await this.loadNotificationTemplates();
      
      // Load scheduled notifications
      await this.loadScheduledNotifications();
      
      // Subscribe to real-time events
      await this.subscribeToNotificationEvents();
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      // Start scheduler
      this.startNotificationScheduler();
      
      this.isInitialized = true;
      console.log('Push Notifications Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Push Notifications Service:', error);
      this.emit('initialization_error', error);
    }
  }

  // Permission and Registration
  private async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        this.emit('permission_denied');
        return false;
      }

      // Request critical alerts permission for urgent notifications
      if (Platform.OS === 'ios' && this.config.deviceSettings.criticalAlertsEnabled) {
        await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: true,
          },
        });
      }

      this.emit('permission_granted');
      return true;
    } catch (error) {
      console.error('Failed to request push notification permissions:', error);
      return false;
    }
  }

  private async registerForPushNotifications(): Promise<void> {
    try {
      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: this.config.projectId,
      });

      this.pushToken = tokenData.data;
      
      // Save token to backend
      await this.savePushTokenToBackend(this.pushToken);
      
      console.log('Push token registered:', this.pushToken);
      this.emit('token_registered', this.pushToken);
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      throw error;
    }
  }

  private async savePushTokenToBackend(token: string): Promise<void> {
    try {
      const tokenData: PushToken = {
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: Constants.sessionId || 'unknown',
        userId: this.config.userId,
        organizationId: this.config.organizationId,
        lastUpdated: new Date(),
        active: true,
      };

      // This would save to Supabase or your backend
      // For now, we'll save locally
      await AsyncStorage.setItem('push_token', JSON.stringify(tokenData));
      
      this.emit('token_saved', tokenData);
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }

  // Event Subscriptions
  private async subscribeToNotificationEvents(): Promise<void> {
    const eventTypes: RealtimeEvent['type'][] = [
      'new_task_assigned',
      'achievement_earned',
      'ranking_updated',
      'attendance_marked',
      'lesson_started',
      'feedback_received',
      'system_announcement',
      'cultural_reminder',
      'prayer_time_notification',
    ];

    this.subscriptionId = await this.realtimeService.subscribeToEvents(
      eventTypes,
      (event: RealtimeEvent) => this.handleNotificationEvent(event)
    );
  }

  // Event Handlers
  private async handleNotificationEvent(event: RealtimeEvent): Promise<void> {
    try {
      const template = this.getTemplateForEvent(event.type);
      if (!template) {
        console.warn('No template found for event type:', event.type);
        return;
      }

      const notification = await this.createNotificationFromEvent(event, template);
      await this.scheduleNotification(notification);
      
    } catch (error) {
      console.error('Error handling notification event:', error);
    }
  }

  private async createNotificationFromEvent(
    event: RealtimeEvent,
    template: NotificationTemplate
  ): Promise<ScheduledNotification> {
    const lang = this.config.culturalSettings.languagePreference;
    let content = template.content[lang];
    
    // Apply Islamic elements if enabled
    if (this.config.culturalSettings.islamicGreetings && template.islamicElements) {
      content = {
        ...content,
        title: template.islamicElements.greeting + ' ' + content.title,
      };
      
      if (template.islamicElements.dua) {
        content.body += '\n\n' + template.islamicElements.dua;
      }
    }

    // Replace placeholders with event data
    content = this.replacePlaceholders(content, event.payload);

    const notification: ScheduledNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      template: {
        ...template,
        content: { ...template.content, [lang]: content },
      },
      data: {
        eventId: event.id,
        eventType: event.type,
        payload: event.payload,
        organizationId: event.organizationId,
      },
      scheduledFor: this.calculateDeliveryTime(template.scheduling),
      attempts: 0,
      status: 'pending',
    };

    return notification;
  }

  // Notification Scheduling
  private async scheduleNotification(notification: ScheduledNotification): Promise<void> {
    // Check cultural restrictions
    if (await this.shouldDelayCulturally(notification)) {
      notification.culturalDelay = true;
      notification.scheduledFor = await this.findNextCulturallyAppropriateTime();
    }

    // Check if should be batched
    if (notification.template.scheduling.batchable && await this.shouldBatchNotification(notification)) {
      await this.addToBatch(notification);
      return;
    }

    this.scheduledNotifications.set(notification.id, notification);
    await this.saveScheduledNotifications();
    
    this.emit('notification_scheduled', notification);
  }

  private calculateDeliveryTime(scheduling: SchedulingConfig): Date {
    const now = new Date();
    
    if (scheduling.immediate) {
      return now;
    }
    
    if (scheduling.delayMinutes) {
      return new Date(now.getTime() + scheduling.delayMinutes * 60 * 1000);
    }
    
    // Default: 5 minutes delay
    return new Date(now.getTime() + 5 * 60 * 1000);
  }

  private async shouldDelayCulturally(notification: ScheduledNotification): Promise<boolean> {
    if (!this.config.culturalSettings.respectPrayerTimes) {
      return false;
    }

    // Check prayer times
    if (await isDuringPrayerTime()) {
      return notification.template.priority !== 'critical';
    }

    // Check family time
    if (this.config.culturalSettings.familyTimeRespect && await isFamilyTime()) {
      return notification.template.priority === 'low';
    }

    // Check Ramadan adjustments
    if (this.config.culturalSettings.ramadanAdjustments && await isRamadanPeriod()) {
      if (await isDuringFastingHours()) {
        return notification.template.priority !== 'critical';
      }
    }

    return false;
  }

  private async findNextCulturallyAppropriateTime(): Date {
    const now = new Date();
    let nextTime = new Date(now.getTime() + 30 * 60 * 1000); // Default: 30 minutes later
    
    // This would integrate with prayer time calculations
    // For now, simple logic
    const hour = now.getHours();
    
    if (hour >= 22 || hour <= 6) {
      // Night time - schedule for 8 AM
      nextTime.setHours(8, 0, 0, 0);
      if (nextTime <= now) {
        nextTime.setDate(nextTime.getDate() + 1);
      }
    }
    
    return nextTime;
  }

  // Batching Logic
  private async shouldBatchNotification(notification: ScheduledNotification): Promise<boolean> {
    if (!this.config.deviceSettings.batchingEnabled) {
      return false;
    }

    // Don't batch high priority notifications
    if (notification.template.priority === 'high' || notification.template.priority === 'critical') {
      return false;
    }

    // Check daily notification limit
    const todayCount = await this.getTodayNotificationCount();
    if (todayCount >= this.config.deviceSettings.maxDailyNotifications) {
      return true; // Force batching to respect limits
    }

    return notification.template.scheduling.batchable;
  }

  private async addToBatch(notification: ScheduledNotification): Promise<void> {
    const batchType = this.determineBatchType(notification);
    const batchKey = `${this.config.userId}_${batchType}`;
    
    let batch = this.notificationBatches.get(batchKey);
    
    if (!batch) {
      batch = {
        id: `batch_${Date.now()}`,
        notifications: [],
        batchType,
        scheduledFor: await this.calculateBatchDeliveryTime(batchType),
      };
      
      this.notificationBatches.set(batchKey, batch);
    }
    
    batch.notifications.push(notification);
    
    // Add cultural theme if applicable
    if (notification.template.islamicElements) {
      batch.culturalTheme = 'islamic';
    }
    
    await this.saveNotificationBatches();
    this.emit('notification_batched', { notification, batch });
  }

  private determineBatchType(notification: ScheduledNotification): NotificationBatch['batchType'] {
    const type = notification.template.type;
    
    if (type.includes('islamic') || type.includes('prayer') || notification.template.islamicElements) {
      return 'islamic_reminders';
    }
    
    if (type.includes('achievement') || type.includes('ranking')) {
      return 'achievements';
    }
    
    if (type.includes('task') || type.includes('homework')) {
      return 'study_session';
    }
    
    return 'daily_summary';
  }

  private async calculateBatchDeliveryTime(batchType: NotificationBatch['batchType']): Date {
    const now = new Date();
    
    switch (batchType) {
      case 'islamic_reminders':
        // Schedule for next appropriate Islamic time
        return await this.findNextIslamicReminderTime();
      
      case 'achievements':
        // Schedule for evening celebration time
        const eveningTime = new Date(now);
        eveningTime.setHours(18, 0, 0, 0); // 6 PM
        if (eveningTime <= now) {
          eveningTime.setDate(eveningTime.getDate() + 1);
        }
        return eveningTime;
      
      case 'study_session':
        // Schedule for next study time
        return await this.findNextStudyTime();
      
      case 'daily_summary':
      default:
        // Schedule for end of day
        const endOfDay = new Date(now);
        endOfDay.setHours(20, 0, 0, 0); // 8 PM
        if (endOfDay <= now) {
          endOfDay.setDate(endOfDay.getDate() + 1);
        }
        return endOfDay;
    }
  }

  // Notification Delivery
  private startNotificationScheduler(): void {
    this.schedulerTimer = setInterval(async () => {
      await this.processScheduledNotifications();
      await this.processBatches();
    }, 60000); // Check every minute
  }

  private async processScheduledNotifications(): Promise<void> {
    const now = new Date();
    const readyNotifications = Array.from(this.scheduledNotifications.values())
      .filter(notification => notification.status === 'pending' && notification.scheduledFor <= now);

    for (const notification of readyNotifications) {
      await this.deliverNotification(notification);
    }
  }

  private async processBatches(): Promise<void> {
    const now = new Date();
    const readyBatches = Array.from(this.notificationBatches.values())
      .filter(batch => batch.scheduledFor <= now);

    for (const batch of readyBatches) {
      await this.deliverBatch(batch);
    }
  }

  private async deliverNotification(notification: ScheduledNotification): Promise<void> {
    try {
      // Check cultural restrictions one more time
      if (await this.shouldDelayCulturally(notification)) {
        notification.scheduledFor = await this.findNextCulturallyAppropriateTime();
        await this.saveScheduledNotifications();
        return;
      }

      const lang = this.config.culturalSettings.languagePreference;
      const content = notification.template.content[lang];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          subtitle: content.subtitle,
          data: notification.data,
          sound: notification.template.sound || (this.config.deviceSettings.soundEnabled ? 'default' : false),
          badge: this.config.deviceSettings.badgeEnabled ? await this.getBadgeCount() : undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });

      notification.status = 'sent';
      this.scheduledNotifications.delete(notification.id);
      await this.saveScheduledNotifications();
      
      this.emit('notification_delivered', notification);
    } catch (error) {
      console.error('Failed to deliver notification:', notification.id, error);
      
      notification.attempts++;
      if (notification.attempts >= 3) {
        notification.status = 'failed';
        this.scheduledNotifications.delete(notification.id);
        this.emit('notification_failed', notification);
      } else {
        // Retry in 5 minutes
        notification.scheduledFor = new Date(Date.now() + 5 * 60 * 1000);
      }
      
      await this.saveScheduledNotifications();
    }
  }

  private async deliverBatch(batch: NotificationBatch): Promise<void> {
    try {
      const combinedContent = await this.createBatchContent(batch);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: combinedContent.title,
          body: combinedContent.body,
          data: {
            batchId: batch.id,
            batchType: batch.batchType,
            notificationCount: batch.notifications.length,
          },
          sound: this.config.deviceSettings.soundEnabled ? 'default' : false,
          badge: this.config.deviceSettings.badgeEnabled ? await this.getBadgeCount() : undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });

      // Mark all notifications in batch as sent
      batch.notifications.forEach(notification => {
        notification.status = 'sent';
      });

      this.notificationBatches.delete(batch.id);
      await this.saveNotificationBatches();
      
      this.emit('batch_delivered', batch);
    } catch (error) {
      console.error('Failed to deliver batch:', batch.id, error);
    }
  }

  private async createBatchContent(batch: NotificationBatch): Promise<{ title: string; body: string }> {
    const lang = this.config.culturalSettings.languagePreference;
    const count = batch.notifications.length;
    
    const titles = {
      en: this.getBatchTitleEn(batch.batchType, count),
      uz: this.getBatchTitleUz(batch.batchType, count),
      ru: this.getBatchTitleRu(batch.batchType, count),
      ar: this.getBatchTitleAr(batch.batchType, count),
    };

    const bodies = {
      en: this.getBatchBodyEn(batch.batchType, batch.notifications),
      uz: this.getBatchBodyUz(batch.batchType, batch.notifications),
      ru: this.getBatchBodyRu(batch.batchType, batch.notifications),
      ar: this.getBatchBodyAr(batch.batchType, batch.notifications),
    };

    let title = titles[lang];
    let body = bodies[lang];

    // Add Islamic greeting for Islamic content
    if (batch.culturalTheme === 'islamic' && this.config.culturalSettings.islamicGreetings) {
      const greetings = {
        en: 'Assalamu Alaikum! ',
        uz: 'Assalomu alaykum! ',
        ru: 'Ассаляму алейкум! ',
        ar: 'السلام عليكم! ',
      };
      title = greetings[lang] + title;
    }

    return { title, body };
  }

  // Template Management
  private async loadNotificationTemplates(): Promise<void> {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'task_assigned',
        type: 'task_assigned',
        priority: 'normal',
        content: {
          en: { title: '📚 New Task Available', body: 'You have a new {subject} task to complete!' },
          uz: { title: '📚 Yangi vazifa', body: '{subject} fanidan yangi vazifa tayinlandi!' },
          ru: { title: '📚 Новое задание', body: 'У вас новое задание по {subject}!' },
          ar: { title: '📚 مهمة جديدة', body: 'لديك مهمة جديدة في {subject}!' }
        },
        islamicElements: {
          greeting: 'Barakallahu feeki',
          dua: 'رَبِّ زِدْنِي عِلْمًا',
        },
        scheduling: {
          immediate: false,
          delayMinutes: 5,
          respectPrayerTimes: true,
          batchable: true,
          expiryHours: 24,
        },
        sound: 'gentle_chime.wav',
        category: 'education',
      },
      {
        id: 'achievement_earned',
        type: 'achievement_earned',
        priority: 'high',
        content: {
          en: { title: '🏆 Achievement Unlocked!', body: 'Congratulations! You earned: {achievement}' },
          uz: { title: '🏆 Yutuq qo\'lga kiritildi!', body: 'Tabriklaymiz! Siz qo\'lga kiritdingiz: {achievement}' },
          ru: { title: '🏆 Достижение получено!', body: 'Поздравляем! Вы получили: {achievement}' },
          ar: { title: '🏆 إنجاز مفتوح!', body: 'مبروك! لقد حصلت على: {achievement}' }
        },
        islamicElements: {
          greeting: 'Masya Allah!',
          dua: 'الحمد لله رب العالمين',
        },
        scheduling: {
          immediate: true,
          respectPrayerTimes: false,
          batchable: false,
        },
        sound: 'celebration.wav',
        category: 'achievement',
      },
      {
        id: 'prayer_time',
        type: 'prayer_time',
        priority: 'high',
        content: {
          en: { title: '🕌 Prayer Time', body: 'Time for {prayer}. May Allah accept your prayers.' },
          uz: { title: '🕌 Namoz vaqti', body: '{prayer} namozi vaqti keldi. Alloh qabul qilsin.' },
          ru: { title: '🕌 Время намаза', body: 'Время для {prayer}. Да примет Аллах ваши молитвы.' },
          ar: { title: '🕌 وقت الصلاة', body: 'حان وقت {prayer}. تقبل الله صلاتكم.' }
        },
        islamicElements: {
          greeting: 'بسم الله',
          dua: 'اللهم أعني على ذكرك وشكرك وحسن عبادتك',
        },
        scheduling: {
          immediate: true,
          respectPrayerTimes: false,
          batchable: false,
        },
        sound: 'adhan.wav',
        category: 'islamic',
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private getTemplateForEvent(eventType: RealtimeEvent['type']): NotificationTemplate | null {
    const templateMap: Record<string, string> = {
      'new_task_assigned': 'task_assigned',
      'achievement_earned': 'achievement_earned',
      'prayer_time_notification': 'prayer_time',
      'ranking_updated': 'achievement_earned',
      'feedback_received': 'task_assigned',
    };

    const templateId = templateMap[eventType];
    return templateId ? this.templates.get(templateId) || null : null;
  }

  private replacePlaceholders(content: LocalizedContent[keyof LocalizedContent], data: any): LocalizedContent[keyof LocalizedContent] {
    let title = content.title;
    let body = content.body;

    // Replace common placeholders
    const replacements = {
      '{subject}': data.subject || data.task_type || 'Learning',
      '{achievement}': data.achievement_name || data.title || 'Great Achievement',
      '{prayer}': data.prayer_name || 'Prayer',
      '{student}': data.student_name || 'Student',
      '{teacher}': data.teacher_name || 'Teacher',
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      title = title.replace(placeholder, value);
      body = body.replace(placeholder, value);
    });

    return { ...content, title, body };
  }

  // Notification Listeners
  private setupNotificationListeners(): void {
    // Handle notification received while app is open
    Notifications.addNotificationReceivedListener(notification => {
      this.emit('notification_received', notification);
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener(response => {
      this.handleNotificationTapped(response);
    });
  }

  private async handleNotificationTapped(response: Notifications.NotificationResponse): Promise<void> {
    const data = response.notification.request.content.data;
    
    this.emit('notification_tapped', {
      data,
      actionIdentifier: response.actionIdentifier,
    });

    // Navigate to appropriate screen based on notification type
    if (data.eventType) {
      this.emit('navigate_to_content', {
        type: data.eventType,
        data: data.payload,
      });
    }
  }

  // Helper Methods
  private async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch {
      return 0;
    }
  }

  private async getTodayNotificationCount(): Promise<number> {
    // This would query delivered notifications for today
    // For now, return 0
    return 0;
  }

  private getBatchTitleEn(type: NotificationBatch['batchType'], count: number): string {
    switch (type) {
      case 'islamic_reminders': return `🌙 ${count} Islamic Reminders`;
      case 'achievements': return `🏆 ${count} New Achievements`;
      case 'study_session': return `📚 ${count} Study Updates`;
      case 'daily_summary': return `📊 Daily Summary (${count} items)`;
      default: return `${count} Notifications`;
    }
  }

  private getBatchTitleUz(type: NotificationBatch['batchType'], count: number): string {
    switch (type) {
      case 'islamic_reminders': return `🌙 ${count} ta islomiy eslatma`;
      case 'achievements': return `🏆 ${count} ta yangi yutuq`;
      case 'study_session': return `📚 ${count} ta o'quv yangilanishi`;
      case 'daily_summary': return `📊 Kunlik xulosalar (${count} ta)`;
      default: return `${count} ta bildirishnoma`;
    }
  }

  private getBatchTitleRu(type: NotificationBatch['batchType'], count: number): string {
    switch (type) {
      case 'islamic_reminders': return `🌙 ${count} исламских напоминаний`;
      case 'achievements': return `🏆 ${count} новых достижений`;
      case 'study_session': return `📚 ${count} учебных обновлений`;
      case 'daily_summary': return `📊 Ежедневная сводка (${count} пунктов)`;
      default: return `${count} уведомлений`;
    }
  }

  private getBatchTitleAr(type: NotificationBatch['batchType'], count: number): string {
    switch (type) {
      case 'islamic_reminders': return `🌙 ${count} تذكيرات إسلامية`;
      case 'achievements': return `🏆 ${count} إنجازات جديدة`;
      case 'study_session': return `📚 ${count} تحديثات دراسية`;
      case 'daily_summary': return `📊 ملخص يومي (${count} عناصر)`;
      default: return `${count} إشعارات`;
    }
  }

  private getBatchBodyEn(type: NotificationBatch['batchType'], notifications: ScheduledNotification[]): string {
    return `Tap to view your ${type.replace('_', ' ')} updates.`;
  }

  private getBatchBodyUz(type: NotificationBatch['batchType'], notifications: ScheduledNotification[]): string {
    return `${type.replace('_', ' ')} yangilanishlarini ko'rish uchun bosing.`;
  }

  private getBatchBodyRu(type: NotificationBatch['batchType'], notifications: ScheduledNotification[]): string {
    return `Нажмите, чтобы просмотреть обновления ${type.replace('_', ' ')}.`;
  }

  private getBatchBodyAr(type: NotificationBatch['batchType'], notifications: ScheduledNotification[]): string {
    return `اضغط لعرض تحديثات ${type.replace('_', ' ')}.`;
  }

  private async findNextIslamicReminderTime(): Date {
    // This would integrate with prayer time calculations
    const now = new Date();
    return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
  }

  private async findNextStudyTime(): Date {
    const now = new Date();
    const studyHours = [9, 15, 17]; // 9 AM, 3 PM, 5 PM
    
    for (const hour of studyHours) {
      const studyTime = new Date(now);
      studyTime.setHours(hour, 0, 0, 0);
      
      if (studyTime > now) {
        return studyTime;
      }
    }
    
    // Next day 9 AM
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(9, 0, 0, 0);
    return nextDay;
  }

  // Storage Management
  private async loadScheduledNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('scheduled_notifications');
      if (stored) {
        const notifications: ScheduledNotification[] = JSON.parse(stored);
        notifications.forEach(notification => {
          notification.scheduledFor = new Date(notification.scheduledFor);
          this.scheduledNotifications.set(notification.id, notification);
        });
      }
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  }

  private async saveScheduledNotifications(): Promise<void> {
    try {
      const notifications = Array.from(this.scheduledNotifications.values());
      await AsyncStorage.setItem('scheduled_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save scheduled notifications:', error);
    }
  }

  private async saveNotificationBatches(): Promise<void> {
    try {
      const batches = Array.from(this.notificationBatches.values());
      await AsyncStorage.setItem('notification_batches', JSON.stringify(batches));
    } catch (error) {
      console.error('Failed to save notification batches:', error);
    }
  }

  // Public API Methods
  public async sendImmediateNotification(
    template: NotificationTemplate,
    data: any
  ): Promise<void> {
    const notification = await this.createNotificationFromEvent(
      {
        id: 'immediate',
        type: template.type as any,
        payload: data,
        timestamp: new Date().toISOString(),
        priority: template.priority as any,
        organizationId: this.config.organizationId,
      },
      template
    );

    notification.scheduledFor = new Date();
    await this.deliverNotification(notification);
  }

  public async updateCulturalSettings(
    settings: Partial<CulturalNotificationSettings>
  ): Promise<void> {
    this.config.culturalSettings = { ...this.config.culturalSettings, ...settings };
    this.emit('cultural_settings_updated', this.config.culturalSettings);
  }

  public async updateDeviceSettings(
    settings: Partial<DeviceNotificationSettings>
  ): Promise<void> {
    this.config.deviceSettings = { ...this.config.deviceSettings, ...settings };
    this.emit('device_settings_updated', this.config.deviceSettings);
  }

  public getScheduledNotificationCount(): number {
    return this.scheduledNotifications.size;
  }

  public getBatchCount(): number {
    return this.notificationBatches.size;
  }

  public async clearAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.scheduledNotifications.clear();
    this.notificationBatches.clear();
    await this.saveScheduledNotifications();
    await this.saveNotificationBatches();
  }

  public getPushToken(): string | null {
    return this.pushToken;
  }

  // Cleanup
  public async destroy(): Promise<void> {
    if (this.subscriptionId) {
      await this.realtimeService.unsubscribeFromEvents(this.subscriptionId);
    }
    
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
    }
    
    await this.saveScheduledNotifications();
    await this.saveNotificationBatches();
    
    this.removeAllListeners();
  }
}

// Helper functions for cultural timing
async function getCulturalSettings(): Promise<CulturalNotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem('cultural_notification_settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to get cultural settings:', error);
  }

  // Default settings
  return {
    respectPrayerTimes: true,
    islamicGreetings: true,
    arabicText: false,
    familyTimeRespect: true,
    ramadanAdjustments: true,
    quietMode: false,
    languagePreference: 'uz',
    culturalThemes: true,
  };
}

async function isDuringPrayerTime(): Promise<boolean> {
  // This would integrate with prayer time calculations
  const hour = new Date().getHours();
  const prayerHours = [5, 13, 16, 19, 20];
  return prayerHours.includes(hour);
}

async function isFamilyTime(): Promise<boolean> {
  const hour = new Date().getHours();
  return hour >= 19 && hour <= 21; // 7-9 PM
}

async function isRamadanPeriod(): Promise<boolean> {
  // This would check Islamic calendar
  return false;
}

async function isDuringFastingHours(): Promise<boolean> {
  // This would check fasting hours during Ramadan
  return false;
}

// Export factory function
export function createPushNotificationsService(
  config: PushNotificationConfig,
  realtimeService: RealtimeSubscriptionsService
): PushNotificationsService {
  return new PushNotificationsService(config, realtimeService);
}