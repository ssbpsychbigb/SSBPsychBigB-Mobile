# BIGB Mobile App

Production-oriented React Native app for BIGB.

This document is the base guide for all future mobile development decisions.

## Product Direction

BIGB mobile is an end-user action app, not an admin or ERP console.

- Mobile focus: social, learning, AI, communication, progress tracking.
- Web/Admin focus: heavy creation, management, moderation, finance, exports, platform controls.

## Role x Channel Policy

Every permission should be checked with role + channel.

- `mobile`: daily user operations and lightweight creator actions.
- `web`: heavy workflows and structured creation.
- `admin`: governance and platform controls.

Examples:

- Create course -> web/admin only
- Edit course -> web/admin only
- Create post -> mobile/web
- Profile edit -> mobile/web
- Platform settings -> admin only
- Admin approve/reject queue -> **admin web only**
- Institute join Accept/Reject, educator hire Accept/Decline -> **mobile OK** (minimal taps)

### Mobile auth module (complete client surface)

Guest → Splash → Welcome → Login/Register → OTP → `/auth/me` gate:

| Status / role | Destination |
|---------------|-------------|
| `pending_verification` | Under Review |
| `rejected` | Rejected → Fix & resubmit |
| `restricted` | Restricted lock |
| `suspended` / `banned` / `deleted` | Force logout |
| Active **aspirant** (first time) | Onboarding (goal → institute code → prep) |
| Active institute / educator / officer / onboarded aspirant | App shell (role home) |

Google Sign-In: `FEATURE_FLAGS.googleSignIn` (off until SDK + backend).  
Aspirant institute-code **server link** waits on backend; mobile stores onboarding locally.

## Architecture

```txt
src/
  app/
    App.tsx
    providers/
    navigation/
  features/
    auth/
    home/
    feed/
    learn/
    ai/
    profile/
    institute/
    educator/
    bookmark/
    message/
  shared/
    api/
    constants/
    storage/
    theme/
    ui/
    lib/
    hooks/
    errors/
    types/
  assets/
    fonts/
    images/
```

## Stack

- React Native 0.86.x (New Architecture)
- React Navigation 7.x
- Zustand 5.x + MMKV 4.x
- TanStack Query 5.x
- Reanimated 4.x + Worklets
- React Hook Form + Zod
- Lucide icons (`lucide-react-native`)
- `react-native-size-matters` (responsive `s` / `vs` / `ms`)
- `react-native-toast-message` (app-wide toasts via `showToast`)
- `@react-native-community/datetimepicker` (themed `AppDateField` calendar)

## UI and Design Rules

- Use design tokens from `src/shared/constants`.
- Do not add arbitrary spacing, colors, or font sizes.
- Use Sora fonts from `src/assets/fonts`.
- Use `shared/ui` primitives and compose in features.
- Buttons: use `Button` (heights `ms(40/44/48)`). Do **not** use `vs()` for CTA height — it looks chunky on tall phones.
- Typography: keep the compact product scale in `AppText` (body ~15, title ~20, display ~28). Do not use poster-sized type on app screens.

## Responsive Layout Rules

Baseline design: ~375×812 (iPhone-class). Helpers live in `src/shared/lib/responsive.ts`.

| Helper | Use for |
|--------|---------|
| `s(n)` | width, paddingHorizontal, marginHorizontal, maxWidth |
| `vs(n)` | height, paddingVertical, marginVertical, top/bottom |
| `ms(n)` | borderRadius, gaps, Lucide `size`, hitSlop |
| `fontSize(n)` / `lineHeight(n)` | StyleSheet typography (prefer `AppText` variants) |

Rules:

- Prefer flex / `%` for structure; scale only fixed design numbers.
- Do **not** hardcode raw pixels in StyleSheets or icon sizes — use `s` / `vs` / `ms`.
- Do **not** scale `StyleSheet.hairlineWidth`, `borderWidth: 1`, flex, opacity, or animation scale factors.
- `theme.spacing` / `theme.radius` / `typography.fontSize` are already scaled — use them as-is.
- Cap accessibility font blow-up via `AppText` `maxFontSizeMultiplier` (default 1.35).

## Toast Rules

- Use `showToast.success|error|info|warning` from `@/shared/ui/toast` (or `@/shared/ui`).
- Do not use `Alert.alert` for routine feedback.
- Host is mounted once in `AppProviders` (`AppToastHost`).
- Custom layouts live in `src/shared/ui/toast/` — keep brand tokens + responsive helpers.

## Security and Config Rules

- Never hardcode secrets or production keys.
- Keep app runtime config centralized in `src/shared/constants/config.ts`.
- Keep sensitive values in secure environment config.

## Local Setup

### Prerequisites

- Node `>=22.11.0`
- Yarn `1.22.x`
- Android Studio
- Xcode + CocoaPods (for iOS on macOS)

### Install

```sh
yarn
```

### Start metro

```sh
yarn start
```

### Run Android

```sh
yarn android
```

### Run iOS (macOS)

```sh
cd ios && bundle exec pod install && cd ..
yarn ios
```

### Reset metro cache

```sh
yarn start --reset-cache
```

## API Base URL

Configured in `src/shared/constants/config.ts`.

- Android emulator: `http://10.0.2.2:5000/api/v1`
- iOS simulator: `http://localhost:5000/api/v1`
- Physical device: `http://<LAN_IP>:5000/api/v1`

## Font Setup

Configured in `react-native.config.js`:

- `assets: ['./src/assets/fonts']`

Expected Sora files:

- `Sora-Thin.ttf`
- `Sora-ExtraLight.ttf`
- `Sora-Light.ttf`
- `Sora-Regular.ttf`
- `Sora-Medium.ttf`
- `Sora-SemiBold.ttf`
- `Sora-Bold.ttf`
- `Sora-ExtraBold.ttf`

If fonts do not appear:

1. Rebuild native app.
2. Reset metro cache.
3. Re-run build.

## Reanimated Rule

In `babel.config.js`, keep this as the last plugin:

- `react-native-worklets/plugin`

Do not place any plugin after it.

## Quality Gate

Before commit, run:

```sh
yarn lint
yarn typecheck
yarn test
```

No lint or type errors should be committed.

## Planned Mobile Modules

- Full OTP auth flow
- Swipe shell (`react-native-tab-view` + `react-native-pager-view`) with custom floating tab bar
- Feed / Bookmark module
- Community module
- Learning / My Course module
- AI mentor + Message
- Chat and notifications
- Profile and privacy controls
