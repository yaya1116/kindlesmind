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
          bg: '#F4EEFF',                // 極淡夢幻紫底
          sage: '#9B45CC',              // 中紫（用於文字 accent）
          'sage-light': '#DC8DF3',      // 品牌主色 violet
          'sage-dark': '#7230A8',       // 深紫
          terracotta: '#33ABD3',        // 品牌副色 cyan
          'terracotta-light': '#6CCAEB',
          'terracotta-dark': '#1E88B0',
          text: '#2B1A42',              // 深紫黑（正文）
          'text-muted': '#8060A8',      // 中紫（次要文字）
          'text-light': '#B898D8',      // 淡紫（說明文字）
          cream: '#EBE0FF',             // 淡紫奶油
          'cream-dark': '#D8C8F4',      // 稍深淡紫
        }
      },
      fontFamily: {
        serif: ['Noto Serif TC', 'Georgia', 'serif'],
        sans: ['Noto Sans TC', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 2px 8px rgba(220, 141, 243, 0.10)',
        'warm':    '0 4px 20px rgba(220, 141, 243, 0.14)',
        'warm-lg': '0 8px 40px rgba(220, 141, 243, 0.20)',
        'warm-xl': '0 16px 60px rgba(220, 141, 243, 0.26)',
        'terracotta':    '0 4px 20px rgba(51, 171, 211, 0.25)',
        'terracotta-lg': '0 8px 40px rgba(51, 171, 211, 0.35)',
        'inner-warm': 'inset 0 2px 8px rgba(220, 141, 243, 0.08)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'breathe':     'breathe 4s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'pulse-warm':  'pulseWarm 2s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'fade-in':     'fadeIn 0.6s ease-out forwards',
        'slide-up':    'slideUp 0.5s ease-out forwards',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 141, 243, 0.4)' },
          '50%':       { boxShadow: '0 0 0 16px rgba(220, 141, 243, 0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
