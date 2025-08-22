/**
 * Harry School CRM - Real-time Task Alerts Service
 * Handles AI-generated task notifications, homework assignments, and learning alerts
 * 
 * Features intelligent notification timing and Islamic educational values
 */

import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealtimeEvent, RealtimeSubscriptionsService } from './subscriptions';

// Types and Interfaces
export interface TaskAlert {
  id: string;
  taskId: string;
  studentId: string;
  teacherId: string;
  type: TaskAlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  metadata: TaskMetadata;
  deliverySettings: DeliverySettings;
  culturalContext: CulturalContext;
  status: AlertStatus;
  createdAt: string;
  scheduledFor?: string;
  deliveredAt?: string;
  readAt?: string;
  organizationId: string;
}

export type TaskAlertType = 
  | 'new_task_assigned'
  | 'homework_assigned' 
  | 'ai_task_generated'
  | 'task_deadline_reminder'
  | 'task_completed_feedback'
  | 'learning_milestone'
  | 'skill_improvement'
  | 'islamic_lesson_ready'
  | 'vocabulary_practice'
  | 'pronunciation_exercise'
  | 'cultural_lesson';

export type AlertPriority = 'low' | 'normal' | 'high' | 'urgent';

export type AlertStatus = 
  | 'pending'
  | 'scheduled' 
  | 'delivered'
  | 'read'
  | 'dismissed'
  | 'expired'
  | 'culturally_delayed';

export interface TaskMetadata {
  taskType: string;
  subject: string;
  difficultyLevel: number;
  estimatedDuration: number;
  deadline?: string;
  aiGenerated: boolean;
  islamicValues?: string[];
  requiredSkills: string[];
  culturalRelevance: 'high' | 'medium' | 'low';
  parentNotificationRequired: boolean;
}

export interface DeliverySettings {
  immediateDelivery: boolean;
  respectPrayerTimes: boolean;
  respectStudyHours: boolean;
  batchWithSimilar: boolean;
  maxDailyAlerts: number;
  preferredTimeSlots: TimeSlot[];
  quietHours: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  timezone: string;
}

export interface CulturalContext {
  islamicValuesIntegration: boolean;
  languagePreference: 'en' | 'uz' | 'ru' | 'ar';
  familyFriendlyTiming: boolean;
  ramadanAdjustments: boolean;
  culturalCelebrations: string[];
  respectFamilyTime: boolean;
}

export interface AlertBatch {
  id: string;
  studentId: string;
  alerts: TaskAlert[];
  scheduledDelivery: string;
  batchType: 'study_session' | 'daily_summary' | 'weekly_review' | 'cultural_themed';
  culturalTheme?: string;
}

export interface LearningProgress {
  studentId: string;
  subject: string;
  skillsImproved: string[];
  tasksCompleted: number;
  averageScore: number;
  weakAreas: string[];
  islamicValuesProgress: number;
  recommendedActions: string[];
}

export interface NotificationTemplate {
  id: string;
  type: TaskAlertType;
  templates: {
    en: { title: string; message: string };
    uz: { title: string; message: string };
    ru: { title: string; message: string };
    ar: { title: string; message: string };
  };
  islamicElements?: {
    dua?: string;
    arabicPhrase?: string;
    islamicGreeting?: string;
  };
  culturalAdaptations: {
    uzbekistan: { greeting: string; closing: string };
    islamic: { values: string[]; context: string };
  };
}

// Real-time Task Alerts Service
export class TaskAlertsService extends EventEmitter {
  private realtimeService: RealtimeSubscriptionsService;
  private pendingAlerts: Map<string, TaskAlert> = new Map();
  private alertBatches: Map<string, AlertBatch> = new Map();
  private deliveryQueue: TaskAlert[] = [];
  private templates: Map<string, NotificationTemplate> = new Map();
  private subscriptionId: string | null = null;
  private deliveryTimer: NodeJS.Timeout | null = null;
  private isOnline = true;

  constructor(realtimeService: RealtimeSubscriptionsService) {
    super();
    this.realtimeService = realtimeService;
    this.initializeService();
  }

  // Service Initialization
  private async initializeService(): Promise<void> {
    try {
      // Load notification templates
      await this.loadNotificationTemplates();
      
      // Load pending alerts
      await this.loadPendingAlerts();
      
      // Subscribe to task events
      await this.subscribeToTaskEvents();
      
      // Start delivery processor
      this.startDeliveryProcessor();
      
      // Monitor connection status
      this.realtimeService.on('offline_mode_enabled', () => {
        this.isOnline = false;
      });
      
      this.realtimeService.on('connected', () => {
        this.isOnline = true;
        this.processOfflineQueue();
      });
      
      console.log('Task Alerts Service initialized');
    } catch (error) {
      console.error('Failed to initialize Task Alerts Service:', error);
    }
  }

  // Event Subscriptions
  private async subscribeToTaskEvents(): Promise<void> {
    const eventTypes = [
      'new_task_assigned',
      'achievement_earned',
      'lesson_started',
      'feedback_received'
    ];

    this.subscriptionId = await this.realtimeService.subscribeToEvents(
      eventTypes,
      (event: RealtimeEvent) => this.handleTaskEvent(event)
    );
  }

  // Event Handlers
  private async handleTaskEvent(event: RealtimeEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'new_task_assigned':
          await this.handleNewTaskAssigned(event);
          break;
        case 'achievement_earned':
          await this.handleAchievementEarned(event);
          break;
        case 'lesson_started':
          await this.handleLessonStarted(event);
          break;
        case 'feedback_received':
          await this.handleFeedbackReceived(event);
          break;
      }
    } catch (error) {
      console.error('Error handling task event:', error);
    }
  }

  private async handleNewTaskAssigned(event: RealtimeEvent): Promise<void> {
    const taskData = event.payload;
    
    const alert = await this.createTaskAlert({
      taskId: taskData.id,
      studentId: taskData.student_id,
      teacherId: taskData.teacher_id,
      type: this.determineTaskType(taskData),
      priority: this.calculatePriority(taskData),
      metadata: this.extractTaskMetadata(taskData),
      organizationId: taskData.organization_id,
    });

    await this.scheduleAlert(alert);
  }

  private async handleAchievementEarned(event: RealtimeEvent): Promise<void> {
    const achievementData = event.payload;
    
    const alert = await this.createTaskAlert({
      taskId: `achievement_${achievementData.id}`,
      studentId: achievementData.student_id,
      teacherId: achievementData.teacher_id || 'system',
      type: 'learning_milestone',
      priority: 'high',
      metadata: {
        taskType: 'achievement',
        subject: achievementData.subject || 'general',
        difficultyLevel: 0,
        estimatedDuration: 0,
        aiGenerated: false,
        islamicValues: achievementData.islamic_values || [],
        requiredSkills: [],
        culturalRelevance: achievementData.islamic_values?.length > 0 ? 'high' : 'medium',
        parentNotificationRequired: true,
      },
      organizationId: achievementData.organization_id,
    });

    // High priority alerts are delivered immediately
    await this.deliverAlert(alert);
  }

  private async handleLessonStarted(event: RealtimeEvent): Promise<void> {
    const lessonData = event.payload;
    
    // Check if this is an Islamic lesson or cultural lesson
    if (this.isIslamicLesson(lessonData) || this.isCulturalLesson(lessonData)) {
      const alert = await this.createTaskAlert({
        taskId: `lesson_${lessonData.id}`,
        studentId: lessonData.student_id,
        teacherId: lessonData.teacher_id,
        type: lessonData.type === 'islamic' ? 'islamic_lesson_ready' : 'cultural_lesson',
        priority: 'normal',
        metadata: this.extractLessonMetadata(lessonData),
        organizationId: lessonData.organization_id,
      });

      await this.scheduleAlert(alert);
    }
  }

  private async handleFeedbackReceived(event: RealtimeEvent): Promise<void> {
    const feedbackData = event.payload;
    
    const alert = await this.createTaskAlert({
      taskId: `feedback_${feedbackData.id}`,
      studentId: feedbackData.student_id,
      teacherId: feedbackData.teacher_id,
      type: 'task_completed_feedback',
      priority: 'normal',
      metadata: {
        taskType: 'feedback',
        subject: feedbackData.subject,
        difficultyLevel: 0,
        estimatedDuration: 0,
        aiGenerated: feedbackData.ai_generated || false,
        islamicValues: feedbackData.islamic_feedback || [],
        requiredSkills: [],
        culturalRelevance: 'medium',
        parentNotificationRequired: false,
      },
      organizationId: feedbackData.organization_id,
    });

    await this.scheduleAlert(alert);
  }

  // Alert Creation and Management
  private async createTaskAlert(params: {
    taskId: string;
    studentId: string;
    teacherId: string;
    type: TaskAlertType;
    priority: AlertPriority;
    metadata: TaskMetadata;
    organizationId: string;
  }): Promise<TaskAlert> {
    const studentSettings = await this.getStudentNotificationSettings(params.studentId);
    const culturalContext = await this.getCulturalContext(params.studentId);
    
    const template = this.getTemplate(params.type);
    const { title, message } = await this.generateNotificationContent(
      template,
      params,
      culturalContext
    );

    const alert: TaskAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId: params.taskId,
      studentId: params.studentId,
      teacherId: params.teacherId,
      type: params.type,
      priority: params.priority,
      title,
      message,
      metadata: params.metadata,
      deliverySettings: studentSettings,
      culturalContext,
      status: 'pending',
      createdAt: new Date().toISOString(),
      organizationId: params.organizationId,
    };

    return alert;
  }

  private async scheduleAlert(alert: TaskAlert): Promise<void> {
    // Determine delivery timing based on cultural and personal preferences
    const deliveryTime = await this.calculateOptimalDeliveryTime(alert);
    
    if (deliveryTime) {
      alert.scheduledFor = deliveryTime;
      alert.status = 'scheduled';
    }

    // Check if we should batch this alert
    if (await this.shouldBatchAlert(alert)) {
      await this.addToBatch(alert);
    } else {
      this.deliveryQueue.push(alert);
    }

    this.pendingAlerts.set(alert.id, alert);
    await this.savePendingAlerts();
    
    this.emit('alert_scheduled', alert);
  }

  private async deliverAlert(alert: TaskAlert): Promise<void> {
    try {
      // Check cultural restrictions
      if (await this.shouldDelayForCulturalReasons(alert)) {
        alert.status = 'culturally_delayed';
        await this.rescheduleAlert(alert);
        return;
      }

      // Deliver the alert
      alert.deliveredAt = new Date().toISOString();
      alert.status = 'delivered';

      this.emit('alert_delivered', alert);
      
      // Remove from pending
      this.pendingAlerts.delete(alert.id);
      await this.savePendingAlerts();

      // Track delivery for analytics
      await this.trackAlertDelivery(alert);

    } catch (error) {
      console.error('Failed to deliver alert:', alert.id, error);
      alert.status = 'pending';
    }
  }

  // Cultural and Timing Logic
  private async calculateOptimalDeliveryTime(alert: TaskAlert): Promise<string | null> {
    const now = new Date();
    const settings = alert.deliverySettings;
    const cultural = alert.culturalContext;

    // Immediate delivery for urgent alerts (unless culturally inappropriate)
    if (alert.priority === 'urgent' && settings.immediateDelivery) {
      if (await this.isCurrentTimeAppropriate(cultural)) {
        return now.toISOString();
      }
    }

    // Check preferred time slots
    for (const slot of settings.preferredTimeSlots) {
      const deliveryTime = await this.findNextSlotTime(slot, cultural);
      if (deliveryTime) {
        return deliveryTime;
      }
    }

    // Fallback to next appropriate time
    return await this.findNextAppropriateTiming(cultural, settings);
  }

  private async isCurrentTimeAppropriate(cultural: CulturalContext): Promise<boolean> {
    const now = new Date();
    
    // Check prayer times if enabled
    if (cultural.islamicValuesIntegration) {
      if (await this.isDuringPrayerTime()) {
        return false;
      }
    }

    // Check family time considerations
    if (cultural.respectFamilyTime) {
      if (await this.isFamilyTime()) {
        return false;
      }
    }

    // Check Ramadan considerations
    if (cultural.ramadanAdjustments && await this.isRamadanPeriod()) {
      if (await this.isDuringFastingHours()) {
        return false;
      }
    }

    return true;
  }

  private async shouldDelayForCulturalReasons(alert: TaskAlert): Promise<boolean> {
    return !(await this.isCurrentTimeAppropriate(alert.culturalContext));
  }

  private async rescheduleAlert(alert: TaskAlert): Promise<void> {
    const newTime = await this.findNextAppropriateTiming(
      alert.culturalContext,
      alert.deliverySettings
    );
    
    if (newTime) {
      alert.scheduledFor = newTime;
      alert.status = 'scheduled';
      await this.savePendingAlerts();
    }
  }

  private async findNextSlotTime(
    slot: TimeSlot,
    cultural: CulturalContext
  ): Promise<string | null> {
    // This would calculate the next available time in the preferred slot
    // considering cultural restrictions
    return null; // Simplified for now
  }

  private async findNextAppropriateTiming(
    cultural: CulturalContext,
    settings: DeliverySettings
  ): Promise<string | null> {
    // This would find the next culturally appropriate time
    const now = new Date();
    
    // Simple fallback: add 30 minutes
    const fallback = new Date(now.getTime() + 30 * 60 * 1000);
    return fallback.toISOString();
  }

  // Batching Logic
  private async shouldBatchAlert(alert: TaskAlert): Promise<boolean> {
    return alert.deliverySettings.batchWithSimilar && 
           alert.priority !== 'urgent' &&
           !alert.deliverySettings.immediateDelivery;
  }

  private async addToBatch(alert: TaskAlert): Promise<void> {
    const batchKey = `${alert.studentId}_${alert.type}`;
    let batch = this.alertBatches.get(batchKey);
    
    if (!batch) {
      batch = {
        id: `batch_${Date.now()}`,
        studentId: alert.studentId,
        alerts: [],
        scheduledDelivery: await this.calculateBatchDeliveryTime(alert),
        batchType: this.determineBatchType(alert.type),
      };
      
      this.alertBatches.set(batchKey, batch);
    }
    
    batch.alerts.push(alert);
    
    // Add cultural theme if applicable
    if (alert.metadata.islamicValues && alert.metadata.islamicValues.length > 0) {
      batch.culturalTheme = 'islamic_values';
    }
  }

  private async calculateBatchDeliveryTime(alert: TaskAlert): Promise<string> {
    // Calculate optimal time for batch delivery
    const now = new Date();
    const batchDelay = 2 * 60 * 60 * 1000; // 2 hours default
    
    return new Date(now.getTime() + batchDelay).toISOString();
  }

  private determineBatchType(alertType: TaskAlertType): AlertBatch['batchType'] {
    const typeMapping: Record<TaskAlertType, AlertBatch['batchType']> = {
      'new_task_assigned': 'study_session',
      'homework_assigned': 'study_session',
      'ai_task_generated': 'study_session',
      'task_deadline_reminder': 'daily_summary',
      'task_completed_feedback': 'daily_summary',
      'learning_milestone': 'weekly_review',
      'skill_improvement': 'weekly_review',
      'islamic_lesson_ready': 'cultural_themed',
      'vocabulary_practice': 'study_session',
      'pronunciation_exercise': 'study_session',
      'cultural_lesson': 'cultural_themed',
    };

    return typeMapping[alertType] || 'daily_summary';
  }

  // Template and Content Generation
  private async loadNotificationTemplates(): Promise<void> {
    // Load templates from storage or use defaults
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'new_task_assigned',
        type: 'new_task_assigned',
        templates: {
          en: {
            title: '📚 New Task Available!',
            message: 'A new {subject} task has been assigned. Ready to learn something amazing?'
          },
          uz: {
            title: '📚 Yangi vazifa!',
            message: '{subject} fanidan yangi vazifa tayinlandi. Ajoyib narsalarni oʻrganishga tayyormisiz?'
          },
          ru: {
            title: '📚 Новое задание!',
            message: 'Назначено новое задание по {subject}. Готовы изучать что-то удивительное?'
          },
          ar: {
            title: '📚 مهمة جديدة!',
            message: 'تم تعيين مهمة جديدة في {subject}. هل أنت مستعد لتعلم شيء رائع؟'
          }
        },
        islamicElements: {
          dua: 'رَبِّ زِدْنِي عِلْمًا',
          arabicPhrase: 'بسم الله',
          islamicGreeting: 'السلام عليكم'
        },
        culturalAdaptations: {
          uzbekistan: {
            greeting: 'Assalomu alaykum',
            closing: 'Omad tilaymiz!'
          },
          islamic: {
            values: ['seeking knowledge', 'dedication', 'perseverance'],
            context: 'Learning is a form of worship in Islam'
          }
        }
      },
      // Add more templates...
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private getTemplate(type: TaskAlertType): NotificationTemplate {
    return this.templates.get(type) || this.getDefaultTemplate();
  }

  private getDefaultTemplate(): NotificationTemplate {
    return {
      id: 'default',
      type: 'new_task_assigned',
      templates: {
        en: { title: 'New Notification', message: 'You have a new notification.' },
        uz: { title: 'Yangi bildirishnoma', message: 'Sizda yangi bildirishnoma bor.' },
        ru: { title: 'Новое уведомление', message: 'У вас есть новое уведомление.' },
        ar: { title: 'إشعار جديد', message: 'لديك إشعار جديد.' }
      },
      culturalAdaptations: {
        uzbekistan: { greeting: 'Assalomu alaykum', closing: 'Rahmat!' },
        islamic: { values: [], context: '' }
      }
    };
  }

  private async generateNotificationContent(
    template: NotificationTemplate,
    params: any,
    cultural: CulturalContext
  ): Promise<{ title: string; message: string }> {
    const lang = cultural.languagePreference;
    const content = template.templates[lang];
    
    let title = content.title;
    let message = content.message;

    // Replace placeholders
    if (params.metadata?.subject) {
      message = message.replace('{subject}', params.metadata.subject);
    }

    // Add Islamic elements if appropriate
    if (cultural.islamicValuesIntegration && template.islamicElements) {
      if (template.islamicElements.islamicGreeting) {
        title = template.islamicElements.islamicGreeting + ' ' + title;
      }
      
      if (template.islamicElements.dua) {
        message += '\n\n' + template.islamicElements.dua;
      }
    }

    return { title, message };
  }

  // Delivery Processing
  private startDeliveryProcessor(): void {
    this.deliveryTimer = setInterval(async () => {
      await this.processDeliveryQueue();
      await this.processBatches();
    }, 30000); // Check every 30 seconds
  }

  private async processDeliveryQueue(): Promise<void> {
    const now = new Date();
    
    for (let i = this.deliveryQueue.length - 1; i >= 0; i--) {
      const alert = this.deliveryQueue[i];
      
      if (alert.scheduledFor && new Date(alert.scheduledFor) <= now) {
        await this.deliverAlert(alert);
        this.deliveryQueue.splice(i, 1);
      } else if (!alert.scheduledFor) {
        // Immediate delivery
        await this.deliverAlert(alert);
        this.deliveryQueue.splice(i, 1);
      }
    }
  }

  private async processBatches(): Promise<void> {
    const now = new Date();
    
    for (const [key, batch] of this.alertBatches) {
      if (new Date(batch.scheduledDelivery) <= now) {
        await this.deliverBatch(batch);
        this.alertBatches.delete(key);
      }
    }
  }

  private async deliverBatch(batch: AlertBatch): Promise<void> {
    const combinedAlert = await this.createBatchAlert(batch);
    await this.deliverAlert(combinedAlert);
    
    this.emit('batch_delivered', batch);
  }

  private async createBatchAlert(batch: AlertBatch): Promise<TaskAlert> {
    const studentId = batch.studentId;
    const cultural = await this.getCulturalContext(studentId);
    
    const title = await this.generateBatchTitle(batch, cultural);
    const message = await this.generateBatchMessage(batch, cultural);
    
    return {
      id: `batch_alert_${batch.id}`,
      taskId: batch.id,
      studentId,
      teacherId: 'system',
      type: 'learning_milestone',
      priority: 'normal',
      title,
      message,
      metadata: {
        taskType: 'batch',
        subject: 'multiple',
        difficultyLevel: 0,
        estimatedDuration: 0,
        aiGenerated: false,
        islamicValues: [],
        requiredSkills: [],
        culturalRelevance: 'medium',
        parentNotificationRequired: false,
      },
      deliverySettings: await this.getStudentNotificationSettings(studentId),
      culturalContext: cultural,
      status: 'pending',
      createdAt: new Date().toISOString(),
      organizationId: batch.alerts[0]?.organizationId || '',
    };
  }

  private async generateBatchTitle(
    batch: AlertBatch,
    cultural: CulturalContext
  ): Promise<string> {
    const count = batch.alerts.length;
    const lang = cultural.languagePreference;
    
    const titles = {
      en: `📚 ${count} New Learning Activities`,
      uz: `📚 ${count} ta yangi ta'lim faoliyati`,
      ru: `📚 ${count} новых учебных активностей`,
      ar: `📚 ${count} أنشطة تعليمية جديدة`
    };

    return titles[lang] || titles.en;
  }

  private async generateBatchMessage(
    batch: AlertBatch,
    cultural: CulturalContext
  ): Promise<string> {
    const lang = cultural.languagePreference;
    const subjects = [...new Set(batch.alerts.map(a => a.metadata.subject))];
    
    const messages = {
      en: `You have new activities in: ${subjects.join(', ')}. Ready to continue your learning journey?`,
      uz: `Sizda quyidagi fanlar bo'yicha yangi faoliyatlar mavjud: ${subjects.join(', ')}. Ta'lim sayohatingizni davom ettirishga tayyormisiz?`,
      ru: `У вас есть новые активности по: ${subjects.join(', ')}. Готовы продолжить свое обучение?`,
      ar: `لديك أنشطة جديدة في: ${subjects.join('، ')}. هل أنت مستعد لمواصلة رحلة التعلم؟`
    };

    return messages[lang] || messages.en;
  }

  // Helper Methods
  private determineTaskType(taskData: any): TaskAlertType {
    if (taskData.ai_generated) return 'ai_task_generated';
    if (taskData.type === 'homework') return 'homework_assigned';
    if (taskData.type === 'vocabulary') return 'vocabulary_practice';
    if (taskData.type === 'pronunciation') return 'pronunciation_exercise';
    if (taskData.islamic_values?.length > 0) return 'islamic_lesson_ready';
    
    return 'new_task_assigned';
  }

  private calculatePriority(taskData: any): AlertPriority {
    if (taskData.urgent) return 'urgent';
    if (taskData.deadline && this.isDeadlineSoon(taskData.deadline)) return 'high';
    if (taskData.islamic_values?.length > 0) return 'high';
    
    return 'normal';
  }

  private extractTaskMetadata(taskData: any): TaskMetadata {
    return {
      taskType: taskData.type || 'general',
      subject: taskData.subject || 'general',
      difficultyLevel: taskData.difficulty_level || 1,
      estimatedDuration: taskData.estimated_duration || 30,
      deadline: taskData.deadline,
      aiGenerated: taskData.ai_generated || false,
      islamicValues: taskData.islamic_values || [],
      requiredSkills: taskData.required_skills || [],
      culturalRelevance: taskData.islamic_values?.length > 0 ? 'high' : 'medium',
      parentNotificationRequired: taskData.parent_notification || false,
    };
  }

  private extractLessonMetadata(lessonData: any): TaskMetadata {
    return {
      taskType: 'lesson',
      subject: lessonData.subject || 'general',
      difficultyLevel: lessonData.difficulty_level || 1,
      estimatedDuration: lessonData.duration || 45,
      aiGenerated: false,
      islamicValues: lessonData.islamic_content || [],
      requiredSkills: [],
      culturalRelevance: lessonData.type === 'islamic' ? 'high' : 'medium',
      parentNotificationRequired: false,
    };
  }

  private isIslamicLesson(lessonData: any): boolean {
    return lessonData.type === 'islamic' || 
           lessonData.subject?.toLowerCase().includes('islamic') ||
           lessonData.islamic_content?.length > 0;
  }

  private isCulturalLesson(lessonData: any): boolean {
    return lessonData.type === 'cultural' ||
           lessonData.subject?.toLowerCase().includes('culture') ||
           lessonData.uzbek_culture === true;
  }

  private isDeadlineSoon(deadline: string): boolean {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilDeadline <= 24; // Less than 24 hours
  }

  // Cultural Time Checks
  private async isDuringPrayerTime(): Promise<boolean> {
    // This would check against prayer time calculations
    return false;
  }

  private async isFamilyTime(): Promise<boolean> {
    // This would check family time settings
    const hour = new Date().getHours();
    return hour >= 19 && hour <= 21; // 7-9 PM family time
  }

  private async isRamadanPeriod(): Promise<boolean> {
    // This would check Islamic calendar for Ramadan
    return false;
  }

  private async isDuringFastingHours(): Promise<boolean> {
    // This would check fasting hours during Ramadan
    return false;
  }

  // Settings and Context
  private async getStudentNotificationSettings(studentId: string): Promise<DeliverySettings> {
    // This would fetch from user preferences
    return {
      immediateDelivery: false,
      respectPrayerTimes: true,
      respectStudyHours: true,
      batchWithSimilar: true,
      maxDailyAlerts: 10,
      preferredTimeSlots: [
        { start: '09:00', end: '11:00', timezone: 'Asia/Tashkent' },
        { start: '15:00', end: '17:00', timezone: 'Asia/Tashkent' },
      ],
      quietHours: [
        { start: '22:00', end: '08:00', timezone: 'Asia/Tashkent' },
      ],
    };
  }

  private async getCulturalContext(studentId: string): Promise<CulturalContext> {
    // This would fetch from user profile
    return {
      islamicValuesIntegration: true,
      languagePreference: 'uz',
      familyFriendlyTiming: true,
      ramadanAdjustments: true,
      culturalCelebrations: ['Eid', 'Ramadan', 'Nowruz'],
      respectFamilyTime: true,
    };
  }

  // Storage Management
  private async loadPendingAlerts(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('task_alerts_pending');
      if (stored) {
        const alerts: TaskAlert[] = JSON.parse(stored);
        alerts.forEach(alert => {
          this.pendingAlerts.set(alert.id, alert);
          
          if (alert.status === 'scheduled' || alert.status === 'pending') {
            this.deliveryQueue.push(alert);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load pending alerts:', error);
    }
  }

  private async savePendingAlerts(): Promise<void> {
    try {
      const alerts = Array.from(this.pendingAlerts.values());
      await AsyncStorage.setItem('task_alerts_pending', JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to save pending alerts:', error);
    }
  }

  private async trackAlertDelivery(alert: TaskAlert): Promise<void> {
    // Track delivery analytics
    const deliveryData = {
      alertId: alert.id,
      type: alert.type,
      priority: alert.priority,
      deliveredAt: alert.deliveredAt,
      culturalDelay: alert.status === 'culturally_delayed',
    };

    this.emit('alert_delivery_tracked', deliveryData);
  }

  private async processOfflineQueue(): Promise<void> {
    // Process any alerts that were queued while offline
    for (const alert of this.deliveryQueue) {
      if (alert.status === 'pending') {
        await this.deliverAlert(alert);
      }
    }
  }

  // Public API Methods
  public async getAlertHistory(
    studentId: string,
    limit: number = 50
  ): Promise<TaskAlert[]> {
    // This would fetch from storage/database
    return [];
  }

  public async markAlertAsRead(alertId: string): Promise<void> {
    const alert = this.pendingAlerts.get(alertId);
    if (alert) {
      alert.readAt = new Date().toISOString();
      alert.status = 'read';
      await this.savePendingAlerts();
      
      this.emit('alert_read', alert);
    }
  }

  public async dismissAlert(alertId: string): Promise<void> {
    const alert = this.pendingAlerts.get(alertId);
    if (alert) {
      alert.status = 'dismissed';
      this.pendingAlerts.delete(alertId);
      await this.savePendingAlerts();
      
      this.emit('alert_dismissed', alert);
    }
  }

  public async updateNotificationSettings(
    studentId: string,
    settings: Partial<DeliverySettings>
  ): Promise<void> {
    // This would update user preferences
    this.emit('settings_updated', { studentId, settings });
  }

  public getPendingAlerts(studentId: string): TaskAlert[] {
    return Array.from(this.pendingAlerts.values())
      .filter(alert => alert.studentId === studentId && alert.status === 'delivered');
  }

  public getAlertStatistics(studentId: string): {
    total: number;
    delivered: number;
    read: number;
    dismissed: number;
  } {
    const alerts = Array.from(this.pendingAlerts.values())
      .filter(alert => alert.studentId === studentId);

    return {
      total: alerts.length,
      delivered: alerts.filter(a => a.status === 'delivered').length,
      read: alerts.filter(a => a.status === 'read').length,
      dismissed: alerts.filter(a => a.status === 'dismissed').length,
    };
  }

  // Cleanup
  public async destroy(): Promise<void> {
    if (this.subscriptionId) {
      await this.realtimeService.unsubscribeFromEvents(this.subscriptionId);
    }
    
    if (this.deliveryTimer) {
      clearInterval(this.deliveryTimer);
    }
    
    await this.savePendingAlerts();
    this.removeAllListeners();
  }
}

// Export factory function
export function createTaskAlertsService(
  realtimeService: RealtimeSubscriptionsService
): TaskAlertsService {
  return new TaskAlertsService(realtimeService);
}