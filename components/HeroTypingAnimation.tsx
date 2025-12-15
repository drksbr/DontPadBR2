"use client";

import { useState, useEffect, useRef } from "react";

interface Collaborator {
    name: string;
    color: string;
}

const collaborators: Collaborator[] = [
    { name: "Ana", color: "#3b82f6" },
    { name: "Carlos", color: "#10b981" },
    { name: "Maria", color: "#f59e0b" },
    { name: "João", color: "#ef4444" },
    { name: "Luiza", color: "#8b5cf6" },

];

const phrases = [
    "simples e eficiente.",
    "sem complicações.",
    "em tempo real.",
    "para todos.",
    "instantânea.",
    "colaboração fácil.",
    "compartilhamento rápido.",
    "edição simultânea.",
];

function getRandomCollaborator(excludeIndex?: number): number {
    let index: number;
    do {
        index = Math.floor(Math.random() * collaborators.length);
    } while (index === excludeIndex);
    return index;
}

type ActionPhase = "typing" | "pausing" | "deleting" | "waiting";

export function HeroTypingAnimation() {
    const [displayText, setDisplayText] = useState("");
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [phase, setPhase] = useState<ActionPhase>("typing");
    const [showCursor, setShowCursor] = useState(true);
    const [activeCollaboratorIndex, setActiveCollaboratorIndex] = useState(() => getRandomCollaborator());
    const lastTypingCollaborator = useRef<number>(activeCollaboratorIndex);

    const currentPhrase = phrases[phraseIndex];
    const activeCollaborator = collaborators[activeCollaboratorIndex];

    // Cursor blink
    useEffect(() => {
        const cursorInterval = setInterval(() => {
            setShowCursor(prev => !prev);
        }, 530);
        return () => clearInterval(cursorInterval);
    }, []);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        switch (phase) {
            case "typing": {
                if (displayText.length < currentPhrase.length) {
                    const delay = Math.random() * 100 + 60;
                    timeout = setTimeout(() => {
                        setDisplayText(currentPhrase.slice(0, displayText.length + 1));
                    }, delay);
                } else {
                    // Finished typing, pause
                    lastTypingCollaborator.current = activeCollaboratorIndex;
                    setPhase("pausing");
                }
                break;
            }

            case "pausing": {
                // Wait a bit before someone starts deleting
                timeout = setTimeout(() => {
                    // Random collaborator (different from the one who typed) starts deleting
                    const newCollaborator = getRandomCollaborator(lastTypingCollaborator.current);
                    setActiveCollaboratorIndex(newCollaborator);
                    setPhase("deleting");
                }, 2000 + Math.random() * 1000);
                break;
            }

            case "deleting": {
                if (displayText.length > 0) {
                    const delay = 35 + Math.random() * 25;
                    timeout = setTimeout(() => {
                        setDisplayText(displayText.slice(0, -1));
                    }, delay);
                } else {
                    // Finished deleting, wait before next phrase
                    setPhase("waiting");
                }
                break;
            }

            case "waiting": {
                // Short pause, then new collaborator starts typing new phrase
                timeout = setTimeout(() => {
                    // Pick next phrase
                    const nextPhraseIndex = (phraseIndex + 1) % phrases.length;
                    setPhraseIndex(nextPhraseIndex);

                    // Random new collaborator starts typing (can be anyone)
                    const newCollaborator = getRandomCollaborator(activeCollaboratorIndex);
                    setActiveCollaboratorIndex(newCollaborator);
                    setPhase("typing");
                }, 400 + Math.random() * 300);
                break;
            }
        }

        return () => clearTimeout(timeout);
    }, [displayText, phase, currentPhrase, phraseIndex, activeCollaboratorIndex]);

    return (
        <span className="relative inline-flex items-baseline h-[1.2em]">
            {/* Collaborator avatar/indicator - fixed position relative to text baseline */}
            <span className="absolute -left-8 top-[0.55em] -translate-y-1/2 flex items-center gap-1.5 transition-all duration-300">
                <span
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: activeCollaborator.color }}
                />
            </span>

            {/* Text being typed - with invisible placeholder to maintain width */}
            <span
                className="transition-colors duration-200"
                style={{ color: activeCollaborator.color }}
            >
                {displayText || "\u200B"}
            </span>

            {/* Cursor with floating badge */}
            <span className="relative inline-flex items-center self-stretch">
                {/* Cursor */}
                <span
                    className="inline-block w-[3px] h-[0.85em] ml-0.5 rounded-full transition-all duration-150 self-center"
                    style={{
                        backgroundColor: activeCollaborator.color,
                        opacity: showCursor ? 1 : 0,
                    }}
                />

                {/* Floating collaborator name badge - follows cursor */}
                <span
                    className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap transition-all duration-200 shadow-sm backdrop-blur-sm"
                    style={{ backgroundColor: `${activeCollaborator.color}cc` }}
                    key={activeCollaboratorIndex}
                >
                    {activeCollaborator.name}
                    <span className="ml-1 opacity-70">
                        {phase === "deleting" ? "⌫" : phase === "typing" ? "✎" : ""}
                    </span>
                    {/* Small arrow pointing down */}
                    <span
                        className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent"
                        style={{ borderTopColor: `${activeCollaborator.color}cc` }}
                    />
                </span>
            </span>
        </span>
    );
}
