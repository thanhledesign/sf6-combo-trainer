# SF6 Combo Trainer

A Street Fighter 6 learning tool focused on counterplay education.

## Features

- ✅ 7 characters with 538 moves
- ✅ Bidirectional cards (flip to see opponent perspective)
- ✅ Hit type toggle (Normal/Counter Hit/Punish Counter)
- ✅ Video demonstrations
- ✅ Cross-character search
- ✅ Punish Calculator
- ✅ Mobile-responsive design

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Setup Notes

### Character Thumbnails
Add character thumbnail images to `src/assets/characters/`:
- kenThumbnail.png
- terryThumbnail.png
- chunliThumbnail.png
- lukeThumbnail.png
- cammyThumbnail.png
- maiThumbnail.png
- ryuThumbnail.png

### Video Demonstrations
Videos are stored in `public/videos/{character}/`

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- React Router 6
- Lucide React (icons)

## Project Structure

```
src/
├── assets/characters/     # Character thumbnails
├── components/
│   ├── Browse/           # Move browser
│   ├── Card/             # Move card component
│   ├── Punish/           # Punish calculator
│   ├── Search/           # Search results
│   └── CharacterCards.jsx
├── data/characters/      # Character JSON data
├── App.jsx               # Main app with routing
├── main.jsx              # Entry point
└── index.css             # Tailwind imports
```

## Documentation

See `SF6-MASTER-HANDOFF.md` for complete project documentation including:
- Competitive analysis vs FullMeter
- Development roadmap
- Technical implementation details
- User feedback insights

## License

Private project
