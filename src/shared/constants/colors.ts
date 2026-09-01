/**
 * Elite Social Infrastructure color tokens (parity with web design system).
 * Scales mix toward white (50–400) and near-black (600–950); 500/DEFAULT is the brand base.
 */

export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
  DEFAULT: string;
};

export const colors = {
  primary: {
    50: '#F3F8FE',
    100: '#E8F1FE',
    200: '#C5DDFC',
    300: '#97C2F9',
    400: '#5DA0F6',
    500: '#1877F2',
    600: '#1667CF',
    700: '#1351A1',
    800: '#103B72',
    900: '#0E2B50',
    950: '#0D1E34',
    DEFAULT: '#1877F2',
  },
  secondary: {
    50: '#F7F7F8',
    100: '#F0F0F0',
    200: '#D9D9DA',
    300: '#BABBBC',
    400: '#939597',
    500: '#65676B',
    600: '#57595C',
    700: '#454649',
    800: '#333436',
    900: '#252627',
    950: '#1A1B1B',
    DEFAULT: '#65676B',
  },
  tertiary: {
    50: '#FCF7F2',
    100: '#FAEEE6',
    200: '#F2D5BF',
    300: '#E8B48C',
    400: '#DB8A4D',
    500: '#CC5800',
    600: '#AF4C02',
    700: '#883D04',
    800: '#612D06',
    900: '#442107',
    950: '#2D1808',
    DEFAULT: '#CC5800',
  },
  neutral: {
    50: '#F8F8F9',
    100: '#F1F1F2',
    200: '#DCDDDF',
    300: '#C0C2C6',
    400: '#9EA0A6',
    500: '#747780',
    600: '#64676E',
    700: '#4F5157',
    800: '#3A3B3F',
    900: '#2A2B2D',
    950: '#1D1E1F',
    DEFAULT: '#747780',
  },
  success: {
    50: '#F5F9F5',
    100: '#EAF2EB',
    200: '#CBDFCC',
    300: '#A1C5A3',
    400: '#6DA470',
    500: '#2E7D32',
    600: '#296C2C',
    700: '#215524',
    800: '#1A3E1C',
    900: '#152D16',
    950: '#101F11',
    DEFAULT: '#2E7D32',
  },
  danger: {
    50: '#FEF5F5',
    100: '#FCEBEB',
    200: '#F9CECD',
    300: '#F3A6A4',
    400: '#ED7472',
    500: '#E53935',
    600: '#C4322F',
    700: '#982926',
    800: '#6D1F1D',
    900: '#4C1817',
    950: '#311212',
    DEFAULT: '#E53935',
  },
  warning: {
    50: '#FFFBF4',
    100: '#FEF6E9',
    200: '#FEE9C9',
    300: '#FCD89D',
    400: '#FBC266',
    500: '#F9A825',
    600: '#D59021',
    700: '#A5711C',
    800: '#765116',
    900: '#523912',
    950: '#35260F',
    DEFAULT: '#F9A825',
  },
  info: {
    50: '#F2F9FD',
    100: '#E6F3FA',
    200: '#C0E1F4',
    300: '#8DC9EA',
    400: '#4EACDF',
    500: '#0288D1',
    600: '#0375B3',
    700: '#055C8B',
    800: '#064364',
    900: '#083046',
    950: '#09212E',
    DEFAULT: '#0288D1',
  },
  semantic: {
    background: '#FFFFFF',
    surface: '#F8F8F9',
    border: '#DCDDDF',
    textPrimary: '#2A2B2D',
    textSecondary: '#65676B',
    textMuted: '#9EA0A6',
  },
  button: {
    primary: '#1877F2',
    secondary: '#F1F1F2',
    inverted: '#2A2B2D',
    outlined: 'transparent',
  },
} as const;

export type Colors = typeof colors;
