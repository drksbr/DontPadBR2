import { DocumentManager } from "@y-sweet/sdk";
import { YDocProvider } from "@y-sweet/react";

import HomePage from "./(home)/page";

const manager = new DocumentManager(
  process.env.CONNECTION_STRING || "ys://127.0.0.1:8080",
);

export default function Home() {
  return <HomePage />;
}
