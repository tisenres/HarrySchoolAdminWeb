// Design Tokens - Core system
export * from './tokens';

// Theme Modules
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './theme';
export * from './animations';

// Main Theme Object
export { default as theme } from './theme';
export { harrySchoolTheme, studentTheme, teacherTheme, darkTheme, getTheme, getComponent, getComponentVariant } from './theme';

// Animation System
export { animations } from './animations';