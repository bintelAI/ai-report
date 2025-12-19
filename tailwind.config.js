/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 现代化的主色调 - 保持原有蓝色基调但更加鲜明
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // 原有的 Lark Blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // 现代化的次要色调 - 更加中性的灰色调
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b', // 原有颜色
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // 现代化的强调色 - 更加活力的橙色
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // 原有颜色
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // 添加现代化的中性色
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // 添加状态色
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'modern': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'modern-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'modern': '0.5rem',
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#3b82f6", // Lark Blue
          "secondary": "#64748b",
          "accent": "#f59e0b",
          "neutral": "#f3f4f6",
          "base-100": "#ffffff",
          "base-200": "#f9fafb",
          "base-300": "#f3f4f6",
          "base-content": "#1f2937",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
      {
        dark: {
          "primary": "#60a5fa", // 更亮的蓝色用于暗色模式
          "secondary": "#94a3b8",
          "accent": "#fbbf24",
          "neutral": "#1f2937",
          "base-100": "#111827",
          "base-200": "#1f2937",
          "base-300": "#374151",
          "base-content": "#f9fafb",
          "info": "#60a5fa",
          "success": "#34d399",
          "warning": "#fbbf24",
          "error": "#f87171",
        },
      },
      {
        modern: {
          "primary": "#3b82f6",
          "secondary": "#6366f1",
          "accent": "#f59e0b",
          "neutral": "#64748b",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#f1f5f9",
          "base-content": "#0f172a",
          "info": "#06b6d4",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
          // 现代化额外颜色
          "--rounded-box": "0.5rem",
          "--rounded-btn": "0.375rem",
          "--rounded-badge": "0.25rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-text-case": "uppercase",
          "--navbar-padding": "0.5rem",
          "--border-btn": "1px",
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    rtl: false,
    prefix: "",
    logs: true,
  },
}