import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hogwarts: {
          primary: '#5B2588', 
          primaryHover: '#4a1d70',
          text: '#111827',   
          label: '#374151',   
          purpleText: '#7C3AED', 
        }
      },
      backgroundImage: {
        
        'clean-gradient': 'linear-gradient(135deg, #E0F7FA 0%, #FFFFFF 50%, #FFEDD5 100%)',
      },
      boxShadow: {
        'card': '0 4px 60px rgba(0, 0, 0, 0.05)', 
      }
    },
  },
  plugins: [],
};
export default config;