
# To-do Timer — Task-Sequencing & Countdown Timer

**To-do Timer** is a task-sequencing and countdown-timer web application. It enables users to break ambitious projects into ordered mini-tasks, configure dedicated work durations and restorative breaks, and execute their plans with a smooth, drift-free circular countdown timer.

---

## 🌿 Design System & Aesthetics

- **Theme**: Warm ivory / off-white (`#FBF9F5`)
- **Primary Accent**: Deep Forest Green (`#1E3A2B`)
- **Secondary Accents**: Sage Green (`#6E8B75`, `#8DA794`) and Warm Sand (`#E8DFC8`, `#D5C7AF`)
- **Typography**: Clean, modern sans-serif with monospace timer numerals
- **Motion**: Subtle micro-interactions, smooth proportional SVG countdown progress, celebratory confetti, and Web Audio gentle harmonic chimes.

---

## 🚀 Key Features

1. **Sign-In & Account Creation** (`/sign-in`):
   - Polished form with email & password validation (min 6 characters)
   - Password visibility toggle (eye icon)
   - 1-click "Fill & Sign In with Demo Account" button for quick review
   - Simulated client-side authentication with session persistence (passwords are never stored).

2. **Dashboard** (`/dashboard`):
   - Persistent desktop sidebar & mobile responsive drawer navigation
   - Personalized greeting ("Good morning / afternoon / evening, Alex")
   - Summary cards: Major Objectives count, Mini-Tasks completed rate, and Total Focused Time
   - Interactive filtering tabs: *All Tasks*, *In Progress*, *Completed*, plus real-time title/description search
   - Prominent **Create Major Task** dialog with validation
   - Major task cards showing progress bar, estimated total time, mini-task counts, and direct action triggers.

3. **Major Task Detail & Sequencing** (`/tasks/[id]`):
   - Editable major-task title and description
   - Drag-and-drop reordering of mini-tasks via `@dnd-kit` with touch-friendly pointer sensors (prevents drag interference with buttons/inputs)
   - Interactive completion checkboxes with strikethrough animation and progress tracking
   - **Add & Edit Mini-Task Dialogs**:
     - Task name (required)
     - Duration in hours and minutes (strictly validated between 1 minute and 24 hours)
     - Optional break toggle with conditional positive break duration field
     - Cancel preserves task data unchanged
   - **Friendly Empty State**: Original illustrated cartoon timer character with personalized greeting when a major task has no mini-tasks yet.

4. **Active Focus Timer** (`/tasks/[id]/focus`):
   - Dedicated, distraction-free focus screen
   - Breadcrumb navigation back to task overview with exit confirmation guard if timer is running
   - Large, smooth SVG circular countdown ring with proportional stroke dash offset
   - Accurate, drift-free time countdown based on epoch timestamps (`Date.now()`)
   - Large digital timer numerals (`MM:SS` or `HH:MM:SS`)
   - Tactile controls: Start/Resume, Pause, Complete/Skip Rest, Reset, and Audio Mute toggle
   - **Single Shared Transition Mechanism**: Handles both manual completion and 00:00 timeout identically, moving seamlessly from Work → Rest Break → Next Mini-Task
   - Up-next mini-task preview card
   - Keyboard shortcuts: `Space` = Pause/Resume, `Shift + C` = Complete
   - **Completion Celebration Summary**: Confetti explosion, session focus statistics, and options to review or restart.

5. **Account & Settings Menu**:
   - 3-dot vertical dropdown menu
   - Profile Details modal with editable name, email, and cumulative focus stats
   - Preferences modal: Audio chimes toggle, Auto-start breaks toggle, Auto-advance tasks
   - Help & Keyboard Shortcuts reference dialog
   - Theme preference indicator (Warm Ivory)
   - Sign-Out with mock session teardown.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript with strict typing
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Icons**: Lucide React
- **Drag & Drop**: `@dnd-kit/core` & `@dnd-kit/sortable`
- **Effects**: `canvas-confetti` & native Web Audio API synthesizer
- **Storage**: Clean storage abstraction in `src/lib/storage.ts` (ready for Supabase migration)

---

## 💻 Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Run Production Build & Verification**:
   ```bash
   npm run build
   npm run lint
   ```
