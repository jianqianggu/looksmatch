# Looksmatch

A beauty consensus voting app with jury-driven matching. Participate in swiping, voting, and matching with other users.

## Quick Start

### Prerequisites

- **Node.js** 16+ (download from [nodejs.org](https://nodejs.org/))

### Installation & Development

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# Server runs at http://localhost:3000
```

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
??? components/          # React components
?   ??? LooksmatchApp.jsx   # Main app component
?   ??? ProfileTab.jsx      # Profile setup phase
?   ??? VotingPhase.jsx     # Jury voting phase
?   ??? SwipePhase.jsx      # Candidate swiping phase
?   ??? PhotoCard.jsx       # Candidate photo display
?   ??? LockedState.jsx     # Locked feature state
??? utils/              # Utility functions
?   ??? verdictEngine.js    # Verdict logic
?   ??? queueBuilder.js     # Queue generation
??? constants/          # App constants
?   ??? profiles.js        # Candidate profiles
??? styles/             # Styling utilities
?   ??? globalStyles.js     # Global CSS
?   ??? buttonStyles.js     # Button style functions
??? main.jsx           # React root
```

## How It Works

### Three-Phase Flow

1. **Profile Phase**: User creates their profile (name, age, photo, tagline)
2. **Vote Phase**: User participates in jury duty, voting on candidate pairs (10 votes required)
3. **Match Phase**: User swipes on candidates; matches are unlocked based on jury verdict

### Key Features

- **Jury-Driven Matching**: Each match verdict requires aggregated votes from the community
- **Undo Support**: Users can undo votes and swipes
- **Responsive Design**: Mobile-first dark theme
- **Seeded Verdicts**: Deterministic matching based on pair IDs for consistent results

## Development Notes

- **Mock Data**: `src/constants/profiles.js` contains placeholder profiles. Replace with real data before production.
- **Styling**: All styles are inline or CSS classes in `src/styles/`. Customize the color palette there.
- **State Management**: Uses React `useState` and `useCallback` for simplicity. Upgrade to Redux/Zustand for complex state.

## Next Steps

- Connect to a backend API for real profiles and voting
- Implement user authentication
- Add real-time notifications for matches
- Deploy to a hosting service (Vercel, Netlify, etc.)
