# CS Lords — Complete Web Color System & Palette Guide (Blue + Dark Elegant Crimson Theme)

This document provides a comprehensive reference of all design tokens, CSS variables, Tailwind color utility classes, and UI component usage guidelines applied across **CS Lords**.

---

## 🎨 1. Core Color Variables Palette

| Color Token | HEX Code | CSS Variable | Tailwind Utility | Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Background** | `#030712` | `var(--bg-primary)` | `bg-bg-primary` | Main page background & dark body canvas |
| **Secondary Background** | `#0f1730` | `var(--bg-secondary)` | `bg-bg-secondary` | Glassmorphic cards, containers, input backgrounds & dropdowns |
| **Dark Accent** | `#000000` | `var(--dark-accent)` | `bg-dark-accent` | Decorative lines, overlays, backdrop overlays & subtle shadows |
| **Primary Text** | `#ffffff` | `var(--text-primary)` | `text-text-primary` | Main headings, primary text, high-contrast labels & icons |
| **Secondary Text** | `#c7d0e0` | `var(--text-secondary)` | `text-text-secondary` | Subheadings, body copy, descriptions, placeholders & metadata |
| **Blue Glow** | `#1e90ff` | `var(--blue-glow)` | `text-blue-glow` | Glowing text highlights, primary status badges & neon accents |
| **Blue Icon** | `#4aa8ff` | `var(--blue-icon)` | `text-blue-icon` | Navigation icons, code symbol markers (`< >`), links & indicators |
| **Blue Border** | `#2e6fd9` | `var(--blue-border)` | `border-blue-border` | Frames, card borders, active input rings & divider lines |
| **Red Action** | `#b91c1c` | `var(--red-action)` | `bg-red-action` | Elegant primary action buttons (`btn-primary`), active nav tabs & avatars |
| **Red Glow** | `#e54848` | `var(--red-glow)` | `text-red-glow` | Soft crimson hover glows, primary button hover shadows & alert badges |

---

## 💡 2. CSS & Tailwind Code Integration

### Global CSS Declaration (`app/globals.css`)

```css
:root {
  --bg-primary: #030712;
  --bg-secondary: #0f1730;
  --dark-accent: #000000;
  --text-primary: #ffffff;
  --text-secondary: #c7d0e0;
  --blue-glow: #1e90ff;
  --blue-icon: #4aa8ff;
  --blue-border: #2e6fd9;
  --red-action: #b91c1c;
  --red-glow: #e54848;
}
```

### Tailwind Configuration (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#030712',
        'bg-secondary': '#0f1730',
        'dark-accent': '#000000',
        'text-primary': '#ffffff',
        'text-secondary': '#c7d0e0',
        'blue-glow': '#1e90ff',
        'blue-icon': '#4aa8ff',
        'blue-border': '#2e6fd9',
        'red-action': '#b91c1c',
        'red-glow': '#e54848',
      },
      boxShadow: {
        'neon-blue': '0 0 15px #1e90ff',
        'neon-red': '0 0 15px #e54848',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 🧩 3. Component Color Guidelines

### 1. Primary Buttons (`.btn-primary` / `<Button variant="primary">`)
- **Background:** `var(--red-action)` (`#b91c1c`)
- **Text Color:** `#ffffff` (`var(--text-primary)`)
- **Hover Glow:** `#dc2626` with `box-shadow: 0 0 15px rgba(229, 72, 72, 0.4)`

### 2. Secondary Buttons (`.btn-secondary` / `<Button variant="secondary">`)
- **Background:** `bg-[var(--bg-primary)]/40 backdrop-blur-md`
- **Text Color:** `var(--text-primary)` (`#ffffff`)
- **Border:** `1px solid var(--blue-border)` (`#2e6fd9`)
- **Hover State:** `hover:bg-[var(--blue-border)]/20` with `box-shadow: 0 0 15px var(--blue-glow)`

### 3. Glassmorphism Cards & Panels (`.lms-card`)
- **Background:** `rgba(15, 23, 48, 0.55)` (`var(--bg-secondary)`)
- **Border:** `1px solid var(--blue-border)` (`#2e6fd9`)
- **Hover Glow:** `border-color: var(--blue-glow)` & `box-shadow: 0 0 15px var(--blue-glow)`

### 4. Gradient Glow Headings (`.glow-heading`)
- **Gradient:** `linear-gradient(135deg, var(--blue-glow) 0%, var(--red-action) 100%)`
- **Clipping:** `background-clip: text`, `-webkit-text-fill-color: transparent`

### 5. Input Fields & Form Controls (`<Input />` & `<select>`)
- **Background:** `bg-[var(--bg-primary)]/40 backdrop-blur-md`
- **Border:** `border-[var(--blue-border)]/40`
- **Focus Ring & Glow:** `focus:border-[var(--blue-border)]` & `focus:shadow-[0_0_12px_var(--blue-glow)]`

### 6. Sidebar Active Navigation Item
- **Active State:** `bg-[var(--red-action)] text-white shadow-[0_0_15px_rgba(185,28,28,0.4)] border border-[var(--blue-border)]/50`

### 7. Badges & Tags (`<Badge />`)
- **Blue Badge:** `bg-[var(--blue-glow)]/15 text-[var(--blue-glow)] border-[var(--blue-glow)]/40`
- **Red Badge:** `bg-[var(--red-action)]/15 text-[var(--red-glow)] border-[var(--red-action)]/40`

---

## 📌 Summary

This color specification ensures strict design consistency, accessibility contrast, and high-end dark crimson elegance across all mobile, tablet, and desktop screens in **CS Lords**.
