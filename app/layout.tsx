import { Inter } from "next/font/google";
import { LinkifyInit } from "@/components/LinkifyInit";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "DontPad 2.0 - Documentos Colaborativos em Tempo Real",
  description: "Crie e compartilhe documentos colaborativos instantaneamente. Edite em tempo real com subdocumentos e sincronização automática.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.className}>
      <body className="bg-white text-gray-900">
        <LinkifyInit />
        {children}
      </body>
    </html>
  );
}
