import { ThemeConfig, ThemeName } from './types';

export const THEMES: Record<ThemeName, ThemeConfig> = {
    midnight: { 
        name: "Midnight", 
        bg: "#050508", 
        cardBg: "rgba(18, 18, 26, 0.7)", 
        accent: "#6366f1", 
        text: "#ffffff", 
        sub: "#94a3b8", 
        radius: "0rem", 
        font: "'Inter', sans-serif", 
        border: "rgba(255,255,255,0.1)",
        particleType: 'circle'
    },
    bond: { 
        name: "007 Protocol", 
        bg: "#0a0a0a", 
        cardBg: "rgba(20, 20, 20, 0.8)", 
        accent: "#dc2626", 
        text: "#e5e5e5", 
        sub: "#525252", 
        radius: "0rem", 
        font: "'Playfair Display', serif", 
        border: "rgba(220,38,38,0.3)",
        particleType: 'circle'
    },
    turing: { 
        name: "Turing", 
        bg: "#050505", 
        cardBg: "rgba(15, 15, 15, 0.9)", 
        accent: "#22c55e", 
        text: "#22c55e", 
        sub: "#14532d", 
        radius: "0rem", 
        font: "'JetBrains Mono', monospace", 
        border: "rgba(34,197,94,0.4)",
        particleType: 'binary'
    },
    solar: { 
        name: "Solar", 
        bg: "#fffdf0", 
        cardBg: "rgba(255, 255, 255, 0.6)", 
        accent: "#d97706", 
        text: "#451a03", 
        sub: "#92400e", 
        radius: "3rem", 
        font: "'Inter', sans-serif", 
        border: "rgba(217,119,6,0.15)",
        particleType: 'circle'
    },
    illojuan: { 
        name: "Andaluz", 
        bg: "#f0fdf4", 
        cardBg: "rgba(255, 255, 255, 0.7)", 
        accent: "#16a34a", 
        text: "#14532d", 
        sub: "#166534", 
        radius: "2rem", 
        font: "'Inter', sans-serif", 
        border: "rgba(22,163,74,0.2)",
        particleType: 'circle'
    },
    obsidian: { 
        name: "Obsidian", 
        bg: "#080706", 
        cardBg: "rgba(18, 17, 15, 0.8)", 
        accent: "#f59e0b", 
        text: "#ffffff", 
        sub: "#a8a29e", 
        radius: "1.5rem", 
        font: "'Inter', sans-serif", 
        border: "rgba(245,158,11,0.2)",
        particleType: 'circle'
    },
    cyber: { 
        name: "Cyberpunk", 
        bg: "#0d0221", 
        cardBg: "rgba(26, 11, 60, 0.6)", 
        accent: "#d946ef", 
        text: "#ffffff", 
        sub: "#c026d3", 
        radius: "1rem", 
        font: "'JetBrains Mono', monospace", 
        border: "rgba(217,70,239,0.5)",
        particleType: 'rain'
    },
};

export const DEFAULT_PLAYERS = ["Agente 1", "Agente 2", "Agente 3", "Agente 4"];