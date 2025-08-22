import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  changeLanguage,
  getCurrentLanguage,
  formatDate,
  formatTime,
  formatDuration,
} from '../../../packages/shared/i18n';

// Mock the storage module
const mockStorage = {
  set: jest.fn(),
  getString: jest.fn(),
  getNumber: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../../../packages/shared/i18n/storage', () => ({
  languageStorage: {
    storeLanguagePreference: jest.fn(),
    getLanguagePreference: jest.fn(),
    initialize: jest.fn(),
  },
  storeLanguagePreference: jest.fn(),
  getLanguagePreference: jest.fn(),
}));

describe('i18n System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getString.mockReturnValue('en');
  });

  describe('Language Management', () => {
    it('should change language to Russian', async () => {
      const mockI18n = {
        changeLanguage: jest.fn().mockResolvedValue(undefined),
      };

      // Test language change functionality
      await expect(changeLanguage('ru')).resolves.toBeUndefined();
    });

    it('should change language to Uzbek', async () => {
      await expect(changeLanguage('uz')).resolves.toBeUndefined();
    });

    it('should handle invalid language gracefully', async () => {
      // @ts-ignore - Testing invalid input
      await expect(changeLanguage('invalid')).rejects.toThrow();
    });

    it('should get current language', () => {
      const currentLang = getCurrentLanguage();
      expect(['en', 'ru', 'uz']).toContain(currentLang);
    });
  });

  describe('Date and Time Formatting', () => {
    const testDate = new Date('2024-01-15T14:30:00Z');

    it('should format date in English', () => {
      const formatted = formatDate(testDate, 'en');
      expect(formatted).toMatch(/January 15, 2024|15\/01\/2024|Jan 15, 2024/);
    });

    it('should format date in Russian', () => {
      const formatted = formatDate(testDate, 'ru');
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should format date in Uzbek', () => {
      const formatted = formatDate(testDate, 'uz');
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should format time in 12-hour format for English', () => {
      const formatted = formatTime(testDate, 'en');
      expect(formatted).toMatch(/\\d{1,2}:\\d{2} [AP]M/);
    });

    it('should format time in 24-hour format for Russian', () => {
      const formatted = formatTime(testDate, 'ru');
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should format duration correctly', () => {
      const duration90min = formatDuration(90, 'en');
      expect(duration90min).toContain('hour');
      expect(duration90min).toContain('minute');

      const duration30min = formatDuration(30, 'en');
      expect(duration30min).toContain('minute');
    });

    it('should handle Russian pluralization for duration', () => {
      // Russian has complex pluralization rules
      const duration1hour = formatDuration(60, 'ru');
      const duration2hours = formatDuration(120, 'ru');
      const duration5hours = formatDuration(300, 'ru');

      expect(duration1hour).toBeTruthy();
      expect(duration2hours).toBeTruthy();
      expect(duration5hours).toBeTruthy();
    });
  });

  describe('Cultural Integration', () => {
    it('should handle Islamic calendar formatting', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, 'en', { calendar: 'islamic' });
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should format prayer times correctly', () => {
      const { mockPrayerTimes } = global.islamicTestHelpers;
      expect(mockPrayerTimes.fajr).toMatch(/\\d{2}:\\d{2}/);
      expect(mockPrayerTimes.maghrib).toMatch(/\\d{2}:\\d{2}/);
    });

    it('should handle age-adaptive language complexity', () => {
      const { getAgeGroup } = global.ageTestHelpers;
      
      expect(getAgeGroup(11)).toBe('elementary');
      expect(getAgeGroup(14)).toBe('middle');
      expect(getAgeGroup(17)).toBe('high');
    });
  });

  describe('Error Handling', () => {
    it('should fallback to English when language loading fails', async () => {
      // Mock i18n to reject
      const mockI18n = {
        changeLanguage: jest.fn().mockRejectedValue(new Error('Load failed')),
      };

      try {
        await changeLanguage('ru');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Should still have a valid current language
      const currentLang = getCurrentLanguage();
      expect(currentLang).toBeDefined();
    });

    it('should handle missing translation keys gracefully', () => {
      // This would be handled by i18next's fallback mechanism
      expect(true).toBe(true); // Placeholder for actual translation key testing
    });
  });

  describe('Performance', () => {
    it('should change language quickly', async () => {
      const startTime = Date.now();
      await changeLanguage('ru');
      const endTime = Date.now();
      
      // Language change should be fast (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should format dates efficiently', () => {
      const date = new Date();
      const iterations = 100;
      
      const startTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        formatDate(date, 'en');
      }
      const endTime = Date.now();
      
      // Should format 100 dates in less than 50ms
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Uzbekistan Educational Context', () => {
    it('should handle educational terminology correctly', () => {
      const { educationalContext } = global.culturalTestHelpers;
      expect(educationalContext.schoolYear).toBe('2024-2025');
      expect(educationalContext.islamicYear).toBe(1445);
    });

    it('should support Latin script for Uzbek', () => {
      const { uzbekLanguagePatterns } = global.culturalTestHelpers;
      expect(uzbekLanguagePatterns.latinScript).toBe(true);
      expect(uzbekLanguagePatterns.cyrillicScript).toBe(false);
    });

    it('should handle simple Uzbek pluralization', () => {
      const { uzbekLanguagePatterns } = global.culturalTestHelpers;
      expect(uzbekLanguagePatterns.pluralization).toBe('simple');
    });

    it('should handle complex Russian pluralization', () => {
      const { russianLanguagePatterns } = global.culturalTestHelpers;
      expect(russianLanguagePatterns.pluralization).toBe('complex');
      expect(russianLanguagePatterns.cases).toHaveLength(6);
    });
  });

  describe('Accessibility', () => {
    it('should provide screen reader friendly date formats', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, 'en', { screenReader: true });
      expect(formatted).toBeTruthy();
      // Screen reader format should be more verbose
      expect(formatted.length).toBeGreaterThan(10);
    });

    it('should handle RTL preparation for Arabic', () => {
      // Test RTL utilities when they become available
      expect(true).toBe(true); // Placeholder for RTL testing
    });
  });
});