
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        // Semantic colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))'
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))'
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))'
        },
        health: {
          DEFAULT: 'hsl(var(--health))',
          foreground: 'hsl(var(--health-foreground))'
        },
        social: {
          DEFAULT: 'hsl(var(--social))',
          foreground: 'hsl(var(--social-foreground))'
        },
        income: {
          DEFAULT: 'hsl(var(--income))',
          foreground: 'hsl(var(--income-foreground))'
        },
        expense: {
          DEFAULT: 'hsl(var(--expense))',
          foreground: 'hsl(var(--expense-foreground))'
        },
        personal: {
          DEFAULT: 'hsl(var(--personal))',
          foreground: 'hsl(var(--personal-foreground))'
        },
        corential: {
          DEFAULT: 'hsl(var(--corential))',
          foreground: 'hsl(var(--corential-foreground))'
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Legacy taskfinity colors (for backward compatibility)
        taskfinity: {
          blue: {
            light: '#60A5FA',
            DEFAULT: '#3B82F6',
            dark: '#1E40AF'
          },
          purple: {
            light: '#A78BFA',
            DEFAULT: '#7C3AED',
            dark: '#5B21B6'
          },
          teal: {
            light: '#2DD4BF',
            DEFAULT: '#14B8A6',
            dark: '#0F766E'
          }
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'card': 'var(--shadow-sm)',
        'card-hover': 'var(--shadow-md)',
        'lg-soft': 'var(--shadow-lg)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          '0%': { opacity: '0.85' },
          '100%': { opacity: '1' }
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.99)', opacity: '0.9' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.15s ease-out',
        'accordion-up': 'accordion-up 0.15s ease-out',
        'fade-in': 'fade-in 0.08s ease-out',
        'fade-out': 'fade-out 0.08s ease-out',
        'scale-in': 'scale-in 0.08s ease-out',
        'slide-in-right': 'slide-in-right 0.15s ease-out',
        'pulse-subtle': 'pulse-subtle 3s infinite ease-in-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
