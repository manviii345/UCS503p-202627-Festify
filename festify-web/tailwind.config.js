/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream:     '#F7F2E7',
        navy:      '#152b38',
        teal:      '#2f7a82',
        crimson:   '#c23b32',
        mustard:   '#e8a63b',
        orange:    '#d8722e',
        pink:      '#EC6484',
        goldenrod: '#F4C430',
        coral:     '#F06E38',
        ink:       '#1A1A1A',
      },
      fontFamily: {
        groovy:     ['Shrikhand', 'cursive'],
        fredoka:    ['Fredoka', 'sans-serif'],
        outfit:     ['Outfit', 'sans-serif'],
        display:    ['"Alfa Slab One"', 'serif'],
        heading:    ['"Fraunces"', 'serif'],
        mono:       ['"Special Elite"', 'cursive'],
        typewriter: ['"Special Elite"', 'cursive'],
        alfa:       ['"Alfa Slab One"', 'serif'],
        fraunces:   ['"Fraunces"', 'serif'],
      },
      borderWidth: {
        '3':  '3px',
        '6':  '6px',
        '8':  '8px',
        '10': '10px',
      },
      borderRadius: {
        bubble: '2rem',
      },
      boxShadow: {
        ticket:           '4px 4px 0px #152b38',
        'ticket-crimson': '4px 4px 0px #c23b32',
        'ticket-teal':    '4px 4px 0px #2f7a82',
        stamp:            '6px 6px 0px rgba(21,43,56,0.25)',
        sticker:          '3px 3px 0px #1A1A1A',
        'sticker-lg':     '5px 5px 0px #1A1A1A',
      },
      keyframes: {
        'stamp-in': {
          '0%':   { transform: 'translateY(-120px) scale(1.4) rotate(-18deg)', opacity: '0' },
          '70%':  { transform: 'translateY(6px) scale(0.97)', opacity: '1' },
          '85%':  { transform: 'translateY(-3px) scale(1.01)' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        'bounce-in': {
          '0%':   { opacity: '0', transform: 'scale(0.5) rotate(-8deg)' },
          '60%':  { opacity: '1', transform: 'scale(1.08) rotate(2deg)' },
          '80%':  { transform: 'scale(0.97) rotate(-1deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%':      { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        'stamp-in':  'stamp-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards',
        'fade-up':   'fade-up 0.6s ease-out forwards',
        'blink':     'blink 0.8s step-end infinite',
        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
        'wiggle':    'wiggle 0.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
