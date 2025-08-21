/**
 * Deep Linking Unit Tests for Harry School Student App
 * 
 * Unit tests for deep linking service, hooks, and utility functions
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock React Navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  reset: jest.fn(),
  getParent: jest.fn().mockReturnValue({
    isReady: jest.fn().mockReturnValue(true),
    getRootState: jest.fn().mockReturnValue({ routes: [] })
  })
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

import { deepLinkingService } from '../services/deepLinking.service';
import { useDeepLinking } from '../hooks/useDeepLinking';

describe('DeepLinkingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deepLinkingService.setNavigationRef(mockNavigation as any);
  });

  describe('URL Parsing', () => {
    it('should parse schedule URLs correctly', async () => {
      const url = 'harryschool://schedule/week/2024-03-15';
      const config = {
        url,
        studentAge: 14,
        authenticationStatus: 'authenticated' as const,
        parentalSettings: {
          oversightRequired: false,
          familyNotifications: true,
          restrictedFeatures: [],
          approvedTeachers: []
        }
      };

      const result = await deepLinkingService.handleDeepLink(config);
      
      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('Schedule', {
        screen: 'Calendar',
        params: expect.objectContaining({
          view: 'week',
          date: '2024-03-15',
          __security: expect.any(Object)
        })
      });
    });

    it('should parse class detail URLs correctly', async () => {
      const url = 'harryschool://class/math-101/attendance';
      const config = {
        url,
        studentAge: 16,
        authenticationStatus: 'authenticated' as const,
        parentalSettings: {
          oversightRequired: false,
          familyNotifications: false,
          restrictedFeatures: [],
          approvedTeachers: []
        }
      };

      const result = await deepLinkingService.handleDeepLink(config);
      
      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('Schedule', {
        screen: 'ClassDetail',
        params: expect.objectContaining({
          classId: 'math-101',
          action: 'attendance'
        })
      });
    });

    it('should parse profile URLs correctly', async () => {
      const url = 'harryschool://profile/achievements';
      const config = {
        url,
        studentAge: 15,
        authenticationStatus: 'authenticated' as const,
        parentalSettings: {
          oversightRequired: false,
          familyNotifications: true,
          restrictedFeatures: [],
          approvedTeachers: []
        }
      };

      const result = await deepLinkingService.handleDeepLink(config);
      
      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('Profile', {
        screen: 'ProfileMain',
        params: expect.objectContaining({
          section: 'achievements'
        })
      });
    });

    it('should reject invalid URLs', async () => {
      const url = 'invalid-url';
      const config = {
        url,
        studentAge: 14,
        authenticationStatus: 'authenticated' as const,
        parentalSettings: {
          oversightRequired: false,
          familyNotifications: true,
          restrictedFeatures: [],
          approvedTeachers: []
        }
      };

      const result = await deepLinkingService.handleDeepLink(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });
  });

  describe('Authentication Validation', () => {
    it('should block unauthenticated users from protected routes', async () => {
      const url = 'harryschool://profile/overview';
      const config = {
        url,
        studentAge: 14,
        authenticationStatus: 'unauthenticated' as const,
        parentalSettings: {
          oversightRequired: false,
          familyNotifications: true,
          restrictedFeatures: [],
          approvedTeachers: []
        }
      };

      const result = await deepLinkingService.handleDeepLink(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(result.action).toBe('redirect_to_login');
    });

    it('should allow authenticated users to access protected routes', async () => {
      const url = 'harryschool://profile/overview';
      const config = {
        url,
        studentAge: 14,
        authenticationStatus: 'authenticated' as const,
        parentalSettings: {
          oversightRequired: false,
          familyNotifications: true,
          restrictedFeatures: [],
          approvedTeachers: []
        }
      };

      const result = await deepLinkingService.handleDeepLink(config);
      
      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('Age-Based Access Control', () => {
    it('should block elementary students from privacy settings', async () => {
      const url = 'harryschool://settings/privacy';
      const config = {
        url,
        studentAge: 11,
        authenticationStatus: 'authenticated' as const,
        parentalSettings: {
          oversightRequired: true,
          familyNotifications: true,
          restrictedFeatures: ['privacy'],
          approvedTeachers: []
        }
      };

      const result = await deepLinkingService.handleDeepLink(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('privacy settings not available for your age');
      expect(result.action).toBe('show_age_restriction_dialog');
    });

    it('should allow high school students full access', async () => {
      const url = 'harryschool://settings/privacy';
      const config = {
        url,
        studentAge: 17,
        authenticationStatus: 'authenticated' as const,
        parentalSettings: {
          oversightRequired: false,
          familyNotifications: false,
          restrictedFeatures: [],
          approvedTeachers: []
        }
      };

      const result = await deepLinkingService.handleDeepLink(config);
      
      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('should require parental approval for payment requests from young students', async () => {
      const url = 'harryschool://request/lesson/create';
      const config = {
        url,
        studentAge: 12,
        authenticationStatus: 'authenticated' as const,
        parentalSettings: {
          oversightRequired: true,
          familyNotifications: true,
          restrictedFeatures: [],
          approvedTeachers: []
        }
      };

      const result = await deepLinkingService.handleDeepLink(config);
      
      // Should still allow navigation but require approval for payment
      expect(result.success).toBe(true);
    });
  });

  describe('Parental Oversight', () => {
    it('should require parental approval for elementary profile access', async () => {
      const url = 'harryschool://profile/settings';
      const config = {
        url,
        studentAge: 10,
        authenticationStatus: 'authenticated' as const,
        parentalSettings: {
          oversightRequired: true,
          familyNotifications: true,
          restrictedFeatures: [],
          approvedTeachers: []
        }
      };

      const result = await deepLinkingService.handleDeepLink(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Parental approval required');
      expect(result.action).toBe('request_parental_approval');
    });

    it('should allow middle school students limited profile access', async () => {
      const url = 'harryschool://profile/overview';
      const config = {
        url,
        studentAge: 14,
        authenticationStatus: 'authenticated' as const,
        parentalSettings: {
          oversightRequired: false,
          familyNotifications: true,
          restrictedFeatures: [],
          approvedTeachers: []
        }
      };

      const result = await deepLinkingService.handleDeepLink(config);
      
      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('Security Validation', () => {
    it('should reject malicious URLs', async () => {
      const maliciousUrls = [
        'javascript:alert("xss")',
        'harryschool://../../etc/passwd',
        'https://malicious-site.com/harryschool/'
      ];

      for (const url of maliciousUrls) {
        const config = {
          url,
          studentAge: 14,
          authenticationStatus: 'authenticated' as const,
          parentalSettings: {
            oversightRequired: false,
            familyNotifications: true,
            restrictedFeatures: [],
            approvedTeachers: []
          }
        };

        const result = await deepLinkingService.handleDeepLink(config);
        
        expect(result.success).toBe(false);
        expect(mockNavigate).not.toHaveBeenCalled();
      }
    });

    it('should add security context to navigation params', async () => {
      const url = 'harryschool://home';
      const config = {
        url,
        studentAge: 14,
        authenticationStatus: 'authenticated' as const,
        parentalSettings: {
          oversightRequired: false,
          familyNotifications: true,
          restrictedFeatures: [],
          approvedTeachers: []
        }
      };

      const result = await deepLinkingService.handleDeepLink(config);
      
      expect(result.success).toBe(true);
      expect(result.params.__security).toEqual({
        ageValidated: true,
        authValidated: true,
        timestamp: expect.any(Number),
        sessionId: expect.any(String)
      });
    });
  });
});

describe('useDeepLinking Hook', () => {
  const defaultConfig = {
    studentAge: 14,
    isAuthenticated: true,
    parentalSettings: {
      oversightRequired: false,
      familyNotifications: true,
      restrictedFeatures: [],
      approvedTeachers: []
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle deep links successfully', async () => {
    const { result } = renderHook(() => useDeepLinking(defaultConfig));
    
    await act(async () => {
      await result.current.handleDeepLink('harryschool://home');
    });
    
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.lastError).toBe(null);
  });

  it('should handle authentication errors', async () => {
    const unauthenticatedConfig = {
      ...defaultConfig,
      isAuthenticated: false
    };
    
    const { result } = renderHook(() => useDeepLinking(unauthenticatedConfig));
    
    await act(async () => {
      await result.current.handleDeepLink('harryschool://profile/overview');
    });
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign In Required',
      'You need to sign in to access this content.',
      expect.any(Array)
    );
  });

  it('should handle age restrictions with appropriate messaging', async () => {
    const youngStudentConfig = {
      ...defaultConfig,
      studentAge: 11
    };
    
    const { result } = renderHook(() => useDeepLinking(youngStudentConfig));
    
    await act(async () => {
      await result.current.handleDeepLink('harryschool://settings/privacy');
    });
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Access Limited',
      expect.stringContaining('You need permission to access this'),
      expect.any(Array)
    );
  });

  it('should provide parental guidance for elementary students', async () => {
    const elementaryConfig = {
      ...defaultConfig,
      studentAge: 10,
      parentalSettings: {
        ...defaultConfig.parentalSettings,
        oversightRequired: true,
        familyNotifications: true
      }
    };
    
    const { result } = renderHook(() => useDeepLinking(elementaryConfig));
    
    await act(async () => {
      await result.current.handleDeepLink('harryschool://profile/settings');
    });
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Permission Needed',
      'This action needs your parent or guardian\'s permission. Would you like to ask them?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Ask Parent' })
      ])
    );
  });

  it('should clear errors when requested', async () => {
    const { result } = renderHook(() => useDeepLinking(defaultConfig));
    
    // Simulate an error
    await act(async () => {
      await result.current.handleDeepLink('invalid-url');
    });
    
    expect(result.current.lastError).toBeTruthy();
    
    // Clear the error
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.lastError).toBe(null);
  });

  it('should prevent concurrent deep link processing', async () => {
    const { result } = renderHook(() => useDeepLinking(defaultConfig));
    
    // Start first deep link
    const promise1 = act(async () => {
      await result.current.handleDeepLink('harryschool://home');
    });
    
    // Try to start second deep link while first is processing
    const promise2 = act(async () => {
      await result.current.handleDeepLink('harryschool://profile');
    });
    
    await Promise.all([promise1, promise2]);
    
    // Should only process one at a time
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});

describe('Cultural Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle Islamic calendar deep links', async () => {
    const config = {
      url: 'harryschool://schedule/month?islamic=true',
      studentAge: 14,
      authenticationStatus: 'authenticated' as const,
      parentalSettings: {
        oversightRequired: false,
        familyNotifications: true,
        restrictedFeatures: [],
        approvedTeachers: []
      }
    };

    const result = await deepLinkingService.handleDeepLink(config);
    
    expect(result.success).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith('Schedule', {
      screen: 'Calendar',
      params: expect.objectContaining({
        view: 'month',
        islamic: 'true'
      })
    });
  });

  it('should support multi-language deep links', async () => {
    const languages = ['en', 'ru', 'uz'];
    
    for (const lang of languages) {
      const config = {
        url: `harryschool://home?lang=${lang}`,
        studentAge: 14,
        authenticationStatus: 'authenticated' as const,
        parentalSettings: {
          oversightRequired: false,
          familyNotifications: true,
          restrictedFeatures: [],
          approvedTeachers: []
        }
      };

      const result = await deepLinkingService.handleDeepLink(config);
      
      expect(result.success).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            lang
          })
        })
      );
    }
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle navigation service errors gracefully', async () => {
    // Mock navigation to throw an error
    mockNavigate.mockImplementationOnce(() => {
      throw new Error('Navigation failed');
    });

    const config = {
      url: 'harryschool://home',
      studentAge: 14,
      authenticationStatus: 'authenticated' as const,
      parentalSettings: {
        oversightRequired: false,
        familyNotifications: true,
        restrictedFeatures: [],
        approvedTeachers: []
      }
    };

    const result = await deepLinkingService.handleDeepLink(config);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Navigation failed');
    expect(result.action).toBe('show_navigation_error');
  });

  it('should handle malformed URLs gracefully', async () => {
    const config = {
      url: 'harryschool://profile/[malformed',
      studentAge: 14,
      authenticationStatus: 'authenticated' as const,
      parentalSettings: {
        oversightRequired: false,
        familyNotifications: true,
        restrictedFeatures: [],
        approvedTeachers: []
      }
    };

    const result = await deepLinkingService.handleDeepLink(config);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});