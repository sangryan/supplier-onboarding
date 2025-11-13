# Theme Configuration

This directory contains the centralized theme and color configuration for the Supplier Onboarding Portal.

## Files

### `colors.js`
Contains all color definitions used throughout the application.

### `theme.js`
Material-UI theme configuration that uses the colors from `colors.js`.

## Usage

### Using Theme Colors in Components

```javascript
import { useTheme } from '@mui/material/styles';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      backgroundColor: theme.palette.green.main,
      color: theme.palette.text.primary 
    }}>
      Content
    </Box>
  );
};
```

### Available Color Palettes

#### Brand Green (Primary CTA color)
```javascript
theme.palette.green.main    // #578A18 - Main green
theme.palette.green.hover   // #467014 - Hover state
theme.palette.green.light   // #6da61f - Light variant
```

#### Primary (Blue)
```javascript
theme.palette.primary.main  // #1976d2 - Logo, links
theme.palette.primary.light // #42a5f5 - Light variant
theme.palette.primary.dark  // #1565c0 - Dark variant
```

#### Text Colors
```javascript
theme.palette.text.primary     // #000000 - Headings, primary text
theme.palette.text.secondary   // #666666 - Body text, secondary content
theme.palette.text.tertiary    // #999999 - Muted text
theme.palette.text.disabled    // #9e9e9e - Disabled state text
```

#### Neutral Grays
```javascript
theme.palette.neutral.gray[50]  // #f9fafb - Lightest gray
theme.palette.neutral.gray[100] // #f5f5f5 - Very light gray
theme.palette.neutral.gray[200] // #f0f0f0 - Light gray
theme.palette.neutral.gray[300] // #e0e0e0 - Border gray
theme.palette.neutral.gray[400] // #d1d5db - Input border
theme.palette.neutral.gray[500] // #9ca3af - Mid gray
theme.palette.neutral.gray[600] // #666666 - Dark gray
theme.palette.neutral.gray[700] // #333333 - Very dark gray
```

#### Background Colors
```javascript
theme.palette.background.default // #ffffff - Default background
theme.palette.background.light   // #f9fafb - Light background
theme.palette.background.gray    // #f3f4f6 - Gray background (footer)
theme.palette.background.input   // #f5f5f5 - Input background
```

#### Border Colors
```javascript
theme.palette.border.light // #e0e0e0 - Light borders
theme.palette.border.main  // #d1d5db - Main borders
theme.palette.border.dark  // #9ca3af - Dark borders
```

#### Status Colors
```javascript
theme.palette.status.success  // #4caf50 - Success state
theme.palette.status.error    // #c62828 - Error state
theme.palette.status.errorBg  // #ffebee - Error background
theme.palette.status.warning  // #ff9800 - Warning state
theme.palette.status.info     // #2196f3 - Info state
```

## Button Examples

### Primary Green Button (Main CTA)
```javascript
<Button
  variant="contained"
  sx={{
    backgroundColor: theme.palette.green.main,
    '&:hover': {
      backgroundColor: theme.palette.green.hover,
    },
  }}
>
  Get Started
</Button>
```

### Disabled Button
```javascript
<Button
  disabled
  sx={{
    '&:disabled': {
      backgroundColor: theme.palette.neutral.gray[300],
      color: theme.palette.text.disabled,
    },
  }}
>
  Disabled
</Button>
```

## Updating Colors

To change colors across the entire application:

1. Edit the color values in `colors.js`
2. The changes will automatically apply to all components using `theme.palette`

### Example: Changing the Brand Green

```javascript
// In colors.js
green: {
  main: '#NEW_COLOR',     // Update this
  hover: '#HOVER_COLOR',  // Update this
  light: '#LIGHT_COLOR',  // Update this
},
```

All buttons and components using `theme.palette.green.main` will automatically update!

## Best Practices

1. **Always use theme colors** instead of hardcoded hex values
2. **Use semantic color names** (e.g., `theme.palette.text.primary` instead of `#000`)
3. **Test in both light/dark modes** when applicable
4. **Maintain consistency** by reusing existing color tokens
5. **Document new colors** if you add them to `colors.js`

## Components Using Theme Colors

- LandingPage
- AuthContainer (Login/Register)
- TwoFactorAuth
- AuthLayout
- All future components should follow this pattern

