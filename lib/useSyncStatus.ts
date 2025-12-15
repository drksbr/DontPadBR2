"use client";

import { useEffect, useState } from "react";
import { useYjsProvider, usePresence } from "@y-sweet/react";

export function useSyncStatus() {
  const provider = useYjsProvider();
  const presence = usePresence();

  const [isConnected, setIsConnected] = useState<boolean>(() => {
    try {
      if (provider && typeof (provider as any).connected !== "undefined")
        return Boolean((provider as any).connected);
      if (presence && typeof (presence as any).entries === "function") {
        try {
          return Array.from((presence as any).entries()).length > 0;
        } catch (e) {
          /* ignore */
        }
      }
      if (
        provider &&
        (provider as any).awareness &&
        typeof (provider as any).awareness.getStates === "function"
      )
        return (provider as any).awareness.getStates().size > 0;
      return false;
    } catch (e) {
      return false;
    }
  });

  const [isSynced, setIsSynced] = useState<boolean>(() => {
    try {
      return Boolean(provider && ((provider as any).isSynced ?? true));
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    if (!provider) return;

    // Initial values (with fallbacks)
    try {
      if (typeof (provider as any).connected !== "undefined")
        setIsConnected(Boolean((provider as any).connected));
      else if (presence && typeof (presence as any).entries === "function") {
        try {
          setIsConnected(Array.from((presence as any).entries()).length > 0);
        } catch (e) {}
      } else if (
        (provider as any).awareness &&
        typeof (provider as any).awareness.getStates === "function"
      )
        setIsConnected((provider as any).awareness.getStates().size > 0);
    } catch (e) {}

    try {
      setIsSynced(Boolean((provider as any).isSynced ?? true));
    } catch (e) {}

    // Debugging aid for flaky provider implementations (only in dev)
    try {
      if (process.env.NODE_ENV !== "production" && !isConnected) {
        const presentCount =
          presence && typeof (presence as any).entries === "function"
            ? Array.from((presence as any).entries()).length
            : undefined;
        // eslint-disable-next-line no-console
        console.debug("useSyncStatus debug", {
          providerKeys: provider ? Object.keys(provider as any) : undefined,
          hasIsSynced: typeof (provider as any).isSynced !== "undefined",
          awarenessSize: (provider as any)?.awareness?.getStates?.()?.size,
          presenceCount: presentCount,
        });
      }
    } catch (e) {
      // ignore
    }

    // Attach listeners if available
    const onStatus = (payload: any) => {
      // Some providers emit { status: 'connected' | 'disconnected' }
      if (payload && payload.status) {
        setIsConnected(payload.status === "connected");
      }
      // Some providers emit boolean
      if (typeof payload === "boolean") setIsConnected(Boolean(payload));
    };

    const onSync = (synced: any) => {
      // Some providers emit boolean directly or an object
      if (typeof synced === "boolean") setIsSynced(synced);
      else if (synced && typeof synced === "object") {
        if ("isSynced" in synced)
          setIsSynced(Boolean((synced as any).isSynced));
        else if ("synced" in synced)
          setIsSynced(Boolean((synced as any).synced));
      }
    };

    if (typeof (provider as any).on === "function") {
      try {
        (provider as any).on("status", onStatus);
      } catch (e) {
        // ignore
      }
      try {
        (provider as any).on("sync", onSync);
      } catch (e) {
        // ignore
      }
    }

    // Listen to awareness changes as a fallback for connection state
    const awareness = (provider as any)?.awareness;
    const awarenessHandler = () => {
      try {
        const size = awareness?.getStates?.().size ?? 0;
        setIsConnected(size > 0);
      } catch (e) {}
    };

    if (awareness && typeof awareness.on === "function") {
      try {
        awareness.on("change", awarenessHandler);
      } catch (e) {}
    }

    return () => {
      if (typeof (provider as any).off === "function") {
        try {
          (provider as any).off("status", onStatus);
        } catch (e) {}
        try {
          (provider as any).off("sync", onSync);
        } catch (e) {}
      }
      if (awareness && typeof awareness.off === "function") {
        try {
          awareness.off("change", awarenessHandler);
        } catch (e) {}
      }
    };
  }, [provider]);

  return { isConnected, isSynced };
}
