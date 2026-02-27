/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: '#FDF8F5',
          sage: '#5F7161',
          'sage-light': '#7A8F7C',
          'sage-dark': '#4A5A4C',
          terracotta: '#D48C70',
          'terracotta-light': '#E0A88E',
          'terracotta-dark': '#B8704F',
          text: '#434242',
          'text-muted': '#7A7676',
          'text-light': '#A89D9A',
          cream: '#F5EDE6',
          'cream-dark': '#EDE0D5',
        }
      },
      fontFamily: {
        serif: ['Noto Serif TC', 'Georgia', 'serif'],
        sans: ['Noto Sans TC', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 2px 8px rgba(95, 113, 97, 0.08)',
        'warm': '0 4px 20px rgba(95, 113, 97, 0.12)',
        'warm-lg': '0 8px 40px rgba(95, 113, 97, 0.16)',
        'warm-xl': '0 16px 60px rgba(95, 113, 97, 0.20)',
        'terracotta': '0 4px 20px rgba(212, 140, 112, 0.25)',
        'terracotta-lg': '0 8px 40px rgba(212, 140, 112, 0.35)',
        'inner-warm': 'inset 0 2px 8px rgba(95, 113, 97, 0.06)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-warm': 'pulseWarm 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseWarm: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 140, 112, 0.4)' },
          '50%': { boxShadow: '0 0 0 16px rgba(212, 140, 112, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
