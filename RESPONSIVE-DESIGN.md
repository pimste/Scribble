# Scribble Responsive Design

This document outlines the responsive design implementation for the Scribble chat application.

## Overview

The application is now fully responsive with optimized layouts for:
- **Mobile devices** (< 768px): WhatsApp-style navigation with bottom tab bar
- **Tablet devices** (768px - 1024px): 2-column layout with compact navigation
- **Desktop devices** (> 1024px): Full 3-column layout with complete navigation

## Breakpoints

Using Tailwind CSS default breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## Key Components

### Mobile Navigation (`components/MobileNavigation.tsx`)

A fixed bottom navigation bar that appears only on mobile devices (< 768px).

**Features:**
- Icon-based navigation (Chats, Invite, Parent Controls, Settings)
- Active state highlighting
- Safe area support for devices with notches
- Automatically shows/hides based on user role (parent/child)

### Chat Page (`app/chat/page.tsx`)

**Mobile View:**
- View-based navigation: switches between contacts, chat, and info panels
- Back button in header for navigation
- Full-screen contact list or chat area
- Info button to view contact details

**Tablet View:**
- 2-column layout (contacts + chat)
- User info hidden to save space
- Compact header navigation

**Desktop View:**
- 3-column layout (contacts + chat + user info)
- Full header with all navigation options
- Wider panels for better readability

### Settings Page (`app/settings/page.tsx`)

**Mobile View:**
- Horizontal profile card with avatar on left
- Scrollable tabs for different settings sections
- Stacked layout for all form elements
- Bottom navigation bar

**Tablet View:**
- Profile card becomes more compact
- 2-column grid layout maintained
- Tabs remain horizontal

**Desktop View:**
- Profile card in left sidebar (sticky)
- Full tabs display
- 2-column form layouts

### Parent Page (`app/parent/page.tsx`)

**Mobile View:**
- Stacked layout for all three panels
- Children list → Contacts → Messages
- Compact headers and spacing

**Tablet View:**
- 2-column layout
- Flexible height for panels

**Desktop View:**
- 3-column layout
- Full height panels with scrolling

### Invite Page (`app/invite/page.tsx`)

**Mobile View:**
- Stacked code cards (parent/friend)
- Compact buttons and text
- Full-width add contact form

**Tablet View:**
- Stacked layout maintained
- Increased spacing

**Desktop View:**
- 2-column layout for parent code cards
- Better spacing and larger text

## Responsive Features

### 1. **Dynamic Header**
- Logo changes on mobile (shows contact name in chat)
- Collapsible navigation buttons
- Context-aware back button

### 2. **Touch-Friendly**
- Minimum 44px tap targets
- Increased padding on mobile
- Larger buttons and interactive elements

### 3. **View Switching**
Chat page on mobile:
- `contacts`: Shows contact list
- `chat`: Shows active conversation
- `info`: Shows contact information

### 4. **Safe Areas**
Support for devices with notches/dynamic islands:
```css
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 5. **Optimized Typography**
- Smaller font sizes on mobile
- Adaptive heading sizes (text-xl → text-2xl → text-3xl)
- Truncated text where necessary

## CSS Utilities

Added in `app/globals.css`:

```css
/* Safe area padding */
.safe-area-pb, .safe-area-pt

/* Hide scrollbar */
.scrollbar-hide

/* Touch targets */
.tap-target
```

## Implementation Details

### Tailwind Classes Used

**Display Control:**
- `hidden`: Hide on current breakpoint
- `md:block`: Show on medium screens and up
- `lg:flex`: Show as flex on large screens

**Layout:**
- `grid-cols-1`: Single column on mobile
- `md:grid-cols-2`: Two columns on tablet
- `lg:grid-cols-3`: Three columns on desktop

**Spacing:**
- `p-3 md:p-6`: Responsive padding
- `gap-4 md:gap-6`: Responsive gaps
- `space-y-3 md:space-y-4`: Responsive vertical spacing

**Typography:**
- `text-xs md:text-sm`: Responsive text sizes
- `text-xl md:text-2xl lg:text-3xl`: Multi-breakpoint sizes

**Widths:**
- `w-full md:w-80`: Full width mobile, fixed on tablet+
- `w-20 md:w-32`: Responsive element sizes

## Testing

Test on various devices:
1. **Mobile** (iPhone, Android): Test bottom navigation, view switching
2. **Tablet** (iPad): Verify 2-column layout, touch targets
3. **Desktop**: Ensure 3-column layout works properly

## Future Enhancements

Potential improvements:
- Swipe gestures for mobile navigation
- Pull-to-refresh functionality
- Landscape mode optimizations
- Progressive Web App (PWA) support
- Offline mode capabilities

## Browser Support

Tested and working on:
- Chrome/Edge (Chromium-based)
- Safari (iOS and macOS)
- Firefox
- Samsung Internet

Minimum requirements:
- CSS Grid support
- Flexbox support
- CSS custom properties (CSS variables)
- CSS env() for safe areas

