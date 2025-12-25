import { CATEGORIES_DATA } from '../categories';
import { GamePlayer, Player, PlayerStats, TrollScenario } from '../types';

interface GameConfig {
    players: Player[];
    impostorCount: number;
    useHintMode: boolean;
    useTrollMode: boolean;
    selectedCats: string[];
    history: { 
        roundCounter: number;
        lastWords: string[]; 
        playerStats: Record<string, PlayerStats>;
        lastTrollRound: number;
    };
}

// Fisher-Yates Shuffle Algorithm for pure randomness
const shuffleArray = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// Helper to calculate ARE "Infinite Balance" weight
const calculateAREWeight = (p: Player, history: GameConfig['history'], currentRound: number) => {
    const stats = history.playerStats[p.id] || { totalImpostorCount: 0, lastImpostorRound: -1 };
    
    // 1. FREQUENCY BALANCE (Long Term Equality)
    let weight = 100 / (stats.totalImpostorCount + 1);
    
    // 2. RECENCY PENALTY (Short Term Fairness)
    if (stats.lastImpostorRound !== -1) {
        const roundsSince = currentRound - stats.lastImpostorRound;
        
        if (roundsSince === 1) weight *= 0.05;      // Last round
        else if (roundsSince === 2) weight *= 0.20; // 2 rounds ago
        else if (roundsSince === 3) weight *= 0.50; // 3 rounds ago
        else if (roundsSince > 5) {
            const gap = roundsSince - 5;
            weight += (gap * 15);
        }
    }

    return weight;
};

export const generateGameData = (config: GameConfig): { 
    players: GamePlayer[]; 
    isTrollEvent: boolean;
    trollScenario: TrollScenario | null;
    newHistory: { 
        roundCounter: number;
        lastWords: string[];
        playerStats: Record<string, PlayerStats>;
        lastTrollRound: number;
    } 
} => {
    const { players, impostorCount, useHintMode, useTrollMode, selectedCats, history } = config;
    
    const currentRound = history.roundCounter + 1;
    const availableCategories = selectedCats.length > 0 ? selectedCats : Object.keys(CATEGORIES_DATA);

    // --- PROTOCOLO PANDORA (Troll Logic) ---
    
    // 1. Session Lock: Check cooldown (5 rounds)
    const roundsSinceLastTroll = currentRound - history.lastTrollRound;
    const isCooldownActive = history.lastTrollRound > 0 && roundsSinceLastTroll <= 5;

    // 2. Probability Check (15% base, 0% if cooldown active)
    const isTrollEvent = !isCooldownActive && useTrollMode && Math.random() < 0.15;

    if (isTrollEvent) {
        // --- 1. La Matriz de Escenarios ---
        const roll = Math.random() * 100;
        let scenario: TrollScenario;
        
        if (roll < 70) scenario = 'espejo_total';      // 70%
        else if (roll < 90) scenario = 'civil_solitario'; // 20%
        else scenario = 'falsa_alarma';                // 10%

        // Pick base data for context
        const catName = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        const catDataList = CATEGORIES_DATA[catName];
        const basePair = catDataList[Math.floor(Math.random() * catDataList.length)];
        
        let trollPlayers: GamePlayer[] = [];
        
        // --- 2. Motor de Pistas "Babilonia" ---
        // Pre-calculate the "Noise Victim" so it's consistent for the whole round generation
        const noiseIndex = Math.floor(Math.random() * players.length);

        const generateBabylonHint = (playerIndex: number): string => {
            if (!useHintMode) return "ERES EL IMPOSTOR";

            // Injection of Noise (One random player gets total garbage)
            if (playerIndex === noiseIndex) {
                // Pick a totally random category not current
                const otherCats = Object.keys(CATEGORIES_DATA).filter(c => c !== catName);
                const noiseCat = otherCats[Math.floor(Math.random() * otherCats.length)];
                const noisePair = CATEGORIES_DATA[noiseCat][0];
                return `PISTA: ${noisePair.hint} (RUIDO)`; // Or just hint, but let's be chaotic
            }

            // Semantic Tree / Synonyms Simulation
            // We use hints from OTHER words in the SAME category to simulate related but distinct concepts
            const randomRelatedPair = catDataList[Math.floor(Math.random() * catDataList.length)];
            
            // 50% chance of getting the Category Name itself as a hint (very generic)
            if (Math.random() > 0.5) {
                return `PISTA: ${catName}`;
            }
            
            return `PISTA: ${randomRelatedPair.hint}`;
        };


        if (scenario === 'espejo_total') {
            // A. Espejo Total: Todos Impostores
            trollPlayers = players.map((p, idx) => ({
                id: p.id,
                name: p.name,
                role: 'Impostor',
                word: generateBabylonHint(idx),
                realWord: basePair.civ, // Context for reveal
                isImp: true,
                category: catName,
                areScore: 0
            }));

        } else if (scenario === 'civil_solitario') {
            // B. El Civil Solitario: Todos Impostores menos 1
            const civilIndex = Math.floor(Math.random() * players.length);
            
            trollPlayers = players.map((p, idx) => {
                const isCivil = idx === civilIndex;
                return {
                    id: p.id,
                    name: p.name,
                    role: isCivil ? 'Civil' : 'Impostor',
                    word: isCivil ? basePair.civ : generateBabylonHint(idx),
                    realWord: basePair.civ,
                    isImp: !isCivil,
                    category: catName,
                    areScore: 0
                };
            });

        } else {
            // C. Falsa Alarma: Todos Civiles
            trollPlayers = players.map(p => ({
                id: p.id,
                name: p.name,
                role: 'Civil',
                word: basePair.civ, // Everyone sees the word
                realWord: basePair.civ,
                isImp: false, // No functional impostor, though the system flags it as Troll Event
                category: catName,
                areScore: 0
            }));
        }

        return { 
            players: trollPlayers, 
            isTrollEvent: true,
            trollScenario: scenario,
            newHistory: { 
                ...history, 
                roundCounter: currentRound,
                lastTrollRound: currentRound // Trigger cooldown
            } 
        };
    }

    // --- NORMAL MODE (ARE Algorithm) ---
    
    const catName = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const wordList = CATEGORIES_DATA[catName];
    const validWords = wordList.filter(w => !history.lastWords.includes(w.civ));
    const finalWords = validWords.length > 0 ? validWords : wordList;
    const wordPair = finalWords[Math.floor(Math.random() * finalWords.length)];

    // ARE Logic
    const areScoresMap: Record<string, number> = {};
    players.forEach(p => {
        areScoresMap[p.id] = calculateAREWeight(p, history, currentRound);
    });

    let pool = shuffleArray([...players]);
    const selectedImpostors: Player[] = [];

    for (let i = 0; i < impostorCount; i++) {
        const weightedPool = pool.map(p => ({ player: p, weight: areScoresMap[p.id] }));
        const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
        let randomTicket = Math.random() * totalWeight;
        
        let selectedIndex = -1;
        for (let j = 0; j < weightedPool.length; j++) {
            randomTicket -= weightedPool[j].weight;
            if (randomTicket <= 0) {
                selectedIndex = j;
                break;
            }
        }
        if (selectedIndex === -1) selectedIndex = weightedPool.length - 1;

        const chosenOne = weightedPool[selectedIndex].player;
        selectedImpostors.push(chosenOne);
        pool = pool.filter(p => p.id !== chosenOne.id);
    }

    // Update Player Stats (Only in Normal Mode)
    const newPlayerStats = { ...history.playerStats };
    const newImpostorIds = selectedImpostors.map(p => p.id);

    players.forEach(p => {
        const currentStats = newPlayerStats[p.id] || { totalImpostorCount: 0, lastImpostorRound: -1 };
        if (newImpostorIds.includes(p.id)) {
            newPlayerStats[p.id] = {
                totalImpostorCount: currentStats.totalImpostorCount + 1,
                lastImpostorRound: currentRound
            };
        } else {
             newPlayerStats[p.id] = currentStats;
        }
    });
    
    const gamePlayers: GamePlayer[] = players.map(p => {
        const isImp = selectedImpostors.some(imp => imp.id === p.id);
        let displayWord = wordPair.civ;
        if (isImp) {
            displayWord = useHintMode ? `PISTA: ${wordPair.hint}` : "ERES EL IMPOSTOR";
        }

        return {
            id: p.id,
            name: p.name,
            role: isImp ? 'Impostor' : 'Civil',
            word: displayWord,
            realWord: wordPair.civ,
            isImp: isImp,
            category: catName,
            areScore: areScoresMap[p.id]
        };
    });

    const newHistoryWords = [wordPair.civ, ...history.lastWords].slice(0, 15);

    return { 
        players: gamePlayers, 
        isTrollEvent: false, 
        trollScenario: null,
        newHistory: {
            roundCounter: currentRound,
            lastWords: newHistoryWords,
            playerStats: newPlayerStats,
            lastTrollRound: history.lastTrollRound
        }
    };
};