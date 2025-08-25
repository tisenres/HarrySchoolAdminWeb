import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { OfflineManager } from '../OfflineManager';
import { SyncService } from '../SyncService';
import { CacheManager } from '../CacheManager';
import { NetworkReconnectionHandler } from '../NetworkReconnectionHandler';

// Mock network conditions
const mockNetworkConditions = {
  online: { isConnected: true, type: 'wifi' },
  offline: { isConnected: false, type: 'none' },
  slowNetwork: { isConnected: true, type: 'cellular', effectiveType: '3g' },
  fastNetwork: { isConnected: true, type: 'wifi', effectiveType: '4g' }
};

describe('Offline Scenarios - Islamic Cultural & Educational Context', () => {
  let offlineManager: OfflineManager;
  let syncService: SyncService;
  let cacheManager: CacheManager;
  let networkHandler: NetworkReconnectionHandler;

  beforeEach(() => {
    // Initialize components with Islamic cultural awareness
    const culturalConfig = {
      culturalAwareness: true,
      educationalContext: true,
      prayerTimeIntegration: true,
      ramadanSensitivity: true
    };

    offlineManager = new OfflineManager(culturalConfig);
    syncService = new SyncService(culturalConfig, offlineManager);
    cacheManager = new CacheManager({
      maxCacheSize: 50,
      culturalAwareness: true,
      educationalContext: true,
      encryptionKey: 'test-key'
    });
    networkHandler = new NetworkReconnectionHandler(
      culturalConfig, 
      offlineManager, 
      syncService, 
      cacheManager
    );
  });

  afterEach(async () => {
    await offlineManager.destroy();
    await syncService.destroy();
    await cacheManager.destroy();
    await networkHandler.destroy();
  });

  describe('Prayer Time Awareness Tests', () => {
    it('should delay operations during prayer times', async () => {
      // Mock current time to be during Fajr prayer (5 AM)
      const mockDate = new Date();
      mockDate.setHours(5, 0, 0, 0);
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

      const operation = {
        id: 'test-op-1',
        type: 'CREATE_LESSON',
        data: { title: 'Mathematics Lesson 1' },
        priority: 'HIGH' as const,
        culturallyRespectful: true
      };

      await offlineManager.enqueue(operation);
      
      // Verify operation is queued but not processed immediately during prayer time
      const queueStatus = await offlineManager.getQueueStatus();
      expect(queueStatus.totalOperations).toBe(1);
      expect(queueStatus.processingPaused).toBe(true);
      expect(queueStatus.pauseReason).toBe('prayer_time');
    });

    it('should process high-priority educational operations after prayer time', async () => {
      // Mock time just after prayer time
      const mockDate = new Date();
      mockDate.setHours(6, 0, 0, 0);
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

      const urgentOperation = {
        id: 'urgent-op-1',
        type: 'EMERGENCY_NOTIFICATION',
        data: { message: 'School closure due to weather' },
        priority: 'CRITICAL' as const,
        culturallyRespectful: true
      };

      await offlineManager.enqueue(urgentOperation);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const queueStatus = await offlineManager.getQueueStatus();
      expect(queueStatus.totalOperations).toBe(0);
      expect(queueStatus.processedOperations).toBe(1);
    });
  });

  describe('Educational Priority Tests', () => {
    it('should prioritize teacher operations over student operations', async () => {
      const teacherOperation = {
        id: 'teacher-op-1',
        type: 'UPDATE_GRADES',
        data: { studentId: 'student-1', grade: 85 },
        priority: 'MEDIUM' as const,
        userRole: 'teacher' as const,
        educationallyRelevant: true
      };

      const studentOperation = {
        id: 'student-op-1',
        type: 'SUBMIT_HOMEWORK',
        data: { homeworkId: 'hw-1', content: 'My homework submission' },
        priority: 'HIGH' as const,
        userRole: 'student' as const,
        educationallyRelevant: true
      };

      // Add operations in reverse priority order
      await offlineManager.enqueue(studentOperation);
      await offlineManager.enqueue(teacherOperation);

      // Process operations
      const processedOperations = await offlineManager.processQueue();
      
      // Teacher operation should be processed first despite lower priority
      expect(processedOperations[0].id).toBe('teacher-op-1');
      expect(processedOperations[1].id).toBe('student-op-1');
    });

    it('should preserve student progress data with high priority', async () => {
      const progressOperation = {
        id: 'progress-op-1',
        type: 'TRACK_STUDENT_PROGRESS',
        data: { 
          studentId: 'student-1', 
          lessonId: 'lesson-1', 
          completionRate: 85,
          timeSpent: 1200
        },
        priority: 'LOW' as const,
        educationallyImportant: true,
        preserveData: true
      };

      await offlineManager.enqueue(progressOperation);

      // Simulate network disconnection during processing
      networkHandler.handleNetworkStateChange(mockNetworkConditions.offline);

      const queueStatus = await offlineManager.getQueueStatus();
      expect(queueStatus.highPriorityCount).toBe(1); // Should be elevated due to educational importance
    });
  });

  describe('Cultural Content Validation Tests', () => {
    it('should validate cultural appropriateness of cached content', async () => {
      const culturallyApropriateContent = {
        id: 'content-1',
        title: 'Islamic History Lesson',
        content: 'Learning about the golden age of Islamic civilization',
        culturallyAppropriate: true,
        respectfulContent: true
      };

      const inappropriateContent = {
        id: 'content-2',
        title: 'Inappropriate Content',
        content: 'Content that violates Islamic values',
        culturallyAppropriate: false,
        respectfulContent: false
      };

      // Appropriate content should be cached
      await cacheManager.set('appropriate-content', culturallyApropriateContent, {
        culturalContext: {
          respectfulContent: true,
          culturalPriority: 'high',
          prayerTimeRelevant: false,
          ramadanSensitive: false,
          arabicContentIncluded: false,
          culturalValidationRequired: false
        }
      });

      // Inappropriate content should be rejected
      await expect(
        cacheManager.set('inappropriate-content', inappropriateContent, {
          culturalContext: {
            respectfulContent: false,
            culturalPriority: 'low',
            prayerTimeRelevant: false,
            ramadanSensitive: false,
            arabicContentIncluded: false,
            culturalValidationRequired: true
          }
        })
      ).rejects.toThrow('Content does not meet Islamic cultural standards');
    });

    it('should handle Ramadan scheduling sensitivity', async () => {
      // Mock Ramadan period
      const isRamadan = true;
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(3); // April (typical Ramadan month)

      const ramadanSensitiveOperation = {
        id: 'ramadan-op-1',
        type: 'SCHEDULE_EXAM',
        data: { examDate: '2024-04-15', duration: 120 },
        priority: 'MEDIUM' as const,
        ramadanSensitive: true
      };

      await offlineManager.enqueue(ramadanSensitiveOperation);

      const queueStatus = await offlineManager.getQueueStatus();
      expect(queueStatus.culturallyDelayedOperations).toBe(1);
    });
  });

  describe('Network Reconnection Tests', () => {
    it('should handle graceful reconnection with cultural timing', async () => {
      // Start offline
      networkHandler.handleNetworkStateChange(mockNetworkConditions.offline);

      // Add operations while offline
      const offlineOperations = [
        { id: 'op-1', type: 'CREATE_ASSIGNMENT', priority: 'HIGH' as const },
        { id: 'op-2', type: 'UPDATE_STUDENT_PROFILE', priority: 'MEDIUM' as const },
        { id: 'op-3', type: 'SEND_NOTIFICATION', priority: 'LOW' as const }
      ];

      for (const op of offlineOperations) {
        await offlineManager.enqueue(op);
      }

      // Mock appropriate timing (not prayer time, during school hours)
      const mockDate = new Date();
      mockDate.setHours(10, 0, 0, 0); // 10 AM on weekday
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

      // Reconnect to network
      networkHandler.handleNetworkStateChange(mockNetworkConditions.fastNetwork);

      // Wait for sync to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      const queueStatus = await offlineManager.getQueueStatus();
      expect(queueStatus.totalOperations).toBe(0);
      expect(queueStatus.syncedOperations).toBe(3);
    });

    it('should delay sync during culturally inappropriate times', async () => {
      networkHandler.handleNetworkStateChange(mockNetworkConditions.offline);

      await offlineManager.enqueue({
        id: 'delayed-op-1',
        type: 'BULK_DATA_SYNC',
        priority: 'MEDIUM' as const
      });

      // Mock prayer time
      const prayerTime = new Date();
      prayerTime.setHours(12, 0, 0, 0); // Dhuhr prayer time
      jest.spyOn(Date, 'now').mockReturnValue(prayerTime.getTime());

      networkHandler.handleNetworkStateChange(mockNetworkConditions.fastNetwork);

      // Sync should be scheduled for later
      const networkState = networkHandler.getNetworkState();
      expect(networkState.culturallyAppropriateTiming).toBe(false);

      // Wait a bit to ensure sync is not immediate
      await new Promise(resolve => setTimeout(resolve, 100));

      const queueStatus = await offlineManager.getQueueStatus();
      expect(queueStatus.totalOperations).toBe(1); // Still queued
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain data integrity across offline/online transitions', async () => {
      const studentData = {
        id: 'student-1',
        name: 'Ahmed Ali',
        grade: 'Grade 8',
        subjects: ['Mathematics', 'Science', 'Islamic Studies'],
        progress: {
          mathematics: 85,
          science: 78,
          islamicStudies: 92
        },
        lastActivity: new Date().toISOString()
      };

      // Cache student data
      await cacheManager.set('student-1', studentData, {
        educationalContext: {
          subjectArea: 'student_management',
          difficultyLevel: 1,
          ageGroup: '13-14',
          teacherApprovalRequired: false,
          studentProgressRelevant: true,
          assessmentData: true,
          parentalConsentRequired: false,
          academicYear: '2023-2024'
        }
      });

      // Simulate offline modification
      const modifiedData = {
        ...studentData,
        progress: {
          ...studentData.progress,
          mathematics: 90 // Improved grade
        }
      };

      await cacheManager.set('student-1', modifiedData);

      // Verify data integrity
      const retrievedData = await cacheManager.get('student-1');
      expect(retrievedData.progress.mathematics).toBe(90);
      expect(retrievedData.name).toBe('Ahmed Ali');
    });

    it('should handle conflict resolution with educational hierarchy', async () => {
      const originalGrade = { studentId: 'student-1', subject: 'math', grade: 80 };
      
      // Teacher updates grade offline
      const teacherUpdate = {
        ...originalGrade,
        grade: 85,
        updatedBy: 'teacher-1',
        updatedAt: Date.now()
      };

      // Student tries to update grade offline (should not be allowed)
      const studentUpdate = {
        ...originalGrade,
        grade: 95,
        updatedBy: 'student-1',
        updatedAt: Date.now() + 1000
      };

      await syncService.resolveConflict(
        'grade-conflict-1',
        originalGrade,
        teacherUpdate,
        studentUpdate,
        { educationalHierarchy: true }
      );

      // Teacher update should take precedence
      const resolvedData = await syncService.getResolvedData('grade-conflict-1');
      expect(resolvedData.grade).toBe(85);
      expect(resolvedData.updatedBy).toBe('teacher-1');
    });
  });

  describe('Performance and Battery Optimization Tests', () => {
    it('should optimize operations for battery conservation', async () => {
      // Mock low battery condition
      jest.spyOn(networkHandler as any, 'getBatteryLevel').mockResolvedValue(15);
      jest.spyOn(networkHandler as any, 'isCharging').mockResolvedValue(false);

      const batteryIntensiveOperation = {
        id: 'intensive-op-1',
        type: 'BULK_MEDIA_SYNC',
        data: { mediaCount: 100, totalSize: '50MB' },
        priority: 'LOW' as const,
        batteryIntensive: true
      };

      await offlineManager.enqueue(batteryIntensiveOperation);

      // Operation should be delayed due to low battery
      const queueStatus = await offlineManager.getQueueStatus();
      expect(queueStatus.batteryOptimizedOperations).toBe(1);
    });

    it('should batch operations for network efficiency', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => ({
        id: `batch-op-${i}`,
        type: 'UPDATE_PROGRESS',
        data: { studentId: `student-${i}`, progress: 80 + i },
        priority: 'MEDIUM' as const,
        batchable: true
      }));

      for (const op of operations) {
        await offlineManager.enqueue(op);
      }

      networkHandler.handleNetworkStateChange(mockNetworkConditions.slowNetwork);
      
      const syncBatches = await syncService.prepareBatchSync();
      expect(syncBatches.length).toBe(1); // All operations batched together
      expect(syncBatches[0].operations.length).toBe(10);
    });
  });

  describe('Multilingual Support Tests', () => {
    it('should handle multilingual content caching', async () => {
      const multilingualLesson = {
        id: 'lesson-multilingual-1',
        title: {
          en: 'Introduction to Algebra',
          uz: 'Algebraga kirish',
          ru: 'Введение в алгебру',
          ar: 'مقدمة في الجبر'
        },
        content: {
          en: 'Basic algebraic concepts...',
          uz: 'Asosiy algebra tushunchalari...',
          ru: 'Основные алгебраические понятия...',
          ar: 'المفاهيم الجبرية الأساسية...'
        },
        culturallyAdapted: true
      };

      await cacheManager.set('multilingual-lesson-1', multilingualLesson, {
        culturalContext: {
          respectfulContent: true,
          culturalPriority: 'high',
          arabicContentIncluded: true,
          prayerTimeRelevant: false,
          ramadanSensitive: false,
          culturalValidationRequired: false
        },
        tags: ['multilingual', 'mathematics', 'culturally-adapted']
      });

      const cachedLesson = await cacheManager.get('multilingual-lesson-1');
      expect(cachedLesson.title.ar).toBe('مقدمة في الجبر');
      expect(cachedLesson.culturallyAdapted).toBe(true);
    });
  });

  describe('Error Handling and Recovery Tests', () => {
    it('should handle storage failures gracefully', async () => {
      // Mock storage failure
      jest.spyOn(offlineManager as any, 'storage').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      const operation = {
        id: 'error-op-1',
        type: 'CREATE_LESSON',
        priority: 'HIGH' as const
      };

      // Should not throw error, should handle gracefully
      await expect(offlineManager.enqueue(operation)).resolves.not.toThrow();

      // Should fall back to alternative storage
      const queueStatus = await offlineManager.getQueueStatus();
      expect(queueStatus.fallbackStorageActive).toBe(true);
    });

    it('should recover from sync failures with exponential backoff', async () => {
      // Mock sync failures
      let attemptCount = 0;
      jest.spyOn(syncService, 'performSync').mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Sync failed');
        }
        return { success: true, operationsSynced: 1 };
      });

      const operation = { id: 'retry-op-1', type: 'UPDATE_PROFILE', priority: 'MEDIUM' as const };
      await offlineManager.enqueue(operation);

      networkHandler.handleNetworkStateChange(mockNetworkConditions.fastNetwork);

      // Wait for retries to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(attemptCount).toBe(3);
      const queueStatus = await offlineManager.getQueueStatus();
      expect(queueStatus.syncedOperations).toBe(1);
    });
  });
});

// Integration test for complete offline workflow
describe('Complete Offline Workflow Integration', () => {
  it('should handle complete teacher workflow offline and sync when reconnected', async () => {
    const offlineManager = new OfflineManager({ culturalAwareness: true });
    const syncService = new SyncService({}, offlineManager);
    const cacheManager = new CacheManager({
      maxCacheSize: 50,
      culturalAwareness: true,
      educationalContext: true
    });
    const networkHandler = new NetworkReconnectionHandler(
      { autoSyncOnReconnection: true },
      offlineManager,
      syncService,
      cacheManager
    );

    // Start offline
    networkHandler.handleNetworkStateChange(mockNetworkConditions.offline);

    // Teacher workflow: mark attendance, update grades, create assignment
    const teacherOperations = [
      {
        id: 'attendance-1',
        type: 'MARK_ATTENDANCE',
        data: { classId: 'class-8a', date: '2024-01-15', attendanceData: [...] },
        priority: 'HIGH' as const,
        userRole: 'teacher' as const
      },
      {
        id: 'grades-1',
        type: 'UPDATE_GRADES',
        data: { studentId: 'student-1', subject: 'math', grade: 85 },
        priority: 'HIGH' as const,
        userRole: 'teacher' as const
      },
      {
        id: 'assignment-1',
        type: 'CREATE_ASSIGNMENT',
        data: { 
          title: 'Algebra Practice', 
          dueDate: '2024-01-20',
          description: 'Practice problems for algebra concepts'
        },
        priority: 'MEDIUM' as const,
        userRole: 'teacher' as const
      }
    ];

    // Process operations offline
    for (const op of teacherOperations) {
      await offlineManager.enqueue(op);
    }

    // Cache student data for offline access
    const studentData = {
      id: 'student-1',
      name: 'Ahmed Ali',
      currentGrades: { math: 80, science: 85 }
    };

    await cacheManager.set('student-1', studentData, {
      educationalContext: {
        subjectArea: 'student_management',
        difficultyLevel: 1,
        ageGroup: '13-14',
        teacherApprovalRequired: false,
        studentProgressRelevant: true,
        assessmentData: false,
        parentalConsentRequired: false,
        academicYear: '2023-2024'
      }
    });

    // Verify offline state
    const offlineStatus = await offlineManager.getQueueStatus();
    expect(offlineStatus.totalOperations).toBe(3);
    
    const cachedStudent = await cacheManager.get('student-1');
    expect(cachedStudent.name).toBe('Ahmed Ali');

    // Reconnect during appropriate time (not prayer time)
    const schoolTime = new Date();
    schoolTime.setHours(10, 0, 0, 0);
    jest.spyOn(Date, 'now').mockReturnValue(schoolTime.getTime());

    networkHandler.handleNetworkStateChange(mockNetworkConditions.fastNetwork);

    // Wait for sync to complete
    await new Promise(resolve => setTimeout(resolve, 300));

    // Verify sync completion
    const finalStatus = await offlineManager.getQueueStatus();
    expect(finalStatus.totalOperations).toBe(0);
    expect(finalStatus.syncedOperations).toBe(3);

    // Cleanup
    await offlineManager.destroy();
    await syncService.destroy();
    await cacheManager.destroy();
    await networkHandler.destroy();
  });
});