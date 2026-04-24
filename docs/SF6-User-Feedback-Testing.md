# SF6 Combo Trainer - User Feedback & Testing Data

---

## Feedback Entry #1
**Date:** November 29, 2025
**From:** Matt (SF6 Discord)
**Context:** Early build review (1-2 characters added)

### Raw Feedback:

> "Yeah thanh also feeling stuck. I think the hard part about just frame data is it's not obvious what the actual mixup is. Like yeah if Ken is doing jinrai i can DI, but the mix is whether you do diff versions and you have time to counter DI."

> "I need shit like sajam or chrisF videos that tell you what the mix is and whether there's an option select that beats it"

> "I think this is sick, i think once the baseline is in, next level is to include the common strings and sequences. Like for example, go into ryus doing 2MK into donkey kick. Safe if spaced, but PC if too close. Also DI is counter but not 100%"

> "I like the list of links on reg hit or PC"

---

### Key Insights Extracted:

#### 1. **Frame data alone isn't enough** ⚠️
- Users know the numbers but don't understand the *actual mixup situations*
- Example: Ken's Jinrai - you can DI, but timing depends on which version he uses
- **Gap identified:** Need situational context, not just raw data

#### 2. **Wants "Sajam/ChrisF-style" explanations**
- Video content creators explain the *why* and *option selects*
- Users want to know: "Is there an option select that beats this?"
- **Gap identified:** Need strategic guidance beyond frame data

#### 3. **Common strings/sequences are the "next level"** 🎯
- Example: Ryu's 2MK into High Blade Kick (donkey kick)
  - Safe if spaced correctly
  - Punish Counter if too close
  - DI is a counter but not 100%
- **Feature request:** Document common pressure strings with spacing context

#### 4. **Likes the "links on regular hit or PC" feature** ✅
- Positive feedback on showing different follow-ups based on hit type
- This aligns with our connectsTo data structure

---

### Impact on Development Plan:

#### GOOD - Validates Our Direction:
- ✅ Bidirectional card design (opponent perspective) is right approach
- ✅ "Opponent Move Database" feature (#3) directly addresses his needs
- ✅ Risk assessment warnings align with his spacing concerns

#### REVEALS NEW PRIORITY - "Common Strings" Feature:
Matt's suggestion about documenting common strings/sequences is **not currently in our plan** but could be huge:

**Proposed: "Pressure String Database"**
- Document common multi-move sequences (e.g., "2MK > 236HK")
- Show: Is it true? Gaps? Spacing dependent?
- Show: Counterplay options (DI timing, interrupt points, option selects)
- This is the "next level" beyond individual move frame data

#### POTENTIAL GAP - Video/Visual Content:
- Matt references Sajam/ChrisF videos
- Our app is text/data focused
- Options:
  1. Link out to existing video resources
  2. Add GIFs for key situations
  3. Accept that we complement (not replace) video content

---

### Recommendations Based on Feedback:

| Priority | Feature | Why |
|----------|---------|-----|
| **HIGH** | Pressure String Database | Matt explicitly requested "common strings and sequences" |
| **HIGH** | Opponent Move Database | Addresses "what's the actual mixup" question |
| **MEDIUM** | Spacing context notes | "Safe if spaced, PC if too close" - add to move descriptions |
| **MEDIUM** | Option select documentation | "Is there an OS that beats it?" |
| **LOW** | Video links/embeds | Complement Sajam/ChrisF content |

---

## Testing Notes:

### To Validate With Matt:
- [ ] Show him the 7-character build
- [ ] Ask about specific strings he wants documented
- [ ] Get feedback on current card flip UX
- [ ] Test Punish Calculator with him

---

*Last updated: November 30, 2025*
