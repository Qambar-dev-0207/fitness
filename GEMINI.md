# GEMINI.md

## Project Overview
**FitAI** (also referred to as **ÉLAN Somatic Club**) is a premium, AI-driven wellness and fitness platform. It provides a "Boutique Wellness" experience by combining minimalist luxury aesthetics with advanced biometric intelligence. The application guides users through a "Somatic Profiling" process to generate high-fidelity training and nutritional protocols.

### Core Directives
1.  **Somatic Analysis:** Analyzes user body type via computer vision or manual selection.
2.  **Aesthetic Alignment:** Understands and targets specific aesthetic goals (Hypertrophy, Lean, Power).
3.  **Protocol Synthesis:** Generates structured, periodized workout plans.
4.  **Contextual Adaptation:** Adjusts for lifestyle factors (Fasting, Home vs. Gym).
5.  **Progressive Overload:** Tracks resistance and volume progression.
6.  **Transformation Visualization:** Provides data-driven projections of physical change.

### Main Technologies
- **Frontend:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS (v4) with **Framer Motion** for sophisticated cinematic animations.
- **AI Engine:** OpenRouter SDK (integrating models like Gemini 2.0 Flash for image analysis and Trinity Large for plan generation).
- **Icons:** Lucide React.
- **Component Patterns:** Client-side components for interactive UI, custom hooks for state management.

### Architecture
- **Intake Flow (`/uplink`):** A multi-step form for collecting biometric data (age, weight, height), somatic profiling (body type via image or choice), and environmental context (training location, routine).
- **Generation Logic (`/api/generate`):** A POST endpoint that synthesizes user data into a structured JSON protocol using AI.
- **Protocol Delivery (`/protocol`):** An archival-style interface for viewing the generated blueprint, including weekly structures, metabolic strategies, and interactive exercise demos via YouTube.
- **UI Components (`/components`):** Reusable elements like `CustomCursor` (magnetic tracking), `Preloader` (system boot simulation), and `DecryptedText` (character scrambling effect).

## Building and Running

### Development
1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Environment Configuration:**
   Create a `.env.local` file in the root directory:
   ```env
   OPENROUTER_API_KEY=your_api_key_here
   ```
3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production
- **Build:** `npm run build`
- **Start:** `npm run start`

### Linting
- **Command:** `npm run lint`

## Development Conventions

### Coding Style
- **TypeScript First:** Ensure strict typing for all props and state.
- **Component Structure:** Prefer functional components with `use client` where interaction or animations are required.
- **Animations:** Use `framer-motion` for all transitions. Avoid standard CSS transitions for primary UI shifts to maintain the "luxury" feel.
- **Naming:** Follow camelCase for variables/functions and PascalCase for components. Use descriptive names for animation variants (e.g., `fadeUp`, `staggerContainer`).

### Design Language
- **Aesthetic:** "Minimal Luxury / Cyber-Zen".
- **Color Palette:**
  - **Primary:** Jet Black (`#000000`)
  - **Accent 1:** Amber Gold (`#f59e0b`)
  - **Accent 2:** Dusty Mauve (`#b0413e`)
  - **Text:** Soft Peach (`#fdf2f8`)
  - **Status:** Emerald Accent (`#10b981`)
- **Typography:** Contrast between `Playfair Display` (Serif/Italic) for headings and `Inter` (Sans) or `JetBrains Mono` for metadata and technical details.

### AI Implementation
- The generation prompt expects a STRICT JSON response. Ensure any modifications to the prompt maintain this structure to prevent parsing errors in the frontend.
- Vision capabilities are triggered if an image is provided during the "Somatic Profiling" stage.

---
*FitAI // Engineering Somatic Excellence.*
