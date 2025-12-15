# Commands for Development

## Development & Building
```bash
bun run dev      # Start dev server with Y-Sweet (http://localhost:3000)
bun run build    # Build for production
bun run start    # Start production server
```

## Package Management
```bash
bun add <package>      # Install package
bun install            # Install dependencies
bun update             # Update packages
```

## Version Control
```bash
git add .              # Stage changes
git commit -m "msg"    # Commit changes
git push               # Push to remote
```

## File Operations
```bash
ls -la                 # List files
find . -name "*.tsx"   # Find TypeScript files
grep -r "pattern"      # Search in files
```

## Development Workflow
1. Make changes to components/pages
2. Changes auto-reload in dev server
3. Test with multiple browser windows (Y-Sweet syncs in real-time)
4. Run `bun run build` before deploying

## Required Services
- Y-Sweet development server (started with `bun run dev`)
- Connection string configured in env: `ys://127.0.0.1:8080`