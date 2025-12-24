export type ThemeName = 'midnight' | 'obsidian' | 'solar' | 'cyber' | 'bond' | 'turing' | 'illojuan';

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
}

export interface GameState {
    phase: 'setup' | 'revealing' | 'results';
    players: Player[];
    gameData: GamePlayer[];
    impostorCount: number;
    currentPlayerIndex: number;
    startingPlayer: string;
    isTrollEvent: boolean;
    history: {
        lastImpostorIds: string[];
        lastWords: string[];
    };
    settings: {
        hintMode: boolean;
        trollMode: boolean;
        selectedCategories: string[];
    };
    theme: ThemeName;
}

export interface CategoryData {
    civ: string;
    imp: string;
    hint: string;
}