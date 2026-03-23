# Critical CSS Guidelines

## File Structure
- `main.css` - Critical above-the-fold styles (< 20KB)
- Non-critical styles should be loaded asynchronously

## Performance Rules
1. Use efficient selectors (max 3 levels)
2. Prefer classes over element selectors
3. Use shorthand properties
4. Minimize nested selectors
5. Remove unused styles regularly

## Maintenance
- Run `npm run css:check-size` to verify < 20KB
- Usecssnano for production minification
- Lazy load non-critical styles via JavaScript
