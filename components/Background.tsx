import React, { useEffect, useRef } from 'react';
import { ThemeConfig } from '../types';

interface BackgroundProps {
    theme: ThemeConfig;
}

export const Background: React.FC<BackgroundProps> = ({ theme }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: any[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Particle Class
        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            char: string;
            opacity: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * (theme.particleType !== 'circle' ? 14 : 3) + 1;
                this.speedY = theme.particleType === 'rain' || theme.particleType === 'binary' 
                    ? Math.random() * 3 + 2 
                    : (Math.random() - 0.5) * 0.5;
                this.speedX = theme.particleType === 'rain' || theme.particleType === 'binary' 
                    ? 0 
                    : (Math.random() - 0.5) * 0.5;
                this.char = theme.particleType === 'binary' ? (Math.random() > 0.5 ? "1" : "0") : "";
                if (theme.particleType === 'rain') {
                    // Matrix characters
                    const chars = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ";
                    this.char = chars[Math.floor(Math.random() * chars.length)];
                }
                this.opacity = Math.random() * 0.5 + 0.1;
            }

            update() {
                this.y += this.speedY;
                this.x += this.speedX;

                if (this.y > canvas!.height) {
                    this.y = -20;
                    this.x = Math.random() * canvas!.width;
                }
                if (this.x < -20 || this.x > canvas!.width + 20) {
                    this.x = Math.random() * canvas!.width;
                }
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = theme.accent;
                ctx.globalAlpha = this.opacity;

                if (theme.particleType === 'circle') {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.font = `${this.size}px ${theme.font}`;
                    ctx.fillText(this.char, this.x, this.y);
                }
            }
        }

        const initParticles = () => {
            particles = [];
            const count = theme.particleType === 'circle' ? 60 : 100;
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        };

        initParticles();

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, [theme]);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 pointer-events-none z-0 opacity-40 transition-opacity duration-1000"
        />
    );
};