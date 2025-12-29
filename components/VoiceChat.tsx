"use client";

import React, { useEffect, useRef, useState } from "react";

export function VoiceChat({ documentId, onClose }: { documentId: string; onClose: () => void }) {
    const [connected, setConnected] = useState(false);
    const [muted, setMuted] = useState(true);
    const [participants, setParticipants] = useState<string[]>([]);
    const roomRef = useRef<any>(null);
    const identityRef = useRef<string>(`user-${Math.random().toString(36).slice(2, 8)}`);

    useEffect(() => {
        return () => {
            if (roomRef.current) roomRef.current.disconnect();
        };
    }, []);

    async function join() {
        try {
            const res = await fetch("/api/livekit/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId, identity: identityRef.current }),
            });
            const data = await res.json();
            if (!data.token) throw new Error(data.error || "no token returned");

            const livekit = await import("livekit-client");
            const room = await livekit.connect(data.url, data.token, { autoSubscribe: true });
            roomRef.current = room;
            setConnected(true);

            // Participants
            const updateList = () => {
                try {
                    const list = Array.from(room.participants.values()).map((p: any) => p.identity || p.sid || "anonymous");
                    setParticipants(list);
                } catch (e) {
                    setParticipants([]);
                }
            };

            room.on("participantConnected", (p: any) => updateList());
            room.on("participantDisconnected", (p: any) => updateList());
            room.on("disconnected", () => {
                setConnected(false);
                setParticipants([]);
            });

            updateList();

            // Publish local audio track
            const { createLocalAudioTrack } = await import("livekit-client");
            const track = await createLocalAudioTrack();
            await room.localParticipant.publishTrack(track);
            track.setEnabled(!muted);
        } catch (e: any) {
            console.error("Voice join error", e);
            alert(e?.message || String(e));
        }
    }

    async function leave() {
        if (roomRef.current) {
            roomRef.current.disconnect();
            roomRef.current = null;
        }
        setConnected(false);
        setParticipants([]);
        onClose();
    }

    async function toggleMute() {
        if (!roomRef.current) return;
        const lp = roomRef.current.localParticipant;
        lp.audioTracks.forEach((pub: any) => {
            if (pub.track) pub.track.setEnabled(muted);
        });
        setMuted(!muted);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={leave} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-lg p-4 z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Voice — {documentId}</div>
                    <button onClick={leave} className="text-sm px-2 py-1">Fechar</button>
                </div>

                {!connected ? (
                    <div className="flex items-center gap-2">
                        <button onClick={join} className="px-3 py-2 rounded bg-slate-800 text-white">Entrar na conversa</button>
                        <div className="text-sm text-slate-600">Sem conexão</div>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <button onClick={toggleMute} className="px-3 py-2 rounded bg-slate-800 text-white">{muted ? "Ativar som" : "Mutar"}</button>
                            <button onClick={leave} className="px-3 py-2 rounded border">Sair</button>
                        </div>
                        <div className="text-sm font-medium mb-2">Participantes</div>
                        <ul className="space-y-2 max-h-40 overflow-auto">
                            {participants.map((p) => (
                                <li key={p} className="text-sm">{p}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
