import { CATEGORIES_DATA } from '../categories';
import { GamePlayer, Player } from '../types';

interface GameConfig {
    players: Player[];
    impostorCount: number;
    useHintMode: boolean;
    useTrollMode: boolean;
    selectedCats: string[];
    history: { lastImpostorIds: string[]; lastWords: string[] };
}

export const generateGameData = (config: GameConfig): { players: GamePlayer[]; isTrollEvent: boolean; newHistoryWords: string[] } => {
    const { players, impostorCount, useHintMode, useTrollMode, selectedCats, history } = config;
    
    // 1. Troll Mode Check (15% Chance)
    const isTrollEvent = useTrollMode && Math.random() < 0.15;
    
    // 2. Category Selection
    const availableCategories = selectedCats.length > 0 ? selectedCats : Object.keys(CATEGORIES_DATA);
    
    // Logic for Troll Mode
    if (isTrollEvent) {
        // In Troll Mode: Everyone is an impostor.
        // If Hint Mode is ACTIVE: Each player receives a different random hint.
        // If Hint Mode is INACTIVE: Each player receives standard Impostor text (Chaos).
        const trollPlayers: GamePlayer[] = players.map(player => {
            const randomCatName = availableCategories[Math.floor(Math.random() * availableCategories.length)];
            const catData = CATEGORIES_DATA[randomCatName];
            const randomPair = catData[Math.floor(Math.random() * catData.length)];
            
            let displayWord = "ERES EL IMPOSTOR";
            if (useHintMode) {
                displayWord = `PISTA: ${randomPair.hint}`;
            }

            return {
                id: player.id,
                name: player.name,
                role: 'Impostor',
                word: displayWord,
                realWord: 'TROLL', // Special marker
                isImp: true,
                category: randomCatName
            };
        });

        return { players: trollPlayers, isTrollEvent: true, newHistoryWords: history.lastWords };
    }

    // Logic for Normal Mode
    const catName = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const wordList = CATEGORIES_DATA[catName];
    
    // Filter out recently used words
    const validWords = wordList.filter(w => !history.lastWords.includes(w.civ));
    // If we run out of words, reset filter
    const finalWords = validWords.length > 0 ? validWords : wordList;
    const wordPair = finalWords[Math.floor(Math.random() * finalWords.length)];

    // Weighted Random Selection for Impostors
    let pool = [...players];
    const impostors: Player[] = [];

    for (let i = 0; i < impostorCount; i++) {
        // Calculate weights
        const weights = pool.map(p => history.lastImpostorIds.includes(p.id) ? 0.1 : 1.0);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        
        let random = Math.random() * totalWeight;
        let selectedIndex = 0;
        
        for (let j = 0; j < pool.length; j++) {
            if (random < weights[j]) {
                selectedIndex = j;
                break;
            }
            random -= weights[j];
        }
        
        impostors.push(pool[selectedIndex]);
        pool.splice(selectedIndex, 1);
    }

    // Map Players to Game Data
    const gamePlayers: GamePlayer[] = players.map(p => {
        const isImp = impostors.some(imp => imp.id === p.id);
        
        let displayWord = wordPair.civ;
        if (isImp) {
            if (useHintMode) {
                displayWord = `PISTA: ${wordPair.hint}`;
            } else {
                displayWord = "ERES EL IMPOSTOR";
            }
        }

        return {
            id: p.id,
            name: p.name,
            role: isImp ? 'Impostor' : 'Civil',
            word: displayWord,
            realWord: wordPair.civ,
            isImp: isImp,
            category: catName
        };
    });

    // Update history (add new word, keep last 15)
    const newHistoryWords = [wordPair.civ, ...history.lastWords].slice(0, 15);

    return { players: gamePlayers, isTrollEvent: false, newHistoryWords };
};