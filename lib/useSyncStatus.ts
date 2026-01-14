"use client";

import { useEffect, useState } from "react";
import { useYjsProvider, usePresence } from "@y-sweet/react";

export function useSyncStatus() {
  const provider = useYjsProvider();
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!provider) return;

    // Check initial state
    const checkState = () => {
      const p = provider as any;
      
      // Check connection via awareness (most reliable)
      let connected = false;
      if (p.awareness?.getStates) {
        const size = p.awareness.getStates().size;
        connected = size > 0;
      } else if (typeof p.connected === "boolean") {
        connected = p.connected;
      } else if (p.wsconnected === true) {
        connected = true;
      }
      setIsConnected(connected);
      
      // Check sync state - multiple fallbacks
      let synced = false;
      if (typeof p.isSynced === "boolean") {
        synced = p.isSynced;
      } else if (typeof p.synced === "boolean") {
        synced = p.synced;
      } else if (p._synced === true) {
        synced = true;
      } else if (connected) {
        // If connected but no sync property, assume synced after brief delay
        synced = true;
      }
      setIsSynced(synced);

      // Debug in dev
      if (process.env.NODE_ENV !== "production") {
        console.debug("[SyncStatus]", { connected, synced, providerKeys: Object.keys(p).slice(0, 10) });
      }
    };

    // Initial check
    checkState();

    // Event handlers
    const onStatus = (payload: any) => {
      if (typeof payload === "boolean") {
        setIsConnected(payload);
        if (payload) setIsSynced(true); // Connected implies synced for Y-Sweet
      } else if (payload?.status) {
        const connected = payload.status === "connected";
        setIsConnected(connected);
        if (connected) setIsSynced(true);
      }
    };

    const onSync = (synced: any) => {
      if (typeof synced === "boolean") {
        setIsSynced(synced);
      } else if (synced?.isSynced !== undefined) {
        setIsSynced(Boolean(synced.isSynced));
      }
    };

    const onAwarenessChange = () => {
      const p = provider as any;
      if (p.awareness?.getStates) {
        const connected = p.awareness.getStates().size > 0;
        setIsConnected(connected);
        if (connected) setIsSynced(true);
      }
    };

    // Attach listeners
    const p = provider as any;
    
    if (typeof p.on === "function") {
      p.on("status", onStatus);
      p.on("sync", onSync);
    }
    
    if (p.awareness?.on) {
      p.awareness.on("change", onAwarenessChange);
    }

    // Poll check for initial connection (fallback)
    const timeout = setTimeout(checkState, 500);
    // Second check after a bit more time
    const timeout2 = setTimeout(checkState, 1500);

    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
      if (typeof p.off === "function") {
        p.off("status", onStatus);
        p.off("sync", onSync);
      }
      if (p.awareness?.off) {
        p.awareness.off("change", onAwarenessChange);
      }
    };
  }, [provider]);

  return { isConnected, isSynced };
}
