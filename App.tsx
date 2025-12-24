import React, { useState, useEffect } from 'react';
import { Settings, Users, Ghost, Zap, Shuffle, RotateCcw, Monitor, ChevronRight, X, Check, ShieldAlert, Mic, LayoutGrid, CheckCheck, Eye, Lock, Fingerprint, Save, Trash2, Database } from 'lucide-react';
import { Background } from './components/Background';
import { IdentityCard } from './components/IdentityCard';
import { generateGameData } from './utils/gameLogic';
import { THEMES, DEFAULT_PLAYERS, PLAYER_COLORS } from './constants';
import { CATEGORIES_DATA } from './categories';
import { GameState, ThemeName, Player } from './types';

function App() {
    // -- State --
    // Diseño "andaluz" activado por defecto
    const [themeName, setThemeName] = useState<ThemeName>('illojuan');
    const theme = THEMES[themeName];
    
    const [gameState, setGameState] = useState<GameState>({
        phase: 'setup',
        players: DEFAULT_PLAYERS.map((name, i) => ({ id: i.toString(), name })),
        gameData: [],
        impostorCount: 1,
        currentPlayerIndex: 0,
        startingPlayer: "",
        isTrollEvent: false,
        history: { lastImpostorIds: [], lastWords: [] },
        settings: {
            hintMode: false,
            trollMode: false, // El modo troll no viene activado por defecto
            selectedCategories: []
        },
        theme: 'illojuan'
    });

    // -- Database State --
    const [savedPlayers, setSavedPlayers] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('impostor_saved_players');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [newPlayerName, setNewPlayerName] = useState("");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [categoriesOpen, setCategoriesOpen] = useState(false);
    const [hasSeenCurrentCard, setHasSeenCurrentCard] = useState(false);
    const [showResults, setShowResults] = useState(false); // Controls the "censored" overlay in results
    const [isExiting, setIsExiting] = useState(false); // Animation state for card slides
    const [isPixelating, setIsPixelating] = useState(false); // Animation state for reset dissolve
    
    // State for the "Hold to Reveal" button
    const [isHoldingReveal, setIsHoldingReveal] = useState(false);

    // -- Derived State for Aesthetics --
    const currentPlayerColor = PLAYER_COLORS[gameState.currentPlayerIndex % PLAYER_COLORS.length];

    // -- Effects --

    // Save players to local storage whenever list changes
    useEffect(() => {
        localStorage.setItem('impostor_saved_players', JSON.stringify(savedPlayers));
    }, [savedPlayers]);

    // Logic for Hold to Reveal in Results screen
    useEffect(() => {
        let timer: number;
        if (isHoldingReveal && !showResults) {
            timer = window.setTimeout(() => {
                setShowResults(true);
                setIsHoldingReveal(false);
                if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
            }, 800); // 800ms hold time
        }
        return () => clearTimeout(timer);
    }, [isHoldingReveal, showResults]);

    // -- Handlers --

    const startGame = () => {
        if (gameState.players.length < 3) return;

        const { players, isTrollEvent, newHistoryWords } = generateGameData({
            players: gameState.players,
            impostorCount: gameState.impostorCount,
            useHintMode: gameState.settings.hintMode,
            useTrollMode: gameState.settings.trollMode,
            selectedCats: gameState.settings.selectedCategories,
            history: gameState.history
        });

        // Determine starting player
        const startingPlayer = gameState.players[Math.floor(Math.random() * gameState.players.length)].name;

        // Save Impostors to history for weighted RNG next time
        const newImpostors = players.filter(p => p.isImp).map(p => p.id);

        setGameState(prev => ({
            ...prev,
            phase: 'revealing',
            gameData: players,
            isTrollEvent,
            currentPlayerIndex: 0,
            startingPlayer,
            history: {
                lastImpostorIds: newImpostors,
                lastWords: newHistoryWords
            }
        }));
        setHasSeenCurrentCard(false);
        setShowResults(false);
        setIsExiting(false);
        setIsHoldingReveal(false);
        setIsPixelating(false);
    };

    const handleNextPlayer = () => {
        if (isExiting) return; // Prevent double clicks during anim

        // Start exit animation
        setIsExiting(true);

        // Wait for animation to finish before changing state
        setTimeout(() => {
            if (gameState.currentPlayerIndex < gameState.players.length - 1) {
                setGameState(prev => ({ ...prev, currentPlayerIndex: prev.currentPlayerIndex + 1 }));
                setHasSeenCurrentCard(false);
            } else {
                setGameState(prev => ({ ...prev, phase: 'results' }));
            }
            // Reset exit state (this triggers the enter animation for the new component)
            setIsExiting(false);
        }, 300);
    };

    // Vuelve al menú de configuración
    const handleBackToSetup = () => {
        setIsPixelating(true);
        setTimeout(() => {
            setGameState(prev => ({...prev, phase: 'setup'}));
            setIsPixelating(false);
        }, 800);
    };

    // Reinicia la partida inmediatamente con la misma configuración
    const handleReplay = () => {
        setIsPixelating(true);
        setTimeout(() => {
            startGame();
            // isPixelating se pondrá a false dentro de startGame
        }, 800);
    };

    const addPlayer = (name: string = newPlayerName) => {
        if (!name.trim()) return;
        // Check duplicate in current game
        if (gameState.players.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) return;

        const newPlayer: Player = { id: Date.now().toString() + Math.random(), name: name.trim() };
        setGameState(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
        if (name === newPlayerName) setNewPlayerName("");
    };

    const removePlayer = (id: string) => {
        setGameState(prev => ({ ...prev, players: prev.players.filter(p => p.id !== id) }));
    };

    // -- Database Handlers --

    const saveToBank = () => {
        if (!newPlayerName.trim()) return;
        const name = newPlayerName.trim();
        if (!savedPlayers.includes(name)) {
            setSavedPlayers(prev => [...prev, name]);
        }
        setNewPlayerName("");
    };

    const deleteFromBank = (name: string) => {
        setSavedPlayers(prev => prev.filter(p => p !== name));
    };

    const toggleCategory = (cat: string) => {
        setGameState(prev => {
            const current = prev.settings.selectedCategories;
            const updated = current.includes(cat) 
                ? current.filter(c => c !== cat) 
                : [...current, cat];
            return { ...prev, settings: { ...prev.settings, selectedCategories: updated } };
        });
    };

    const toggleAllCategories = () => {
        const allCats = Object.keys(CATEGORIES_DATA);
        const currentCount = gameState.settings.selectedCategories.length;
        const allSelected = currentCount === allCats.length;

        setGameState(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                selectedCategories: allSelected ? [] : allCats
            }
        }));
    };

    // -- Renders --

    const renderSetup = () => {
        const isValidToStart = gameState.players.length >= 3;
        return (
            <div className={`flex flex-col h-full relative z-10 animate-in fade-in duration-500 pt-[env(safe-area-inset-top)] ${isPixelating ? 'animate-dissolve' : ''}`}>
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-48 space-y-6">
                    
                    {/* Header - Now inside scrollable area */}
                    <header className="pt-6 text-center space-y-2 mb-2">
                        <h1 style={{ color: theme.text, fontFamily: theme.font }} className="text-5xl font-black italic tracking-tighter">IMPOSTOR</h1>
                    </header>

                    {/* Players Section */}
                    <div 
                        style={{ 
                            backgroundColor: theme.cardBg, 
                            borderColor: theme.border, 
                            borderRadius: theme.radius,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }} 
                        className="p-5 border backdrop-blur-md"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 style={{ color: theme.sub }} className="text-xs font-black uppercase tracking-widest">Jugadores ({gameState.players.length})</h3>
                            <Users size={16} color={theme.accent} />
                        </div>
                        
                        {/* Active Players List */}
                        <div className="space-y-2 mb-4">
                            {gameState.players.map(p => (
                                <div key={p.id} style={{ backgroundColor: theme.border }} className="flex justify-between items-center p-3 rounded-lg animate-in slide-in-from-left duration-300">
                                    <span style={{ color: theme.text }} className="font-bold">{p.name}</span>
                                    <button onClick={() => removePlayer(p.id)} style={{ color: theme.sub }} className="hover:text-red-500 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="flex gap-2 mb-4">
                            <input 
                                value={newPlayerName}
                                onChange={(e) => setNewPlayerName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                                placeholder="Nuevo Jugador..."
                                className="flex-1 min-w-0 rounded-lg px-4 py-3 outline-none text-sm font-bold border border-transparent focus:border-white/30 transition-colors placeholder:text-inherit placeholder:opacity-40"
                                style={{ backgroundColor: theme.border, color: theme.text }}
                            />
                            {/* Save to Bank Button */}
                            <button 
                                onClick={saveToBank}
                                style={{ backgroundColor: theme.border, color: theme.sub }}
                                className="w-12 rounded-lg font-bold hover:bg-white/10 active:scale-90 transition-transform flex items-center justify-center shrink-0"
                                title="Guardar en banco"
                            >
                                <Save size={20} />
                            </button>
                            {/* Add to Game Button */}
                            <button 
                                onClick={() => addPlayer()}
                                style={{ backgroundColor: theme.accent }}
                                className="w-12 rounded-lg text-white font-bold active:scale-90 transition-transform shadow-lg flex items-center justify-center shrink-0"
                            >
                                <Check size={24} />
                            </button>
                        </div>

                        {/* Player Bank Section */}
                        {savedPlayers.length > 0 && (
                             <div className="mt-6 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Database size={12} color={theme.sub}/>
                                    <h4 style={{ color: theme.sub }} className="text-[10px] font-black uppercase tracking-widest">Banco de Agentes</h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {savedPlayers.map((name, idx) => {
                                        const isInGame = gameState.players.some(p => p.name === name);
                                        return (
                                            <div 
                                                key={idx}
                                                style={{ 
                                                    backgroundColor: isInGame ? theme.accent : theme.border,
                                                    opacity: isInGame ? 0.5 : 1,
                                                    borderColor: theme.border
                                                }}
                                                className="pl-3 pr-1 py-1.5 rounded-full border flex items-center gap-2 transition-all"
                                            >
                                                <button 
                                                    onClick={() => !isInGame && addPlayer(name)}
                                                    disabled={isInGame}
                                                    style={{ color: isInGame ? 'white' : theme.text }}
                                                    className="text-xs font-bold disabled:cursor-not-allowed"
                                                >
                                                    {name}
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteFromBank(name);
                                                    }}
                                                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10"
                                                    style={{ color: theme.sub }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                             </div>
                        )}
                    </div>

                    {/* Settings Section */}
                    <div 
                        style={{ 
                            backgroundColor: theme.cardBg, 
                            borderColor: theme.border, 
                            borderRadius: theme.radius,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }} 
                        className="p-5 border backdrop-blur-md space-y-6"
                    >
                        
                        {/* Impostor Count */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p style={{ color: theme.sub }} className="text-xs font-black uppercase tracking-widest">Impostores</p>
                            </div>
                            <div style={{ backgroundColor: theme.border }} className="flex items-center gap-4 rounded-lg p-1">
                                <button 
                                    onClick={() => setGameState(prev => ({...prev, impostorCount: Math.max(1, prev.impostorCount - 1)}))}
                                    style={{ color: theme.text }}
                                    className="w-8 h-8 flex items-center justify-center font-bold hover:opacity-70 active:scale-75 transition-transform rounded"
                                >-</button>
                                <span style={{ color: theme.text }} className="font-bold w-4 text-center">{gameState.impostorCount}</span>
                                <button 
                                    onClick={() => setGameState(prev => ({...prev, impostorCount: Math.min(gameState.players.length - 1, prev.impostorCount + 1)}))}
                                    style={{ color: theme.text }}
                                    className="w-8 h-8 flex items-center justify-center font-bold hover:opacity-70 active:scale-75 transition-transform rounded"
                                >+</button>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p style={{ color: theme.text }} className="text-sm font-bold">Modo Pista</p>
                                <p style={{ color: theme.sub }} className="text-[10px]">El impostor recibe una pista genérica</p>
                            </div>
                            <button 
                                onClick={() => setGameState(prev => ({...prev, settings: {...prev.settings, hintMode: !prev.settings.hintMode}}))}
                                style={{ backgroundColor: gameState.settings.hintMode ? theme.accent : theme.border }}
                                className="w-12 h-6 rounded-full relative transition-colors active:scale-90 transform-gpu"
                            >
                                <div className={`w-4 h-4 bg-white shadow-md rounded-full absolute top-1 transition-all ${gameState.settings.hintMode ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                             <div className="space-y-1">
                                <p style={{ color: theme.text }} className="text-sm font-bold flex items-center gap-2">
                                    Modo Troll <Ghost size={12}/>
                                </p>
                                <p style={{ color: theme.sub }} className="text-[10px]">15% prob. Caos Total</p>
                            </div>
                             <button 
                                onClick={() => setGameState(prev => ({...prev, settings: {...prev.settings, trollMode: !prev.settings.trollMode}}))}
                                style={{ backgroundColor: gameState.settings.trollMode ? theme.accent : theme.border }}
                                className="w-12 h-6 rounded-full relative transition-colors active:scale-90 transform-gpu"
                            >
                                <div className={`w-4 h-4 bg-white shadow-md rounded-full absolute top-1 transition-all ${gameState.settings.trollMode ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Categories Button */}
                    <button 
                        onClick={() => setCategoriesOpen(true)}
                        style={{ 
                            borderColor: theme.border, 
                            color: theme.text, 
                            backgroundColor: theme.cardBg, 
                            borderRadius: theme.radius,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        className="w-full py-4 border flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:opacity-80 active:scale-95 transition-all backdrop-blur-md transform-gpu"
                    >
                        <LayoutGrid size={16} /> Categorías de palabras
                    </button>

                    {/* Settings Drawer Button */}
                    <button 
                        onClick={() => setSettingsOpen(true)}
                        style={{ 
                            borderColor: theme.border, 
                            color: theme.sub,
                            backgroundColor: theme.border,
                            borderRadius: theme.radius,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        className="w-full py-4 border flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:opacity-80 active:scale-95 transition-all backdrop-blur-md transform-gpu"
                    >
                        <Settings size={16} /> Ajustes
                    </button>

                </div>

                {/* Start Button Container */}
                <div className="fixed bottom-0 left-0 w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-20 pointer-events-none flex justify-center items-center">
                    <div className="relative w-full max-w-xs group">
                        {/* AURA EFFECT - External Glow only */}
                        {isValidToStart && (
                            <>
                                {/* Deep Pulse Glow */}
                                <div
                                    className="absolute inset-1 rounded-full opacity-50 blur-xl"
                                    style={{
                                        backgroundColor: theme.accent,
                                        animation: 'aura-pulse 2s ease-in-out infinite'
                                    }}
                                />
                            </>
                        )}

                        <button 
                            onClick={startGame}
                            disabled={!isValidToStart}
                            style={{ 
                                backgroundColor: !isValidToStart ? 'gray' : theme.accent,
                                // Subtle border shadow for definition
                                boxShadow: '0 0 0 1px rgba(255,255,255,0.1)'
                            }}
                            className="w-full py-3.5 relative z-10 text-white font-black text-base active:scale-90 transition-all duration-100 flex items-center justify-center gap-3 pointer-events-auto rounded-full overflow-hidden transform-gpu"
                        >
                            {/* Internal Clean Shimmer */}
                            {isValidToStart && (
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]" 
                                     style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} 
                                />
                            )}
                            
                            <span className="relative z-10 flex items-center gap-3">
                                EMPEZAR PARTIDA <ChevronRight strokeWidth={4} size={20} />
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderReveal = () => {
        // Deterministic color based on player index
        // Using calculation from top scope for consistency, but redefined here for local variable clarity
        const cardColor = currentPlayerColor;
        const isLastPlayer = gameState.currentPlayerIndex === gameState.players.length - 1;

        // Aura Expansion Effect
        // Creates a massive explosion of the player's color when transition starts
        const auraExplosion = isExiting && (
            <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
                <div 
                    style={{
                        backgroundColor: cardColor,
                        animation: 'aura-expand 0.6s ease-out forwards',
                    }}
                    className="w-64 h-64 rounded-full blur-3xl opacity-80"
                />
            </div>
        );

        return (
            <div className="flex flex-col h-full items-center justify-center p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] relative z-10">
                {auraExplosion}
                
                <div 
                    key={gameState.currentPlayerIndex} // Key ensures remount on index change for entry anim
                    className={`w-full max-w-sm flex flex-col items-center ${isExiting ? 'card-exit' : 'card-enter'}`}
                >
                    <IdentityCard 
                        player={gameState.gameData[gameState.currentPlayerIndex]}
                        theme={theme}
                        color={cardColor}
                        onRevealStart={() => {}}
                        onRevealEnd={() => setHasSeenCurrentCard(true)}
                        nextAction={handleNextPlayer}
                        readyForNext={hasSeenCurrentCard}
                        isLastPlayer={isLastPlayer}
                    />
                </div>
                
                <div className="mt-auto mb-4 text-center opacity-50 space-y-2 shrink-0">
                     <p style={{ color: theme.sub }} className="text-[10px] uppercase tracking-widest">
                        Jugador {gameState.currentPlayerIndex + 1} de {gameState.players.length}
                    </p>
                    {/* Light Echo Indicator */}
                    <div className="flex gap-2 justify-center items-center h-4">
                        {gameState.players.map((_, i) => {
                            const isActive = i === gameState.currentPlayerIndex;
                            const isPast = i < gameState.currentPlayerIndex;
                            return (
                                <div 
                                    key={i} 
                                    style={{ 
                                        backgroundColor: isActive || isPast
                                            ? PLAYER_COLORS[i % PLAYER_COLORS.length] 
                                            : 'rgba(255,255,255,0.2)',
                                        animation: isActive ? 'echo-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none',
                                        boxShadow: isActive ? `0 0 10px ${PLAYER_COLORS[i % PLAYER_COLORS.length]}` : 'none'
                                    }}
                                    className={`rounded-full transition-all duration-500 ${isActive ? 'w-3 h-3' : 'w-1.5 h-1.5'}`}
                                />
                            );
                        })}
                    </div>
                </div>

                <style>{`
                    .card-enter {
                        animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                    .card-exit {
                        animation: slideOutLeft 0.3s cubic-bezier(0.7, 0, 0.84, 0) forwards;
                    }
                    
                    @keyframes slideInRight {
                        from { 
                            opacity: 0; 
                            transform: translateX(100px) scale(0.95) rotate(2deg);
                            filter: blur(4px);
                        }
                        to { 
                            opacity: 1; 
                            transform: translateX(0) scale(1) rotate(0deg);
                            filter: blur(0);
                        }
                    }
                    
                    @keyframes slideOutLeft {
                        from { 
                            opacity: 1; 
                            transform: translateX(0) scale(1) rotate(0deg);
                            filter: blur(0);
                        }
                        to { 
                            opacity: 0; 
                            transform: translateX(-100px) scale(0.95) rotate(-2deg);
                            filter: blur(4px);
                        }
                    }

                    /* Aura Expansion - Explodes from center */
                    @keyframes aura-expand {
                        0% { transform: scale(0.5); opacity: 0; }
                        30% { opacity: 0.6; }
                        100% { transform: scale(20); opacity: 0; }
                    }
                `}</style>
            </div>
        );
    };

    const renderResults = () => {
        // Logic for results
        const impostors = gameState.gameData.filter(p => p.isImp);
        const civilWord = gameState.gameData.find(p => !p.isImp)?.realWord ?? "ERROR";
        
        let impostorText = "";
        if (gameState.isTrollEvent) {
             impostorText = "¡TODOS ERAIS IMPOSTORES!";
        } else if (impostors.length === 1) {
             impostorText = `${impostors[0].name} era el impostor`;
        } else {
             const names = impostors.map(p => p.name);
             impostorText = names.length > 1 
                ? `${names.slice(0, -1).join(", ")} y ${names.slice(-1)} eran los impostores`
                : `${names[0]} era el impostor`;
        }

        const hintUsed = gameState.settings.hintMode && !gameState.isTrollEvent && impostors.length > 0
            ? impostors[0].word.replace("PISTA: ", "")
            : null;

        return (
            <div className={`flex flex-col h-full relative z-10 p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] animate-in slide-in-from-right duration-500 ${isPixelating ? 'animate-dissolve' : ''}`}>
                <header className="mb-4 text-center">
                    <h2 style={{ color: theme.text, fontFamily: theme.font }} className="text-4xl font-black italic">INFORME</h2>
                    {showResults && gameState.isTrollEvent && (
                        <p className="text-xs font-bold uppercase tracking-[0.4em] text-red-500 mt-2">
                            ¡EVENTO TROLL DETECTADO!
                        </p>
                    )}
                </header>

                {/* Starting Player Info - Redesigned */}
                <div 
                    style={{ 
                        backgroundColor: theme.cardBg, 
                        borderColor: theme.border, 
                        borderRadius: theme.radius,
                    }} 
                    className="mb-10 w-full max-w-sm border backdrop-blur-md relative overflow-hidden group shadow-lg"
                >
                    {/* Gradient Line at Top */}
                    <div className="absolute top-0 left-0 right-0 h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }} />

                    <div className="p-5 flex items-center gap-4">
                        {/* Avatar/Icon Placeholder */}
                        <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner relative"
                            style={{ backgroundColor: theme.bg, borderColor: theme.border, border: '1px solid' }}
                        >
                            {/* Subtle pulse */}
                            <div className="absolute inset-0 rounded-full animate-ping opacity-10" style={{ backgroundColor: theme.accent }} />
                            <Mic size={20} style={{ color: theme.accent }} />
                        </div>

                        <div className="flex flex-col">
                            <span style={{ color: theme.sub }} className="text-[10px] font-black uppercase tracking-widest mb-1">
                                Comienza a hablar
                            </span>
                            <span style={{ color: theme.text }} className="text-xl font-black leading-none break-all">
                                {gameState.startingPlayer}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center pb-32">
                    
                    {!showResults ? (
                        /* Locked State with Latent Suspense */
                        <div 
                            className="flex flex-col items-center gap-6 opacity-50"
                            style={{
                                animation: isHoldingReveal ? 'heartbeat 0.75s infinite ease-in-out' : 'pulse 3s infinite ease-in-out'
                            }}
                        >
                            <Lock 
                                size={64} 
                                style={{ 
                                    color: isHoldingReveal ? theme.accent : theme.sub,
                                    filter: isHoldingReveal ? `drop-shadow(0 0 10px ${theme.accent})` : 'none'
                                }} 
                            />
                            <p 
                                style={{ color: isHoldingReveal ? theme.text : theme.sub }} 
                                className="text-sm font-black uppercase tracking-widest text-center transition-colors duration-200"
                            >
                                EXPEDIENTE CLASIFICADO<br/>
                                <span className="text-[10px] opacity-70">Mantén para desclasificar</span>
                            </p>
                        </div>
                    ) : (
                        /* Revealed State - Summary Card */
                        <div 
                            style={{ 
                                backgroundColor: theme.cardBg, 
                                borderColor: gameState.isTrollEvent ? '#ef4444' : theme.accent,
                                borderRadius: theme.radius,
                                boxShadow: `0 0 40px ${gameState.isTrollEvent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,0,0,0.2)'}`
                            }} 
                            className="w-full max-w-sm border-2 p-8 flex flex-col items-center text-center backdrop-blur-xl animate-in zoom-in duration-300"
                        >
                            {/* The Word */}
                            <div className="mb-8 w-full">
                                <p style={{ color: theme.sub }} className="text-[10px] font-black uppercase tracking-widest mb-2">La palabra era</p>
                                <p style={{ color: theme.text, fontFamily: theme.font }} className="text-4xl font-black break-words uppercase leading-tight">
                                    {gameState.isTrollEvent ? "CAOS" : civilWord}
                                </p>
                            </div>

                            <div className="w-full h-px bg-white/10 mb-8" />

                            {/* The Impostor(s) */}
                            <div className="w-full">
                                <p style={{ color: gameState.isTrollEvent ? '#ef4444' : theme.accent }} className="text-[10px] font-black uppercase tracking-widest mb-2">
                                    Identidad Confirmada
                                </p>
                                <p style={{ color: theme.text }} className="text-lg font-bold leading-snug">
                                    {impostorText}
                                </p>
                            </div>

                            {/* Optional Hint Display */}
                            {hintUsed && (
                                <div className="mt-8 pt-6 border-t border-white/10 w-full animate-in fade-in slide-in-from-bottom-4 delay-150 fill-mode-forwards">
                                    <p style={{ color: theme.sub }} className="text-[10px] font-black uppercase tracking-widest mb-1">
                                        Pista Revelada
                                    </p>
                                    <p style={{ color: theme.text }} className="text-sm font-mono italic opacity-80">
                                        "{hintUsed}"
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="fixed bottom-0 left-0 w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-30 pointer-events-none space-y-3 flex flex-col items-center">
                    {!showResults && (
                        <button 
                            onPointerDown={() => setIsHoldingReveal(true)}
                            onPointerUp={() => setIsHoldingReveal(false)}
                            onPointerLeave={() => setIsHoldingReveal(false)}
                            className="w-full max-w-xs h-14 bg-white text-black font-black uppercase tracking-widest active:scale-95 transition-transform pointer-events-auto rounded-full shadow-lg relative overflow-hidden flex items-center justify-center gap-2 select-none touch-none transform-gpu"
                        >
                            {/* Progress Fill */}
                            <div 
                                className={`absolute left-0 top-0 bottom-0 bg-black/10 transition-all ease-linear`}
                                style={{ 
                                    width: isHoldingReveal ? '100%' : '0%',
                                    transitionDuration: isHoldingReveal ? '800ms' : '0ms',
                                    filter: isHoldingReveal ? 'blur(2px) brightness(2)' : 'none',
                                    backgroundColor: isHoldingReveal ? theme.accent : 'rgba(0,0,0,0.1)'
                                }}
                            />
                            <Eye size={18} className="relative z-10" />
                            <span className="relative z-10">MANTENER PARA REVELAR</span>
                        </button>
                    )}

                    <div className="grid grid-cols-2 gap-3 w-full max-w-xs pointer-events-auto">
                        <button 
                            onClick={handleReplay}
                            style={{ 
                                backgroundColor: showResults ? theme.accent : theme.cardBg, 
                                color: showResults ? 'white' : theme.text,
                                borderColor: theme.border
                            }}
                            className={`relative overflow-hidden w-full py-4 font-black uppercase tracking-wide active:scale-90 transition-all flex items-center justify-center gap-2 rounded-2xl shadow-lg border ${!showResults && 'backdrop-blur-md'} transform-gpu`}
                        >
                            {/* Inner Bg Mask */}
                            <div className="absolute inset-[1px] rounded-[15px] z-0" style={{ backgroundColor: showResults ? theme.accent : theme.cardBg }} />

                            <span className="relative z-10 flex items-center gap-2"><RotateCcw size={16} /> <span className="text-[10px]">Volver a Jugar</span></span>
                        </button>
                        
                        <button 
                            onClick={handleBackToSetup}
                            style={{ 
                                backgroundColor: theme.cardBg,
                                borderColor: theme.border, 
                                color: theme.sub 
                            }}
                            className="w-full py-4 border font-bold uppercase tracking-wide text-[10px] hover:text-opacity-100 hover:bg-white/5 active:scale-90 transition-all flex items-center justify-center gap-2 rounded-2xl backdrop-blur-md shadow-lg transform-gpu"
                        >
                            <Settings size={16} /> Configuración
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderDrawer = () => (
        <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ${settingsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
            <div style={{ backgroundColor: theme.bg }} className="absolute right-0 h-full w-80 shadow-2xl p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto flex flex-col border-l border-white/10">
                <div className="flex justify-between items-center mb-8">
                    <h2 style={{ color: theme.text }} className="text-2xl font-black italic">Ajustes</h2>
                    <button style={{ color: theme.text }} onClick={() => setSettingsOpen(false)}><X /></button>
                </div>

                {/* Theme Selector */}
                <div className="flex-1">
                    <h3 style={{ color: theme.sub }} className="text-xs font-black uppercase tracking-widest mb-4">Interfaz Visual</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {(Object.keys(THEMES) as ThemeName[]).map(t => (
                            <button 
                                key={t}
                                onClick={() => setThemeName(t)}
                                style={{ 
                                    backgroundColor: themeName === t ? THEMES[t].accent : THEMES[t].border,
                                    borderColor: THEMES[t].accent 
                                }}
                                className={`p-3 rounded border text-xs font-bold text-left transition-all ${themeName === t ? 'text-white' : 'border-transparent'}`}
                            >
                                <span style={{ color: themeName === t ? 'white' : theme.text }}>{THEMES[t].name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Version Badge */}
                <div className="mt-auto pt-6 border-t border-white/10 text-center">
                    <p style={{ color: theme.sub }} className="text-[10px] font-mono opacity-50">v2.0.1 PRO ULTRA</p>
                </div>
            </div>
        </div>
    );

    const renderCategories = () => {
        const allCats = Object.keys(CATEGORIES_DATA);
        const selected = gameState.settings.selectedCategories;
        const isNoneSelected = selected.length === 0;

        return (
            <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ${categoriesOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <div style={{ backgroundColor: theme.bg }} className="absolute inset-0 flex flex-col">
                    <div className="p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] flex items-center justify-between border-b border-white/10 shrink-0 bg-inherit z-10">
                        <h2 style={{ color: theme.text }} className="text-2xl font-black italic">Categorías</h2>
                        <button style={{ color: theme.text }} onClick={() => setCategoriesOpen(false)}><X /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="mb-6">
                             <button 
                                onClick={toggleAllCategories}
                                style={{ 
                                    borderColor: theme.accent, 
                                    color: theme.accent,
                                    backgroundColor: theme.cardBg 
                                }}
                                className="w-full py-4 border rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 backdrop-blur-md transition-all active:scale-95 transform-gpu"
                            >
                                <CheckCheck size={16} />
                                {selected.length === allCats.length ? 'Resetear (Todas Activas)' : 'Seleccionar Todo'}
                            </button>
                            {isNoneSelected && (
                                <p style={{ color: theme.sub }} className="text-center text-[10px] mt-2 font-bold uppercase tracking-widest opacity-70">
                                    Todas las categorías están activas por defecto
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 pb-32">
                            {allCats.map(cat => {
                                const isActive = selected.includes(cat);
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        style={{ 
                                            backgroundColor: isActive ? theme.accent : 'transparent',
                                            borderColor: isActive ? theme.accent : theme.border,
                                            color: isActive ? '#fff' : theme.text,
                                            boxShadow: isActive ? `0 4px 12px ${theme.accent}40` : 'none'
                                        }}
                                        className="p-4 rounded-xl border font-bold text-left flex justify-between items-center transition-all active:scale-95 backdrop-blur-sm transform-gpu"
                                    >
                                        <span className="opacity-90 text-sm uppercase tracking-wide">{cat}</span>
                                        {isActive && <Check size={18} strokeWidth={3} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ backgroundColor: theme.bg, color: theme.text }} className="w-full h-full relative overflow-hidden transition-colors duration-700">
            <Background theme={theme} phase={gameState.phase} isTroll={gameState.isTrollEvent} activeColor={currentPlayerColor} />
            
            {gameState.phase === 'setup' && renderSetup()}
            {gameState.phase === 'revealing' && renderReveal()}
            {gameState.phase === 'results' && renderResults()}
            
            {renderDrawer()}
            {renderCategories()}
            
            {/* Global Keyframes for new effects */}
            <style>{`
                @keyframes particle-flow {
                    0% { background-position: 0 0; }
                    100% { background-position: 20px 20px; }
                }
                @keyframes echo-pulse {
                    0% { box-shadow: 0 0 0 0px currentColor; opacity: 1; transform: scale(1.2); }
                    70% { box-shadow: 0 0 0 10px transparent; opacity: 1; transform: scale(1); }
                    100% { box-shadow: 0 0 0 0 transparent; opacity: 1; transform: scale(1); }
                }
                @keyframes heartbeat {
                    0% { transform: scale(1); text-shadow: 0 0 0 transparent; }
                    15% { transform: scale(1.1); text-shadow: 0 0 20px currentColor; }
                    30% { transform: scale(1); text-shadow: 0 0 10px currentColor; }
                    45% { transform: scale(1.1); text-shadow: 0 0 20px currentColor; }
                    60% { transform: scale(1); text-shadow: 0 0 0 transparent; }
                }
                @keyframes dissolve {
                    0% { filter: blur(0px) brightness(1); opacity: 1; transform: scale(1); }
                    50% { filter: blur(4px) brightness(1.5); opacity: 0.8; transform: scale(1.02); }
                    100% { filter: blur(20px) brightness(5); opacity: 0; transform: scale(1.1); }
                }
                .animate-dissolve {
                    animation: dissolve 0.8s cubic-bezier(0.7, 0, 0.84, 0) forwards;
                }
                
                /* Aura Button Effects */
                @keyframes aura-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes aura-pulse {
                    0%, 100% { transform: scale(0.95); opacity: 0.5; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}

export default App;