# Getting Started with Looksmatch

## What Changed

Your monolithic `Looksmatch.jsx` has been refactored into a proper React project with:

? **Organized file structure** - Components, utils, constants, and styles are separated  
? **Vite build tooling** - Fast dev server and optimized production builds  
? **Modern Node.js workflow** - npm scripts for dev, build, and preview  
? **Reusable components** - Each phase and UI element is its own component  
? **Documented code** - JSDoc comments throughout

## Installation

1. **Install Node.js** (if you don't have it):
    - Visit [nodejs.org](https://nodejs.org/) and download LTS version
    - Verify installation: `node --version` and `npm --version`

2. **Install dependencies**:

    ```bash
    npm install
    ```

    This installs React, React DOM, lucide-react icons, and Vite.

3. **Start the dev server**:
    ```bash
    npm run dev
    ```
    Your browser should open to `http://localhost:3000`

## File Structure Explained

```
project-root/
??? index.html              # HTML entry point
??? package.json            # Dependencies & scripts
??? vite.config.js          # Vite configuration
??? .prettierrc              # Code formatting rules
??? .gitignore              # Git ignore rules
??? README.md               # Main docs
?
??? src/
    ??? main.jsx            # React root
    ??? components/         # UI components
    ?   ??? LooksmatchApp.jsx
    ?   ??? ProfileTab.jsx
    ?   ??? VotingPhase.jsx
    ?   ??? SwipePhase.jsx
    ?   ??? PhotoCard.jsx
    ?   ??? LockedState.jsx
    ??? utils/              # Business logic
    ?   ??? verdictEngine.js
    ?   ??? queueBuilder.js
    ??? constants/          # Static data
    ?   ??? profiles.js
    ??? styles/             # Style utilities
        ??? globalStyles.js
        ??? buttonStyles.js
```

## Available Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

## How to Develop

### Adding a New Component

1. Create a new file in `src/components/MyComponent.jsx`
2. Import it in the parent component
3. Hot module replacement will reload automatically

Example:

```jsx
// src/components/MyNewComponent.jsx
export function MyNewComponent() {
    return <div>Hello!</div>;
}
```

### Modifying Styles

All styles are in `src/styles/`:

- **Global styles** (fonts, animations): `globalStyles.js`
- **Button styles** (reusable style functions): `buttonStyles.js`

Colors used throughout:

- Primary accent: `#F2B84B` (yellow)
- Primary action: `#FF5C7A` (pink/red)
- Secondary: `#4FD1C5` (teal)
- Text: `#F2F1ED` (off-white)
- Background: `#0E0F13` (dark)
- Muted: `#8A8D99` (gray)

### Using Constants

Update candidate profiles in `src/constants/profiles.js`:

```javascript
export const PROFILES = [
    { id: 1, name: "...", age: 27, tagline: "...", photo: "..." },
    // ...
];
```

### Business Logic

- **Verdict engine** (`src/utils/verdictEngine.js`): Seeded random matching
- **Queue builder** (`src/utils/queueBuilder.js`): Shuffled pair/swipe queues

## Next Steps for Deployment

1. **Connect a Backend**:
    - Replace mock profiles with real API data
    - Store voting data in a database
    - Implement user authentication

2. **Deploy**:
    - **Vercel** (easiest): `npm install -g vercel` ? `vercel`
    - **Netlify**: Drag-and-drop `dist/` folder
    - **Docker**: Create a Dockerfile with `npm run build`

3. **Optimize**:
    - Add TypeScript for type safety
    - Set up ESLint and Prettier
    - Add testing with Vitest/React Testing Library

## Troubleshooting

**Port 3000 already in use?**

```bash
npm run dev -- --port 3001
```

**Node modules issues?**

```bash
rm -rf node_modules
npm install
```

**Build errors?**
Check `vite.config.js` and ensure React plugin is installed:

```bash
npm install @vitejs/plugin-react
```

---

Enjoy building! ??
