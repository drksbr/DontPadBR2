import { NextResponse } from "next/server";

export async function GET() {
  const conn = process.env.CONNECTION_STRING || "ys://127.0.0.1:4001";

  // Try to parse ys://host:port
  try {
    const m = conn.match(/^ys:\/\/(.+?):(\d+)/);
    if (!m) {
      return NextResponse.json(
        { ok: false, message: `Invalid CONNECTION_STRING: ${conn}` },
        { status: 400 }
      );
    }
    const host = m[1];
    const port = parseInt(m[2], 10);

    const net = await import("net");
    const reachable = await new Promise<boolean>((resolve) => {
      const s = new net.Socket();
      const timeout = 1500;
      let done = false;
      s.setTimeout(timeout, () => {
        if (!done) {
          done = true;
          s.destroy();
          resolve(false);
        }
      });
      s.once("error", () => {
        if (!done) {
          done = true;
          s.destroy();
          resolve(false);
        }
      });
      s.connect(port, host, () => {
        if (!done) {
          done = true;
          s.end();
          resolve(true);
        }
      });
    });

    return NextResponse.json({
      ok: reachable,
      host,
      port,
      connectionString: conn,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || String(e) },
      { status: 500 }
    );
  }
}
