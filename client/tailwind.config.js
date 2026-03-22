/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#9945FF',
          cyan:   '#00F0FF',
          pink:   '#FF2EF7',
          green:  '#14F195',
          yellow: '#FFD600',
          bg:     '#0A0A0F',
          card:   '#12121A',
          glass:  'rgba(255,255,255,0.04)',
          border: 'rgba(255,255,255,0.08)',
          muted:  '#6B7280',
          text:   '#E2E8F0',
        }
      },
      fontFamily: {
        sans:    ['Space Grotesk', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow':        'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(153,69,255,0.3), transparent)',
        'card-shine':       'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)',
        'neon-purple':      'linear-gradient(135deg, #9945FF, #6B00FF)',
        'neon-cyan':        'linear-gradient(135deg, #00F0FF, #0088FF)',
        'neon-pink':        'linear-gradient(135deg, #FF2EF7, #9945FF)',
        'neon-green':       'linear-gradient(135deg, #14F195, #00C27A)',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(153,69,255,0.4), 0 0 60px rgba(153,69,255,0.15)',
        'glow-cyan':   '0 0 20px rgba(0,240,255,0.4), 0 0 60px rgba(0,240,255,0.15)',
        'glow-pink':   '0 0 20px rgba(255,46,247,0.4), 0 0 60px rgba(255,46,247,0.15)',
        'glow-green':  '0 0 20px rgba(20,241,149,0.4), 0 0 60px rgba(20,241,149,0.15)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-slow':   'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':        'float 6s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'spin-slow':    'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
}
