# Project Analysis & Redesign Prompt

## 1. Current Project Description

### Architecture Overview
The "Insight" project is a **No-Code Data Analysis** web application designed to allow users to upload datasets (CSV) and instantly view visualizations and logic-based insights.

**Current Tech Stack:**
*   **Frontend:** Vanilla HTML5, CSS3 (Variables + Layout/Component modules), and ES6 JavaScript modules.
*   **Backend:** Python (mimicking Vercel Serverless Functions) located in the `/api` directory.
*   **Visualization:** Plotly.js (CDN) for client-side rendering.
*   **State Management:** Simple in-memory global state (`js/state.js`).

### File Structure & Functionality
*   **`index.html`**: The main entry point. Contains the app shell (Sidebar, Main Content Area) and a hidden Modal for data upload.
*   **`css/`**:
    *   `layout.css`: Define the CSS Grid structure (`.app`, `.dashboard-grid`) and responsive behavior.
    *   `components.css`: Styles for Buttons, Cards, Modals, and Tables.
    *   `variables.css`: CSS variables for colors (Theme).
*   **`js/`**:
    *   `main.js`: Handles DOM events (Modal toggles, Button clicks) and calls the API.
    *   `api.js`: Wraps the `fetch` call to the Python backend (`/api/process`).
    *   `ui.js`: The core rendering engine. It dynamically generates HTML for:
        *   **Column List**: Badges showing detected types (Number, Category, Date).
        *   **Controls**: Dropdowns for Chart Type, X/Y axes, and bin filters.
        *   **Charts**: Plotly.js implementation for Histograms, Scatter plots, and Correlation Heatmaps.
        *   **Summary Stats**: (The component recently debugged) Blocks showing Mean/Median/Min/Max.
    *   `state.js`: Exports a mutable `STATE` object holding `data`, `columns`, `summary`, and `types`.
*   **`api/`**:
    *   `process.py`: Python script receiving the raw CSV text, likely parsing it (Pandas) and returning a JSON summary.

### Current Workflow
1.  User loads page -> Sees "Empty State".
2.  Clicks "+ New Project" -> Modal appears.
3.  User pastes CSV data or uploads file.
4.  App sends data to `/api/process`.
5.  On response, `STATE` is updated.
6.  `renderDashboard()` in `ui.js` clears content and builds the Grid:
    *   **Controls Card**: Users select "Scatter", "Histogram", etc.
    *   **Chart Card**: Plotly graph updates instantly.
    *   **Data Table**: Preview of rows.

---

## 2. Dashboard Design Prompt

**Role:** You are a World-Class UI/UX Designer specializing in complex data-heavy web applications. Current "Flat" designs are boring; we need something visually striking yet highly functional.

**Objective:** Design the full visual interface for "Insight 2.0".

### Design Directives
1.  **Aesthetic Style:** "Deep Premium Tech". Think financial terminals meets modern SaaS.
    *   **Palette:** Deep Charcoal/Midnight Blue backgrounds (Dark Mode default) OR Crisp, High-Contrast Light Mode with subtle grayish-blue tints. NOT plain white.
    *   **Texture:** Subtle gradients, "Glassmorphism" for overlay panels (like the upload modal), and fine borders (1px solid rgba(255,255,255,0.1)).
    *   **Typography:** Inter or JetBrains Mono for data; Clean Sans-Serif for headers. High readability is paramount.
2.  **Layout Strategy:**
    *   **Fluid Grid:** A dashboard that adapts. Widgets should be resizeable or snap mainly into a bento-box style grid.
    *   **Collapsible Sidebar:** Maximizing canvas space for the charts.
3.  **Key Screens to Design:**
    *   **Screen 1: The Command Center (Landing)**: A welcoming screen that isn't just "Empty". It should show "Recent Projects" or a "Quick Start" drop zone that looks alive (pulsing border or micro-interaction).
    *   **Screen 2: The Analysis Workspace (Main)**:
        *   **Header**: Project Name, Export Buttons, "Smart Actions" (AI suggestions).
        *   **Left Control Panel**: A slim column for selecting standard columns/filters.
        *   **Main Stage**: A massive Area for the Chart.
        *   **Bottom Tray**: Data Grid Preview (Excel-like) that can slide up.
    *   **Screen 3: The "Magic" Modal (Upload)**: A floating glass panel. When file is dragged over, the whole screen dims and focuses on the drop zone.

### Conversation Examples for Iteration

**Example Conversation 1: Setting the Vibe**

> **User:** "Design the main workspace for Insight. It needs to feel professional but not boring. I want a dark theme."
>
> **Designer:** "I've designed the **Analysis Workspace** with a 'Midnight Pro' theme.
> *   **Background:** A deep slate blue (`#0f172a`) to reduce eye strain.
> *   **Cards:** Floating elements with a backdrop blur and a thin, glowing border to separate them from the background.
> *   **Charts:** Plotly graphs now use neon accents (Cyan and Magenta) against the dark background for high contrast.
> *   **Layout:** The Controls are now a floating palette on the right, leaving the center 80% of the screen purely for the Data Visualization."

> **User:** "That's good, but the floating palette blocks the data sometimes. Can we dock it?"
>
> **Designer:** "I've docked the **Control Palette** to the right edge. It now behaves like a collapsible drawer. When open, it pushes the content slightly; when closed, you get the full-screen immersive chart view. I also added a 'Focus Mode' toggle that hides everything except the chart."

**Example Conversation 2: Refining the Data Interaction**

> **User:** "Now for the data table at the bottom. It looks too generic. Make it look like a high-performance tool."
>
> **Designer:** "I've upgraded the **Data Grid Tray**:
> *   **Header Row:** Sticky, with a frosted glass effect so data scrolls 'under' it seamlessly.
> *   **Typography:** Switched to a Monospace font for all numeric values for precise alignment.
> *   **Status Indicators:** Added small colored dots (Green/Red) next to numeric changes (Delta) to give it a 'Stock Market' feel.
> *   **Interaction:** Hovering over a row highlights it with a bright accent line, making it easy to track across wide datasets."

> **User:** "Add a way to filter directly from the header."
>
> **Designer:** "I've added **Inline Header Filters**. Each column header now has a subtle 'funnel' icon. Clicking it reveals a compact, shadow-styled dropdown menu allowing users to search, sort, or filter values instantly without leaving the context of the grid."
