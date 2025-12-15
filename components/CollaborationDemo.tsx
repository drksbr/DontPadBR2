"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
    name: string;
    lightColor: string;
    darkColor: string;
}

// Professional colors with light/dark variants for proper contrast
const users: User[] = [
    { name: "Ana", lightColor: "#2563eb", darkColor: "#60a5fa" },     // Blue
    { name: "Carlos", lightColor: "#059669", darkColor: "#34d399" },  // Emerald
    { name: "Maria", lightColor: "#ea580c", darkColor: "#fb923c" },   // Orange
];

interface TypedLine {
    text: string;
    user: User;
    completed: boolean;
}

const collaborationScript: { text: string; userIndex: number }[] = [
    { text: "# Pauta da Reunião", userIndex: 0 },
    { text: "", userIndex: 0 },
    { text: "## Participantes", userIndex: 1 },
    { text: "- Ana (Product)", userIndex: 0 },
    { text: "- Carlos (Dev)", userIndex: 1 },
    { text: "- Maria (Design)", userIndex: 2 },
    { text: "", userIndex: 0 },
    { text: "## Tópicos", userIndex: 2 },
    { text: "1. Revisão do sprint anterior", userIndex: 0 },
    { text: "2. Definição de prioridades", userIndex: 1 },
    { text: "3. Próximos passos", userIndex: 2 },
];

export function CollaborationDemo() {
    const [lines, setLines] = useState<TypedLine[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [activeUsers, setActiveUsers] = useState<number[]>([0]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Detectar tema do sistema apenas no cliente
    useEffect(() => {
        setIsMounted(true);
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        setIsDarkMode(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    // Helper para obter cor correta baseada no tema
    const getUserColor = useCallback((user: User) => {
        return isDarkMode ? user.darkColor : user.lightColor;
    }, [isDarkMode]);

    const resetAnimation = useCallback(() => {
        setLines([]);
        setCurrentLineIndex(0);
        setCurrentCharIndex(0);
        setActiveUsers([0]);
    }, []);

    useEffect(() => {
        if (currentLineIndex >= collaborationScript.length) {
            // Reset after completion
            const timeout = setTimeout(resetAnimation, 3000);
            return () => clearTimeout(timeout);
        }

        const currentScript = collaborationScript[currentLineIndex];
        const currentUser = users[currentScript.userIndex];

        // Add user to active users if not present
        if (!activeUsers.includes(currentScript.userIndex)) {
            setActiveUsers(prev => [...prev, currentScript.userIndex].slice(-3));
        }

        if (currentCharIndex === 0) {
            // Start new line
            setLines(prev => [
                ...prev,
                { text: "", user: currentUser, completed: false }
            ]);
        }

        if (currentCharIndex <= currentScript.text.length) {
            const timeout = setTimeout(() => {
                setLines(prev => {
                    const newLines = [...prev];
                    if (newLines.length > 0) {
                        newLines[newLines.length - 1] = {
                            ...newLines[newLines.length - 1],
                            text: currentScript.text.slice(0, currentCharIndex),
                            completed: currentCharIndex === currentScript.text.length
                        };
                    }
                    return newLines;
                });
                setCurrentCharIndex(prev => prev + 1);
            }, currentScript.text.length === 0 ? 200 : Math.random() * 50 + 30);

            return () => clearTimeout(timeout);
        } else {
            // Move to next line
            const timeout = setTimeout(() => {
                setCurrentLineIndex(prev => prev + 1);
                setCurrentCharIndex(0);
            }, 300);

            return () => clearTimeout(timeout);
        }
    }, [currentLineIndex, currentCharIndex, activeUsers, resetAnimation]);

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Editor Window */}
            <div className="collab-demo shadow-xl">
                {/* Window Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-2 font-mono">/reuniao-sprint</span>
                    </div>

                    {/* Active Users */}
                    <div className="flex items-center gap-1">
                        {activeUsers.map((userIndex, i) => (
                            <div
                                key={userIndex}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 animate-fade-in"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getUserColor(users[userIndex]) }}
                                ></div>
                                <span className="text-xs text-slate-600 dark:text-slate-300">{users[userIndex].name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor Content */}
                <div className="p-6 min-h-[280px] font-mono text-sm bg-white dark:bg-slate-800">
                    {lines.map((line, index) => (
                        <div key={index} className="flex items-start min-h-[1.75rem]">
                            <span className="w-6 text-slate-300 dark:text-slate-600 text-right mr-4 select-none text-xs">
                                {index + 1}
                            </span>
                            <div className="flex-1 flex items-center">
                                <span className={`${line.text.startsWith('#') ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {line.text}
                                </span>
                                {!line.completed && index === lines.length - 1 && (
                                    <span
                                        className="w-0.5 h-4 ml-0.5 animate-typing-cursor rounded-full"
                                        style={{ backgroundColor: getUserColor(line.user) }}
                                    ></span>
                                )}
                            </div>
                        </div>
                    ))}
                    {lines.length === 0 && (
                        <div className="flex items-center text-slate-300 dark:text-slate-600">
                            <span className="w-6 text-right mr-4 text-xs">1</span>
                            <span className="w-0.5 h-4 bg-blue-500 animate-typing-cursor rounded-full"></span>
                        </div>
                    )}
                </div>
            </div>

            {/* Caption */}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                Colaboração em tempo real • Múltiplos cursores • Sincronização instantânea
            </p>
        </div>
    );
}
