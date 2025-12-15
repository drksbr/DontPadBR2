"use client";

import { useMemo } from "react";
import { useSyncStatus } from "@/lib/useSyncStatus";
import { useCollaboratorCount } from "@/lib/useCollaboratorCount";

export function SyncStatus() {
    const { isConnected, isSynced } = useSyncStatus();
    const count = useCollaboratorCount();

    const { colorClass, label } = useMemo(() => {
        if (!isConnected) return { colorClass: "bg-red-500", label: "Offline" };
        if (isSynced) return { colorClass: "bg-green-500", label: "Sincronizado" };
        return { colorClass: "bg-yellow-500", label: "Sincronizando..." };
    }, [isConnected, isSynced]);

    return (
        <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${colorClass}`} />
            <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
            <span className="text-xs text-slate-400">({count} {count === 1 ? "colaborador" : "colaboradores"})</span>
        </div>
    );
}
