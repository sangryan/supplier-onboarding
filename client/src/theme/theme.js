import { createTheme } from '@mui/material/styles';
import colors from './colors';

const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: colors.background.light,
      paper: colors.neutral.white,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
    // Custom colors
    green: {
      main: colors.green.main,
      hover: colors.green.hover,
      light: colors.green.light,
    },
    neutral: colors.neutral,
    border: colors.border,
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

export default theme;

