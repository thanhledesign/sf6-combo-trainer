# SF6 Combo Trainer - Technical Architecture Overview

*Version: 1.0 (MVP)*
*Created: November 30, 2025*

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool & dev server |
| React Router | 6.x | Client-side routing |
| Tailwind CSS | 3.x | Utility-first styling |
| Lucide React | - | Icon library |

### Data Storage
| Type | Technology | Purpose |
|------|------------|---------|
| Character Data | JSON files | Static move/frame data |
| User Preferences | localStorage | Bookmarks, settings (future) |
| State Management | React useState | Component state |

### Deployment
| Service | Purpose |
|---------|---------|
| Vercel | Hosting & CI/CD |
| GitHub | Version control |

---

## Project Structure

```
sf6-combo-trainer/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── characters/
│   │       ├── kenThumbnail.png
│   │       ├── terryThumbnail.png
│   │       ├── chunliThumbnail.png
│   │       ├── lukeThumbnail.png
│   │       ├── cammyThumbnail.png
│   │       ├── maiThumbnail.png
│   │       └── ryuThumbnail.png
│   ├── components/
│   │   ├── Browse/
│   │   │   └── MoveBrowser.jsx
│   │   ├── Card/
│   │   │   └── MoveCard.jsx
│   │   ├── Character/
│   │   │   └── (empty - future use)
│   │   ├── Punish/
│   │   │   └── PunishCalculator.jsx
│   │   ├── Search/
│   │   │   └── SearchResults.jsx
│   │   └── CharacterCards.jsx
│   ├── data/
│   │   └── characters/
│   │       ├── index.js
│   │       ├── ken.json
│   │       ├── terry.json
│   │       ├── chunli.json
│   │       ├── luke.json
│   │       ├── cammy.json
│   │       ├── mai.json
│   │       └── ryu.json
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## Data Architecture

### Character JSON Schema

Each character file follows this structure:

```json
{
  "character": {
    "id": "string",           // Unique identifier (e.g., "ken")
    "name": "string",         // Full display name
    "displayName": "string",  // Short name for UI
    "archetype": "string",    // Fighting style category
    "description": "string",  // Character description
    "version": "string",      // Data version
    "lastUpdated": "string"   // ISO date
  },
  
  "tactics": {
    "neutral": {
      "name": "string",
      "description": "string",
      "icon": "string",       // Emoji icon
      "moveIds": ["string"]   // References to moves
    },
    "offensive": { ... },
    "combo": { ... },
    "corner": { ... }
  },
  
  "moves": {
    "move_id": {
      "id": "string",
      "displayName": "string",
      "shortName": "string",
      "notation": "string",
      "input": "string",
      "category": "string",   // normal|unique|special|super|throw|common
      "damage": number,
      
      "yourPerspective": {
        "tacticalUse": "string",
        "whenToUse": "string",
        "situations": ["string"],
        "range": "string",
        "connectsTo": ["string"],  // Move IDs this connects to
        "executionDifficulty": "string"
      },
      
      "opponentPerspective": {
        "frameAdvantage": {
          "onBlock": number|null,
          "onHit": number|null
        },
        "riskLevel": "string",     // safe|medium|unsafe|very_unsafe
        "riskDescription": "string"
      },
      
      "frameData": {
        "startup": number|null,
        "active": number|null,
        "recovery": number|null,
        "total": number|null
      },
      
      "properties": {
        "hitLevel": "string",      // high|mid|low|throw|none
        "cancelable": boolean,
        // Optional properties:
        "invincible": "string",
        "superArmor": "string",
        "projectile": boolean,
        "airborne": "string",
        "comboScaling": "string",
        "minimumDamage": "string"
      }
    }
  }
}
```

### Move Categories

| Category | Description | Count (Total) |
|----------|-------------|---------------|
| `normal` | Standing, crouching, jumping attacks | 122 |
| `unique` | Command normals (e.g., →+MP) | 46 |
| `special` | Motion input specials | 219 |
| `super` | Super Arts, Critical Arts | 66 |
| `throw` | Normal and command throws | 15 |
| `common` | Universal mechanics (DI, parry, etc.) | 70 |

### Data Relationships

```
Character
    │
    ├── Tactics (groups moves by situation)
    │       │
    │       └── moveIds[] → references Move objects
    │
    └── Moves
            │
            └── connectsTo[] → references other Move IDs
```

---

## Component Architecture

### Component Hierarchy

```
App.jsx
├── Navigation (sticky)
└── Routes
    ├── "/" → CharacterCards
    │           └── CharacterCard (×7)
    │
    ├── "/characters" → CharacterCards
    │
    ├── "/browse" → MoveBrowser
    │                 └── MoveCard (×N)
    │
    ├── "/punish" → PunishCalculator
    │
    └── "/search" → SearchResults
                      └── MoveCard (×N)
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `App.jsx` | Routing, global state, navigation |
| `CharacterCards.jsx` | Character selection grid, search bar |
| `MoveBrowser.jsx` | Browse moves by tactic category |
| `MoveCard.jsx` | Flippable card with move details |
| `PunishCalculator.jsx` | Find punishes by frame advantage |
| `SearchResults.jsx` | Cross-character search results |

### State Management

Currently using React's built-in state:

```jsx
// App.jsx - Global state
const [selectedCharacter, setSelectedCharacter] = useState(kenData);
const [searchQuery, setSearchQuery] = useState('');

// Derived data
const allCharacters = [kenData, terryData, chunliData, ...];
```

**Future consideration:** If state becomes complex, consider:
- React Context for theme/preferences
- Zustand for global state
- React Query for async data (if backend added)

---

## Routing Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | CharacterCards | Home/character select |
| `/characters` | CharacterCards | Same as home |
| `/browse` | MoveBrowser | Browse selected character's moves |
| `/punish` | PunishCalculator | Punish lookup tool |
| `/search` | SearchResults | Cross-character search |

### Navigation Flow

```
CharacterCards → (select character) → MoveBrowser
                                         ↓
                                    MoveCard (flip)
                                         ↓
                              Your Perspective ↔ Opponent Perspective
```

---

## Key Features Implementation

### 1. Flippable Cards

```jsx
// MoveCard.jsx concept
const [isFlipped, setIsFlipped] = useState(false);

return (
  <div onClick={() => setIsFlipped(!isFlipped)}>
    {isFlipped ? (
      <OpponentPerspective move={move} />
    ) : (
      <YourPerspective move={move} />
    )}
  </div>
);
```

### 2. Cross-Character Search

```jsx
// SearchResults.jsx concept
const results = allCharacters.flatMap(char => 
  Object.values(char.moves).filter(move =>
    move.displayName.toLowerCase().includes(query) ||
    move.notation.toLowerCase().includes(query) ||
    move.input.toLowerCase().includes(query)
  ).map(move => ({ ...move, character: char.character.name }))
);
```

### 3. Punish Calculator

```jsx
// PunishCalculator.jsx concept
const findPunishes = (frameDisadvantage) => {
  return Object.values(characterData.moves).filter(move =>
    move.frameData.startup <= Math.abs(frameDisadvantage)
  ).sort((a, b) => b.damage - a.damage);
};
```

### 4. Scroll-to-Top on Navigation

```jsx
// App.jsx
const location = useLocation();

useEffect(() => {
  window.scrollTo(0, 0);
}, [location.pathname]);
```

---

## Styling Architecture

### Tailwind Configuration

Using default Tailwind with custom color usage:

| Color | Usage |
|-------|-------|
| `gray-900` | Background |
| `gray-800` | Card backgrounds, nav |
| `gray-700` | Borders, secondary elements |
| `purple-*` | Accent color, CTAs |
| `red-*` | Unsafe moves, warnings |
| `green-*` | Safe moves, positive |
| `yellow-*` | Caution, medium risk |

### Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |

### Component Styling Pattern

```jsx
// Consistent class ordering
className="
  {/* Layout */}
  flex items-center justify-between
  {/* Sizing */}
  w-full h-12 px-4 py-2
  {/* Colors */}
  bg-gray-800 text-white
  {/* Borders */}
  border border-gray-700 rounded-lg
  {/* Effects */}
  shadow-lg
  {/* Transitions */}
  transition-all duration-300
  {/* States */}
  hover:bg-gray-700 focus:ring-2
"
```

---

## Performance Considerations

### Current Optimizations

1. **Static JSON imports** - No runtime fetching
2. **Vite bundling** - Tree-shaking, code splitting
3. **Lazy image loading** - Thumbnails load on demand

### Future Optimizations

1. **Route-based code splitting**
   ```jsx
   const MoveBrowser = lazy(() => import('./components/Browse/MoveBrowser'));
   ```

2. **Virtual scrolling** for large move lists
   ```jsx
   // Consider react-window for 50+ items
   ```

3. **Image optimization**
   - WebP format
   - Responsive srcset
   - Blur placeholder

4. **Service Worker** for offline access (PWA)

---

## Testing Strategy (Future)

### Unit Tests
- Move data validation
- Frame data calculations
- Search filtering logic

### Component Tests
- Card flip interaction
- Navigation flow
- Form submissions

### E2E Tests
- Full user flows
- Cross-browser compatibility

### Tools
- Vitest (unit)
- React Testing Library (component)
- Playwright (E2E)

---

## Deployment Pipeline

### Current Flow

```
Local Development
      ↓
   git push
      ↓
GitHub Repository
      ↓
Vercel Auto-Deploy
      ↓
Production (vercel.app)
```

### Environment Variables

Currently none required (all static data).

Future needs:
- `VITE_API_URL` - If backend added
- `VITE_ANALYTICS_ID` - For tracking

---

## Security Considerations

### Current State
- No user authentication
- No sensitive data
- All data is public frame data
- No backend/API

### Future Considerations
- If adding accounts: OAuth (Google, Discord)
- If adding API: Rate limiting, CORS
- Input sanitization for user-generated content

---

## Extensibility Points

### Adding New Characters

1. Create `src/data/characters/newchar.json`
2. Add thumbnail to `src/assets/characters/`
3. Update `src/data/characters/index.js`
4. Add to `allCharacters` array in `App.jsx`
5. Add card config to `CharacterCards.jsx`

**Time estimate:** ~2 hours with PDF data

### Adding New Features

| Feature | Files to Modify |
|---------|-----------------|
| New route | `App.jsx`, new component |
| New move property | JSON schema, `MoveCard.jsx` |
| New filter | `SearchResults.jsx` or `MoveBrowser.jsx` |
| New tactic category | JSON files, `MoveBrowser.jsx` |

---

## Known Limitations

1. **No backend** - Can't sync across devices
2. **No user accounts** - Bookmarks are device-specific
3. **Static data** - Manual updates for patches
4. **English only** - No i18n support
5. **No offline mode** - Requires internet (easily fixable with PWA)

---

## Future Architecture Considerations

### If Adding Backend

```
Frontend (React)
      ↓
   REST API
      ↓
Backend (Node.js/Express or Serverless)
      ↓
Database (PostgreSQL or MongoDB)
```

### If Adding Real-time Features

```
Frontend ←→ WebSocket ←→ Backend
                           ↓
                      Redis (pub/sub)
```

### If Adding AI Features

```
Frontend → API → Claude/GPT
                     ↓
            "Analyze my replay"
            "Suggest training focus"
```

---

*Last updated: November 30, 2025*
*Architecture version: 1.0*
