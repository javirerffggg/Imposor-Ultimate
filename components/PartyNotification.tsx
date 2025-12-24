import React, { useEffect } from 'react';
import { Beer } from 'lucide-react';
import { ThemeConfig } from '../types';

interface Props {
    prompt: string;
    theme: ThemeConfig;
}

export const PartyNotification: React.FC<Props> = ({ prompt, theme }) => {
    
    // Text-to-Speech Effect
    useEffect(() => {
        if (!prompt) return;

        // Cancel previous utterances to avoid queue buildup
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(prompt);
        utterance.lang = 'es-ES'; // Spanish Spain
        utterance.rate = 1.1; // Slightly faster for energy
        utterance.pitch = 1.0;
        
        // Find a Spanish voice if available
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(v => v.lang.includes('es-ES') || v.lang.includes('es'));
        if (spanishVoice) utterance.voice = spanishVoice;

        window.speechSynthesis.speak(utterance);

    }, [prompt]);

    if (!prompt) return null;

    return (
        <div className="w-full max-w-sm relative group animate-party-pop">
            {/* Dynamic Border Container */}
            <div 
                className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
                style={{ borderRadius: theme.radius }}
            >
                <svg className="absolute inset-0 w-full h-full">
                    <rect 
                        x="1" y="1" 
                        width="99%" height="99%" 
                        rx={parseFloat(theme.radius) * 16 || 10} 
                        ry={parseFloat(theme.radius) * 16 || 10}
                        fill="none" 
                        stroke={theme.accent} 
                        strokeWidth="3"
                        strokeDasharray="400% 400%" // Large enough to cover perimeter
                        strokeDashoffset="400%" // Start hidden
                        className="animate-border-fill"
                    />
                </svg>
            </div>

            {/* Background & Content */}
            <div 
                className="p-6 border-2 border-dashed relative overflow-hidden backdrop-blur-md"
                style={{ 
                    borderColor: `${theme.accent}40`, // Dim base border
                    borderRadius: theme.radius,
                    backgroundColor: 'rgba(0,0,0,0.6)' 
                }}
            >
                {/* Rotating Icon */}
                <div className="absolute top-2 right-2 animate-[spin_3s_linear_infinite]">
                    <Beer size={24} color={theme.text} />
                </div>

                {/* Strobe Text */}
                <p style={{ color: theme.accent }} className="text-[10px] font-black uppercase tracking-widest mb-2 animate-strobe">
                    ¡NOTIFICACIÓN DE FIESTA!
                </p>

                {/* Prompt Text */}
                <p style={{ color: theme.text }} className="text-lg font-bold leading-snug drop-shadow-md">
                    {prompt}
                </p>

                {/* Flash Effect Overlay on Mount */}
                <div className="absolute inset-0 bg-white/20 animate-flash pointer-events-none" />
            </div>

            <style>{`
                /* Fills the border over 120 seconds (2 minutes) */
                .animate-border-fill {
                    animation: border-progress 120s linear forwards;
                    pathLength: 100; /* SVG 2 properties helper */
                }

                @keyframes border-progress {
                    0% { stroke-dashoffset: 400%; }
                    100% { stroke-dashoffset: 0%; }
                }

                /* Entrance Pop */
                .animate-party-pop {
                    animation: party-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }

                @keyframes party-pop {
                    0% { transform: scale(0.8) translateY(20px); opacity: 0; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }

                /* Flash Effect */
                .animate-flash {
                    animation: flash-fade 0.5s ease-out forwards;
                }

                @keyframes flash-fade {
                    0% { opacity: 0.8; background-color: ${theme.accent}; }
                    100% { opacity: 0; }
                }

                @keyframes strobe {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                .animate-strobe {
                    animation: strobe 0.5s steps(2, start) infinite;
                }
            `}</style>
        </div>
    );
};