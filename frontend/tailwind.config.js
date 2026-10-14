/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          bg: "#0B0F17",
          panel: "#111827",
          border: "#1F2937",
          surface: "#161F30",
          accent: "#00E5FF",
          danger: "#FF3366",
          warning: "#FFB020",
          success: "#00E676",
          p1: "#FF1744",
          p2: "#FF9100",
          p3: "#FFD600",
          p4: "#00E5FF",
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(0, 229, 255, 0.4)',
        'neon-red': '0 0 15px rgba(255, 23, 68, 0.5)',
        'neon-amber': '0 0 15px rgba(255, 145, 0, 0.4)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
