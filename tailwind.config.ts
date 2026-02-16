import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			surface: {
  				DEFAULT: '#09090B',
  				raised: '#18181B',
  				overlay: '#27272A',
  				subtle: '#1C1C1F'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				hover: '#7C3AED',
  				muted: 'rgba(139, 92, 246, 0.12)',
  				subtle: 'rgba(139, 92, 246, 0.06)',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			success: {
  				DEFAULT: '#10B981',
  				muted: 'rgba(16, 185, 129, 0.12)'
  			},
  			warning: {
  				DEFAULT: '#F59E0B',
  				muted: 'rgba(245, 158, 11, 0.12)'
  			},
  			danger: {
  				DEFAULT: '#F43F5E',
  				muted: 'rgba(244, 63, 94, 0.12)'
  			},
  			info: {
  				DEFAULT: '#3B82F6',
  				muted: 'rgba(59, 130, 246, 0.12)'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'sans-serif'
  			],
  			mono: [
  				'JetBrains Mono',
  				'SF Mono',
  				'monospace'
  			]
  		},
  		fontSize: {
  			'2xs': [
  				'0.625rem',
  				{
  					lineHeight: '0.875rem'
  				}
  			],
  			xs: [
  				'0.6875rem',
  				{
  					lineHeight: '1rem'
  				}
  			],
  			sm: [
  				'0.8125rem',
  				{
  					lineHeight: '1.25rem'
  				}
  			],
  			base: [
  				'0.875rem',
  				{
  					lineHeight: '1.375rem'
  				}
  			],
  			lg: [
  				'1rem',
  				{
  					lineHeight: '1.5rem'
  				}
  			],
  			xl: [
  				'1.25rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			'2xl': [
  				'1.5rem',
  				{
  					lineHeight: '2rem'
  				}
  			],
  			'3xl': [
  				'1.875rem',
  				{
  					lineHeight: '2.25rem'
  				}
  			]
  		},
  		borderRadius: {
  			DEFAULT: '8px',
  			lg: 'var(--radius)',
  			xl: '16px',
  			'2xl': '20px',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'fade-in': {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			'slide-up': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(8px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-in-right': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(100%)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			'scale-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'scale(0.96)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-200% 0'
  				},
  				'100%': {
  					backgroundPosition: '200% 0'
  				}
  			}
  		},
  		animation: {
  			'fade-in': 'fade-in 0.2s ease-out',
  			'slide-up': 'slide-up 0.25s ease-out',
  			'slide-in-right': 'slide-in-right 0.3s ease-out',
  			'scale-in': 'scale-in 0.2s ease-out',
  			shimmer: 'shimmer 2s infinite linear'
  		},
  		boxShadow: {
  			glow: '0 0 24px rgba(139, 92, 246, 0.15)',
  			card: '0 1px 2px rgba(0, 0, 0, 0.3)',
  			'card-hover': '0 4px 12px rgba(0, 0, 0, 0.4)',
  			modal: '0 16px 48px rgba(0, 0, 0, 0.6)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
