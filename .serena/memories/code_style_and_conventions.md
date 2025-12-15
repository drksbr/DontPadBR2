# Code Style & Conventions

## TypeScript
- Strict mode enabled
- Path aliases: `@/*` maps to workspace root
- JSX: react-jsx (no React import needed)

## React/Next.js Conventions
- Functional components with proper typing
- Server components by default in app router
- "use client" directive for client-side code
- Props typing with interfaces/types
- Standard naming: PascalCase for components, camelCase for variables/functions

## Styling
- **Tailwind CSS** for all styling
- Custom config in `tailwind.config.js`
- Global styles in `app/globals.css`
- Current theme: Light mode with cream background (#fcfaf0)
- Typography: Inter font family (from Google Fonts)

## Component Organization
- Components in `/components` directory
- Page routes in `/app` directory
- Utilities in `/lib` directory
- Shared styles/colors in `/lib`

## File Naming
- Components: PascalCase.tsx
- Utilities: camelCase.ts
- Pages: lowercase/[dynamic].tsx

## Best Practices Observed
- Async server actions in page.tsx
- Use of provider pattern for Y-Sweet context
- Clear separation of concerns (providers, components, utilities)