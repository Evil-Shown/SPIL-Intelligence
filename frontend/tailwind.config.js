/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        void:    'var(--bg-void)',
        base:    'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated:'var(--bg-elevated)',
        overlay: 'var(--bg-overlay)',
        neural: {
          core:  'var(--neural-core)',
          pulse: 'var(--neural-pulse)',
          glow:  'var(--neural-glow)',
          trace: 'var(--neural-trace)',
        },
        hot:    { core: 'var(--hot-core)' },
        violet: { core: 'var(--violet-core)' },
        intel:  { violet: 'var(--intel-violet)' },
        status: {
          active:  'var(--status-active)',
          warning: 'var(--status-warning)',
          risk:    'var(--status-risk)',
          idle:    'var(--status-idle)',
        },
      },
      borderColor: {
        subtle:  'var(--border-subtle)',
        default: 'var(--border-default)',
        active:  'var(--border-active)',
      },
      boxShadow: {
        neural:    '0 0 24px var(--neural-glow)',
        'neural-sm':'0 0 12px var(--neural-glow)',
        hot:       '0 0 20px var(--hot-glow)',
        violet:    '0 0 20px var(--violet-glow)',
      },
    },
  },
  plugins: [],
};
