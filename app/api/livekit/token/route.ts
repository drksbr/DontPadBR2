import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const documentId = body?.documentId as string;
    const identity =
      body?.identity || `user-${Math.random().toString(36).slice(2, 8)}`;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url =
      process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

    if (!apiKey || !apiSecret) {
      console.error("Missing LiveKit API credentials");
      return NextResponse.json(
        { error: "LiveKit API key/secret not configured" },
        { status: 500 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    // Import server sdk dynamically to avoid build issues when dependency is absent
    const sdk = await import("livekit-server-sdk");

    // Helper to resolve exported classes across CJS/ESM interop shapes
    const resolve = (name: string) => {
      if (!sdk) return undefined;
      if ((sdk as any)[name]) return (sdk as any)[name];
      if ((sdk as any).default && (sdk as any).default[name])
        return (sdk as any).default[name];
      // Some builds nest classes under properties
      if ((sdk as any)[name]?.[name]) return (sdk as any)[name][name];
      return undefined;
    };

    console.debug(
      "livekit-server-sdk raw keys:",
      Object.keys(sdk).slice(0, 50)
    );
    console.debug(
      "livekit-server-sdk has default export?",
      !!(sdk as any).default,
      Object.keys((sdk as any).default ?? {}).slice(0, 50)
    );

    const AccessToken = resolve("AccessToken");

    if (!AccessToken) {
      console.error(
        "livekit-server-sdk does not expose AccessToken",
        Object.keys(sdk)
      );
      // Provide actionable suggestion for local dev: install the package and restart
      const suggestion =
        "Ensure 'livekit-server-sdk' is installed (npm install livekit-server-sdk or bun add livekit-server-sdk) and restart the server.";
      return NextResponse.json(
        {
          error: "LiveKit SDK unavailable",
          suggestion,
          available: Object.keys(sdk).slice(0, 20),
        },
        { status: 500 }
      );
    }

    const at = new AccessToken(apiKey, apiSecret, { identity });

    // The server SDK exposes a flexible grants shape instead of a RoomGrant class.
    // Add a video grant that allows joining the specific room.
    at.addGrant({ video: { roomJoin: true, room: documentId } });

    // toJwt() is async and returns a signed token
    const token = await at.toJwt();

    return NextResponse.json({ token, url });
  } catch (e: any) {
    console.error("Error generating LiveKit token", e);
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
