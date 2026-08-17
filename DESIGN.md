# DESIGN.md
# Sahaay (सहाय) — UI Design System & Stitch Prompts
> Single source of truth for visual design. Every AI coding tool, designer, and contributor reads this before touching the UI.

---

## 0. Design Philosophy

Sahaay is a **crisis coordination tool** — not a consumer app. The visual language must communicate:
- **Urgency without panic** — critical information is always visible, never buried
- **Trust through density** — field workers and coordinators need data-rich screens, not marketing layouts
- **Speed of cognition** — a coordinator seeing 47 open needs must parse the most critical one in under 2 seconds

> Design tone: **"Google Maps meets an emergency dispatch room"** — functional, precise, alive.

---

## 1. Global Design Tokens

These tokens are the single source of truth. Every component references only these values.

```scss
// styles/_tokens.scss

:root {
  // Brand Colors
  --color-primary:        #0A6B5E;   // Deep teal — primary actions, headers
  --color-primary-light:  #E8F5F2;   // Teal tint — selected states, highlights
  --color-primary-mid:    #1D9E75;   // Mid teal — active indicators, badges
  --color-primary-dark:   #085041;   // Dark teal — pressed states

  // Semantic Colors
  --color-critical:       #DC2626;   // Red — critical urgency
  --color-high:           #D97706;   // Amber — high urgency
  --color-medium:         #2563EB;   // Blue — medium urgency
  --color-low:            #16A34A;   // Green — low / resolved
  --color-info:           #2563EB;   // Informational

  // Surfaces
  --color-surface:        #FAFAF9;   // Page background (warm off-white)
  --color-card:           #FFFFFF;   // Card background
  --color-overlay:        rgba(0,0,0,0.45); // Modal scrim

  // Borders
  --color-border:         #E5E3DF;   // Default border
  --color-border-strong:  #C9C7C3;   // Emphasized border

  // Text
  --color-text-primary:   #111110;   // Headlines, labels
  --color-text-secondary: #6B6965;   // Subtext, metadata
  --color-text-disabled:  #A8A5A1;   // Disabled states

  // Typography
  --font-display:  'DM Serif Display', serif;   // Headings, wordmark
  --font-ui:       'Inter', sans-serif;          // All UI text

  // Spacing Scale
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   12px;
  --space-lg:   16px;
  --space-xl:   24px;
  --space-2xl:  32px;
  --space-3xl:  48px;

  // Radius
  --radius-sm:     6px;
  --radius-md:     8px;
  --radius-input:  9px;
  --radius-card:   14px;
  --radius-pill:   20px;
  --radius-full:   9999px;

  // Elevation (shadows)
  --shadow-card:   0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-drawer: 0 -4px 24px rgba(0,0,0,0.12);
  --shadow-modal:  0 20px 60px rgba(0,0,0,0.18);

  // Layout
  --screen-pad:      12px;
  --bottom-nav-h:    56px;
  --top-bar-h:       56px;
}
```

---

## 2. Typography System

| Role | Font | Size | Weight | Usage |
|------|------|------|--------|-------|
| Wordmark | DM Serif Display | 24px | 400 | "Sahaay सहाय" top bar |
| Page Title | DM Serif Display | 28px | 400 | Tab headings |
| Section Title | DM Serif Display | 20px | 400 | Card group headings |
| Greeting | DM Serif Display | 22px | 400 | Home welcome line |
| Body | Inter | 14px | 400 | Card descriptions |
| Label | Inter | 13px | 500 | Form labels, card meta |
| Caption | Inter | 11px | 400 | Timestamps, secondary info |
| Stat Number | Inter | 28–36px | 700 | KPI metrics |
| Button | Inter | 13px | 600 | CTA text |
| Badge | Inter | 11px | 600 | Urgency pills |

---

## 3. Component Patterns

### 3.1 Urgency Badge / Pill
```
CRITICAL → bg #FEF2F2, text #DC2626, border #FECACA
HIGH     → bg #FFFBEB, text #D97706, border #FDE68A
MEDIUM   → bg #EFF6FF, text #2563EB, border #BFDBFE
LOW      → bg #F0FDF4, text #16A34A, border #BBF7D0
```
Specs: 20px border-radius, 3px 9px padding, 11px Inter 600, uppercase.

### 3.2 Urgency Left Bar (Need Cards)
4px wide left border on each card in the urgency color. Creates instant visual hierarchy without heavy color blocks.

### 3.3 Primary Button
```
bg: #0A6B5E | text: #FFFFFF | radius: 8px | height: 40px | padding: 0 16px
hover: bg #085041 | active: scale(0.98) | font: Inter 13px 600
```

### 3.4 Outline Button
```
bg: transparent | text: #0A6B5E | border: 1px solid #0A6B5E | same radius/height
hover: bg #E8F5F2
```

### 3.5 Stat Card (KPI metric)
```
bg: white | border: 1px solid #E5E3DF | radius: 14px | padding: 12px
Number: 28px Inter 700 in urgency/teal color
Label: 11px Inter 400 #6B6965 below the number
Icon: 20px in top-right corner, muted teal
```

### 3.6 Bottom Navigation
```
Height: 56px | bg: #FFFFFF | border-top: 1px solid #E5E3DF
5 items: Home, Map, Tasks, Volunteers, Insights
Active: icon filled teal + label teal 11px 600
Inactive: icon outline gray + label gray 11px 400
```

### 3.7 AI Feature Card (Gradient Strip)
```
bg: linear-gradient(135deg, #0A6B5E, #1D9E75)
text: white | radius: 14px | padding: 16px
Sparkle/AI icon top-left | Confidence progress bar inside
Two buttons: [Confirm] white bg teal text | [View] outline white
```

---

## 4. Tab-by-Tab Design Specs & Stitch Prompts

---

### TAB 1 — HOME
**Theme:** Mission Control · Warm authority · Data density with breathing room

**Color mood:** Deep teal primary, white cards, warm off-white (#FAFAF9) background. Numbers are the heroes — large, bold, instantly scannable.

**Key screens:** Dashboard overview, greeting, stat cards, critical needs list, AI match card

**Layout structure:**
```
[Top Bar: Wordmark + Bell + Avatar]
[Greeting section]
[Horizontal scroll: 4 Stat Cards]
[Section: "Needs Requiring Action" — 3 need cards]
[AI Match Card — teal gradient]
[Bottom Nav]
```

#### 🎨 Stitch Prompt — Home Tab (Full Screen)

```
Design a mobile-first Angular 18 PWA home dashboard for "Sahaay" — an NGO coordination platform for Mumbai, India. Make it feel like a premium mission control tool, not a consumer app.

DESIGN SYSTEM:
- Primary color: #0A6B5E (deep teal)
- Accent: #1D9E75
- Font headings: DM Serif Display (Google Fonts)
- Font UI: Inter (Google Fonts)
- Background: #FAFAF9 (warm off-white)
- Cards: white, 14px border-radius, 1px border #E5E3DF, subtle shadow
- All data must be real Mumbai/Dharavi NGO context. Zero lorem ipsum.

TOP BAR (56px, white, bottom border #E5E3DF):
- Left: "Sahaay" in DM Serif Display 22px teal + "सहाय" 14px muted beside it
- Center: empty
- Right: bell icon with red badge "3" + circular avatar "RK" (initials, teal bg, white text)

GREETING SECTION (padding 16px, bg #FAFAF9):
- "Good morning, Rahul" in DM Serif Display 24px #111110
- Below: "3 critical needs in Dharavi need immediate attention" — 14px #6B6965
- Small teal dot pulsing animation on left of the urgent message line

STAT CARDS (horizontal scroll row, 4 cards, 90px tall each, 12px gap):
Card 1 — "Open Needs" / 47 / red number / map-pin icon
Card 2 — "Volunteers Active" / 23 / green number / person icon
Card 3 — "In Progress" / 12 / amber number / checklist icon
Card 4 — "Resolved Today" / 8 / teal number / circle-check icon
Each card: white bg, 100px wide, large number 28px bold, label 11px gray below, icon top-right 18px muted

CRITICAL NEEDS SECTION:
Section header: "Needs Requiring Action" DM Serif 18px + "View all →" teal 13px right-aligned

3 need cards stacked (white, radius 14px, border, 4px LEFT urgency bar):

Card 1 — LEFT BAR: #DC2626 (red)
  Circle icon: stethoscope, red tint bg
  Title: "Dharavi — Medical Emergency" bold 14px
  Badge: "CRITICAL" red pill
  Desc: "Insulin shortage affecting 12 diabetic families" 13px muted
  Time: "2 min ago" + "Reported by Ananya M." 11px
  Button: [Assign Now] filled teal button right side
  Footer: "2 volunteers nearby · 0.8 km" teal micro-text

Card 2 — LEFT BAR: #D97706 (amber)
  Circle icon: fork/knife, amber tint bg
  Title: "Kurla — Food Distribution" bold 14px
  Badge: "HIGH" amber pill
  Desc: "80 ration packets needed, 200 families waiting" 13px muted
  Time: "18 min ago" + "Reported by Faiz K."
  Button: [Assign] outline teal button
  Footer: "5 volunteers nearby · 1.4 km"

Card 3 — LEFT BAR: #2563EB (blue)
  Circle icon: book, blue tint bg
  Title: "Govandi — Education Supplies"
  Badge: "MEDIUM" blue pill
  Desc: "School stationery for 60 students, new term starting"
  Time: "1 hr ago" + "Reported by Sunita P."
  Button: [View] outline gray button
  Footer: "3 volunteers nearby · 2.1 km"

AI MATCH CARD (teal gradient, radius 14px, padding 16px):
- Top row: sparkle ✦ icon + "AI Match Ready" white 13px 600
- Main text: "MatchAgent matched Priya Sharma (Medical, 1.2 km) for Dharavi emergency" white 15px DM Serif
- Confidence bar: "94% match" — thin progress bar, white filled, below text
- Buttons row: [Confirm Match] white bg teal text | [View All Matches] white outline

BOTTOM NAV (56px, white, top border):
Home (active, teal filled icon + "Home" teal 11px) | Map | Tasks | Volunteers | Insights
```

#### 🎨 Stitch Prompt — Home: Need Assignment Drawer

```
Design a bottom drawer / bottom sheet component for Sahaay NGO app that slides up when a coordinator taps a need card. 

DRAWER SPECS:
- Slides up 75% of screen height from bottom
- bg: white, top-left/right radius 20px
- Drag handle bar: 40px wide, 4px tall, #E5E3DF, centered top, 12px margin

HEADER SECTION:
- "CRITICAL" red badge + "Medical Emergency" DM Serif 20px on same line
- Location row: map-pin icon + "Dharavi, Sector 14" 14px
- Time: "Reported 2 minutes ago by Ananya M." 12px muted
- Full description: "12 diabetic families without insulin. Nearest pharmacy is 3.2 km. Requires cold-chain transport." 14px

PHOTO (if exists): 16:9 rounded image thumbnail with "View Photo" overlay

AI RECOMMENDATION BOX (teal light bg #E8F5F2, radius 10px, padding 12px):
- Sparkle icon + "MatchAgent Recommendation" teal 12px label
- "Priya Sharma is the best match — Medical background, 1.2 km away, available now"
- Confidence: 94% mini badge

TOP 3 VOLUNTEER CARDS (stacked list):
Each: Avatar circle (initials) + Name + Distance + Top skill badge + Availability dot (green=available)
1. Priya Sharma — 1.2 km — Medical — Available now ●
2. Rohan Verma — 2.1 km — First Aid — Available now ●
3. Meera Iyer — 3.4 km — Nursing — Available in 30 min ○

ACTION BUTTONS (bottom, full-width):
[Assign Priya Sharma] — filled teal, 48px height, full width
[Choose Different Volunteer] — outline, below
```

---

### TAB 2 — NEEDS MAP
**Theme:** Live intelligence · Dark map with floating glass cards · Emergency dispatch aesthetic

**Color mood:** Dark Google Maps basemap ("Aubergine" or custom dark navy). Urgency pins in vivid colors glow against the dark map. All UI floats as white cards over the map.

**Key screens:** Full-screen map, pin cluster view, heatmap toggle, filter drawer, proximity ring on need tap

**Layout structure:**
```
[Full-screen Google Map — 100% width and height]
[Floating top bar — search + filter]
[Floating bottom card — selected need or summary]
[Floating FAB — toggle heatmap/pins]
[Bottom Nav overlay]
```

#### 🎨 Stitch Prompt — Needs Map Tab (Full Screen)

```
Design a full-screen map view for "Sahaay" NGO app — the Needs Map tab. The map fills 100% of the viewport. All UI elements float over it as cards.

MAP:
- Google Maps with dark "Aubergine" style or custom dark navy theme (#1A2332 base)
- Centered: Dharavi, Mumbai (19.0383° N, 72.8527° E), zoom level 13
- Map fills 100% width and height — no padding, no border

CUSTOM MAP PINS (floating over map):
Use circular pins with urgency color fill and white icon inside. Pin has a small tail/pointer at bottom.

Pin types (show 8-10 scattered on map):
- CRITICAL (red #DC2626): 3 pins — stethoscope icon, food icon, shelter icon
- HIGH (amber #D97706): 3 pins — education icon, water icon, food icon
- MEDIUM (blue #2563EB): 2 pins — book icon, person icon
- LOW (green #16A34A): 2 pins — checkmark icon

Cluster: where 3+ pins overlap show a dark circle with count "5" inside

Heatmap Layer (when toggled on): Radial heat blobs in teal/amber/red at high-density areas — Dharavi (large red blob), Kurla (medium amber), Govandi (small blue)

FLOATING TOP BAR (glass card, blur bg, 12px horizontal margin, 8px top margin, 48px height, radius 12px):
- Search icon + "Search needs in Mumbai..." placeholder gray
- Filter icon button right side (shows active filter count badge if filters set)
- Below search (when no filter active): 3 urgency filter pills: [All] [Critical 12] [High 8] [Medium 15] — teal for active, white outline for inactive

FLOATING PROXIMITY RING (when a pin is tapped):
- Dashed circle 5km radius centered on need pin
- Teal color, 2px dashed stroke
- Small volunteer avatar dots scattered inside the ring showing nearby volunteers

FLOATING BOTTOM CARD (slides up 220px when a pin is tapped, stays minimized 60px otherwise):
MINIMIZED state: "47 open needs across Mumbai" + [View List] button

EXPANDED state (when pin tapped) — white card, radius 20px top corners, shadow:
- Row 1: Urgency badge + Need title in DM Serif 18px + close X button
- Row 2: location + time metadata 12px muted
- Row 3: Description 13px, 2 lines max
- Row 4: "MatchAgent found 3 volunteers nearby" teal micro-card with volunteer count chips
- Buttons: [Assign Volunteer →] filled teal | [Navigate] outline with arrow icon

FLOATING ACTION BUTTON (bottom right, above bottom nav, 56px circle, teal):
- Default: layers icon (toggle between pin/heatmap/cluster view)
- Show tooltip "Heatmap" when in heatmap mode

FLOATING LEGEND (top-left, small glass card):
4 colored dots + labels: Critical · High · Medium · Low

TIME SLIDER (only in heatmap mode, floating bottom above card):
A thin horizontal slider "Replay past 8 weeks" with week labels, thumb shows week on drag

BOTTOM NAV: semi-transparent white (80% opacity), blur backdrop, Map tab active teal
```

#### 🎨 Stitch Prompt — Map: Filter Drawer

```
Design a bottom filter drawer for Sahaay Needs Map. Slides up 60% of screen, white bg, radius 20px top corners.

HEADER: "Filter Needs" DM Serif 18px + [Reset All] teal text button right + drag handle top

FILTER SECTIONS (each with section label 11px uppercase muted, options as multi-select chips):

Urgency Level (multi-select chips):
[● Critical] [● High] [● Medium] [● Low]
Active chip: teal bg white text. Inactive: white bg gray border.

Category (horizontal scroll chips):
[Medical] [Food] [Education] [Shelter] [Water] [Other]
Icons inside each chip.

Status:
[Open] [Assigned] [In Progress] [Resolved]

Distance Range (slider):
"Within" label + slider from 1km to 20km + "5 km" live readout in teal

Date Range (two date pills side by side):
[From: 01 Jan] [To: Today] — teal outlined

APPLY BUTTON (full width, 48px, teal filled): "Show 23 Needs"
Count updates live as filters change.
```

---

### TAB 3 — TASKS
**Theme:** Operational command · Kanban energy · Amber/teal accent · Dense but ordered

**Color mood:** Warm white background. Amber (#D97706) as accent for in-progress states. Status columns feel like physical kanban lanes. Each task card is a mini mission brief.

**Key screens:** Task list with status tabs, task detail, create task flow, task timeline

**Layout structure:**
```
[Top Bar: "Tasks" title + Create button]
[Status Tab Strip: Open | Assigned | In Progress | Resolved]
[Task Cards List — scrollable]
[FAB: + New Task]
[Bottom Nav]
```

#### 🎨 Stitch Prompt — Tasks Tab (Full Screen)

```
Design the Tasks tab for "Sahaay" NGO coordination app. Mobile-first, Angular 18 feel, premium NGO operations tool.

DESIGN: Primary #0A6B5E teal, amber #D97706 for in-progress accent, Inter font, DM Serif for titles.

TOP BAR:
Left: "Tasks" DM Serif 24px
Right: filter icon (outline) + [+ New Task] small teal filled button (32px height, 8px radius)
Below: summary line "12 tasks active · 3 overdue" 13px muted

STATUS TABS (horizontal tabs strip, full width, white bg, bottom border):
[Open 18] [Assigned 7] [In Progress 12] [Resolved 47]
Active tab: bottom 2.5px teal border + teal text. Count in small badge.

TASK CARD (full width, white, radius 14px, border, 1px left urgency bar, shadow-card):
Row 1: Task ID "#T-042" muted 11px + Category badge (Medical/Food/etc) + [Priority] red/amber pill + overflow menu ···
Row 2: Task title "Insulin Delivery — Dharavi Sector 14" bold 15px DM Serif
Row 3: Description 13px gray 1 line
Row 4: Progress bar (if In Progress) — thin, teal filled, percentage below "67% complete"
Row 5: Bottom row — 3 metadata chips:
  📍 Dharavi  |  👤 Priya Sharma  |  ⏰ Due: Today 5pm (red if overdue)

Show 4 task cards covering different statuses and categories:

Card A (left bar red, CRITICAL): #T-038 · Medical · CRITICAL
"Emergency insulin delivery for 12 families"
Assigned to: Priya Sharma · Due: Today 3pm [OVERDUE red]
Progress: 0% (Open status)
Button: [Assign Volunteer] teal

Card B (left bar amber, HIGH): #T-041 · Food · HIGH
"Kurla food distribution — 80 ration packets"
Assigned to: Rohan Verma · Due: Tomorrow 10am
Progress bar: 35% amber-filled
Status chip: [IN PROGRESS] amber

Card C (left bar blue, MEDIUM): #T-044 · Education · MEDIUM
"Govandi school stationery procurement"
Assigned to: Unassigned (show "⚠ Unassigned" amber warning)
Due: 3 days
Button: [Assign Now] outline

Card D (left bar green, RESOLVED): #T-029 · Shelter · LOW
"Bhandup temporary shelter setup"
Assigned to: Meera Iyer · Completed: Yesterday
Progress: 100% — [RESOLVED] green chip
"Resolved in 4h 20min · 3 volunteers" gray caption

FAB (bottom right, teal circle 56px, + icon white, shadow):
Tap expands into speed-dial: [New Need] [New Task] [Assign Volunteer]

FLOATING OVERDUE BANNER (top, sticky, below tab strip, if any overdue):
Red tint strip: "⚠ 3 tasks are overdue — [Review Now]" 13px
```

#### 🎨 Stitch Prompt — Tasks: Create Task Flow

```
Design a Create New Task bottom sheet / modal for Sahaay NGO app.

Full-screen modal (slides up), white bg, top radius 20px, drag handle.

HEADER: [← Back] icon + "Create Task" DM Serif 20px center + [Save Draft] teal text right

FORM SECTIONS:

Section 1 — "Link to Need" (required):
Search input: "Search open needs..." with location pin icon
Below: recent needs chips: [Dharavi Medical ×] [Kurla Food] [Govandi Education]
Selected need shows as a teal-bordered card preview with need title + urgency badge

Section 2 — "Task Details":
Title input (full-width, 48px, radius 9px, placeholder "Describe what needs to be done")
Category picker: icon grid 2x3 — Medical, Food, Education, Shelter, Water, Other — selected gets teal bg
Priority toggle: [LOW] [MEDIUM] [HIGH] [CRITICAL] — single select, segmented control, teal for selected

Section 3 — "Assignment":
"Assign Volunteer" — shows AI suggestion card:
  Sparkle icon + "MatchAgent suggests Priya Sharma (94% match)" — [Assign Her] teal button | [Choose Manually] link
Manual picker: searchable list of volunteers with availability dots

Section 4 — "Timeline":
Due date picker: two-row date chips [Today] [Tomorrow] [This Week] [Custom]
Estimated hours: +/- stepper control "3 hours"

Section 5 — "Notes & Attachments":
Multiline text area 80px
[Attach Photo] [Attach Document] icon buttons

BOTTOM: [Create Task] full-width teal 48px button
Disabled until Title + Need linked.
```

---

### TAB 4 — VOLUNTEERS
**Theme:** Human-centered directory · Profile cards with warmth · Green accent for availability

**Color mood:** White background, rich volunteer profile cards. Green (#16A34A) for available status. Card-heavy layout — each volunteer is a person, not a row in a table.

**Key screens:** Volunteer roster, profile card, smart match results, skills filter

**Layout structure:**
```
[Top Bar: "Volunteers" + Add Volunteer]
[Search bar + Filter row]
[Available count banner — green]
[Volunteer Cards Grid]
[FAB: Smart Match]
[Bottom Nav]
```

#### 🎨 Stitch Prompt — Volunteers Tab (Full Screen)

```
Design the Volunteers tab for Sahaay NGO app. Mobile-first, card-focused, people-first design.

DESIGN: Primary #0A6B5E teal, green #16A34A for availability, Inter font, DM Serif for names.

TOP BAR:
"Volunteers" DM Serif 24px left
[+ Add Volunteer] teal button right (32px height)
Below: "34 registered · 23 available now" 13px muted

SEARCH + FILTER BAR (white bg, rounded, full width):
Search: "Search by name or skill..." input with search icon
Below: horizontal scroll filter chips:
[All] [Available Now ●] [Medical] [Food] [Education] [Shelter] [< 5 km]
Active chip: teal filled. Count in chip if filtered.

AVAILABILITY BANNER (full width, green tint bg #F0FDF4, border-left 3px green):
"23 volunteers available right now across Mumbai"
Sub: "Highest density: Dharavi (8) · Kurla (6) · Govandi (5)"

VOLUNTEER CARDS (2-column grid, white cards, radius 14px, border, shadow):

Each card layout:
- TOP: Avatar circle (48px, initials on teal/green/blue bg) + Availability dot (green ● or gray ○) top-right of avatar
- NAME: Full name DM Serif 15px below avatar
- ROLE/SKILLS: 2-3 skill tags (Medical, First Aid, Hindi) — small teal pills
- META: Location pin + "Dharavi, 1.2 km" 12px muted
- RATING: ★ 4.8 · 23 tasks · 140 hrs in 11px muted gray
- STATUS: "Available Now" green 11px OR "Available 5pm" amber 11px OR "Offline" gray 11px
- BOTTOM: [Assign] outline teal button full width of card

Show 6 volunteer cards:
1. Priya Sharma | Medical, First Aid, Hindi | Dharavi 1.2km | ★4.9 | ● Available
2. Rohan Verma | Food Distribution, Logistics | Kurla 2.1km | ★4.7 | ● Available
3. Meera Iyer | Nursing, Kannada, Hindi | Govandi 3.4km | ★4.8 | ○ Available 5pm
4. Faiz Khan | Shelter, Carpentry, Urdu | Dharavi 0.8km | ★4.6 | ● Available
5. Sunita Patil | Education, Marathi, Tutoring | Bhandup 4.1km | ★5.0 | ● Available
6. Arjun Nair | Water, Plumbing, Malayalam | Kurla 2.8km | ★4.5 | ○ Available Tomorrow

SMART MATCH FAB (bottom right, teal 56px circle, sparkle icon):
Tap opens: "Smart Match for a Need" modal — search/select a need, then shows ranked volunteers

BOTTOM NAV: Volunteers tab active
```

#### 🎨 Stitch Prompt — Volunteers: Profile Detail Screen

```
Design a full volunteer profile screen for Sahaay NGO app. Accessible via tapping a volunteer card.

TOP: Back arrow + "Volunteer Profile" title + edit icon (if admin)

HERO SECTION (teal gradient bg #0A6B5E to #1D9E75, 180px tall):
- Large avatar circle 72px (initials "PS", white text on teal)
- "Priya Sharma" DM Serif 22px white
- "Medical Volunteer · Dharavi" 14px white 70% opacity
- Availability status: large green dot + "Available Now" white 13px
- Row of 3 stats: "23 Tasks" | "140 Hrs" | "★ 4.9"

SKILL TAGS (below hero, horizontal scroll):
[Medical Aid] [First Aid] [Insulin Management] [Hindi] [Marathi] [English]
Teal filled pills.

INFO CARDS (stacked, white, radius 12px, border):

Card — "Contact & Location":
Phone: +91 98XXX XXXXX (masked for privacy) — [Call] button
WhatsApp: [Message] button
Location: Dharavi, Mumbai — [View on Map] link
Languages: Hindi, Marathi, English

Card — "Availability Schedule":
Week grid — MON to SUN — each day shows available hours as teal bar
"Usually available: Weekdays 9am–6pm, Weekends 10am–2pm"

Card — "Recent Activity":
3 completed tasks listed:
- #T-029 Insulin Delivery · Dharavi · Completed Jan 15 · ★5 rating
- #T-021 Food Distribution · Kurla · Completed Jan 12 · ★5 rating  
- #T-018 Medical Camp · Govandi · Completed Jan 10 · ★4 rating

Card — "AI Match Score" (teal light bg):
Sparkle icon + "Why MatchAgent recommends Priya"
Skill match: ●●●●● 95%
Proximity: ●●●●○ 80%
Availability: ●●●●● 100%
Rating: ●●●●● 98%
Overall: 94% match

BOTTOM BUTTON: [Assign to a Need] full-width teal 48px
```

---

### TAB 5 — INSIGHTS
**Theme:** Data storytelling · Purple/teal analytics · Executive report aesthetic

**Color mood:** White dashboard with rich charts. Purple (#7C3AED) for AI-generated insights and predictions. Teal for positive trends. Red for critical alerts. Feels like a board-level NGO report made interactive.

**Key screens:** KPI overview, trend charts, AI surge predictions, donor narrative, region breakdown

**Layout structure:**
```
[Top Bar: "Insights" + Time Range picker]
[KPI Summary Row]
[Trend Chart: Needs over 8 weeks]
[Surge Prediction Card — AI]
[Region Breakdown]
[Donor Narrative — AI Generated]
[Bottom Nav]
```

#### 🎨 Stitch Prompt — Insights Tab (Full Screen)

```
Design the Insights tab for Sahaay NGO app — an AI-powered analytics dashboard for NGO coordinators and donors.

DESIGN: Primary teal #0A6B5E, purple #7C3AED for AI features, Inter font for data, DM Serif for section titles. White cards on #FAFAF9 bg.

TOP BAR:
"Insights" DM Serif 24px left
Time range picker right: [Week ▾] dropdown — options: Week / Month / Quarter / All Time
Below: "Last updated: 2 min ago · Dharavi, Kurla, Govandi, Bhandup" 12px muted

KPI ROW (horizontal scroll, 5 metric cards 90px each):
Each card: white, radius 12px, border, centered content
1. "Needs Reported" — 127 — ↑ 12% teal up arrow
2. "Resolved" — 89 — 70% rate — green
3. "Avg Response" — 4.2 hrs — ↓ 18% improvement — teal
4. "Active Volunteers" — 34 — ↑ 5 this week — green
5. "Critical Handled" — 23/23 — 100% — gold star

TREND CHART (white card, radius 14px, 220px tall):
Section title: "Need Volume — 8 Week Trend" DM Serif 16px
Line chart with 3 lines:
- Teal: Total needs reported (peaks at week 5)
- Red: Critical needs (spiky)
- Green: Resolved (climbing trend)
X-axis: Week 1 through Week 8 labels
Y-axis: 0 to 60
Legend dots below chart
Annotation: dashed vertical line at "Dharavi Flood" week 5 with label

CATEGORY BREAKDOWN (white card, radius 14px):
Title: "Needs by Category" DM Serif 16px
Horizontal bar chart, bars in category colors:
Medical    ████████████ 38 (teal)
Food       ████████ 27 (amber)
Education  █████ 18 (blue)
Shelter    ████ 14 (orange)
Water      ██ 9 (cyan)
Other      █ 5 (gray)
Each bar shows count label right

SURGE PREDICTION CARD (purple tinted bg #F5F3FF, border #DDD6FE, radius 14px):
Header row: sparkle icon + "SurgeAgent Prediction" purple 12px label + "Next 2 Weeks" badge
Title: "Monsoon prep: Medical needs to surge 40% in Dharavi" DM Serif 16px purple
Body: "Based on 8-week historical data and June monsoon patterns, expect peak medical demand June 15-22. Recommended: pre-assign 6 medical volunteers."
Prediction bars (category mini sparklines):
Medical ↑ 40%  Food ↑ 15%  Shelter ↑ 28%  Water ↑ 55%
[View Full Prediction] purple outline button

REGION MAP MINI (white card, radius 14px, 160px tall):
Static Mumbai region heatmap (SVG or static image)
4 circles on Dharavi / Kurla / Govandi / Bhandup
Circle size = need volume. Color = urgency level.
Legend: small colored dots below

DONOR NARRATIVE CARD (white card, radius 14px, teal left border 3px):
Header: sparkle icon + "NarratorAgent — Weekly Donor Report" 12px label + [Generate New] teal text button
Headline (DM Serif 18px): "47 families found relief in Dharavi this week"
Body (14px, 3 paras, real content):
  "This week, Sahaay coordinated 23 volunteers across Dharavi, Kurla, and Govandi to address 47 critical community needs. When a medical emergency emerged at 11pm in Sector 14, MatchAgent connected field worker Ananya with nurse Priya Sharma in under 3 minutes..."
Key stats row: [89 Resolved] [4.2hr Avg Response] [140 Volunteer Hrs]
[Download PDF Report] teal outline button + [Share with Donors] button

BOTTOM NAV: Insights tab active
```

---

### TAB 6 — AUTH SCREEN
**Theme:** Trust and calm · First impression · Brand immersion

#### 🎨 Stitch Prompt — Login / OTP Screen

```
Design a login screen for Sahaay NGO app. Full-screen, mobile, premium feel.

BACKGROUND: Deep teal to dark #0A6B5E to #054035 gradient, full screen.
Subtle pattern: very faint circular rings (SVG, white 3% opacity) like a ripple — symbolizing help spreading outward.

LOGO SECTION (top 35% of screen, centered):
- Large circular icon 80px — white bg, teal icon of two hands or a network/help symbol
- "Sahaay" DM Serif Display 40px white
- "सहाय" 20px white 60% opacity below
- "NGO Coordination Platform" 13px white 50% opacity, letter-spacing 1px

BOTTOM CARD (white, top-left/right radius 28px, padding 28px, slides up):
Title: "Welcome back" DM Serif 22px #111110
Subtitle: "Enter your phone number to continue" 14px #6B6965

Phone input (full width, 48px height, radius 9px, border #E5E3DF):
[+91 ▾] | [Phone number placeholder]
Country code dropdown on left.

[Send OTP] button — full width, 48px, teal bg, white text Inter 14px 600, radius 9px
Below: "OTP will be sent to your WhatsApp" 12px muted with WhatsApp green icon

Divider: — or —

[Continue with Google] white outline button — Google logo + text, full width, 48px

BOTTOM: "For NGO workers, volunteers & coordinators only" 11px muted center

OTP SCREEN STATE (same card, replaces phone input):
"OTP sent to +91 98XXX XXXXX" 13px muted + [Change] link
4-box OTP input — each box 56px wide, 56px tall, radius 10px, border, centered number, auto-advance
[Verify OTP] teal full-width button
[Resend in 45s] disabled timer below → becomes teal link when countdown ends
```

---

## 5. Global Stitch/v0 Prefix (Add to Every Prompt)

Paste this at the **start** of every individual tab prompt to ensure consistency:

```
GLOBAL DESIGN SYSTEM for all Sahaay screens:
- Framework: Angular 18 PWA, mobile-first (390px wide viewport)
- Primary: #0A6B5E | Accent: #1D9E75 | Surface: #FAFAF9 | Card: #FFFFFF
- Critical: #DC2626 | High: #D97706 | Medium: #2563EB | Low: #16A34A | AI: #7C3AED
- Fonts: DM Serif Display (headings/brand), Inter (all UI text)
- Radius: Cards 14px | Buttons 8px | Inputs 9px | Pills 20px
- Border: 1px solid #E5E3DF on all cards
- Shadow: 0 1px 3px rgba(0,0,0,0.08)
- icons: Material Symbols Rounded (Google)
- NO lorem ipsum — all placeholder data must be real Mumbai/NGO context
- Bottom nav: 56px, 5 tabs, white bg, teal for active tab
- Top bar: 56px, white bg, bottom border #E5E3DF
- All data: Dharavi / Kurla / Govandi / Bhandup locations, Indian names
```

---

## 6. Absolute Design Rules

| # | Rule |
|---|------|
| 1 | **Zero lorem ipsum.** All placeholder text uses real Mumbai NGO data. |
| 2 | **DM Serif Display for all headings.** Never use Inter for section titles. |
| 3 | **Urgency color is always consistent.** Critical=red, High=amber, Medium=blue, Low=green. Never deviate. |
| 4 | **AI features always show the purple (#7C3AED) accent** + sparkle icon. |
| 5 | **Bottom nav is always 56px, always white, always 5 tabs.** |
| 6 | **Map tab = full-screen map only.** No background behind map. |
| 7 | **Cards never use box-shadow on colored backgrounds.** Shadow only on white cards. |
| 8 | **Stat numbers use the semantic color** — critical number in red, positive in green, etc. |
| 9 | **All buttons must be minimum 40px tall** for mobile touch targets. |
| 10 | **No inline styles in production code.** All styles via _tokens.scss variables. |

---

## 7. Figma/Stitch Component Naming Convention

```
sahaay/
├── global/
│   ├── tokens          ← CSS variables
│   ├── typography      ← font scale
│   ├── icons           ← icon library (Material Symbols Outlined)
│   └── bottom-nav      ← shared nav bar
├── home/
│   ├── stat-card
│   ├── need-card
│   ├── ai-match-card
│   └── assign-drawer
├── map/
│   ├── map-pin
│   ├── filter-drawer
│   ├── bottom-sheet
│   └── proximity-ring
├── tasks/
│   ├── task-card
│   ├── status-tabs
│   └── create-task-modal
├── volunteers/
│   ├── volunteer-card
│   ├── profile-screen
│   └── smart-match-modal
└── insights/
    ├── kpi-card
    ├── trend-chart
    ├── surge-prediction-card
    └── donor-narrative-card
├── verification/
│   ├── kyc-stepper
│   ├── ocr-result-card
│   ├── face-match-badge
│   └── document-preview
```

---

## 8. Identity Verification Patterns

### 8.1 Aadhaar OCR Result Card
```
bg: white | border: 1px solid #E5E3DF | radius: 14px
Field Labels: 11px Inter 500 #6B6965
Field Values: 14px Inter 600 #111110
Confidence Dot: green for >90%, amber for 70-90%, red for <70%
```

### 8.2 Face Match Badge
```
Large Badge: 24px height, radius 12px, Inter 12px 600
Logic: "Face Verified" + check icon in green if score > 85%
Logic: "Review Needed" + warning icon in amber if score 60-85%
Logic: "Identity Mismatch" + error icon in red if score < 60%
```

### 8.3 Resource Vault Security
Items in the vault (IDs, Documents) show a `lock` icon and a "Secured by App Check" micro-label.

---

## 9. Icon Library

Use **Material Symbols Rounded** (Google) throughout for a softer, more modern feel. Key icons:

| Context | Icon name               |
|---------|-----------              |
| Medical need | `medical_services` |
| Food need | `restaurant`          |
| Education need | `school`         |
| Shelter need | `home`             |
| Water need | `water_drop`         |
| Volunteer | `person`              |
| Location | `location_on`          |
| AI/Sparkle | `auto_awesome`       |
| Notification | `notifications`    |
| Assign | `assignment_ind`         |
| Resolved | `check_circle`         |
| Overdue | `schedule` / `warning`  |
| Heatmap | `layers`                |
| Surge | `trending_up`             |
| Verification | `verified_user` / `face` / `fingerprint` |
| Security | `lock` / `shield` |
| Vault | `inventory_2` |

---

## 10. AI Coordinator Command Drawer & Telemetry

### 10.1 Layout & Trigger
- **Top Bar Trigger**: Glass pill button with rotating sparkle icon, `AI Coordinator` label, and live pulsing telemetry beacon (`#10b981`).
- **Drawer Sidenav**: 480px width on desktop (100vw on mobile), deep elevation shadow `-8px 0 36px rgba(0, 56, 48, 0.18)`.
- **Theme Palette**: Deep Emerald (`#003830` to `#005147`) gradient header, slate mint (`#0f766e`), warm canvas (`#f6f4f0`).

### 10.2 Command Filter Strip
Horizontal command pill track for rapid operational queries:
- `/status` — Mumbai Ward 4 Command status
- `/volunteers` — Available volunteer headcount & proximity
- `/critical` — Emergency tickets in Dharavi and Kurla
- `/surge` — 7-day monsoon surge prediction
- `/vault` — Resource vault inventory levels

### 10.3 Agent Response Cards
- **Agent Attribution**: Tagged with specialist identifier (`MatchAgent`, `SurgeAgent`, `NarratorAgent`, `QueryAgent`).
- **Urgency Tags**: `.badge-critical` in ruby (`#fee2e2`/`#991b1b`), `.badge-optimal` in green (`#dcfce7`/`#15803d`).
- **1-Click Action Dock**: Direct navigation pills to `/needs-map`, `/tasks`, `/volunteers`, `/resource-vault`.

---

*Sahaay — सहाय — Built for Mumbai Disaster & Humanitarian Resilience*

