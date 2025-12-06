# SF6 Combo Trainer - User Preferences & Coding Standards
## Consistency Guide for Development

**Last Updated:** December 1, 2025
**Developer:** thanhledesign (learning coder)
**Philosophy:** Best practices for maintainable, readable code

---

## 👤 Developer Profile

- **Experience Level:** New to coding
- **Primary Language:** JavaScript/React
- **Learning Goals:** Build production-quality apps with proper practices
- **Preferred Approach:** Explicit, readable code over clever shortcuts

---

## 📝 Code Style Guidelines

### React Component Structure

**Use functional components with hooks (not class components):**

```jsx
// ✅ GOOD - Functional component with hooks
const MoveCard = ({ move, compact = false }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  return (
    <div className="...">
      {/* content */}
    </div>
  );
};

export default MoveCard;

// ❌ BAD - Class component (outdated pattern)
class MoveCard extends React.Component {
  // Don't use this pattern
}
```

### File Organization

**One component per file, named after the component:**

```
src/components/
├── Card/
│   └── MoveCard.jsx       ✅ Component matches filename
├── Browse/
│   └── MoveBrowser.jsx
└── Search/
    └── SearchResults.jsx
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `MoveCard`, `SearchResults` |
| Files | PascalCase.jsx | `MoveCard.jsx` |
| Functions | camelCase | `handleClick`, `fetchData` |
| Variables | camelCase | `isLoading`, `userData` |
| Constants | UPPER_SNAKE | `MAX_RESULTS`, `API_URL` |
| CSS Classes | kebab-case | `move-card`, `search-input` |
| JSON keys | camelCase | `displayName`, `frameData` |

### Import Order

```jsx
// 1. React and hooks
import React, { useState, useEffect, useMemo } from 'react';

// 2. Third-party libraries
import { useNavigate, useParams } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';

// 3. Local components
import MoveCard from '../Card/MoveCard';

// 4. Data/utilities
import kenData from '../../data/characters/ken.json';

// 5. Assets
import kenThumbnail from '../../assets/characters/kenThumbnail.png';

// 6. Styles (if any)
import './styles.css';
```

### Component Props

**Destructure props with defaults:**

```jsx
// ✅ GOOD - Clear, with defaults
const MoveCard = ({ 
  move, 
  showCharacter = false, 
  characterName = '',
  compact = false 
}) => {
  // ...
};

// ❌ BAD - Unclear, no defaults
const MoveCard = (props) => {
  const x = props.move;
  // ...
};
```

### State Management

**Use descriptive state names:**

```jsx
// ✅ GOOD - Clear what each state represents
const [isFlipped, setIsFlipped] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [selectedCategory, setSelectedCategory] = useState('all');

// ❌ BAD - Vague names
const [flip, setFlip] = useState(false);
const [query, setQuery] = useState('');
const [cat, setCat] = useState('all');
```

### Comments

**Comment the "why", not the "what":**

```jsx
// ✅ GOOD - Explains reasoning
// Counter Hit adds +2 frames, Punish Counter adds +4
const getAdjustedFrames = (baseFrames, type) => {
  switch (type) {
    case 'counter': return baseFrames + 2;
    case 'punishCounter': return baseFrames + 4;
    default: return baseFrames;
  }
};

// ❌ BAD - States the obvious
// This function adds frames
const getAdjustedFrames = (baseFrames, type) => {
  // Check if counter
  if (type === 'counter') {
    // Add 2
    return baseFrames + 2;
  }
};
```

### Conditional Rendering

**Use clear patterns:**

```jsx
// ✅ GOOD - Clear conditions
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// ✅ GOOD - Ternary for simple either/or
{isFlipped ? <BackSide /> : <FrontSide />}

// ✅ GOOD - Early return for complex conditions
if (!move) return null;
if (isLoading) return <Spinner />;
return <MoveCard move={move} />;

// ❌ BAD - Nested ternaries (hard to read)
{isLoading ? <Spinner /> : error ? <Error /> : data ? <Data /> : null}
```

---

## 🎨 Styling Guidelines

### Tailwind Classes

**Order classes consistently:**

```jsx
className="
  {/* 1. Layout */}
  flex items-center justify-between
  {/* 2. Sizing */}
  w-full h-12 px-4 py-2
  {/* 3. Colors */}
  bg-gray-800 text-white
  {/* 4. Borders */}
  border border-gray-700 rounded-lg
  {/* 5. Effects */}
  shadow-lg
  {/* 6. Transitions */}
  transition-all duration-300
  {/* 7. Hover/Focus states */}
  hover:bg-gray-700 focus:ring-2
"
```

### Color Palette (Stay Consistent)

| Usage | Tailwind Class |
|-------|----------------|
| Background | `bg-gray-900` |
| Cards/Modals | `bg-gray-800` |
| Borders | `border-gray-700` |
| Primary accent | `purple-600` |
| Success/Safe | `green-500` |
| Danger/Unsafe | `red-500` |
| Warning | `yellow-500` |
| Muted text | `text-gray-400` |

### Responsive Design

**Mobile-first approach:**

```jsx
// ✅ GOOD - Base = mobile, then scale up
className="
  grid-cols-1          // Mobile: 1 column
  md:grid-cols-2       // Tablet: 2 columns
  lg:grid-cols-3       // Desktop: 3 columns
"

// ❌ BAD - Desktop-first (harder to maintain)
className="
  grid-cols-3
  md:grid-cols-2
  sm:grid-cols-1
"
```

---

## 📁 File Structure Standards

```
sf6-combo-trainer/
├── docs/                    # Documentation
│   ├── SESSION-LOG.md
│   ├── KNOWN-ISSUES.md
│   ├── USER-PREFERENCES.md  # This file
│   ├── ENVIRONMENT.md
│   └── INTAKE-TEMPLATE.md
├── public/
│   └── videos/              # Move demonstration videos
│       └── [character]/
├── src/
│   ├── assets/
│   │   └── characters/      # Character thumbnails
│   ├── components/
│   │   ├── Browse/          # Feature-based folders
│   │   ├── Card/
│   │   ├── Navigation/
│   │   ├── Punish/
│   │   └── Search/
│   ├── data/
│   │   └── characters/      # JSON data files
│   ├── hooks/               # Custom hooks (future)
│   ├── utils/               # Utility functions (future)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## ✅ Code Review Checklist

Before committing code, verify:

- [ ] Component has clear, descriptive name
- [ ] Props are destructured with defaults
- [ ] State names are descriptive
- [ ] No unused imports or variables
- [ ] Consistent Tailwind class ordering
- [ ] Mobile-first responsive design
- [ ] Comments explain "why" not "what"
- [ ] No console.log statements left in
- [ ] Build passes without errors
- [ ] No new eslint warnings

---

## 🚫 Anti-Patterns to Avoid

### Don't Do This:

```jsx
// ❌ Inline styles (use Tailwind instead)
<div style={{ backgroundColor: 'red' }}>

// ❌ Magic numbers without explanation
if (scrollY > 300) {  // Why 300?

// ❌ Deeply nested ternaries
{a ? b ? c : d : e ? f : g}

// ❌ Mutating state directly
state.items.push(newItem);  // Use setItems([...items, newItem])

// ❌ useEffect without dependencies
useEffect(() => {
  // This runs on EVERY render!
});

// ❌ Index as key (unless list is static)
{items.map((item, index) => <Item key={index} />)}
```

### Do This Instead:

```jsx
// ✅ Tailwind classes
<div className="bg-red-500">

// ✅ Named constants with comments
const STICKY_THRESHOLD = 300; // Height of hero section
if (scrollY > STICKY_THRESHOLD) {

// ✅ Clear conditionals
const content = useMemo(() => {
  if (a) return <ComponentA />;
  if (b) return <ComponentB />;
  return <Default />;
}, [a, b]);

// ✅ Immutable state updates
setItems([...items, newItem]);

// ✅ Explicit dependencies
useEffect(() => {
  // Runs when searchQuery changes
}, [searchQuery]);

// ✅ Unique IDs as keys
{items.map((item) => <Item key={item.id} />)}
```

---

## 📚 Learning Resources

If you want to understand why these patterns are recommended:

1. **React Docs:** https://react.dev/learn
2. **Tailwind Docs:** https://tailwindcss.com/docs
3. **JavaScript.info:** https://javascript.info/
4. **Kent C. Dodds Blog:** https://kentcdodds.com/blog

---

*This document defines the coding standards for this project. All contributions should follow these guidelines.*
