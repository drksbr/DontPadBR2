"use client";

import { useMemo, useState, useEffect } from "react";
import { useSyncStatus } from "@/lib/useSyncStatus";
import { useCollaboratorCount } from "@/lib/useCollaboratorCount";

export function SyncStatus() {
    const { isConnected, isSynced } = useSyncStatus();
    const count = useCollaboratorCount();
    const [showConnecting, setShowConnecting] = useState(true);

    // Hide "Conectando..." after brief initial period
    useEffect(() => {
        if (isConnected) {
            setShowConnecting(false);
        } else {
            // Only show connecting after 1s delay to avoid flicker
            const timeout = setTimeout(() => setShowConnecting(true), 1000);
            return () => clearTimeout(timeout);
        }
    }, [isConnected]);

    const { colorClass, label } = useMemo(() => {
        if (!isConnected) {
            return showConnecting
                ? { colorClass: "bg-amber-500 animate-pulse", label: "Conectando..." }
                : { colorClass: "bg-slate-400", label: "" };
        }
        if (!isSynced) {
            return { colorClass: "bg-amber-500", label: "Sincronizando..." };
        }
        return { colorClass: "bg-green-500", label: "" };
    }, [isConnected, isSynced, showConnecting]);

    // Don't show anything if connected and synced (clean UI)
    const showLabel = !isConnected || !isSynced;

    return (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${colorClass}`} />
            {showLabel && label && (
                <span className="transition-opacity duration-200">{label}</span>
            )}
            {isConnected && count > 0 && (
                <span className="text-slate-400 dark:text-slate-500">
                    {count} {count === 1 ? "online" : "online"}
                </span>
            )}
        </div>
    );
}
