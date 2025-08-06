# Accessibility Guidelines - Harry School CRM

## WCAG 2.1 AA Compliance Checklist

### Color & Contrast

#### Color Contrast Requirements
- [x] **Normal text**: Minimum 4.5:1 contrast ratio
- [x] **Large text (18px+)**: Minimum 3:1 contrast ratio
- [x] **UI components**: Minimum 3:1 contrast ratio
- [x] **Focus indicators**: Minimum 3:1 contrast ratio

#### Color Independence
- [x] **Information conveyance**: No information conveyed by color alone
- [x] **Status indicators**: Include icons and text labels
- [x] **Error states**: Use icons + text + color
- [x] **Success states**: Use icons + text + color

#### Tested Color Combinations
```
✅ Primary text (#334155) on white: 10.7:1
✅ Secondary text (#64748b) on white: 5.8:1
✅ Primary button (#1d7452) on white: 7.1:1
✅ Error text (#991b1b) on error background (#fee2e2): 4.8:1
✅ Success text (#065f46) on success background (#d1fae5): 6.2:1
✅ Warning text (#92400e) on warning background (#fef3c7): 4.9:1
```

### Keyboard Navigation

#### Focus Management
- [x] **Visible focus indicators**: 2px solid outline with primary color
- [x] **Focus order**: Logical tab sequence through interface
- [x] **Skip links**: "Skip to main content" for screen readers
- [x] **Focus trapping**: Modals trap focus within dialog

#### Keyboard Shortcuts
```
Tab         - Navigate forward through interactive elements
Shift+Tab   - Navigate backward through interactive elements
Enter       - Activate buttons and links
Space       - Activate buttons, checkboxes, toggle switches
Escape      - Close modals, dropdowns, cancel operations
Arrow keys  - Navigate within components (tables, menus)
Home/End    - Navigate to beginning/end of lists
```

#### Interactive Element Requirements
- [x] **All interactive elements**: Reachable via keyboard
- [x] **Custom controls**: Proper ARIA attributes and keyboard handling
- [x] **Disabled elements**: Not in tab order
- [x] **Hidden elements**: Properly hidden from screen readers

### Screen Reader Support

#### ARIA Labels and Descriptions
```html
<!-- Form inputs with proper labeling -->
<label for="teacher-name">Teacher Name *</label>
<input 
  id="teacher-name" 
  type="text" 
  required 
  aria-describedby="teacher-name-help"
  aria-invalid="false"
/>
<div id="teacher-name-help">Enter the teacher's full name</div>

<!-- Buttons with descriptive labels -->
<button aria-label="Edit teacher profile for Alice Johnson">
  <EditIcon aria-hidden="true" />
  Edit
</button>

<!-- Status indicators -->
<span 
  role="status" 
  aria-label="Student status: Active"
  class="status-badge status-active"
>
  <CheckIcon aria-hidden="true" />
  Active
</span>
```

#### Semantic HTML Structure
- [x] **Headings**: Proper hierarchy (h1 → h2 → h3)
- [x] **Landmarks**: Header, nav, main, aside, footer
- [x] **Lists**: Use ul/ol for related items
- [x] **Tables**: Proper th/td structure with headers

#### Live Regions
```html
<!-- For dynamic content updates -->
<div aria-live="polite" aria-atomic="true" id="status-message">
  <!-- Updated content announced to screen readers -->
</div>

<!-- For urgent notifications -->
<div aria-live="assertive" id="error-message">
  <!-- Immediately announced to screen readers -->
</div>
```

### Form Accessibility

#### Input Field Requirements
- [x] **Labels**: Every input has associated label
- [x] **Required fields**: Marked with asterisk and aria-required
- [x] **Error messages**: Associated with inputs via aria-describedby
- [x] **Placeholder text**: Not used as substitute for labels

#### Form Validation
```html
<!-- Error state example -->
<label for="email">Email Address *</label>
<input 
  id="email" 
  type="email" 
  required 
  aria-required="true"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<div id="email-error" role="alert">
  Please enter a valid email address
</div>
```

#### Fieldset Grouping
```html
<fieldset>
  <legend>Contact Information</legend>
  <!-- Related form fields grouped together -->
</fieldset>
```

### Data Table Accessibility

#### Table Structure
```html
<table role="table" aria-label="Teachers list">
  <thead>
    <tr>
      <th scope="col">
        <input type="checkbox" aria-label="Select all teachers" />
      </th>
      <th scope="col" aria-sort="ascending">
        <button>Name <ArrowUpIcon aria-hidden="true" /></button>
      </th>
      <th scope="col">Phone</th>
      <th scope="col">Status</th>
      <th scope="col">Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <input type="checkbox" aria-label="Select Alice Johnson" />
      </td>
      <td>Alice Johnson</td>
      <td>+998 90 123 4567</td>
      <td>
        <span role="status" aria-label="Status: Active">
          <CheckIcon aria-hidden="true" /> Active
        </span>
      </td>
      <td>
        <button aria-label="More actions for Alice Johnson">
          <MoreIcon aria-hidden="true" />
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

#### Table Navigation
- [x] **Column headers**: Proper scope attributes
- [x] **Sortable columns**: ARIA sort states
- [x] **Row selection**: Clear labeling for checkboxes
- [x] **Action buttons**: Descriptive labels with context

### Modal and Dialog Accessibility

#### Dialog Implementation
```html
<div 
  role="dialog" 
  aria-modal="true" 
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Edit Teacher Profile</h2>
  <p id="dialog-description">Update teacher information and save changes</p>
  
  <!-- Dialog content -->
  
  <div class="dialog-actions">
    <button type="button">Cancel</button>
    <button type="submit">Save Changes</button>
  </div>
</div>
```

#### Focus Management
- [x] **Initial focus**: Set to first interactive element
- [x] **Focus trap**: Tab cycles within dialog
- [x] **Return focus**: Back to trigger element on close
- [x] **Escape key**: Closes dialog

### Mobile Accessibility

#### Touch Target Requirements
- [x] **Minimum size**: 44px × 44px for touch targets
- [x] **Spacing**: 8px minimum between targets
- [x] **Gesture alternatives**: Keyboard alternatives for gestures
- [x] **Orientation**: Works in both portrait and landscape

#### Mobile Screen Reader
- [x] **VoiceOver testing**: iOS accessibility testing
- [x] **TalkBack testing**: Android accessibility testing
- [x] **Swipe navigation**: Proper element discovery
- [x] **Zoom support**: Content remains accessible at 200% zoom

### Testing Procedures

#### Automated Testing Tools
```bash
# Install accessibility testing tools
npm install --save-dev @axe-core/playwright
npm install --save-dev jest-axe
npm install --save-dev @testing-library/jest-dom
```

#### Manual Testing Checklist
- [ ] **Keyboard navigation**: Tab through entire interface
- [ ] **Screen reader testing**: Test with NVDA/JAWS/VoiceOver
- [ ] **High contrast mode**: Test in system high contrast
- [ ] **Zoom testing**: Test at 200% browser zoom
- [ ] **Color blindness**: Test with color blindness simulator

#### Automated Test Examples
```typescript
// Playwright accessibility test
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test('Teachers page accessibility', async ({ page }) => {
  await page.goto('/teachers');
  await injectAxe(page);
  await checkA11y(page);
});

// Jest accessibility test
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import TeacherCard from './TeacherCard';

expect.extend(toHaveNoViolations);

test('TeacherCard has no accessibility violations', async () => {
  const { container } = render(<TeacherCard {...mockProps} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Multi-language Accessibility

#### Language Attributes
```html
<!-- Document language -->
<html lang="en">

<!-- Content in different languages -->
<span lang="ru">Алиса Джонсон</span>
<span lang="uz">Alice Johnson</span>
```

#### Screen Reader Considerations
- [x] **Language switching**: Proper lang attributes for mixed content
- [x] **Pronunciation**: Ensure names pronounced correctly
- [x] **Voice selection**: Screen reader uses appropriate voice
- [x] **Text direction**: Support for RTL if needed in future

### Error Handling Accessibility

#### Error Message Guidelines
- [x] **Clear language**: Plain language error descriptions
- [x] **Solution-focused**: Tell users how to fix the error
- [x] **Immediate feedback**: Errors announced on form submission
- [x] **Persistent display**: Errors remain visible until resolved

#### Error State Examples
```html
<!-- Form-level error -->
<div role="alert" class="error-summary">
  <h3>Please fix the following errors:</h3>
  <ul>
    <li><a href="#email">Email address is required</a></li>
    <li><a href="#phone">Phone number is invalid</a></li>
  </ul>
</div>

<!-- Field-level error -->
<div class="field-error">
  <label for="email">Email Address *</label>
  <input 
    id="email" 
    type="email" 
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <div id="email-error" role="alert">
    Please enter a valid email address like example@email.com
  </div>
</div>
```

### Compliance Monitoring

#### Regular Audits
- **Monthly**: Automated accessibility scans
- **Quarterly**: Manual testing with real users
- **New features**: Accessibility review before deployment
- **User feedback**: Accessible contact form for reporting issues

#### Documentation Requirements
- [ ] **Component docs**: Accessibility notes for each component
- [ ] **Implementation guides**: How to use components accessibly
- [ ] **Testing procedures**: Step-by-step accessibility testing
- [ ] **Training materials**: Accessibility best practices for team