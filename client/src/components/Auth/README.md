# Authentication Components

This directory contains reusable authentication components for the Supplier Onboarding Portal.

## Components

### AuthLayout.js
The main layout wrapper for all authentication pages. Provides the split-screen design with:
- Left side: Handshake illustration placeholder
- Right side: Form content area
- Header with logo and portal name

**Usage:**
```jsx
import AuthLayout from './AuthLayout';

<AuthLayout>
  {/* Your form content here */}
</AuthLayout>
```

### TabSwitcher.js
A reusable tab switcher component with a clean, modern design.
- Active tab has white background with subtle shadow
- Inactive tabs are transparent
- Container has a light gray background

**Props:**
- `activeTab` (number): Index of the currently active tab
- `onTabChange` (function): Callback when a tab is clicked
- `tabs` (array): Array of tab objects with `label` property

**Usage:**
```jsx
import TabSwitcher from './TabSwitcher';

const tabs = [
  { label: 'Sign In' },
  { label: 'Create account' }
];

<TabSwitcher 
  activeTab={0} 
  onTabChange={(index) => console.log(index)} 
  tabs={tabs} 
/>
```

### AuthContainer.js
The main authentication container that handles:
- Login flow
- Registration flow
- 2FA flow (future implementation)
- Form validation
- Error handling
- Tab switching

**Props:**
- `mode` (string): Either 'login' or 'register'

**Usage:**
```jsx
import AuthContainer from './AuthContainer';

// For login page
<AuthContainer mode="login" />

// For registration page
<AuthContainer mode="register" />
```

## Pages

### Login.js
Simple wrapper that uses `AuthContainer` with `mode="login"`

### Register.js
Simple wrapper that uses `AuthContainer` with `mode="register"`

### TwoFactorAuth.js
Standalone 2FA verification page with:
- 6-digit code input
- Resend code functionality
- Back to login button

## Future Enhancements

1. **2FA Integration**: The `AuthContainer` has placeholder code for 2FA. Uncomment and implement when backend is ready.

2. **Social Auth**: Google Sign-In button is present but needs OAuth integration.

3. **Password Reset**: Add forgot password flow.

4. **Email Verification**: Add email verification step after registration.

## Design Consistency

All auth components follow these design principles:
- White/light backgrounds
- Green primary buttons (#5A9F5E)
- Compact input fields with 12px/14px padding
- 8px border radius
- Gray borders (#d1d5db)
- 15px font size for labels and inputs

