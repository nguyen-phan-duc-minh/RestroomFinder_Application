// Central theme colors for RestroomFinder App
export const Colors = {
  // Primary colors
  green: '#00bf63',        // Xanh lá - Primary green
  darkBlue: '#060c23',     // Xanh đậm - Dark blue for backgrounds/text
  red: '#ff5757',          // Đỏ - Error/warning states
  yellow: '#ffce38',       // Vàng - Accent/warning
  lightBlue: '#5271ff',    // Xanh nhạt - Links, chat, secondary actions
  
  // Background colors
  background: {
    primary: '#ffffff',     // White background
    secondary: '#f8f9fa',   // Light gray background
    dark: '#060c23',        // Dark blue background
  },
  
  // Text colors
  text: {
    green: '#00bf63',
    primary: '#060c23',     // Dark blue for main text
    secondary: '#666666',   // Gray for secondary text
    light: '#ffffff',       // White text for dark backgrounds
    muted: '#999999',       // Muted text
    lightBlue: '#5271ff',
  },
  
  // Button colors
  button: {
    primary: '#00bf63',     // Green primary buttons
    secondary: '#5271ff',   // Light blue secondary buttons
    danger: '#ff5757',      // Red danger buttons
    warning: '#ffce38',     // Yellow warning buttons
    disabled: '#cccccc',    // Disabled state
  },
  
  // Border colors
  border: {
    light: '#e1e5e9',      // Light border
    medium: '#cccccc',     // Medium border
    dark: '#060c23',       // Dark border
  },
  
  // Shadow colors
  shadow: {
    light: 'rgba(6, 12, 35, 0.1)',    // Light shadow
    medium: 'rgba(6, 12, 35, 0.2)',   // Medium shadow
    dark: 'rgba(6, 12, 35, 0.3)',     // Dark shadow
  },
  
  // Overlay colors
  overlay: {
    light: 'rgba(255, 255, 255, 0.9)',    // Light overlay
    medium: 'rgba(6, 12, 35, 0.3)',       // Medium overlay
    dark: 'rgba(6, 12, 35, 0.7)',         // Dark overlay
  }
};

// Helper functions for color variations
export const ColorHelpers = {
  // Create transparent version of any color
  withOpacity: (color: string, opacity: number) => {
    return color.replace('#', '') + Math.round(opacity * 255).toString(16).padStart(2, '0');
  },
  
  // Get hover/pressed states
  getButtonStates: (baseColor: string) => ({
    normal: baseColor,
    pressed: ColorHelpers.withOpacity(baseColor, 0.8),
    disabled: Colors.button.disabled,
  }),
};