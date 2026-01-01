# Project Specification: "Insight" – The No-Code Data Analysis Webapp

## 1. Project Overview

**Goal:** Build a fast, effective, and generic web application for data visualization and analysis. Users should be able to upload data or create it manually and generate professional insights without writing a single line of code.
**Core Philosophy:** "The Calculator Approach." The app must handle any dataset (sales, engineering, grades) generically based on data types (Number, String, Date), not business logic.

## 2. Technology Stack

* **Frontend:** Next.js (React) + Tailwind CSS (Styling).
* **Backend:** Python (FastAPI or Flask) deployed on Vercel Serverless Functions.
* **Data Engine:** Pandas (Data manipulation), NumPy (Math).
* **Visualization:** Plotly (Python) generating JSON for Plotly.js (Frontend).
* **Input Handling:** AG Grid Community (for manual data entry/editing).
* **Deployment:** Vercel (Frontend & Backend).

---

## 3. UI/UX Design System (Strictly No Glassmorphism)

**Visual Style:** "Modern Clean Dashboard" / Card-Based UI (Inspiration: Sneat, TailAdmin).

* **Color Palette:**
* **Background:** `#F5F5F9` (Cool Light Grey).
* **Cards:** `#FFFFFF` (Pure White, Shadow-sm).
* **Text:** `#384551` (Dark Slate) for body, `#8592A3` (Cool Grey) for metadata.
* **Accent/Action:** `#696CFF` (Indigo/Blurple) – used for primary buttons and active states.


* **Typography:** "Public Sans" or "Inter." Bold headings (600/700), regular body (400).
* **Layout Structure:**
* **Sidebar (Left):** Fixed width (260px). Navigation links (Dashboard, Data, Settings) with "Pill" style active states.
* **Top Bar (Floating):** Floating card style, detached from edges. Contains Search and Profile.
* **Main Canvas:** Large padding (`32px`). All content lives inside rounded white cards.
* **Empty State:** A massive, dashed-border "Drag & Drop" zone in the center of the screen.



---

## 4. Feature Specifications

### A. The "Omni-Channel" Data Input Layer

The app must support 5 distinct input methods via a "New Project" modal:

1. **File Upload:** `.csv`, `.xlsx`, `.json` (using `openpyxl` for Excel).
2. **Paste Text:** `Textarea` input parsed via `io.StringIO` (auto-detect separators).
3. **URL Import:** Support for Google Sheets (convert `/edit` to `/export`) and raw CSV links.
4. **Manual Entry:** An interactive spreadsheet grid (AG Grid) for typing data from scratch.
5. **Sample Data:** Pre-loaded "Superstore" dataset for testing.

### B. The "Generic" Analysis Engine (Backend Logic)

The backend must not look for specific column names. It must detect **Data Types**:

1. **The Scanner:**
* Detect `Numerical`, `Categorical`, and `Temporal` (Date) columns.


2. **Analysis Modules:**
* **Delta Indicator:** If a Time column exists, sort by Date and calculate `(Last Value - Previous Value) / Previous Value`.
* **Distribution (Bin Slider):** For any Numerical column, generate a Histogram. Allow user to pass a `bin_size` parameter to dynamically resize buckets.
* **Drill Down:** For Categorical columns. Logic: Filter by `Category A`, then Group By `Category B`.
* **Correlations:** If two Numerical columns are selected, calculate Pearson Correlation.



### C. Visualization (Plotly JSON)

* **Constraint:** NEVER generate static images (PNG/JPG).
* **Output:** The backend must return **Plotly JSON strings**.
* **Chart Types:**
* *Bar Chart* (Category vs Number).
* *Scatter Plot* (Number vs Number).
* *Line Chart* (Time vs Number).
* *Heatmap* (Correlation Matrix).



---

## 5. Technical Data Flow (Vercel Optimized)

Since Vercel functions are stateless:

1. **Input:** User uploads data -> Frontend parses it -> Sends to Backend OR Frontend stores it in generic State Management (Redux/Zustand).
2. **Processing:**
* Frontend sends **Pagination Request** (Rows 0-20) for the Table View.
* Frontend sends **Filter Object** (`{col: "Price", op: ">", val: 100}`) to Backend.


3. **Output:** Backend returns lightweight JSON. Frontend renders it.

---

## 6. Implementation Phases

**Phase 1: The Skeleton**

* Set up Next.js + Tailwind.
* Build the "Card Layout" (Sidebar, Topbar, Main Area).
* Build the "Omni-Input" Modal (File/Text/Link tabs).

**Phase 2: The Brain (Pandas)**

* Create the Python API route `/api/process`.
* Implement `load_data` (handles CSV/Excel/URL).
* Implement `get_preview` (Pagination).
* Implement `get_stats` (Basic Mean/Max/Min).

**Phase 3: The Visuals**

* Implement Plotly in Python.
* Create the "Chart Card" component on Frontend.
* Connect the "Bin Slider" and "Filter Bar" to the API.

**Phase 4: Advanced Features**

* Add "Manual Entry" grid.
* Add "Drill Down" interactivity.
* Add "Delta" trend calculation.

---