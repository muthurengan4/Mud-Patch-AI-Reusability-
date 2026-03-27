/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                fontFamily: {
                        'heading': ['Outfit', 'sans-serif'],
                        'body': ['Figtree', 'sans-serif'],
                },
                borderRadius: {
                        lg: '16px',
                        md: '12px',
                        sm: '8px'
                },
                colors: {
                        background: '#fcfdfc',
                        foreground: '#1f2923',
                        card: {
                                DEFAULT: '#ffffff',
                                foreground: '#1f2923'
                        },
                        popover: {
                                DEFAULT: '#ffffff',
                                foreground: '#1f2923'
                        },
                        primary: {
                                DEFAULT: '#386641',
                                foreground: '#ffffff',
                                hover: '#2b5033',
                                light: '#a7c957'
                        },
                        secondary: {
                                DEFAULT: '#e6ede7',
                                foreground: '#1f2923'
                        },
                        muted: {
                                DEFAULT: '#f4f7f4',
                                foreground: '#8b968e'
                        },
                        accent: {
                                DEFAULT: '#a7c957',
                                foreground: '#1f2923'
                        },
                        destructive: {
                                DEFAULT: '#ef4444',
                                foreground: '#ffffff'
                        },
                        border: '#e6ede7',
                        input: '#e6ede7',
                        ring: '#a7c957',
                        status: {
                                resale: '#10b981',
                                refurbish: '#f59e0b',
                                recycle: '#14b8a6',
                                downcycle: '#d97757',
                                waste: '#ef4444'
                        },
                        text: {
                                primary: '#1f2923',
                                secondary: '#4b554e',
                                muted: '#8b968e'
                        }
                },
                boxShadow: {
                        'card': '0 4px 20px -2px rgba(56, 102, 65, 0.05)',
                        'hover': '0 10px 30px -4px rgba(56, 102, 65, 0.1)'
                },
                keyframes: {
                        'accordion-down': {
                                from: {
                                        height: '0'
                                },
                                to: {
                                        height: 'var(--radix-accordion-content-height)'
                                }
                        },
                        'accordion-up': {
                                from: {
                                        height: 'var(--radix-accordion-content-height)'
                                },
                                to: {
                                        height: '0'
                                }
                        },
                        'fade-in': {
                                from: { opacity: '0', transform: 'translateY(10px)' },
                                to: { opacity: '1', transform: 'translateY(0)' }
                        },
                        'scale-in': {
                                from: { opacity: '0', transform: 'scale(0.95)' },
                                to: { opacity: '1', transform: 'scale(1)' }
                        },
                        'pulse-ring': {
                                '0%, 100%': { opacity: '1' },
                                '50%': { opacity: '0.5' }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'fade-in': 'fade-in 0.3s ease-out',
                        'scale-in': 'scale-in 0.2s ease-out',
                        'pulse-ring': 'pulse-ring 2s ease-in-out infinite'
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
