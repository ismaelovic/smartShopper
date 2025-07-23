// This file contains the color scheme for the SmartShopper app
export const colors = {
  primary: '#4CAF50',        // Medium green - represents freshness and savings
  primaryDark: '#388E3C',    // Darker green - for pressed states
  secondary: '#FF9800',      // Warm orange - creates urgency for deals
  secondaryDark: '#F57C00',  // Darker orange - for pressed states
  accent: '#009688',         // Teal - for interactive elements
  accentDark: '#00796B',     // Darker teal - for pressed states
  background: '#F9F9F9',     // Light neutral - clean shopping experience
  surface: '#FFFFFF',        // White - for cards, inputs, etc.
  error: '#F44336',          // Red - for errors and alerts
  text: {
    primary: '#212121',      // Dark gray - for primary text
    secondary: '#757575',    // Medium gray - for secondary text
    inverse: '#FFFFFF',      // White - for text on dark backgrounds
    muted: '#BDBDBD',        // Light gray - for disabled text
  },
  border: '#E0E0E0',         // Light gray - for borders
};

// Shorthand for common style patterns
export const colorStyles = {
  primaryButton: {
    backgroundColor: colors.primary,
    color: colors.text.inverse,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    color: colors.text.inverse,
  },
  accentButton: {
    backgroundColor: colors.accent,
    color: colors.text.inverse,
  },
  surface: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  }
};
