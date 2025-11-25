# Design Guidelines: AI-Powered Learning Platform

## Design Approach

**Selected System**: Material Design 3 principles adapted for educational accessibility

**Rationale**: This platform serves non-affluent learners requiring clear information hierarchy, accessibility, and low-bandwidth optimization. Material Design provides proven patterns for data-heavy interfaces while maintaining clarity and usability.

**Core Principles**:
- Accessibility and readability above all
- Distraction-free learning environment
- Clear progress visibility
- Efficient information density
- Low-bandwidth optimization

---

## Typography

**Font Families** (via Google Fonts CDN):
- Primary: Inter (body text, UI elements, course content)
- Secondary: Space Grotesk (headings, section titles)

**Type Scale**:
- Hero/Page Titles: text-4xl to text-5xl, font-bold
- Section Headings: text-2xl to text-3xl, font-semibold
- Card Titles: text-lg to text-xl, font-semibold
- Body Text: text-base, font-normal, leading-relaxed
- Captions/Meta: text-sm, font-medium
- Small Labels: text-xs, font-medium

**Reading Optimization**: All course content uses max-w-prose for optimal line length (65-75 characters)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, and 16
- Tight spacing: p-2, gap-2 (UI controls, compact lists)
- Standard spacing: p-4, gap-4 (cards, form elements)
- Section spacing: p-8, py-12 (content sections)
- Page margins: px-4 md:px-8, py-6 md:py-12

**Grid Patterns**:
- Course cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboard widgets: grid-cols-1 md:grid-cols-2
- Content + sidebar: grid-cols-1 lg:grid-cols-3 (2:1 ratio)

**Container Widths**:
- Default: max-w-7xl mx-auto
- Reading content: max-w-4xl mx-auto
- Forms/Modals: max-w-2xl

---

## Component Library

### Navigation
**Top Navigation Bar**:
- Fixed header with platform logo, search, user profile
- Desktop: Horizontal menu items with icons
- Mobile: Hamburger menu with slide-out drawer
- Height: h-16, sticky top-0

**Sidebar Navigation** (Admin Dashboard):
- Fixed left sidebar, w-64 on desktop
- Collapsible icon labels for space efficiency
- Active state with subtle left border accent

### Cards & Content Containers

**Course Cards**:
- Rounded corners: rounded-lg
- Subtle elevation: shadow-md hover:shadow-lg transition
- Padding: p-6
- Structure: Image preview (if available), title, description snippet, tier badge, progress indicator

**Learning Module Cards**:
- Minimal design: rounded-lg border
- Header with module number and title
- Progress bar (h-2 rounded-full)
- Duration estimate and completion status

**Dashboard Widgets**:
- Clean cards with rounded-xl
- Icon + metric layout
- Minimal decoration, focus on data clarity

### Forms & Inputs

**Input Fields**:
- Height: h-12
- Rounded: rounded-md
- Border: border-2 with focus states
- Labels: text-sm font-medium mb-2
- Helper text: text-xs mt-1

**Buttons**:
- Primary action: px-6 py-3 rounded-lg font-semibold
- Secondary action: px-6 py-3 rounded-lg font-medium
- Icon buttons: p-3 rounded-full
- Disabled state: opacity-50 cursor-not-allowed

**Search Bar**:
- Prominent placement with icon
- h-12, rounded-full for course discovery
- Autocomplete dropdown with course suggestions

### Progress Indicators

**Progress Bars**:
- Height: h-2 for inline, h-3 for prominent
- Fully rounded: rounded-full
- Show percentage text alongside bar
- Animated fill transition

**Tier Badges**:
- Small chips: px-3 py-1 rounded-full text-xs font-semibold
- Labels: "Start", "Intermediate", "Advanced"

### Learning Interface

**Daily Reading View**:
- Clean, distraction-free layout
- Content: max-w-prose mx-auto
- Generous line-height: leading-relaxed
- Navigation: Previous/Next buttons fixed at bottom
- Sticky progress bar at top

**Flashcard Component**:
- Card dimensions: w-full max-w-md aspect-[3/2]
- Flip animation on click
- Large, readable text: text-xl
- Tap/click affordance indicator

**Understanding Check Input**:
- Large textarea: min-h-32
- Character counter
- Submit button prominent
- AI feedback display in structured format

### Data Display

**Course Catalog**:
- Filter sidebar (left): Categories, tiers, topics
- Grid layout for course cards
- Sort options: Relevance, Recent, Popular
- Load more pagination

**Admin Content Management**:
- Table view for uploaded materials
- Drag-and-drop upload zone
- Status indicators for AI processing
- Bulk action toolbar

### Overlays

**Modals**:
- Max-width: max-w-2xl
- Rounded: rounded-xl
- Padding: p-6 md:p-8
- Close button: top-right, subtle
- Backdrop blur

**Toasts/Notifications**:
- Fixed position: top-right
- Slide-in animation
- Auto-dismiss: 3-5 seconds
- Icon + message + close button

---

## Images

**Hero Section** (Landing/Marketing Pages):
- Large hero image showing diverse students learning
- Dimensions: Full viewport width, h-96 md:h-[500px]
- Overlay: Semi-transparent gradient for text readability
- CTA buttons with blurred backgrounds (backdrop-blur-sm)

**Course Preview Images**:
- Aspect ratio: aspect-video
- Placeholder: Abstract educational illustrations
- Position: Top of course cards, rounded-t-lg

**Empty States**:
- Friendly illustrations for "No courses yet", "Start learning"
- Centered with encouraging message

---

## Animations

**Minimal Use Only**:
- Progress bar fills: transition-all duration-300
- Card hover lifts: hover:shadow-lg transition-shadow
- Modal/drawer entry: slide-in 200ms ease-out
- No scrolling animations or parallax effects

---

## Accessibility Considerations

- All interactive elements: min-h-11 (44px touch target)
- Focus indicators: ring-2 ring-offset-2
- Skip navigation links
- ARIA labels for icon-only buttons
- Keyboard navigation for flashcards and assessments
- Screen reader announcements for progress updates

---

## Low-Bandwidth Optimization

- No background videos or heavy graphics
- SVG icons from Heroicons (lightweight)
- Lazy loading for course images
- Progressive content loading
- Minimize decorative elements
- Text-first design approach