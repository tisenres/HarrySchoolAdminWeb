# Multi-language Design Guidelines - Harry School CRM

## Language Support Overview

### Supported Languages
1. **English** (Default/Fallback)
   - Script: Latin
   - Direction: Left-to-right (LTR)
   - Text expansion: Baseline (100%)

2. **Russian** (Русский)
   - Script: Cyrillic
   - Direction: Left-to-right (LTR)
   - Text expansion: ~130% of English
   - Font requirements: Cyrillic character support

3. **Uzbek Latin** (O'zbek)
   - Script: Latin with diacritics (ʻ, oʻ, gʻ, etc.)
   - Direction: Left-to-right (LTR)
   - Text expansion: ~110% of English
   - Special characters: Apostrophe variations

## Text Expansion Considerations

### Length Variations by Component

#### Navigation Labels
```
English: "Teachers" (8 chars)
Russian: "Преподаватели" (13 chars) - 162% expansion
Uzbek:   "O'qituvchilar" (13 chars) - 162% expansion
```

#### Button Labels
```
English: "Save Changes" (12 chars)
Russian: "Сохранить изменения" (19 chars) - 158% expansion
Uzbek:   "O'zgarishlarni saqlash" (22 chars) - 183% expansion
```

#### Status Messages
```
English: "Student successfully enrolled" (29 chars)
Russian: "Студент успешно зачислен" (24 chars) - 83% contraction
Uzbek:   "Talaba muvaffaqiyatli ro'yxatga olindi" (38 chars) - 131% expansion
```

### Design Implications

#### Flexible Layout Requirements
- **Minimum button width**: 120px to accommodate longer translations
- **Navigation items**: 25% extra space allocation
- **Form labels**: Position above inputs, not beside
- **Card content**: Variable height containers
- **Table headers**: Expandable column widths

#### Typography Adjustments
```css
/* Language-specific line height adjustments */
:lang(ru) {
  line-height: 1.6; /* Increased for Cyrillic readability */
}

:lang(uz) {
  line-height: 1.5; /* Standard for Latin script */
}

:lang(en) {
  line-height: 1.5; /* Baseline */
}
```

## Font Selection & Typography

### Primary Font Stack
**Inter** - Excellent multi-script support

#### Character Coverage
- ✅ **Latin Extended**: Full coverage for Uzbek diacritics
- ✅ **Cyrillic**: Complete Russian character set
- ✅ **Latin Basic**: Standard English characters
- ✅ **Punctuation**: Proper quotation marks for all languages

#### Fallback Strategy
```css
font-family: 
  /* Primary font with multi-script support */
  'Inter', 
  
  /* System fonts with good Cyrillic support */
  -apple-system, BlinkMacSystemFont,
  'Segoe UI', 'Roboto',
  
  /* Fallbacks for specific scripts */
  'Helvetica Neue', Arial,
  
  /* Generic fallbacks */
  sans-serif,
  
  /* Emoji support */
  'Apple Color Emoji', 'Segoe UI Emoji';
```

### Font Weight Considerations
- **Russian text**: Slightly heavier weight for Cyrillic readability
- **Uzbek text**: Standard weight works well
- **Mixed language content**: Consistent weight across scripts

## Layout Adaptations

### Responsive Breakpoints by Language

#### English (Baseline)
```css
.button-group {
  min-width: 240px; /* 3 buttons × 80px */
}

.form-label {
  min-width: 120px;
}
```

#### Russian (30% expansion)
```css
.button-group {
  min-width: 312px; /* 3 buttons × 104px */
}

.form-label {
  min-width: 156px;
}
```

#### Uzbek (15% expansion)
```css
.button-group {
  min-width: 276px; /* 3 buttons × 92px */
}

.form-label {
  min-width: 138px;
}
```

### Grid System Adaptations
```css
/* Flexible grid for multi-language content */
.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

/* Language-specific adjustments */
:lang(ru) .admin-grid {
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
}

:lang(uz) .admin-grid {
  grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
}
```

## Component-Specific Guidelines

### Navigation Components

#### Sidebar Navigation
```
┌─────────────────────────────┐ English (240px wide)
│ 📊 Dashboard               │
│ 👥 Teachers                │
│ 👨‍🎓 Students                │
└─────────────────────────────┘

┌───────────────────────────────────┐ Russian (280px wide)
│ 📊 Панель управления             │
│ 👥 Преподаватели                 │
│ 👨‍🎓 Студенты                    │
└───────────────────────────────────┘
```

#### Design Specifications
- **Minimum width**: 240px (English), 280px (Russian), 260px (Uzbek)
- **Collapsible**: Icon-only mode for all languages
- **Text overflow**: Ellipsis for extremely long translations
- **Tooltip support**: Full text on hover for collapsed state

### Form Components

#### Label Positioning
```css
/* Always position labels above inputs for multi-language support */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-weight: 500;
  line-height: 1.4;
  /* Allow wrapping for long translations */
  word-wrap: break-word;
}
```

#### Input Field Sizing
```css
.form-input {
  min-height: 44px; /* Comfortable for all languages */
  padding: 10px 12px;
  
  /* Font size adjustments for readability */
  font-size: 14px;
  line-height: 1.4;
}

/* Language-specific adjustments */
:lang(ru) .form-input {
  line-height: 1.5; /* Better for Cyrillic */
}
```

### Button Components

#### Multi-language Button Design
```css
.button {
  min-width: 80px; /* English baseline */
  padding: 8px 16px;
  white-space: nowrap;
  
  /* Allow slight expansion for longer translations */
  max-width: fit-content;
}

/* Language-specific minimum widths */
:lang(ru) .button {
  min-width: 104px; /* 30% expansion */
}

:lang(uz) .button {
  min-width: 92px; /* 15% expansion */
}

/* For critical actions, ensure consistent sizing */
.button-primary {
  min-width: 120px; /* All languages */
  text-align: center;
}
```

### Data Table Adaptations

#### Column Width Management
```css
.data-table {
  table-layout: auto;
  width: 100%;
}

/* Flexible column widths by content type */
.column-name {
  min-width: 150px; /* Names can be long in any language */
}

.column-status {
  min-width: 100px; /* Status text varies significantly */
}

.column-actions {
  width: 120px; /* Fixed width for action buttons */
}

/* Language-specific adjustments */
:lang(ru) .column-status {
  min-width: 130px; /* Longer Russian status text */
}
```

## Cultural Design Considerations

### Color Preferences
- **Green (#1d7452)**: Universally positive in Central Asian cultures
- **Blue**: Associated with trust and education
- **Red**: Use carefully - can have negative associations
- **Gold/Yellow**: Positive associations with prosperity

### Educational Iconography
```css
/* Use universally understood education symbols */
.teacher-icon { /* 👨‍🏫 or book icon */ }
.student-icon { /* 👨‍🎓 or graduation cap */ }
.group-icon { /* 👥 or classroom icon */ }
.schedule-icon { /* 📅 or clock icon */ }
```

### Cultural Spacing Preferences
- **Generous whitespace**: Reduces cognitive load for multilingual users
- **Clear hierarchy**: Important in cultures with formal education systems
- **Consistent alignment**: Left-aligned text for all LTR languages

## Implementation Strategy

### CSS Structure for Multi-language Support
```css
/* Base styles - English defaults */
.component {
  /* English specifications */
}

/* Russian language overrides */
:lang(ru) .component {
  /* Cyrillic-specific adjustments */
}

/* Uzbek language overrides */
:lang(uz) .component {
  /* Uzbek-specific adjustments */
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .component {
    /* Enhanced contrast for all languages */
  }
}
```

### Next.js Implementation with next-intl
```typescript
// Component with internationalization
import { useTranslations } from 'next-intl';

export function TeacherCard() {
  const t = useTranslations('Teachers');
  
  return (
    <div className="teacher-card">
      <h3 className="teacher-name">{teacher.name}</h3>
      <button className="btn-primary">
        {t('edit')} {/* Automatically sized for translation */}
      </button>
    </div>
  );
}
```

### Dynamic Layout Calculations
```typescript
// Utility for language-aware sizing
export function getButtonMinWidth(locale: string): string {
  const expansionFactors = {
    en: 1.0,
    ru: 1.3,
    uz: 1.15
  };
  
  const baseWidth = 80;
  const factor = expansionFactors[locale] || 1.0;
  
  return `${Math.ceil(baseWidth * factor)}px`;
}
```

## Testing Guidelines

### Multi-language Testing Checklist
- [ ] **Layout integrity**: No text overflow or breaking
- [ ] **Button functionality**: All buttons remain clickable
- [ ] **Form validation**: Error messages display correctly
- [ ] **Navigation**: All menu items accessible
- [ ] **Data tables**: Column headers and content align properly
- [ ] **Responsive behavior**: Works across all screen sizes
- [ ] **Loading states**: Skeleton components adapt to content length

### Testing Tools and Procedures
```bash
# Test with longest possible translations
npm run test:i18n

# Visual regression testing for all locales
npm run test:visual -- --locale=all

# Accessibility testing in all languages
npm run test:a11y -- --locale=ru,uz,en
```

### Browser Testing Matrix
- **Chrome**: Primary testing browser
- **Firefox**: Cyrillic font rendering verification
- **Safari**: macOS/iOS specific issues
- **Edge**: Windows-specific font rendering

## Performance Considerations

### Font Loading Strategy
```css
/* Preload primary font with multi-script support */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable.woff2') format('woff2');
  font-display: swap;
  unicode-range: U+0000-007F, U+0080-00FF, U+0400-04FF; /* Latin + Cyrillic */
}
```

### Bundle Size Optimization
```javascript
// Code splitting by locale
const localeModules = {
  en: () => import('./locales/en'),
  ru: () => import('./locales/ru'),
  uz: () => import('./locales/uz')
};
```

### Caching Strategy
- **Static translations**: Long-term caching
- **Dynamic content**: Cache with locale-specific keys
- **Font files**: Aggressive caching with proper unicode-range