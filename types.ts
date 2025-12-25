export type ThemeName = 'midnight' | 'obsidian' | 'solar' | 'cyber' | 'bond' | 'turing' | 'illojuan' | 'material' | 'zenith' | 'protocol' | 'ethereal' | 'terminal84' | 'soft' | 'noir' | 'paper' | 'space' | 'nightclub';

export interface ThemeConfig {
    name: string;
    bg: string;
    cardBg: string;
    accent: string;
    text: string;
    sub: string;
    radius: string; // Tailwind class equivalent or CSS value
    font: string;
    border: string;
    particleType: 'circle' | 'binary' | 'rain';
}

export interface Player {
    id: string;
    name: string;
}

export interface GamePlayer extends Player {
    role: 'Civil' | 'Impostor';
    word: string; // What they see on the card
    realWord: string; // The actual civil word (for results)
    isImp: boolean;
    category: string;
    areScore: number; // The ARE weight calculated for this round
}

export interface PlayerStats {
    totalImpostorCount: number; // Total times they have been impostor
    lastImpostorRound: number;  // The round number (index) when they were last impostor
}

export type TrollScenario = 'espejo_total' | 'civil_solitario' | 'falsa_alarma';

export interface GameState {
    phase: 'setup' | 'revealing' | 'discussion' | 'results';
    players: Player[];
    gameData: GamePlayer[];
    impostorCount: number;
    currentPlayerIndex: number;
    startingPlayer: string;
    isTrollEvent: boolean;
    trollScenario: TrollScenario | null; // Specific Pandora scenario
    history: {
        roundCounter: number; // Global counter of rounds played
        lastWords: string[];
        playerStats: Record<string, PlayerStats>; // Persistent infinite history by Player ID
        lastTrollRound: number; // For the 5-round cooldown lock
    };
    settings: {
        hintMode: boolean;
        trollMode: boolean;
        partyMode: boolean;
        selectedCategories: string[];
    };
    currentDrinkingPrompt: string;
    theme: ThemeName;
}

export interface CategoryData {
    civ: string;
    imp: string;
    hint: string;
}