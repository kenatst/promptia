const Colors = {
  // Light "Creamy" Background
  background: '#FAFAFA',
  backgroundGradientStart: '#FAFAFA',
  backgroundGradientEnd: '#FFFBF2', // Slight warmth at bottom

  // Card Backgrounds
  cardBg: '#FFFFFF',

  // Specific Accents (Keep Pastels but they pop on white)
  accent: '#F59E0B',

  // The "Recipe" card colors (Light Mode)
  yellowCard: '#FFF9C4',
  yellowCardDark: '#FDE047',

  // Category Circle Backgrounds (Slightly stronger to pop on white)
  circleGreen: '#D1FAE5',
  circleOrange: '#FFEDD5',
  circleYellow: '#FEF3C7',
  circlePurple: '#EDE9FE',
  circlePink: '#FCE7F3',
  circleBlue: '#DBEAFE',

  // Text
  text: '#1F2937', // Dark Grey/Blue
  textDark: '#111827', // Almost Black
  textSecondary: '#6B7280', // Medium Grey
  textTertiary: '#9CA3AF', // Light Grey

  // Glass (Now "Frosted White" for light mode)
  glass: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(0, 0, 0, 0.05)',

  // Tab Bar
  tabBar: '#FFFFFF', // Clean White Pill

  // Action Buttons
  primaryButton: '#111827', // Black
  primaryButtonText: '#FFFFFF',

  // "Aegean Breeze" Card
  purpleCardBg: '#F3E8FF', // Very Light purple
  greenCardBg: '#ECFDF5',  // Very Light green
} as const;

export default Colors;
