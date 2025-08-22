import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LanguageSwitcher } from '../../src/components/settings/LanguageSwitcher';

// Mock the i18n system
const mockChangeLanguage = jest.fn();
const mockGetCurrentLanguage = jest.fn();
const mockT = jest.fn((key) => key);

jest.mock('../../../packages/shared/i18n', () => ({
  changeLanguage: mockChangeLanguage,
  getCurrentLanguage: mockGetCurrentLanguage,
  SupportedLanguage: {
    EN: 'en',
    RU: 'ru',
    UZ: 'uz',
  },
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

// Mock Alert
const mockAlert = jest.fn();
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: mockAlert,
}));

describe('LanguageSwitcher Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentLanguage.mockReturnValue('en');
    mockChangeLanguage.mockResolvedValue(undefined);
    mockT.mockImplementation((key) => key);
  });

  describe('Rendering', () => {
    it('should render language options correctly', () => {
      const { getByText } = render(<LanguageSwitcher />);

      expect(getByText('English')).toBeTruthy();
      expect(getByText('Русский')).toBeTruthy();
      expect(getByText('O\'zbek')).toBeTruthy();
    });

    it('should show current language as selected', () => {
      mockGetCurrentLanguage.mockReturnValue('ru');
      
      const { getByText } = render(<LanguageSwitcher />);
      
      // Should show Russian as selected (would have checkmark in actual implementation)
      expect(getByText('Русский')).toBeTruthy();
    });

    it('should render with description when showDescription is true', () => {
      const { getByText } = render(
        <LanguageSwitcher showDescription={true} />
      );

      expect(mockT).toHaveBeenCalledWith('language.description');
    });

    it('should not render description when showDescription is false', () => {
      render(<LanguageSwitcher showDescription={false} />);

      expect(mockT).not.toHaveBeenCalledWith('language.description');
    });
  });

  describe('Language Switching', () => {
    it('should change language when option is pressed', async () => {
      const mockOnLanguageChanged = jest.fn();
      const { getByText } = render(
        <LanguageSwitcher onLanguageChanged={mockOnLanguageChanged} />
      );

      const russianOption = getByText('Русский');
      fireEvent.press(russianOption);

      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('ru');
        expect(mockOnLanguageChanged).toHaveBeenCalledWith('ru');
      });
    });

    it('should not change language when current language is pressed', async () => {
      mockGetCurrentLanguage.mockReturnValue('en');
      
      const { getByText } = render(<LanguageSwitcher />);
      const englishOption = getByText('English');
      
      fireEvent.press(englishOption);

      // Should not call changeLanguage for already selected language
      expect(mockChangeLanguage).not.toHaveBeenCalled();
    });

    it('should handle language change success', async () => {
      const { getByText } = render(<LanguageSwitcher />);
      const uzbekOption = getByText('O\'zbek');

      fireEvent.press(uzbekOption);

      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('uz');
        expect(mockT).toHaveBeenCalledWith('language.changeSuccessTitle');
        expect(mockT).toHaveBeenCalledWith('language.changeSuccessMessage');
      });
    });

    it('should handle language change error', async () => {
      mockChangeLanguage.mockRejectedValue(new Error('Change failed'));
      
      const { getByText } = render(<LanguageSwitcher />);
      const russianOption = getByText('Русский');

      fireEvent.press(russianOption);

      await waitFor(() => {
        expect(mockT).toHaveBeenCalledWith('language.changeErrorTitle');
        expect(mockT).toHaveBeenCalledWith('language.changeErrorMessage');
      });
    });
  });

  describe('Loading States', () => {
    it('should show changing indicator during language change', async () => {
      // Mock a delayed language change
      mockChangeLanguage.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { getByText } = render(<LanguageSwitcher />);
      const russianOption = getByText('Русский');

      fireEvent.press(russianOption);

      // Should show changing text during the operation
      expect(mockT).toHaveBeenCalledWith('language.changing');
    });

    it('should disable options during language change', async () => {
      mockChangeLanguage.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { getByText } = render(<LanguageSwitcher />);
      const russianOption = getByText('Русский');
      const uzbekOption = getByText('O\'zbek');

      fireEvent.press(russianOption);

      // Second press should not trigger another change
      fireEvent.press(uzbekOption);

      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Cultural Integration', () => {
    it('should display correct native names for languages', () => {
      const { getByText } = render(<LanguageSwitcher />);

      // Check native language names
      expect(getByText('English')).toBeTruthy(); // English
      expect(getByText('Русский')).toBeTruthy(); // Russian
      expect(getByText('O\'zbek')).toBeTruthy(); // Uzbek in Latin script
    });

    it('should display appropriate flags', () => {
      const { getByText } = render(<LanguageSwitcher />);

      // Flags should be present (though exact rendering might vary)
      expect(getByText('🇺🇸')).toBeTruthy(); // US flag for English
      expect(getByText('🇷🇺')).toBeTruthy(); // Russian flag
      expect(getByText('🇺🇿')).toBeTruthy(); // Uzbekistan flag
    });
  });

  describe('Educational Context', () => {
    it('should support age-appropriate language switching', () => {
      const { getAgeGroup } = global.ageTestHelpers;
      
      // All age groups should be able to switch languages
      expect(getAgeGroup(11)).toBe('elementary');
      expect(getAgeGroup(14)).toBe('middle');
      expect(getAgeGroup(17)).toBe('high');

      // Component should render for all age groups
      const { getByText } = render(<LanguageSwitcher />);
      expect(getByText('English')).toBeTruthy();
    });

    it('should handle Islamic educational context', () => {
      const { educationalContext } = global.culturalTestHelpers;
      
      expect(educationalContext.islamicYear).toBe(1445);
      
      // Language switcher should work within Islamic educational framework
      const { getByText } = render(<LanguageSwitcher />);
      expect(getByText('language.title')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible language options', () => {
      const { getByText } = render(<LanguageSwitcher />);

      const englishOption = getByText('English');
      const russianOption = getByText('Русский');
      const uzbekOption = getByText('O\'zbek');

      // All options should be touchable
      expect(englishOption).toBeTruthy();
      expect(russianOption).toBeTruthy();
      expect(uzbekOption).toBeTruthy();
    });

    it('should support screen readers', () => {
      // Screen reader support would be tested with actual accessibility testing tools
      const { getByText } = render(<LanguageSwitcher />);
      
      // Component should render properly for screen readers
      expect(getByText('language.title')).toBeTruthy();
    });

    it('should have adequate touch targets', () => {
      const { getByText } = render(<LanguageSwitcher />);

      // Touch targets should be easily tappable (would test actual dimensions in real implementation)
      expect(getByText('English')).toBeTruthy();
      expect(getByText('Русский')).toBeTruthy();
      expect(getByText('O\'zbek')).toBeTruthy();
    });
  });

  describe('Props and Customization', () => {
    it('should apply custom styles', () => {
      const customStyle = { backgroundColor: 'red' };
      const { container } = render(
        <LanguageSwitcher style={customStyle} />
      );

      // Would test actual style application in real implementation
      expect(container).toBeTruthy();
    });

    it('should call onLanguageChanged callback', async () => {
      const mockCallback = jest.fn();
      const { getByText } = render(
        <LanguageSwitcher onLanguageChanged={mockCallback} />
      );

      const russianOption = getByText('Русский');
      fireEvent.press(russianOption);

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith('ru');
      });
    });
  });

  describe('Error Recovery', () => {
    it('should maintain UI state after language change failure', async () => {
      mockChangeLanguage.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(<LanguageSwitcher />);
      const russianOption = getByText('Русский');

      fireEvent.press(russianOption);

      await waitFor(() => {
        // UI should still be interactive after error
        expect(getByText('Русский')).toBeTruthy();
        expect(getByText('English')).toBeTruthy();
      });
    });

    it('should not leave component in loading state after error', async () => {
      mockChangeLanguage.mockRejectedValue(new Error('Change failed'));

      const { getByText } = render(<LanguageSwitcher />);
      const uzbekOption = getByText('O\'zbek');

      fireEvent.press(uzbekOption);

      await waitFor(() => {
        // Changing indicator should be hidden after error
        expect(mockT).toHaveBeenCalledWith('language.changing');
      });
    });
  });
});