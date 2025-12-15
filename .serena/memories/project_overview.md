# DontPadBR2 - Project Overview

## Purpose
A collaborative document editor platform similar to dontpad.com, built with Next.js and Y-Sweet for real-time synchronization.

## Tech Stack
- **Framework**: Next.js 16.0.10 (App Router)
- **Language**: TypeScript 5.6.3
- **Real-time Collaboration**: Y-Sweet 0.9.1 + Yjs 13.6.20
- **Editor**: BlockNote (with Mantine UI)
- **Styling**: Tailwind CSS 3.4.15 + PostCSS
- **Runtime**: Bun (package manager)
- **Font**: Next.js Google Fonts (Inter)

## Project Structure
```
app/
  layout.tsx      - Root layout with metadata and styling
  page.tsx        - Main page (home/document view)
  globals.css     - Global styles
components/
  App.tsx         - Main app component with BlockNote editor
  Footer.tsx
  Hero.tsx
  Presence.tsx
  Todos.tsx
lib/
  colors.ts       - Color constants
public/           - Static assets
```

## Current Setup
- Next.js SSR/SSG with server actions
- Y-Sweet for real-time collaboration
- BlockNote editor integrated with Yjs for sync
- Basic styling with Tailwind (bg-[#fcfaf0] body background)
- Path aliases configured (@/* maps to root)

## Dev Environment
- **Package Manager**: Bun
- **Node Version**: Compatible with Next.js 16
- **Editor**: VSCode compatible