import React, { useState, useEffect } from 'react';
import { Settings, Users, Ghost, Zap, Shuffle, RotateCcw, Monitor, ChevronRight, X, Check, ShieldAlert, Mic, LayoutGrid, CheckCheck } from 'lucide-react';
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

    const [newPlayerName, setNewPlayerName] = useState("");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [categoriesOpen, setCategoriesOpen] = useState(false);
    const [hasSeenCurrentCard, setHasSeenCurrentCard] = useState(false);
    const [showResults, setShowResults] = useState(false); // Controls the "censored" overlay in results
    const [isExiting, setIsExiting] = useState(false); // Animation state

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

    const addPlayer = () => {
        if (!newPlayerName.trim()) return;
        const newPlayer: Player = { id: Date.now().toString(), name: newPlayerName.trim() };
        setGameState(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
        setNewPlayerName("");
    };

    const removePlayer = (id: string) => {
        setGameState(prev => ({ ...prev, players: prev.players.filter(p => p.id !== id) }));
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

    const renderSetup = () => (
        <div className="flex flex-col h-full relative z-10 animate-in fade-in duration-500 pt-[env(safe-area-inset-top)]">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-48 space-y-6">
                
                {/* Header - Now inside scrollable area */}
                <header className="pt-6 text-center space-y-2 mb-2">
                    <h1 style={{ color: theme.text, fontFamily: theme.font }} className="text-5xl font-black italic tracking-tighter">IMPOSTOR</h1>
                </header>

                {/* Players Section */}
                <div style={{ backgroundColor: theme.cardBg, borderColor: theme.border, borderRadius: theme.radius }} className="p-5 border backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 style={{ color: theme.sub }} className="text-xs font-black uppercase tracking-widest">Agentes ({gameState.players.length})</h3>
                        <Users size={16} color={theme.accent} />
                    </div>
                    <div className="space-y-2 mb-4">
                        {gameState.players.map(p => (
                            <div key={p.id} style={{ backgroundColor: theme.border }} className="flex justify-between items-center p-3 rounded-lg">
                                <span style={{ color: theme.text }} className="font-bold">{p.name}</span>
                                <button onClick={() => removePlayer(p.id)} style={{ color: theme.sub }} className="hover:text-red-500 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                            placeholder="Nuevo Agente..."
                            className="flex-1 rounded-lg px-4 py-3 outline-none text-sm font-bold border border-transparent focus:border-white/30 transition-colors placeholder:text-inherit placeholder:opacity-40"
                            style={{ backgroundColor: theme.border, color: theme.text }}
                        />
                        <button 
                            onClick={addPlayer}
                            style={{ backgroundColor: theme.accent }}
                            className="px-4 rounded-lg text-white font-bold"
                        >
                            <Check />
                        </button>
                    </div>
                </div>

                {/* Settings Section */}
                <div style={{ backgroundColor: theme.cardBg, borderColor: theme.border, borderRadius: theme.radius }} className="p-5 border backdrop-blur-md space-y-6">
                    
                    {/* Impostor Count */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p style={{ color: theme.sub }} className="text-xs font-black uppercase tracking-widest">Impostores</p>
                        </div>
                        <div style={{ backgroundColor: theme.border }} className="flex items-center gap-4 rounded-lg p-1">
                            <button 
                                onClick={() => setGameState(prev => ({...prev, impostorCount: Math.max(1, prev.impostorCount - 1)}))}
                                style={{ color: theme.text }}
                                className="w-8 h-8 flex items-center justify-center font-bold hover:opacity-70 rounded"
                            >-</button>
                            <span style={{ color: theme.text }} className="font-bold w-4 text-center">{gameState.impostorCount}</span>
                            <button 
                                onClick={() => setGameState(prev => ({...prev, impostorCount: Math.min(gameState.players.length - 1, prev.impostorCount + 1)}))}
                                style={{ color: theme.text }}
                                className="w-8 h-8 flex items-center justify-center font-bold hover:opacity-70 rounded"
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
                            className="w-12 h-6 rounded-full relative transition-colors"
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
                            className="w-12 h-6 rounded-full relative transition-colors"
                        >
                            <div className={`w-4 h-4 bg-white shadow-md rounded-full absolute top-1 transition-all ${gameState.settings.trollMode ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Categories Button */}
                <button 
                    onClick={() => setCategoriesOpen(true)}
                    style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.cardBg }}
                    className="w-full py-4 border rounded-lg flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:opacity-80 transition-all backdrop-blur-md"
                >
                    <LayoutGrid size={16} /> Banco de Datos
                </button>

                {/* Settings Drawer Button */}
                <button 
                    onClick={() => setSettingsOpen(true)}
                    style={{ borderColor: theme.border, color: theme.sub }}
                    className="w-full py-4 border rounded-lg flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:opacity-50 transition-all"
                >
                    <Settings size={16} /> Ajustes
                </button>

            </div>

            {/* Start Button */}
            <div className="fixed bottom-0 left-0 w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-20 pointer-events-none flex justify-center">
                <button 
                    onClick={startGame}
                    disabled={gameState.players.length < 3}
                    style={{ 
                        backgroundColor: gameState.players.length < 3 ? 'gray' : theme.accent, 
                    }}
                    className="w-full max-w-xs py-3.5 text-white font-black text-base active:scale-95 transition-transform flex items-center justify-center gap-3 pointer-events-auto shadow-none rounded-full shadow-lg"
                >
                    INICIAR MISIÓN <ChevronRight strokeWidth={4} size={20} />
                </button>
            </div>
        </div>
    );

    const renderReveal = () => {
        // Deterministic color based on player index
        const cardColor = PLAYER_COLORS[gameState.currentPlayerIndex % PLAYER_COLORS.length];
        const isLastPlayer = gameState.currentPlayerIndex === gameState.players.length - 1;

        return (
            <div className="flex flex-col h-full items-center justify-center p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] relative z-10 overflow-hidden">
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
                    <div className="flex gap-1 justify-center">
                        {gameState.players.map((_, i) => (
                            <div 
                                key={i} 
                                style={{ 
                                    backgroundColor: i <= gameState.currentPlayerIndex 
                                        ? PLAYER_COLORS[i % PLAYER_COLORS.length] 
                                        : 'rgba(255,255,255,0.2)' 
                                }}
                                className={`w-2 h-2 rounded-full transition-colors`}
                            />
                        ))}
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
                `}</style>
            </div>
        );
    };

    const renderResults = () => (
        <div className="flex flex-col h-full relative z-10 p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] animate-in slide-in-from-right duration-500">
             <header className="mb-8">
                <h2 style={{ color: theme.text, fontFamily: theme.font }} className="text-4xl font-black italic">INFORME</h2>
                <p style={{ color: showResults ? (gameState.isTrollEvent ? '#ef4444' : theme.accent) : theme.sub }} className="text-xs font-bold uppercase tracking-[0.4em]">
                    {showResults && gameState.isTrollEvent ? '¡EVENTO TROLL DETECTADO!' : 'Estado de la Misión'}
                </p>
            </header>

            {/* Starting Player Info Container */}
            <div 
                style={{ 
                    backgroundColor: theme.cardBg, 
                    borderColor: theme.border,
                    borderRadius: theme.radius
                }} 
                className="mb-6 border p-4 flex items-center gap-4 backdrop-blur-md shadow-sm"
            >
                <div 
                    style={{ backgroundColor: theme.accent }} 
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                >
                    <Mic size={20} className="text-white" />
                </div>
                <div>
                    <p style={{ color: theme.sub }} className="text-[10px] font-black uppercase tracking-widest mb-0.5">
                        Turno Inicial
                    </p>
                    <p style={{ color: theme.text }} className="font-bold text-lg leading-tight">
                        Comienza a hablar <span className="italic">{gameState.startingPlayer}</span>
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-[calc(6rem+env(safe-area-inset-bottom))]">
                {gameState.gameData.map((p, i) => (
                    <div 
                        key={i} 
                        style={{ backgroundColor: theme.cardBg, borderRadius: theme.radius }}
                        className="p-4 flex justify-between items-center backdrop-blur-sm"
                    >
                        <div>
                            <p style={{ color: showResults ? (p.isImp ? '#ef4444' : '#22c55e') : theme.sub }} className="text-[9px] font-black uppercase tracking-widest mb-1">
                                {showResults ? p.role : 'CLASIFICADO'}
                            </p>
                            <p style={{ color: theme.text }} className="font-bold text-lg">{p.name}</p>
                        </div>
                        <div className="text-right">
                             {showResults ? (
                                <span style={{ color: theme.text }} className="font-bold opacity-80">{p.realWord}</span>
                             ) : (
                                 <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
                             )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="fixed bottom-0 left-0 w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-30 pointer-events-none space-y-3 flex flex-col items-center">
                {!showResults ? (
                    <button 
                        onClick={() => setShowResults(true)}
                        className="w-full max-w-xs py-3.5 bg-white text-black font-black uppercase tracking-widest active:scale-95 transition-transform pointer-events-auto rounded-full shadow-lg"
                    >
                        Revelar Identidades
                    </button>
                ) : (
                    <>
                        <button 
                            onClick={startGame}
                            style={{ 
                                backgroundColor: theme.accent, 
                            }}
                            className="w-full max-w-xs py-3.5 text-white font-black uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 pointer-events-auto rounded-full shadow-lg"
                        >
                            <RotateCcw size={18} /> Volver a Jugar
                        </button>
                        <button 
                            onClick={() => setGameState(prev => ({...prev, phase: 'setup'}))}
                            style={{ borderColor: theme.border, color: theme.sub }}
                            className="w-full max-w-xs py-3 border font-bold uppercase text-[10px] hover:text-opacity-100 opacity-80 transition-all pointer-events-auto rounded-full"
                        >
                            Cambiar Configuración
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    const renderCategories = () => {
        const allCats = Object.keys(CATEGORIES_DATA);
        const selectedCount = gameState.settings.selectedCategories.length;
        const allSelected = selectedCount === allCats.length;

        return (
             <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ${categoriesOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setCategoriesOpen(false)} />
                <div style={{ backgroundColor: theme.bg }} className="absolute right-0 h-full w-full md:w-96 shadow-2xl p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto flex flex-col border-l border-white/10">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 style={{ color: theme.text }} className="text-2xl font-black italic">Categorías</h2>
                            <p style={{ color: theme.sub }} className="text-xs font-bold">{selectedCount > 0 ? selectedCount : 'Todas'} seleccionadas</p>
                        </div>
                        <button style={{ color: theme.text }} onClick={() => setCategoriesOpen(false)}><X /></button>
                    </div>

                    {/* Toggle All Button */}
                    <button 
                        onClick={toggleAllCategories}
                        style={{ borderColor: theme.border, color: theme.accent }}
                        className="w-full py-3 border rounded-lg flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest mb-6 hover:bg-white/5 transition-all"
                    >
                        <CheckCheck size={16} /> {allSelected ? "Deseleccionar Todas" : "Seleccionar Todas"}
                    </button>

                    {/* List */}
                    <div className="space-y-2 pb-12">
                         {allCats.map(cat => {
                             const isSelected = gameState.settings.selectedCategories.includes(cat);
                             return (
                                <button 
                                    key={cat}
                                    onClick={() => toggleCategory(cat)}
                                    style={{ backgroundColor: isSelected ? theme.accent : theme.border }}
                                    className={`w-full flex justify-between items-center p-3 rounded-lg text-sm font-bold transition-all active:scale-[0.98]`}
                                >
                                    <span style={{ color: isSelected ? 'white' : theme.text }}>{cat}</span>
                                    {isSelected && <Check size={14} color="white" />}
                                </button>
                             );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderDrawer = () => (
        <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ${settingsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
            <div style={{ backgroundColor: theme.bg }} className="absolute right-0 h-full w-80 shadow-2xl p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto flex flex-col gap-8 border-l border-white/10">
                <div className="flex justify-between items-center">
                    <h2 style={{ color: theme.text }} className="text-2xl font-black italic">Ajustes</h2>
                    <button style={{ color: theme.text }} onClick={() => setSettingsOpen(false)}><X /></button>
                </div>

                {/* Theme Selector */}
                <div>
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
            </div>
        </div>
    );

    return (
        <div style={{ backgroundColor: theme.bg, color: theme.text }} className="w-full h-full relative overflow-hidden transition-colors duration-700">
            <Background theme={theme} />
            
            {gameState.phase === 'setup' && renderSetup()}
            {gameState.phase === 'revealing' && renderReveal()}
            {gameState.phase === 'results' && renderResults()}
            
            {renderDrawer()}
            {renderCategories()}
        </div>
    );
}

export default App;