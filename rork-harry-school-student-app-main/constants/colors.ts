const Colors = {
  primary: '#1d7452',
  primaryLight: '#2a9d6f',
  primaryDark: '#155c42',
  secondary: '#f39c12',
  accent: '#e74c3c',
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#3498db',
  
  background: '#ffffff',
  surface: '#f8f9fa',
  card: '#ffffff',
  
  text: '#2c3e50',
  textSecondary: '#7f8c8d',
  textLight: '#bdc3c7',
  
  border: '#ecf0f1',
  borderLight: '#f4f6f7',
  
  gradient: {
    primary: ['#1d7452', '#2a9d6f'] as const,
    secondary: ['#f39c12', '#e67e22'] as const,
    success: ['#27ae60', '#2ecc71'] as const,
    purple: ['#8e44ad', '#9b59b6'] as const,
    blue: ['#2980b9', '#3498db'] as const,
  },
  
  shadow: {
    color: '#000000',
    opacity: 0.1,
  },
  
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export default Colors;