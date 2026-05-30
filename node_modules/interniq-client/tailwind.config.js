/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        background: 'var(--surface-bg)',
        foreground: 'var(--surface-text)',
        card: {
          DEFAULT: 'var(--surface-card)',
          foreground: 'var(--surface-text)',
        },
        border: 'var(--surface-border)',
        muted: {
          DEFAULT: 'var(--surface-muted)',
          foreground: 'var(--surface-muted)',
        },
        subtle: 'var(--surface-subtle)',
        // Brand — Forest Green (nilamone.in inspired)
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#052e16',
          950: '#020f07',
        },
        // Accent — Warm Gold
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Success — Emerald
        success: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        // Warning — Amber
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Danger — Rose
        danger: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        // Dark surface palette — Deep Navy/Teal
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          700: '#1e3250',
          800: '#132240',
          850: '#0d1c35',
          900: '#0f1f35',
          950: '#0a1628',
        },
        background: 'var(--surface-bg)',
        foreground: 'var(--surface-text)',
        card:       'var(--surface-card)',
        border:     'var(--surface-border)',
        muted: {
          DEFAULT: 'var(--surface-muted)',
          foreground: 'var(--surface-muted)',
        },
      },
      backgroundImage: {
        'gradient-brand':    'linear-gradient(135deg, #16a34a 0%, #4ade80 50%, #f59e0b 100%)',
        'gradient-dark':     'linear-gradient(135deg, #0a1628 0%, #0f2d1a 50%, #0a1628 100%)',
        'gradient-glow':     'radial-gradient(ellipse at top, #15803d 0%, transparent 60%)',
        'gradient-card':     'linear-gradient(145deg, rgba(22,163,74,0.15) 0%, rgba(245,158,11,0.05) 100%)',
        'gradient-success':  'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        'gradient-warning':  'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
        'gradient-danger':   'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
      },
      animation: {
        'fade-in':       'fadeIn 0.5s ease-out',
        'fade-up':       'fadeUp 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'slide-in-right':'slideInRight 0.4s ease-out',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow':          'glow 2s ease-in-out infinite alternate',
        'float':         'float 6s ease-in-out infinite',
        'spin-slow':     'spin 8s linear infinite',
        'gradient':      'gradient 6s ease infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        glow: {
          from: { boxShadow: '0 0 5px #16a34a, 0 0 10px #16a34a' },
          to:   { boxShadow: '0 0 20px #16a34a, 0 0 40px #4ade80' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
      boxShadow: {
        'glow-sm':    '0 0 10px rgba(22,163,74,0.4)',
        'glow-md':    '0 0 20px rgba(22,163,74,0.5), 0 0 40px rgba(74,222,128,0.2)',
        'glow-lg':    '0 0 40px rgba(22,163,74,0.6), 0 0 80px rgba(74,222,128,0.3)',
        'card':       '0 4px 24px rgba(0,0,0,0.12)',
        'card-dark':  '0 4px 24px rgba(0,0,0,0.5)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
