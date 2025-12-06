# SF6 Combo Trainer - Session Intake Template
## How to Continue Development in New Claude Sessions

**Last Updated:** December 1, 2025

---

## 🚀 Quick Start (Copy-Paste This)

When starting a new Claude session, copy this template into your first message:

```markdown
## SF6 Combo Trainer - Part [X] Continuation

### Uploads Attached:
- [ ] sf6-complete-project.zip (source code)
- [ ] sf6-documentation.zip (all docs)
- [ ] Character thumbnails (if updated)

### Repository:
https://github.com/thanhledesign/sf6-combo-trainer

### Live Site:
https://sf6-combo-trainer.vercel.app

### Last Session Summary:
[What was accomplished in the previous session]

### This Session Goal:
[What you want to work on today]

### Known Blockers:
[Any issues or bugs you're aware of]

---

Please:
1. Extract the zip files
2. Read the documentation (especially SF6-MASTER-HANDOFF.md)
3. Review the current code state
4. Confirm build passes
5. Summarize what you understand before we start
```

---

## 📦 Files to Upload

### Required (Every Session)

| File | Contents | Why Needed |
|------|----------|------------|
| `sf6-complete-project.zip` | All source code | Claude needs the actual code |
| `sf6-documentation.zip` | All docs in `/docs` | Context and history |

### Optional (When Updated)

| File | When to Include |
|------|-----------------|
| Character thumbnails (7 PNGs) | If images were updated |
| New video files | If demo videos were added |
| Screenshots | If reporting visual bugs |

### How to Create the Zips

**On Mac:**
```bash
cd ~/path/to/sf6-combo-trainer

# Create source code zip (excludes node_modules)
zip -r sf6-complete-project.zip . -x "node_modules/*" -x ".git/*" -x "dist/*"

# Create docs zip
zip -r sf6-documentation.zip docs/
```

**On Windows (PowerShell):**
```powershell
# Navigate to project
cd C:\path\to\sf6-combo-trainer

# Create zips (manually exclude node_modules)
Compress-Archive -Path src,public,*.json,*.js,*.html -DestinationPath sf6-complete-project.zip
Compress-Archive -Path docs -DestinationPath sf6-documentation.zip
```

---

## 📋 What Claude Will Do

When you provide the intake template, Claude will:

### Phase 1: File Extraction
```bash
unzip sf6-complete-project.zip -d sf6-combo-trainer
unzip sf6-documentation.zip -d sf6-combo-trainer
```

### Phase 2: Document Review (in this order)
1. `SF6-MASTER-HANDOFF.md` - Current project state
2. `SESSION-LOG.md` - What happened in previous sessions
3. `KNOWN-ISSUES.md` - Active bugs to avoid
4. `USER-PREFERENCES.md` - Coding style to follow
5. `ENVIRONMENT.md` - Deployment info
6. `SF6-Development-Roadmap.md` - Feature priorities

### Phase 3: Code Verification
```bash
cd sf6-combo-trainer
npm install
npm run build
```

### Phase 4: State Confirmation
Claude will summarize:
- ✅ What features are complete
- 📋 What's planned next
- 🐛 Known issues to be aware of
- 🎯 Ready to work on [your stated goal]

---

## 📚 Documentation Map

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| `SF6-MASTER-HANDOFF.md` | Complete project state | Every session |
| `SESSION-LOG.md` | Development history | Every session |
| `KNOWN-ISSUES.md` | Bug tracker | When bugs found/fixed |
| `USER-PREFERENCES.md` | Coding standards | Rarely |
| `ENVIRONMENT.md` | Deployment info | When infra changes |
| `SF6-Development-Roadmap.md` | Feature priorities | When priorities change |
| `SF6-Technical-Architecture.md` | How it's built | When architecture changes |
| `SF6-Design-System.md` | Styling guide | When design changes |
| `SF6-User-Feedback-Testing.md` | User insights | When feedback received |
| `SF6-Complete-Character-Data-Reference.md` | All 538 moves | When moves added |

---

## 🎯 Session Goal Examples

Good session goals are **specific and achievable**:

### ✅ Good Goals

```markdown
### This Session Goal:
- Add the Flash Card Study Mode feature
- Create quiz UI with multiple choice
- Implement spaced repetition logic
```

```markdown
### This Session Goal:
- Fix Issue #003 (offline support)
- Add PWA service worker
- Test offline functionality
```

```markdown
### This Session Goal:
- Add 3 new characters (Juri, Akuma, Rashid)
- Use the PDF intake workflow
- Update character selector
```

### ❌ Vague Goals

```markdown
### This Session Goal:
- Make the app better
- Fix some stuff
- Add features
```

---

## 🔄 End of Session Checklist

Before ending a session, ask Claude to:

1. **Update SESSION-LOG.md** with what was accomplished
2. **Update KNOWN-ISSUES.md** if bugs were found/fixed
3. **Update SF6-MASTER-HANDOFF.md** if major changes
4. **Create new zip** of updated project
5. **Commit to GitHub** if ready

```markdown
Before we end, please:
1. Update the session log with what we did
2. Note any new issues discovered
3. Create an updated project zip for my next session
4. Summarize what's ready vs still in progress
```

---

## 🆘 Troubleshooting

### "Claude doesn't remember the project"

Claude has no memory between sessions. You MUST upload:
- The project zip
- The documentation

### "Build fails after extraction"

Common fixes:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### "Missing component errors"

Check that all files were included in the zip. The zip should contain:
- `src/components/` (all .jsx files)
- `src/data/characters/` (all .json files)
- `src/assets/characters/` (all .png files)

### "Claude made changes I don't want"

Always review changes before committing. Ask Claude to explain changes:
```markdown
Before I accept these changes, can you explain:
1. What files were modified?
2. What specifically changed in each file?
3. Why was this change necessary?
```

---

## 📝 Template Variations

### Quick Bug Fix Session

```markdown
## SF6 Combo Trainer - Bug Fix

### Uploads: sf6-complete-project.zip, sf6-documentation.zip

### Bug to Fix:
[Describe the bug - what happens, what should happen]

### Steps to Reproduce:
1. Go to [page]
2. Click [thing]
3. See [error]

### Screenshot:
[Attach if visual bug]
```

### New Feature Session

```markdown
## SF6 Combo Trainer - New Feature

### Uploads: sf6-complete-project.zip, sf6-documentation.zip

### Feature: [Feature Name]

### Requirements:
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

### Reference:
[Link to similar feature, Figma design, or description]
```

### Code Review Session

```markdown
## SF6 Combo Trainer - Code Review

### Uploads: sf6-complete-project.zip, sf6-documentation.zip

### Please Review:
- [ ] Code follows USER-PREFERENCES.md standards
- [ ] No obvious bugs or issues
- [ ] Performance considerations
- [ ] Accessibility check
- [ ] Mobile responsiveness

### Specific Concerns:
[Any areas you're unsure about]
```

---

*This template ensures consistent, productive sessions every time.*
