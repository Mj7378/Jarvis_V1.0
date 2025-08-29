
import React, { useRef, useEffect, useCallback } from 'react';

const MatrixBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const getThemeColors = useCallback(() => {
        const style = getComputedStyle(document.documentElement);
        return {
            primaryColor: style.getPropertyValue('--primary-color-hex').trim() || '#00ffff',
            primaryRgb: style.getPropertyValue('--primary-color-rgb').trim() || '0, 255, 255',
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: any[] = [];
        const particleCount = 70;
        
        let colors = getThemeColors();

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: Math.random() * 0.4 - 0.2,
                    vy: Math.random() * 0.4 - 0.2,
                    size: Math.random() * 1.5 + 1,
                });
            }
        };

        resizeCanvas();

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = colors.primaryColor;
                ctx.fill();

                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const distance = Math.sqrt(Math.pow(p.x - p2.x, 2) + Math.pow(p.y - p2.y, 2));
                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(${colors.primaryRgb}, ${1 - distance / 150})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };

        animate();
        
        const handleResize = () => {
            colors = getThemeColors(); // Recalculate colors on resize in case theme changed
            resizeCanvas();
        };

        window.addEventListener('resize', handleResize);
        
        // Add an observer to detect theme changes on root element style
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
              colors = getThemeColors();
            }
          }
        });
        observer.observe(document.documentElement, { attributes: true });


        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, [getThemeColors]);

    return <canvas ref={canvasRef} id="matrix-background" />;
};

export default MatrixBackground;