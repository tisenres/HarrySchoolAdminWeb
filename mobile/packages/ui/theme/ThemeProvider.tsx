import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { 
  harrySchoolTheme, 
  studentTheme, 
  teacherTheme, 
  darkTheme, 
  getTheme 
} from './theme';

type ThemeVariant = 'default' | 'student' | 'teacher' | 'dark' | 'auto';

interface ThemeContextValue {
  theme: typeof harrySchoolTheme;
  variant: ThemeVariant;
  isDark: boolean;
  colors: typeof harrySchoolTheme.colors;
  tokens: typeof harrySchoolTheme.tokens;
  typography: typeof harrySchoolTheme.typography;
  spacing: typeof harrySchoolTheme.spacing;
  animations: typeof harrySchoolTheme.animations;
  components: typeof harrySchoolTheme.components;
  setThemeVariant: (variant: ThemeVariant) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  variant?: ThemeVariant;
  onThemeChange?: (variant: ThemeVariant) => void;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  variant: initialVariant = 'default',
  onThemeChange,
}) => {
  const systemColorScheme = useColorScheme();
  const [currentVariant, setCurrentVariant] = React.useState<ThemeVariant>(initialVariant);

  const theme = useMemo(() => {
    let selectedTheme;
    
    if (currentVariant === 'auto') {
      selectedTheme = systemColorScheme === 'dark' ? darkTheme : harrySchoolTheme;
    } else {
      selectedTheme = getTheme(currentVariant);
    }
    
    return selectedTheme;
  }, [currentVariant, systemColorScheme]);

  const isDark = useMemo(() => {
    return currentVariant === 'dark' || (currentVariant === 'auto' && systemColorScheme === 'dark');
  }, [currentVariant, systemColorScheme]);

  const setThemeVariant = React.useCallback((variant: ThemeVariant) => {
    setCurrentVariant(variant);
    onThemeChange?.(variant);
  }, [onThemeChange]);

  const contextValue = useMemo((): ThemeContextValue => ({
    theme,
    variant: currentVariant,
    isDark,
    colors: theme.colors,
    tokens: theme.tokens,
    typography: theme.typography,
    spacing: theme.spacing,
    animations: theme.animations,
    components: theme.components,
    setThemeVariant,
  }), [theme, currentVariant, isDark, setThemeVariant]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility hooks for specific theme parts
export const useColors = () => {
  const { colors } = useTheme();
  return colors;
};

export const useTokens = () => {
  const { tokens } = useTheme();
  return tokens;
};

export const useTypography = () => {
  const { typography } = useTheme();
  return typography;
};

export const useSpacing = () => {
  const { spacing } = useTheme();
  return spacing;
};

export const useAnimations = () => {
  const { animations } = useTheme();
  return animations;
};

export const useComponents = () => {
  const { components } = useTheme();
  return components;
};

// Educational app-specific hooks
export const useEducationalTheme = (appType: 'student' | 'teacher') => {
  const { setThemeVariant } = useTheme();
  
  React.useEffect(() => {
    setThemeVariant(appType);
  }, [appType, setThemeVariant]);
};

// Responsive design helper
export const useResponsive = () => {
  const { theme } = useTheme();
  
  return {
    isMobile: true, // Always mobile in React Native
    isTablet: false, // Could be enhanced with device detection
    breakpoints: theme.breakpoints,
  };
};

export default ThemeProvider;