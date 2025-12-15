"use client";

import Image from "next/image";
import { usePresence, usePresenceSetter } from "@y-sweet/react";
import { useEffect, useState } from "react";
import { getCollaboratorColor } from "@/lib/colors";

export function Presence() {
  const setPresence = usePresenceSetter();
  const presence = usePresence();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [self, setSelf] = useState(() => ({ color: getCollaboratorColor(false) }));

  // Detectar tema do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = mediaQuery.matches;
    setIsDarkMode(isDark);
    // Atualizar cor ao montar com o tema correto
    setSelf((prev) => ({ ...prev, color: getCollaboratorColor(isDark) }));

    const handler = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => setPresence(self), [setPresence, self]);

  const others = Array.from(presence.entries());

  return (
    <div className="inline-block relative mx-auto pb-[102px]">
      <ul className="flex justify-center items-center gap-2">
        <li
          className="flex rounded-full border border-dashed p-0.5"
          style={{ borderColor: self.color }}
        >
          <label
            className="block appearance-none w-6 h-6 rounded-full"
            style={{ backgroundColor: self.color }}
          >
            <input
              className="invisible"
              type="color"
              value={self.color}
              onChange={(e) => setSelf({ ...self, color: e.target.value })}
            />
          </label>
        </li>
        {others.map(([id, peer]) => (
          <li
            key={id}
            className="rounded-full w-6 h-6"
            style={{ backgroundColor: peer.color }}
          ></li>
        ))}
      </ul>
      <img
        className="absolute max-w-none mt-[4px] -left-6"
        src="/tip.svg"
        alt=""
        width="116"
        height="98"
      />
    </div>
  );
}
