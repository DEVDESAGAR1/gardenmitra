# GardenMitra 🌱
> **“Your first garden, from zero.”**

A beginner-first gardening companion crafted for the **Hacktoberfest Week 1 “Touch Grass” Challenge**.

GardenMitra guides complete newcomers from *"I know nothing about gardening"* to *"I know what I can grow, what I need to buy, how to start, and what I should do today."*

Crucially, GardenMitra is designed to encourage users to spend **less time inside the app** and **more time outside touching real soil and nurturing living plants**.

---

## 🌿 Core Philosophy: "Touch Grass"

```
PHOTO → UNDERSTAND → RECOMMEND → PREPARE → GROW → GO OUTSIDE
```

Most gardening apps either bury the user in botanical jargon or try to keep them addicted to screens. GardenMitra embraces a calm, supportive, outdoor-first mindset:
1. Provide instant clarity in under 2 minutes.
2. Deliver an actionable, bite-sized daily routine (~8 minutes).
3. **Encourage the user to close the app and step outside into the real world.**

---

## 🧐 The Problem GardenMitra Solves

When beginners attempt to start their first garden:
- **Decision Paralysis:** Overwhelmed by seed catalogs and gardening jargon (determinate vs. indeterminate, NPK ratios, soil pH).
- **The "Black Thumb" Myth:** Most beginners kill their first plant by overwatering or placing it in zero light, falsely concluding they "can't grow things."
- **Overcomplicated Tooling:** Endless commercial ads pushing expensive gadgets rather than simple seeds, soil, and pots.

GardenMitra solves this by offering an opinionated, beginner-proof onboarding path with personalized reasoning for every recommendation.

---

## 🚀 Implemented Features (MVP)

| Feature | Status | Description |
| :--- | :---: | :--- |
| **Welcome Screen** | ✅ Implemented | Warm, accessible landing page introducing the Hacktoberfest Touch Grass philosophy. |
| **Zero-GPS Garden Setup** | ✅ Implemented | Fast, friendly onboarding: City/State/Country, Space Type (balcony/terrace/windowsill), Space Size, Sunlight hours, Experience level, and Goals. Includes "I don't know" as a first-class choice. |
| **Space Photo Uploader** | ✅ Implemented | Drag & drop or upload balcony/terrace photos with local preview. Includes preset sample spaces for quick testing. Zero fake computer vision detections. |
| **Local Plant Recommendations** | ✅ Implemented | Local rule-based recommendation engine scoring beginner crops (Mint, Coriander, Tulsi, Spinach, Fenugreek, Cherry Tomato, Chilli, Radish, Marigold) with personalized *"Why this plant?"* reasoning. |
| **Plant Care Detail Cards** | ✅ Implemented | Accessible modal care cards showing sunlight, watering, container guidance, timeline, basic care, and common beginner gotchas. |
| **Automatic Shopping List** | ✅ Implemented | Automatically generated starter list grouped into Containers, Seeds/Saplings, Growing Medium, Nutrients, and Tools. Explains *"What is this for?"* for every item. |
| **Ask GardenMitra (Context-Aware Chatbot)** | ✅ Implemented | Rule-based assistant aware of user location, space type, sunlight hours, and active plants. Handles common beginner questions and suggests follow-up queries. |
| **Garden Doctor** | ✅ Implemented | Educational symptom checker (yellow leaves, brown tips, wilting, insects, spots). Provides practical next steps without claiming diagnosis. |
| **Today's Garden Checklist** | ✅ Implemented | Generates practical daily tasks (1-inch finger test, leaf underside check, pot rotation, mindful watering) with an 8-minute timer and Touch Grass prompts. |
| **"Touch Grass" Exit Prompt** | ✅ Implemented | Dedicated grounding modal offering a 3-minute sensory outdoor exercise (Look, Touch, Breathe) when tasks are done. |
| **Local-First Persistence** | ✅ Implemented | 100% private client-side persistence using `localStorage`. No accounts, no ads, no tracking. |

---

## 🏗️ Architecture for Future Migration

GardenMitra does not lock logic to the MVP implementation. All subsystems are built around clean **TypeScript Provider Interfaces**:

```
src/
├── services/
│   ├── types.ts                     # Core Provider Interfaces
│   │   ├── VisionProvider           # Garden space & plant health image analysis
│   │   ├── GardenAssistantProvider  # Context-aware chat companion
│   │   ├── PlantKnowledgeProvider   # Plant dataset & recommendation scoring
│   │   ├── ShoppingProvider         # Starter gear & supply checklist generator
│   │   ├── TaskGenerator            # Daily routine & Touch Grass generator
│   │   └── WeatherProvider          # Future climate & watering guidance
│   ├── localVisionProvider.ts       # MVP: Safe, honest local implementation (no fake CV)
│   ├── localAssistantProvider.ts    # MVP: Context-aware local rule engine
│   ├── localPlantKnowledgeProvider.ts # MVP: Curated beginner crop dataset & scorer
│   ├── localShoppingProvider.ts     # MVP: Category-based equipment generator
│   └── localTaskGenerator.ts        # MVP: Bite-sized ~8-minute task generator
```

### Clearly Distinguishing Current vs. Future Roadmap

| Subsystem | Implemented Now (MVP) | Planned / Future Architecture |
| :--- | :--- | :--- |
| **Space Vision** | `LocalVisionProvider` (Stores image locally; displays honest status notice without fake CV scores) | `GemmaVisionProvider` / local multimodal model for railing detection and shadow mapping |
| **Chat Assistant** | `LocalGardenAssistantProvider` (Deterministic, context-aware rule-based companion) | `OllamaGardenAssistantProvider` / on-device Gemma with explicit user consent |
| **Shopping** | `LocalShoppingProvider` (Educational categorization and necessity explanations) | `SerpApiShoppingProvider` / local nursery open directory search |
| **Plant Health** | `LocalVisionProvider` (Symptom-based educational checklist with non-diagnosis notice) | `PlantHealthVisionProvider` for visual disease assistance |
| **Weather** | User profile sunlight self-reporting | `OpenMeteoWeatherProvider` for real-time rain & frost warnings |
| **Persistence** | Browser `localStorage` (100% private, zero server footprint) | Optional local SQLite / IndexedDB sync |

---

## 🔒 Privacy & Safety Principles

1. **Zero Fake AI:** GardenMitra never fabricates confidence percentages, fake sunlight calculations, or fake disease diagnoses. If a real vision model is not connected, it honestly says so.
2. **Local-First Data:** Photos and profile choices remain strictly on your device in your browser.
3. **No Accounts Required:** Instant usage from the first click—no signups, passwords, or telemetry.

---

## 🛠️ Tech Stack

- **Framework:** React 18 with TypeScript
- **Bundler & Dev Server:** Vite 5
- **Styling:** Vanilla CSS with custom nature-inspired design tokens (Moss Greens, Terracotta Clay, Warm Sand)
- **Icons:** Lucide React
- **Testing:** Vitest (18 automated tests covering recommendation scoring, shopping generation, task generation, assistant context, and vision honesty)

---

## 💻 Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ or v22+
- Git

### Installation & Startup

```bash
# Clone the repository
git clone https://github.com/your-username/gardenmitra.git
cd gardenmitra

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Run Tests & Verification

```bash
# Run automated Vitest test suite
npm run test

# Run TypeScript type check and production build
npm run build
```

---

## 📂 Project Structure

```
gardenmitra/
├── .gitignore
├── LICENSE                  # MIT License
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── index.html
├── src/
│   ├── __tests__/           # Vitest unit and integration test suites
│   │   ├── assistantProvider.test.ts
│   │   ├── plantRecommendation.test.ts
│   │   ├── shoppingList.test.ts
│   │   ├── taskGenerator.test.ts
│   │   └── visionAndDoctor.test.ts
│   ├── components/          # Polished UI components
│   │   ├── ChatbotView.tsx
│   │   ├── Footer.tsx
│   │   ├── GardenDoctorView.tsx
│   │   ├── GardenSetupWizard.tsx
│   │   ├── Header.tsx
│   │   ├── MyGardenDashboard.tsx
│   │   ├── PhotoUploader.tsx
│   │   ├── PlantDetailModal.tsx
│   │   ├── PlantRecommendationView.tsx
│   │   ├── ShoppingListView.tsx
│   │   ├── TodaysGardenView.tsx
│   │   ├── TouchGrassModal.tsx
│   │   └── WelcomeScreen.tsx
│   ├── context/
│   │   └── GardenContext.tsx # Central React State & LocalStorage persistence
│   ├── data/
│   │   └── plants.ts        # Curated beginner-friendly plant dataset
│   ├── services/            # Modular provider abstractions & MVP implementations
│   │   ├── localAssistantProvider.ts
│   │   ├── localPlantKnowledgeProvider.ts
│   │   ├── localShoppingProvider.ts
│   │   ├── localTaskGenerator.ts
│   │   ├── localVisionProvider.ts
│   │   └── types.ts
│   ├── types/
│   │   └── index.ts         # Shared TypeScript interfaces & models
│   ├── App.tsx
│   ├── index.css            # Responsive botanical design system
│   └── main.tsx
```

---

## 🤝 Contributing

Contributions are warmly welcomed for Hacktoberfest!
1. Fork the repo and create your branch: `git checkout -b feature/my-new-feature`
2. Add tests for your logic under `src/__tests__/`
3. Verify that `npm run test` and `npm run build` pass
4. Commit your changes: `git commit -m 'feat: add local seasonal sowing guide'`
5. Push to the branch and open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
=======
<div align="center">

<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>Built with AI Studio</h2>

  <p>The fastest path from prompt to production with Gemini.</p>

  <a href="https://aistudio.google.com/apps">Start building</a>

</div>

