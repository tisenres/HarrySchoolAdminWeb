/**
 * ProfileSettings Component Types
 * Harry School Mobile Design System
 */

import { ViewStyle } from 'react-native';

export type SettingType = 'toggle' | 'navigation' | 'value' | 'button';

export interface SettingItem {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  type: SettingType;
  value?: boolean | string | number;
  buttonText?: string;
  disabled?: boolean;
}

export interface SettingSection {
  id?: string;
  title?: string;
  footer?: string;
  items: SettingItem[];
}

export interface ProfileSettingsProps {
  /** Array of setting sections */
  sections: SettingSection[];
  
  /** Item press handler (for navigation and button types) */
  onItemPress?: (item: SettingItem, index: number) => void;
  
  /** Toggle handler (for toggle type) */
  onToggle?: (item: SettingItem, value: boolean) => void;
  
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  
  /** Theme variant */
  theme?: 'light' | 'dark';
  
  /** Custom container styles */
  style?: ViewStyle;
  
  /** Test ID for automation */
  testID?: string;
}

export interface ProfileSettingsStyles {
  container: ViewStyle;
  section: ViewStyle;
  sectionTitle: ViewStyle;
  sectionContent: ViewStyle;
  sectionFooter: ViewStyle;
  itemContainer: ViewStyle;
  iconContainer: ViewStyle;
  icon: ViewStyle;
  content: ViewStyle;
  title: ViewStyle;
  subtitle: ViewStyle;
  rightElement: ViewStyle;
  valueText: ViewStyle;
  chevron: ViewStyle;
  button: ViewStyle;
  buttonText: ViewStyle;
}