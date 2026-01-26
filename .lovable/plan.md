

# Redesign Login Page with Stackit Branding

## Overview

Transform the current centered card login page into a modern split-screen design matching the Academy reference, updated with Stackit branding.

---

## Summary of Changes

| Area | Change |
|------|--------|
| **Logo Assets** | Add new Stackit blue icon, update Logo component |
| **Auth.tsx Layout** | Convert to split-screen (left form, right hero) |
| **Branding** | Replace "Infostack" with "Stackit" throughout |
| **Visual Style** | Dark blue gradient hero, modern form styling |

---

## 1. Add Stackit Logo Asset

Copy the blue Stackit logo to assets:
```
user-uploads://bluuee-removebg-preview.png → src/assets/stackit-logo.png
```

---

## 2. Update Logo Component

### File: `src/components/Logo.tsx`

Update to use the new Stackit logo and branding:

```typescript
import logo from "@/assets/stackit-logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "small" | "medium" | "large" | "xlarge";
  className?: string;
  showText?: boolean;
  gradientText?: boolean;
}

export const Logo = ({ size = "medium", className, showText = false, gradientText = true }: LogoProps) => {
  const sizeClasses = {
    small: "h-6 w-6 sm:h-7 sm:w-7",
    medium: "h-8 w-8 sm:h-9 sm:w-9",
    large: "h-12 w-12 sm:h-16 sm:w-16",
    xlarge: "h-20 w-20 sm:h-24 sm:w-24",
  };

  return (
    <div className={cn("flex items-center gap-2 sm:gap-2.5", className)}>
      <img 
        src={logo} 
        alt="Stackit Logo" 
        className={cn(sizeClasses[size], "object-contain")}
      />
      {showText && (
        <span className={cn(
          "font-bold text-base sm:text-xl tracking-tight",
          gradientText 
            ? "text-gradient-brand" 
            : "text-foreground"
        )}>
          Stackit
        </span>
      )}
    </div>
  );
};
```

---

## 3. Redesign Auth Page Layout

### File: `src/pages/Auth.tsx`

Transform from centered card to split-screen layout:

```text
+----------------------------------------------------------+
|  LEFT SIDE (Form - White/Light)  |  RIGHT SIDE (Hero)    |
|----------------------------------|------------------------|
|  🔵 Stackit                      |                        |
|                                  |  ✨ Dark blue gradient |
|  Welcome back                    |                        |
|  Sign in to your account         |  📦 Logo icon          |
|                                  |                        |
|  [   Google   ] [  Outlook  ]    |  💡 Floating badges:   |
|  (social buttons)                |     - "Certificate"    |
|                                  |     - "Interactive"    |
|  ─── or continue with email ───  |                        |
|                                  |  🚀 Hero copy:         |
|  Email                           |  "The Operating System |
|  [___________________________]   |   for Scaling Digital  |
|                                  |   Offers."             |
|  Password                  👁    |                        |
|  [___________________________]   |  Sub-copy: Stack It    |
|                                  |  builds your funnels...|
|  [Forgot password?]              |                        |
|                                  |                        |
|  [====== Sign in ======]         |                        |
|                                  |                        |
|  Don't have account? Sign up     |                        |
+----------------------------------+------------------------+
```

### Key Layout Changes:

```typescript
return (
  <div className="min-h-screen flex">
    {/* Left Side - Form */}
    <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 bg-background">
      {/* Logo */}
      <div className="mb-8">
        <Logo size="medium" showText />
      </div>
      
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Welcome back
        </h1>
        <p className="text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>
      
      {/* Social Buttons - Side by Side */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button variant="outline" onClick={handleGoogleSignIn}>
          <GoogleIcon /> Google
        </Button>
        <Button variant="outline" disabled>
          <OutlookIcon /> Outlook
        </Button>
      </div>
      
      {/* Divider */}
      <div className="relative my-6">
        <Separator />
        <span className="absolute ...">or continue with email</span>
      </div>
      
      {/* Form Fields */}
      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label>Email <span className="text-destructive">*</span></Label>
          <Input placeholder="you@company.com" ... />
        </div>
        
        <div className="space-y-2">
          <Label>Password <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Input type={showPassword ? "text" : "password"} ... />
            <button onClick={togglePassword}>
              <Eye />
            </button>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button className="text-primary text-sm">Forgot password?</button>
        </div>
        
        <Button type="submit" className="w-full bg-primary">
          Sign in
        </Button>
      </form>
      
      {/* Switch to Sign Up */}
      <p className="mt-6 text-center text-sm">
        Don't have an account? <Link>Create an account</Link>
      </p>
    </div>
    
    {/* Right Side - Hero (Hidden on mobile) */}
    <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden items-center justify-center">
      {/* Decorative Elements */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <Badge className="bg-blue-600/20 text-blue-300">
          ✨ Join 500+ teams worldwide
        </Badge>
      </div>
      
      {/* Floating Cards (decorative) */}
      <div className="relative">
        <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
          ...course progress mockup...
        </Card>
        <Badge className="absolute ...">Certificate Earned</Badge>
        <Badge className="absolute ...">Interactive lessons</Badge>
      </div>
      
      {/* Bottom Copy */}
      <div className="absolute bottom-12 px-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">
          The Operating System for Scaling Digital Offers.
        </h2>
        <p className="text-slate-400 text-sm">
          Stack It builds your funnels, captures leads, books calls, 
          tracks deals, and automates follow-ups, all in one system.
        </p>
      </div>
    </div>
  </div>
);
```

---

## 4. Features to Implement

### Form Enhancements
- Password visibility toggle (eye icon)
- Red asterisk for required fields
- Placeholder text styling
- "Forgot password?" link aligned right

### Right Side Hero
- Dark blue gradient background
- Decorative circular glows/blurs
- Floating badge: "Join X+ teams worldwide"
- Mockup card with progress indicators (decorative)
- Marketing headline: "The Operating System for Scaling Digital Offers."
- Sub-copy from Stackit website

### Responsive Behavior
- **Desktop (lg+)**: Split 50/50 layout
- **Tablet/Mobile**: Full-width form only, hero hidden

---

## 5. Color Scheme

Based on the reference images:

```text
Left Side (Form):
- Background: bg-background (white/light)
- Text: text-foreground
- Input borders: border-input
- Primary button: bg-blue-600 (Stackit blue)

Right Side (Hero):
- Background: gradient from-slate-900 via-blue-950 to-slate-900
- Accent: blue-500/blue-600 for badges and glows
- Text: text-white, text-slate-400 for secondary
```

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/assets/stackit-logo.png` | Create (copy) | New Stackit blue icon |
| `src/components/Logo.tsx` | Modify | Update to use Stackit logo and name |
| `src/pages/Auth.tsx` | Modify | Complete redesign to split-screen layout |

---

## Visual Result

After implementation:
- **Modern split-screen login** matching the Academy reference
- **Stackit branding** with blue logo throughout
- **Professional dark hero section** with marketing copy
- **Clean form UX** with social login, password toggle, and clear CTAs
- **Fully responsive** - hero hidden on mobile, form takes full width

