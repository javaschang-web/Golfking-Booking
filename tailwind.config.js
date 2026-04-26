/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07140d',
        'bg-soft': '#0d1f15',
        panel: '#11261a',
        'panel-alt': '#163121',
        border: '#29543c',
        text: '#f3fff6',
        'text-soft': '#b8d6c0',
        primary: '#65d46e',
        'primary-strong': '#7ef08a',
        'primary-muted': '#21492d',
        danger: '#ff7b7b',
        warning: '#f6d365',
      },
      boxShadow: {
        glass: '0 12px 32px rgba(0,0,0,0.22)',
        hero: '0 18px 50px rgba(0,0,0,0.28)',
      },
      // Make UI "boxes" square (keep `rounded-full` pills/circles as-is).
      // This affects `rounded`, `rounded-sm/md/lg/xl/...`.
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
      },
    },
  },
  plugins: [],
}

