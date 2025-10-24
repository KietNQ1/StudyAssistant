# Logo Assets (Source)

This folder contains logo assets that need to be imported in React components.

## Usage in React Components

### Import and use
```jsx
import logo from '@/assets/logos/logo.png';
import logoSmall from '@/assets/logos/logo-small.png';

function Header() {
  return (
    <header>
      <img src={logo} alt="Study Assistant" />
    </header>
  );
}
```

### With Vite alias (if configured)
```jsx
import logo from '@assets/logos/logo.png';
```

## When to use this folder vs public/assets/logos?

**Use `public/assets/logos/`** when:
- Logo is referenced directly in HTML
- Logo path doesn't need to change
- Used in static files like index.html, manifest.json

**Use `src/assets/logos/`** when:
- Logo needs to be imported in React components
- Want Vite to process the image (optimization, hashing)
- Using in dynamic components

## Recommendation

For most cases, use **`public/assets/logos/`** for simpler access and better caching.

Use this folder only if you need build-time processing or TypeScript imports.
