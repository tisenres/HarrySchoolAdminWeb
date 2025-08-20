import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { 
  ThemeProvider, 
  useTheme, 
  useColors, 
  useTypography, 
  useSpacing,
  useComponents 
} from '../theme';

const ThemedCard: React.FC<{ title: string; children: React.ReactNode }> = ({ 
  title, 
  children 
}) => {
  const colors = useColors();
  const spacing = useSpacing();
  const typography = useTypography();
  const components = useComponents();
  
  return (
    <View style={[
      components.Card.variants.elevated,
      { marginBottom: spacing.md }
    ]}>
      <Text style={[
        typography.textStyles.heading4,
        { color: colors.text.primary, marginBottom: spacing.sm }
      ]}>
        {title}
      </Text>
      {children}
    </View>
  );
};

const ColorPalette: React.FC = () => {
  const colors = useColors();
  const spacing = useSpacing();
  
  return (
    <ThemedCard title="Color Palette">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Object.entries(colors.primary).map(([key, value]) => (
          <View
            key={key}
            style={{
              width: 40,
              height: 40,
              backgroundColor: value,
              marginRight: spacing.xs,
              marginBottom: spacing.xs,
              borderRadius: 8,
            }}
          />
        ))}
      </View>
    </ThemedCard>
  );
};

const TypographyExample: React.FC = () => {
  const colors = useColors();
  const typography = useTypography();
  
  return (
    <ThemedCard title="Typography">
      <Text style={[
        typography.textStyles.heading1, 
        { color: colors.text.primary, marginBottom: 8 }
      ]}>
        Heading 1
      </Text>
      <Text style={[
        typography.textStyles.heading2, 
        { color: colors.text.primary, marginBottom: 8 }
      ]}>
        Heading 2
      </Text>
      <Text style={[
        typography.textStyles.body, 
        { color: colors.text.secondary, marginBottom: 8 }
      ]}>
        Body text with secondary color
      </Text>
      <Text style={[
        typography.textStyles.caption, 
        { color: colors.text.tertiary }
      ]}>
        Caption text
      </Text>
    </ThemedCard>
  );
};

const ButtonExamples: React.FC = () => {
  const components = useComponents();
  const spacing = useSpacing();
  const colors = useColors();
  const typography = useTypography();
  
  const buttons = [
    { variant: 'primary', label: 'Primary' },
    { variant: 'secondary', label: 'Secondary' },
    { variant: 'outline', label: 'Outline' },
    { variant: 'ghost', label: 'Ghost' },
    { variant: 'destructive', label: 'Destructive' },
  ];
  
  return (
    <ThemedCard title="Buttons">
      {buttons.map(({ variant, label }) => (
        <TouchableOpacity
          key={variant}
          style={[
            components.Button.variants[variant],
            { marginBottom: spacing.sm }
          ]}
          onPress={() => console.log(`${label} pressed`)}
        >
          <Text style={[
            typography.textStyles.button,
            { color: components.Button.variants[variant].color }
          ]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </ThemedCard>
  );
};

const ThemeControls: React.FC = () => {
  const { variant, setThemeVariant, isDark } = useTheme();
  const colors = useColors();
  const spacing = useSpacing();
  const typography = useTypography();
  
  const variants = ['default', 'student', 'teacher', 'dark', 'auto'] as const;
  
  return (
    <ThemedCard title="Theme Controls">
      <Text style={[
        typography.textStyles.body,
        { color: colors.text.secondary, marginBottom: spacing.sm }
      ]}>
        Current: {variant} {isDark ? '(Dark)' : '(Light)'}
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {variants.map((themeVariant) => (
          <TouchableOpacity
            key={themeVariant}
            style={{
              backgroundColor: variant === themeVariant 
                ? colors.primary[500] 
                : colors.neutral[200],
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: 8,
              marginRight: spacing.xs,
              marginBottom: spacing.xs,
            }}
            onPress={() => setThemeVariant(themeVariant)}
          >
            <Text style={[
              typography.textStyles.caption,
              { 
                color: variant === themeVariant 
                  ? colors.text.inverse 
                  : colors.text.primary 
              }
            ]}>
              {themeVariant}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedCard>
  );
};

const EducationalComponents: React.FC = () => {
  const components = useComponents();
  const spacing = useSpacing();
  const colors = useColors();
  const typography = useTypography();
  
  return (
    <ThemedCard title="Educational Components">
      {/* Ranking Badges */}
      <Text style={[
        typography.textStyles.body,
        { color: colors.text.primary, marginBottom: spacing.sm }
      ]}>
        Ranking Badges:
      </Text>
      
      <View style={{ 
        flexDirection: 'row', 
        marginBottom: spacing.md,
        alignItems: 'center'
      }}>
        {['gold', 'silver', 'bronze', 'default'].map((rankVariant) => (
          <View
            key={rankVariant}
            style={[
              components.RankingBadge.variants[rankVariant],
              { marginRight: spacing.sm }
            ]}
          >
            <Text style={[
              typography.textStyles.caption,
              { 
                color: components.RankingBadge.variants[rankVariant].color,
                fontWeight: 'bold'
              }
            ]}>
              #{rankVariant === 'gold' ? '1' : rankVariant === 'silver' ? '2' : '3'}
            </Text>
          </View>
        ))}
      </View>
      
      {/* Task Status Cards */}
      <Text style={[
        typography.textStyles.body,
        { color: colors.text.primary, marginBottom: spacing.sm }
      ]}>
        Task Status Examples:
      </Text>
      
      {['notStarted', 'inProgress', 'completed', 'overdue'].map((status) => (
        <View
          key={status}
          style={[
            components.TaskCard.variants[status],
            { marginBottom: spacing.sm }
          ]}
        >
          <Text style={[
            typography.textStyles.body,
            { color: colors.text.primary }
          ]}>
            Task Status: {status.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </Text>
        </View>
      ))}
    </ThemedCard>
  );
};

const ThemeExampleContent: React.FC = () => {
  const colors = useColors();
  
  return (
    <ScrollView style={{ 
      flex: 1, 
      backgroundColor: colors.background.primary 
    }}>
      <View style={{ padding: 16 }}>
        <ThemeControls />
        <ColorPalette />
        <TypographyExample />
        <ButtonExamples />
        <EducationalComponents />
      </View>
    </ScrollView>
  );
};

export const ThemeExample: React.FC = () => {
  return (
    <ThemeProvider variant="default">
      <ThemeExampleContent />
    </ThemeProvider>
  );
};

export default ThemeExample;