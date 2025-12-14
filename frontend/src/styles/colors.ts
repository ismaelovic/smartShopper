// This file contains the color scheme for the SmartShopper app
export const colors = {
  primary: '#3CBBB1',        // Danish Mint
  secondary: '#FFFFFF',      // Pure White
  background: '#FFFFFF',     // Use white for background
  text: {
    primary: '#3CBBB1',      // Danish Mint for main text
    inverse: '#FFFFFF',      // White for text on primary
  },
};

// Shorthand for common style patterns
export const colorStyles = {
  primaryButton: {
    backgroundColor: colors.primary,
    color: colors.text.inverse,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    color: colors.primary,
  },
};
