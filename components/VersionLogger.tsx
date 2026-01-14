"use client";

import { useEffect } from "react";
import { APP_VERSION } from "@/lib/crypto";

export function VersionLogger() {
  useEffect(() => {
    console.log(
      `%c🚀 DontPad ${APP_VERSION}`,
      "color: #f97316; font-size: 16px; font-weight: bold; background: #fef3c7; padding: 4px 8px; border-radius: 4px;"
    );
  }, []);

  return null;
}
