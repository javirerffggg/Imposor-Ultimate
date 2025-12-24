import React, { useRef, useState, useEffect } from 'react';
import { GamePlayer, ThemeConfig } from '../types';
import { Fingerprint, Shield, Skull, Eye, Play, ArrowRight } from 'lucide-react';

interface Props {
    player: GamePlayer;
    theme: ThemeConfig;
    color: string;
    onRevealStart: () => void;
    onRevealEnd: () => void;
    nextAction: () => void;
    readyForNext: boolean;
    isLastPlayer: boolean;
}

export const IdentityCard: React.FC<Props> = ({ player, theme, color, onRevealStart, onRevealEnd, nextAction, readyForNext, isLastPlayer }) => {
    // Reveal States
    const [isHolding, setIsHolding] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    
    // Physics States
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    
    // Refs
    const cardRef = useRef<HTMLDivElement>(null);
    const holdTimer = useRef<number | null>(null); 
    const startPos = useRef({ x: 0, y: 0 });
    const isPointerDown = useRef(false);

    // Reset state when player changes
    useEffect(() => {
        setHasInteracted(false);
        setIsHolding(false);
        setDragPosition({ x: 0, y: 0 });
    }, [player.id]);

    // Haptic feedback
    const vibrate = (pattern: number[]) => {
        if (navigator.vibrate) navigator.vibrate(pattern);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault(); 
        e.stopPropagation();

        isPointerDown.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        setIsDragging(true); 
        
        // INSTANT REVEAL LOGIC
        setIsHolding(true);
        setHasInteracted(true);
        onRevealStart();
        
        // Immediate Haptics
        if (player.isImp) {
            vibrate([50, 30, 50]); 
        } else {
            vibrate([40]); 
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isPointerDown.current) return;
        e.preventDefault();

        const deltaX = e.clientX - startPos.current.x;
        const deltaY = e.clientY - startPos.current.y;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 20) {
            if (isHolding) {
                setIsHolding(false);
                onRevealEnd();
            }
        }

        // Apply elastic resistance
        // LOCK POSITION if holding (revealed) to prevent text jitter while reading
        if (isHolding) {
            setDragPosition({ x: 0, y: 0 });
        } else {
            const resistance = 0.4;
            setDragPosition({
                x: deltaX * resistance,
                y: deltaY * resistance
            });
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        e.preventDefault();
        isPointerDown.current = false;
        setIsDragging(false); 
        
        setDragPosition({ x: 0, y: 0 });

        if (isHolding) {
            setIsHolding(false);
            onRevealEnd();
        }
    };

    const getFontSize = (text: string) => {
        if (text.length > 15) return '1.5rem';
        if (text.length > 10) return '2.2rem';
        return '3rem';
    };

    const isButtonVisible = readyForNext && !isHolding && !isDragging && dragPosition.y === 0;

    return (
        <>
            <div 
                className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-in-out"
                style={{ 
                    background: `radial-gradient(circle at 50% 50%, ${color}40 0%, ${color}10 50%, transparent 80%)`,
                    zIndex: 0,
                    opacity: 0.8,
                    mixBlendMode: 'screen'
                }}
            />

            <div className="flex flex-col items-center gap-8 w-full max-w-sm z-10 relative">
                <div className="text-center space-y-1">
                    <p style={{ color: theme.sub }} className="text-xs font-black uppercase tracking-[0.3em]">Identidad</p>
                    <h2 style={{ color: color, fontFamily: theme.font }} className="text-4xl font-bold">{player.name}</h2>
                </div>

                <div 
                    ref={cardRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{ 
                        '--card-color': color,
                        '--card-shadow-weak': `${color}40`,
                        '--card-shadow-strong': `${color}80`,
                        
                        background: `linear-gradient(135deg, ${theme.cardBg} 0%, ${color}33 100%)`,
                        borderColor: isHolding ? color : theme.border,
                        borderRadius: theme.radius,
                        
                        boxShadow: isHolding ? `0 0 50px ${color}60` : '0 10px 30px rgba(0,0,0,0.5)',
                        
                        transition: isDragging 
                            ? 'none' 
                            : 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease, border-color 0.3s ease',
                        
                        // Removed scale(${isHolding ? 1.02 : 1}) to prevent text blur
                        transform: `translate3d(${dragPosition.x}px, ${dragPosition.y}px, 0) rotate(${dragPosition.x * 0.05}deg)`,
                        
                        animation: (!isHolding && !hasInteracted && !isDragging) ? 'breathe 4s ease-in-out infinite' : (isHolding ? 'reveal-pulse 2s infinite' : 'none'),
                        touchAction: 'none',
                        cursor: isDragging ? 'grabbing' : 'grab'
                    } as React.CSSProperties}
                    className="w-full aspect-[3/4] border-2 relative overflow-hidden select-none touch-none group will-change-transform"
                >
                    {theme.name === "007 Protocol" && (
                        <div 
                            className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-overlay"
                            style={{
                                background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.8) 45%, transparent 60%)',
                                backgroundSize: '200% 100%',
                                animation: 'metallic-shine 4s cubic-bezier(0.4, 0, 0.2, 1) infinite'
                            }}
                        />
                    )}

                    <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center transition-all duration-200 ${isHolding ? 'pb-32' : ''}`}>
                        
                        {!isHolding ? (
                            <div className="flex flex-col items-center gap-6 animate-pulse">
                                <div 
                                    className="w-24 h-24 rounded-full border-4 flex items-center justify-center transition-colors duration-300"
                                    style={{ borderColor: color }}
                                >
                                    <Fingerprint size={48} color={color} />
                                </div>
                                <p style={{ color: theme.sub }} className="text-xs font-black tracking-widest uppercase">
                                    Mantén pulsado para revelar
                                </p>
                            </div>
                        ) : (
                            // Removed animate-in zoom-in to prevent blur
                            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
                                {player.isImp ? (
                                    <div className="relative flex items-center justify-center mb-2 mt-2">
                                        {/* Aura Effects Impostor */}
                                        <div className="absolute w-28 h-28 bg-red-600/30 rounded-full blur-xl animate-pulse" />
                                        <div 
                                            className="absolute w-24 h-24 rounded-full border border-red-500/30 border-dashed opacity-60"
                                            style={{ animation: 'imp-aura-spin 8s linear infinite' }}
                                        />
                                        <div 
                                            className="absolute w-16 h-16 bg-red-500/20 rounded-full blur-md mix-blend-screen"
                                            style={{ animation: 'imp-aura-pulse 2s ease-in-out infinite' }}
                                        />
                                        <Skull 
                                            size={48} 
                                            className="text-red-500 relative z-10 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" 
                                        />
                                    </div>
                                ) : (
                                    <div className="relative flex items-center justify-center mb-2 mt-2">
                                        {/* Aura Effects Civil */}
                                        <div className="absolute w-28 h-28 bg-green-600/30 rounded-full blur-xl animate-pulse" />
                                        <div 
                                            className="absolute w-24 h-24 rounded-full border border-green-500/30 border-dashed opacity-60"
                                            style={{ animation: 'imp-aura-spin 12s linear infinite reverse' }}
                                        />
                                        <div 
                                            className="absolute w-16 h-16 bg-green-500/20 rounded-full blur-md mix-blend-screen"
                                            style={{ animation: 'imp-aura-pulse 3s ease-in-out infinite' }}
                                        />
                                        <Shield 
                                            size={48} 
                                            className="text-green-500 relative z-10 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" 
                                        />
                                    </div>
                                )}

                                <h3 
                                    className={`text-xl font-black uppercase tracking-widest ${player.isImp ? 'text-red-500' : 'text-green-500'}`}
                                >
                                    {player.role}
                                </h3>

                                <div className="w-full h-px bg-white/20 my-2" />

                                {!player.isImp && (
                                    <p style={{ color: theme.sub }} className="text-xs font-black uppercase tracking-[0.2em] mb-1">
                                        Categoría: {player.category}
                                    </p>
                                )}
                                
                                <p 
                                    style={{ 
                                        fontSize: getFontSize(player.word),
                                        color: theme.text,
                                        // Removed textShadow to eliminate blur effect
                                        // textShadow: `0 0 20px ${color}` 
                                    }}
                                    className="font-black leading-tight break-words uppercase"
                                >
                                    {player.word}
                                </p>

                                <p style={{ color: theme.sub }} className="text-[10px] mt-4 uppercase tracking-widest">
                                    Soltar para ocultar
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 opacity-50 transition-colors z-10" style={{ borderColor: isHolding ? color : theme.text }}/>
                    <div className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 opacity-50 transition-colors z-10" style={{ borderColor: isHolding ? color : theme.text }}/>
                    <div className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 opacity-50 transition-colors z-10" style={{ borderColor: isHolding ? color : theme.text }}/>
                    <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 opacity-50 transition-colors z-10" style={{ borderColor: isHolding ? color : theme.text }}/>
                </div>

                <div className="h-16 w-full flex items-center justify-center relative mt-4">
                    
                    {/* External pulse div removed from here */}

                    <button
                        onPointerDown={(e) => {
                            if (isButtonVisible) {
                                e.preventDefault();
                                e.stopPropagation();
                                if (navigator.vibrate) navigator.vibrate(20);
                                nextAction();
                            }
                        }}
                        disabled={!isButtonVisible}
                        style={{ 
                            backgroundColor: color,
                            opacity: isButtonVisible ? 1 : 0,
                            transform: isButtonVisible ? 'scale(1)' : 'scale(0.95)',
                            pointerEvents: isButtonVisible ? 'auto' : 'none',
                            touchAction: 'manipulation',
                            // Only apply static shadow if it's the start game button. 
                            // Otherwise, let the animation handle the shadow.
                            boxShadow: isLastPlayer && isButtonVisible ? `0 0 20px ${color}` : undefined,
                            animation: isButtonVisible 
                                ? (isLastPlayer ? 'none' : 'shadow-pulse 2s infinite ease-in-out') 
                                : 'none'
                        }}
                        className={`relative z-20 w-full max-w-xs py-3 px-6 font-bold text-white transition-all duration-100 flex items-center justify-center gap-2 rounded-full overflow-hidden transform-gpu
                        ${isLastPlayer ? 'active:scale-90' : 'active:scale-95'}`}
                    >
                         {/* Shimmer Effect for Last Player */}
                         {isLastPlayer && (
                            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-full">
                                <div 
                                    className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
                                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}
                                />
                            </div>
                         )}

                         <div className="absolute inset-[2px] rounded-full z-0" style={{ backgroundColor: color }} />
                         
                        <span className="relative z-10 tracking-widest">{isLastPlayer ? 'EMPEZAR PARTIDA' : 'SIGUIENTE JUGADOR'}</span>
                        {isLastPlayer ? <Play size={20} fill="currentColor" className="relative z-10"/> : <ArrowRight size={20} className="relative z-10"/>}
                    </button>
                </div>

                <style>{`
                    @keyframes scan {
                        0% { top: -10%; opacity: 0; }
                        10% { opacity: 1; }
                        90% { opacity: 1; }
                        100% { top: 110%; opacity: 0; }
                    }
                    @keyframes breathe {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                        100% { transform: scale(1); }
                    }
                    @keyframes reveal-pulse {
                        0% { box-shadow: 0 0 30px var(--card-shadow-weak); }
                        50% { box-shadow: 0 0 60px var(--card-shadow-strong), 0 0 100px var(--card-shadow-weak); }
                        100% { box-shadow: 0 0 30px var(--card-shadow-weak); }
                    }
                    @keyframes metallic-shine {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                    @keyframes imp-aura-spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes imp-aura-pulse {
                        0%, 100% { transform: scale(1); opacity: 0.5; }
                        50% { transform: scale(1.2); opacity: 0.8; }
                    }
                    @keyframes shimmer {
                        100% { transform: translateX(100%); }
                    }
                    @keyframes shadow-pulse {
                        0% { box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
                        50% { box-shadow: 0 12px 28px rgba(0,0,0,0.6); }
                        100% { box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
                    }
                `}</style>
            </div>
        </>
    );
};