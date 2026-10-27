/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-surface',
    'bg-surface-card',
    'bg-surface-lowest',
    'bg-background',
    'bg-primary',
    'bg-secondary',
    'bg-tertiary',
    'text-primary',
    'text-secondary',
    'text-tertiary',
    'text-content-primary',
    'text-content-secondary',
    'border-outline',
    'font-headline',
    'font-display',
    'font-body',
    'font-mono',
    'font-label',
    'panel-rim',
    'glow-primary',
    'glow-secondary',
    'shadow-glow-primary',
    'shadow-glow-secondary',
    'shadow-panel-rim',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Stitch "Neon Tokyo" / Terminal Design Tokens
        stitch: {
          bg: '#0A0A12',
          'surface-lowest': '#0F0F1A',
          surface: '#111118',
          'surface-card': '#141422',
          primary: '#FF2D78',
          secondary: '#00FFCC',
          tertiary: '#FFE04A',
          'tertiary-amber': '#F59E0B',
          'text-primary': '#E8E0F0',
          'text-secondary': '#A098B0',
          border: '#302840',
          'border-subtle': 'rgba(148, 163, 184, 0.08)',
        },
        // Direct Semantic Aliases (e.g. bg-surface, text-primary, bg-secondary)
        background: {
          DEFAULT: '#0A0A12',
          lowest: '#0A0A12',
          subtle: '#0F0F1A',
        },
        surface: {
          DEFAULT: '#111118',
          lowest: '#0F0F1A',
          low: '#111118',
          card: '#141422',
          container: '#141422',
        },
        primary: {
          DEFAULT: '#FF2D78',
          neon: '#FF2D78',
          glow: 'rgba(255, 45, 120, 0.25)',
        },
        secondary: {
          DEFAULT: '#00FFCC',
          neon: '#00FFCC',
          glow: 'rgba(0, 255, 204, 0.25)',
        },
        tertiary: {
          DEFAULT: '#FFE04A',
          amber: '#F59E0B',
        },
        content: {
          primary: '#E8E0F0',
          secondary: '#A098B0',
        },
        outline: {
          DEFAULT: '#302840',
          subtle: 'rgba(148, 163, 184, 0.08)',
        }
      },
      fontFamily: {
        headline: ['Sora', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace', 'sans-serif'],
        label: ['Space Grotesk', 'sans-serif'],
        jetbrains: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 16px -2px rgba(255, 45, 120, 0.25)',
        'glow-secondary': '0 0 16px -2px rgba(0, 255, 204, 0.25)',
        'panel-rim': 'inset 0 1px 0 0 rgba(248, 250, 252, 0.06)',
      }
    },
  },
  plugins: [],
}
