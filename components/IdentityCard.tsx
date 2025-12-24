import React, { useRef, useState, useEffect } from 'react';
import { GamePlayer, ThemeConfig } from '../types';
import { Fingerprint, Shield, Skull, Eye } from 'lucide-react';

interface Props {
    player: GamePlayer;
    theme: ThemeConfig;
    onRevealStart: () => void;
    onRevealEnd: () => void;
    nextAction: () => void;
    readyForNext: boolean;
}

export const IdentityCard: React.FC<Props> = ({ player, theme, onRevealStart, onRevealEnd, nextAction, readyForNext }) => {
    const [isHolding, setIsHolding] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const holdTimer = useRef<number | null>(null);

    // Reset state when player changes (Fix for animation only working on first player)
    useEffect(() => {
        setHasInteracted(false);
        setIsHolding(false);
    }, [player.id]);

    // Haptic feedback
    const vibrate = (pattern: number[]) => {
        if (navigator.vibrate) navigator.vibrate(pattern);
    };

    const handlePointerDown = () => {
        // Removed the check for readyForNext so users can re-check their role if needed
        setIsHolding(true);
        setHasInteracted(true);
        onRevealStart();
        
        // Short vibe on touch
        vibrate([50]);
        
        // Delayed vibe for role reveal
        holdTimer.current = window.setTimeout(() => {
            if (player.isImp) {
                vibrate([100, 50, 200, 50, 200]);
            } else {
                vibrate([50]);
            }
        }, 300);
    };

    const handlePointerUp = () => {
        setIsHolding(false);
        onRevealEnd();
        if (holdTimer.current) {
            clearTimeout(holdTimer.current);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Subtle tilt effect
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        
        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHolding ? 1.02 : 1})`;
    };

    const resetTilt = () => {
        if (cardRef.current) {
            // If animation should be active, clear transform so CSS animation can take over
            if (!hasInteracted && !isHolding) {
                cardRef.current.style.transform = '';
            } else {
                cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
            }
        }
        handlePointerUp();
    };

    // Smart font scaling
    const getFontSize = (text: string) => {
        if (text.length > 15) return '1.5rem';
        if (text.length > 10) return '2.2rem';
        return '3rem';
    };

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-sm z-10">
            {/* Header */}
            <div className="text-center space-y-1">
                <p style={{ color: theme.sub }} className="text-xs font-black uppercase tracking-[0.3em]">Identidad</p>
                <h2 style={{ color: theme.text, fontFamily: theme.font }} className="text-4xl font-bold">{player.name}</h2>
            </div>

            {/* The Card */}
            <div 
                ref={cardRef}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={resetTilt}
                onMouseMove={handleMouseMove}
                style={{ 
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                    borderRadius: theme.radius,
                    boxShadow: isHolding ? `0 0 50px ${theme.accent}40` : '0 10px 30px rgba(0,0,0,0.5)',
                    transition: 'transform 0.1s ease-out, box-shadow 0.3s ease',
                    animation: (!isHolding && !hasInteracted) ? 'breathe 4s ease-in-out infinite' : 'none'
                }}
                className="w-full aspect-[3/4] border-2 relative overflow-hidden cursor-pointer select-none touch-none"
            >
                {/* Scanner Effect */}
                {isHolding && (
                    <div 
                        className="absolute w-full h-2 z-20 shadow-[0_0_20px_currentColor]"
                        style={{ 
                            backgroundColor: theme.accent, 
                            color: theme.accent,
                            animation: 'scan 1.5s linear infinite'
                        }}
                    />
                )}

                {/* Content Container */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    
                    {!isHolding ? (
                        /* Front / Idle State */
                        <div className="flex flex-col items-center gap-6 animate-pulse">
                            <div 
                                className="w-24 h-24 rounded-full border-4 flex items-center justify-center"
                                style={{ borderColor: theme.accent }}
                            >
                                <Fingerprint size={48} color={theme.accent} />
                            </div>
                            <p style={{ color: theme.sub }} className="text-xs font-black tracking-widest uppercase">
                                Mantén pulsado para revelar tu rol
                            </p>
                        </div>
                    ) : (
                        /* Back / Revealed State */
                        <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-200">
                             {/* Role Icon */}
                            {player.isImp ? (
                                <Skull size={48} className="text-red-500 mb-2" />
                            ) : (
                                <Shield size={48} className="text-green-500 mb-2" />
                            )}

                            {/* Role Name */}
                            <h3 
                                className={`text-xl font-black uppercase tracking-widest ${player.isImp ? 'text-red-500' : 'text-green-500'}`}
                            >
                                {player.role}
                            </h3>

                            {/* Secret Word */}
                            <div className="w-full h-px bg-white/20 my-2" />

                            {/* Show Category ONLY if not impostor */}
                            {!player.isImp && (
                                <p style={{ color: theme.sub }} className="text-xs font-black uppercase tracking-[0.2em] mb-1">
                                    Categoría: {player.category}
                                </p>
                            )}
                            
                            <p 
                                style={{ 
                                    fontSize: getFontSize(player.word),
                                    color: theme.text,
                                    textShadow: `0 0 20px ${theme.accent}`
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

                {/* Decorative corners */}
                <div className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 opacity-50" style={{ borderColor: theme.text }}/>
                <div className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 opacity-50" style={{ borderColor: theme.text }}/>
                <div className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 opacity-50" style={{ borderColor: theme.text }}/>
                <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 opacity-50" style={{ borderColor: theme.text }}/>
            </div>

            {/* Next Button */}
            <div className="h-16 w-full flex items-center justify-center">
                {readyForNext && !isHolding && (
                    <button
                        onClick={nextAction}
                        style={{ backgroundColor: theme.accent }}
                        className="w-full max-w-xs py-3 px-6 font-bold text-white shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 rounded-full"
                    >
                        <span>SIGUIENTE JUGADOR</span>
                        <Eye size={20} />
                    </button>
                )}
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
            `}</style>
        </div>
    );
};