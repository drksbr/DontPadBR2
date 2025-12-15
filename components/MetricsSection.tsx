"use client";

import { useState, useEffect, useRef } from "react";

interface Metric {
    value: number;
    suffix: string;
    label: string;
    description: string;
}

const metrics: Metric[] = [
    { value: 2.4, suffix: "M+", label: "Documentos", description: "criados na plataforma" },
    { value: 850, suffix: "K+", label: "Usuários", description: "colaborando mensalmente" },
    { value: 99.9, suffix: "%", label: "Uptime", description: "disponibilidade garantida" },
    { value: 15, suffix: "ms", label: "Latência", description: "sincronização em tempo real" },
];

function AnimatedCounter({
    value,
    suffix,
    duration = 2000,
    shouldAnimate
}: {
    value: number;
    suffix: string;
    duration?: number;
    shouldAnimate: boolean;
}) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (!shouldAnimate) return;

        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing function (ease-out-cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setDisplayValue(value * easeOut);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [value, duration, shouldAnimate]);

    const formattedValue = value >= 100
        ? Math.round(displayValue).toLocaleString('pt-BR')
        : displayValue.toFixed(1);

    return (
        <span className="counter-value">
            {formattedValue}{suffix}
        </span>
    );
}

export function MetricsSection() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section
            ref={sectionRef}
            className="py-24 px-6 bg-slate-900 dark:bg-slate-950 text-white overflow-hidden"
        >
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                    <h3 className="text-3xl font-bold mb-4">
                        Milhões confiam no DontPad BR
                    </h3>
                    <p className="text-slate-400 max-w-xl mx-auto">
                        Uma plataforma robusta e escalável, construída para colaboração em qualquer escala.
                    </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {metrics.map((metric, index) => (
                        <div
                            key={metric.label}
                            className={`text-center ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                            style={{ animationDelay: `${index * 100 + 200}ms` }}
                        >
                            <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                                <AnimatedCounter
                                    value={metric.value}
                                    suffix={metric.suffix}
                                    shouldAnimate={isVisible}
                                    duration={2000 + index * 200}
                                />
                            </div>
                            <div className="text-lg font-semibold text-slate-200 mb-1">
                                {metric.label}
                            </div>
                            <div className="text-sm text-slate-400">
                                {metric.description}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trust Badges */}
                <div className={`mt-20 pt-12 border-t border-slate-800 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '800ms' }}>
                    <div className="flex flex-wrap justify-center items-center gap-8 text-slate-500">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-sm">Dados criptografados</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm">Servidores globais</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-sm">Sincronização instantânea</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm">Backup automático</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
