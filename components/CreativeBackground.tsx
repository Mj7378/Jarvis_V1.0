
import React, { useRef, useEffect } from 'react';

const CreativeBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        let particles: Particle[] = [];
        
        const primaryRgb = getComputedStyle(document.documentElement).getPropertyValue('--primary-color-rgb').trim();

        const handleMouseMove = (event: MouseEvent) => {
            mouseRef.current.x = event.clientX;
            mouseRef.current.y = event.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        class Particle {
            x: number;
            y: number;
            size: number;
            baseX: number;
            baseY: number;
            density: number;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 1.5 + 1;
                this.baseX = this.x;
                this.baseY = this.y;
                this.density = (Math.random() * 40) + 5;
            }

            draw() {
                if(!ctx) return;
                ctx.fillStyle = `rgba(${primaryRgb}, 0.6)`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }
            
            update() {
                const dx = mouseRef.current.x - this.x;
                const dy = mouseRef.current.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const maxDistance = 150;
                const force = (maxDistance - distance) / maxDistance;
                
                let directionX = 0;
                let directionY = 0;

                if (distance < maxDistance) {
                    directionX = forceDirectionX * force * this.density * -0.5;
                    directionY = forceDirectionY * force * this.density * -0.5;
                }
                
                if (this.x !== this.baseX) {
                    const dxHome = this.x - this.baseX;
                    this.x -= dxHome / 20;
                }
                if (this.y !== this.baseY) {
                    const dyHome = this.y - this.baseY;
                    this.y -= dyHome / 20;
                }
                
                this.x += directionX;
                this.y += directionY;
            }
        }

        const init = () => {
            particles = [];
            const numberOfParticles = Math.floor((width * height) / 12000);
            for (let i = 0; i < numberOfParticles; i++) {
                let x = Math.random() * width;
                let y = Math.random() * height;
                particles.push(new Particle(x, y));
            }
        };

        const connect = () => {
            if(!ctx) return;
            let opacityValue = 1;
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 80) {
                        opacityValue = 1 - (distance / 80);
                        ctx.strokeStyle = `rgba(${primaryRgb}, ${opacityValue * 0.5})`;
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            if(!ctx) return;
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            connect();
            animationFrameId.current = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            init();
        };
        window.addEventListener('resize', handleResize);
        
        init();
        animate();

        return () => {
            if (animationFrameId.current) {
              cancelAnimationFrame(animationFrameId.current);
            }
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-background" />;
};

export default CreativeBackground;
