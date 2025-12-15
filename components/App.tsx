"use client";

import { useYDoc, useYjsProvider } from "@y-sweet/react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

export function App() {
  const provider = useYjsProvider();
  const doc = useYDoc();

  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: doc.getXmlFragment("blocknote"),
      user: { name: "Your Username", color: "#ff0000" },
    },
  });

  return <BlockNoteView editor={editor} />;
}
