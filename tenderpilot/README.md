# ✈️ TenderPilot
### Find. Score. Draft. Win.

**An AI-powered tender intelligence and proposal development platform built for consultancy and advisory firms.**

TenderPilot helps consultancy firms discover relevant tender opportunities, understand how well those opportunities match their capabilities, and prepare technical proposals using their own organisational knowledge.

Instead of spending days searching procurement portals and rewriting proposals from scratch, teams can focus on opportunities they are genuinely qualified to pursue.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Core Features](#-core-features)
- [How It Works](#-how-it-works)
- [Brand Identity and Logo](#-brand-identity-and-logo)
- [Technology Stack](#-technology-stack)
- [External Integrations and APIs](#-external-integrations-and-apis)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Development Workflow](#-development-workflow)
- [Deployment](#-deployment)
- [Project Roadmap](#-project-roadmap)
- [Team and Contributions](#-team-and-contributions)

---

## 🌍 Overview

TenderPilot is an AI-powered assistant designed to simplify the tendering process for small and medium-sized consultancy and advisory firms.

The platform brings together tender discovery, organisational knowledge management, opportunity evaluation and technical proposal generation in one workspace.

It uses a firm's existing documents, including consultant CVs, previous proposals and capability statements, to provide context-aware recommendations and generate proposal drafts.

**Our mission:** Help consultancy firms spend less time searching, evaluating and writing, and more time pursuing the opportunities that matter.

## 🚩 The Problem

Consultancy firms frequently encounter several challenges when pursuing tenders:

- **Fragmented tender discovery:** Relevant opportunities are scattered across different procurement portals.
- **Time-consuming evaluation:** Teams manually assess whether each opportunity matches their expertise and experience.
- **Repetitive proposal writing:** Technical proposals often require rewriting information already contained in previous submissions.
- **Scattered organisational knowledge:** Consultant CVs, project references and capability statements are stored across multiple documents.
- **Missed opportunities:** Limited time and resources make it difficult to monitor procurement opportunities consistently.

These challenges make the bidding process expensive, repetitive and inefficient.

## 💡 Our Solution

TenderPilot provides an intelligent workflow that connects a firm's knowledge with relevant tender opportunities.

It helps users:

1. Organise their firm's knowledge in one searchable workspace.
2. Discover relevant tender opportunities from selected procurement sources.
3. Evaluate opportunities using AI-assisted capability matching.
4. Understand why a tender is or isn't a good fit.
5. Generate technical proposal drafts grounded in their uploaded documents.
6. Review, edit and export proposals for further preparation.

**Human oversight remains central:** TenderPilot assists with research, evaluation and drafting, while the firm retains control over final decisions and submissions.

---

## 🚀 Core Features

### 1. Knowledge Base

A central workspace for managing organisational knowledge.

Users can upload and organise:

- Consultant CVs and professional profiles.
- Previous technical proposals.
- Company capability statements.
- Project descriptions and references.
- Relevant organisational documents.

The knowledge base provides the information needed to support more relevant tender matching and proposal generation.

### 2. Tender Discovery

Discover procurement opportunities without manually searching multiple portals.

The planned discovery workflow supports:

- Monitoring selected procurement sources, starting with UN procurement opportunities.
- Filtering by sectors and areas of expertise.
- Regional and geographical preferences.
- Keyword-based opportunity discovery.
- Viewing tender descriptions, requirements and deadlines.

### 3. AI-Powered Tender Fit Ranking

Not every tender is worth pursuing.

TenderPilot evaluates opportunities against the firm's organisational capabilities and provides:

- A tender suitability score.
- Relevant matching capabilities.
- Areas of alignment between the tender and the firm.
- Potential experience or qualification gaps.
- Explanations supporting the recommendation.

This helps business development teams make more informed bid/no-bid decisions.

### 4. AI Proposal Studio

Generate technical proposal drafts using information from the firm's own documents.

The proposal generation workflow aims to:

- Analyse tender requirements.
- Identify relevant consultant experience.
- Retrieve supporting organisational information.
- Structure technical proposal sections.
- Generate context-aware draft content.
- Reference supporting documents for verification.

The objective is to reduce repetitive writing while maintaining accuracy and traceability.

### 5. Review and Export

AI-generated proposals are starting points, not automatic submissions.

Users can:

- Review generated content.
- Edit and refine proposal sections.
- Verify supporting information.
- Approve drafts internally.
- Export proposals into Word or PDF formats.

---

## 🔄 How It Works

TenderPilot follows a straightforward four-stage workflow.

| Stage | What happens |
|---|---|
| 01. Organise | Upload CVs, past proposals and company documents. |
| 02. Discover | Identify relevant tenders based on selected preferences. |
| 03. Evaluate | Score opportunities against the firm's capabilities and explain the results. |
| 04. Draft | Generate, review and export technical proposal drafts. |

**The result:** A more organised, informed and efficient tender preparation process.

---

## 🎨 Brand Identity and Logo

TenderPilot's visual identity reflects intelligent technology, direction, innovation and professional growth.

### Logo Concept

The brand identity is inspired by the relationship between aviation, navigation and intelligent opportunity discovery.

The proposed logo direction incorporates:

- **TP identity:** A recognisable visual mark representing TenderPilot.
- **Paper-plane inspiration:** Symbolises direction, forward movement and guiding firms towards opportunities.
- **Teal and cyan accents:** Represent innovation, intelligence and technology.
- **Clean typography:** Communicates professionalism, clarity and reliability.

### Brand Colours

The visual direction follows the dark, technology-inspired aesthetic of the TenderPilot landing page.

| Colour | Purpose |
|---|---|
| Deep Black | Primary backgrounds and visual depth |
| Teal / Cyan | Technology accents, highlights and interactive elements |
| White | Text, readability and contrast |

### Brand Tagline

**Find. Score. Draft. Win.**

The tagline communicates the four essential stages of the TenderPilot experience.

### Logo Placement

The logo should remain consistent across:

- Landing page and website navigation.
- Application dashboard and sidebar.
- Login and authentication screens.
- Project documentation.
- Presentations and promotional materials.

The final logo assets should include suitable versions for dark and light backgrounds, alongside a compact icon suitable for favicons and application navigation.

---

## 🛠️ Technology Stack

TenderPilot uses a modern web development architecture designed to support an interactive frontend and an AI-powered backend.

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | Component-based user interface development |
| TypeScript | Type safety and maintainable application code |
| Vite 6 | Development server and frontend build tooling |
| Tailwind CSS 3 | Utility-first styling |
| React Router 6 | Application navigation and routing |
| Lucide React | Interface icons |
| Vitest | Frontend testing |
| React Testing Library | Component testing |

### Backend

The backend is responsible for application logic, API endpoints, document processing, tender discovery, AI orchestration and communication with external services.

The final backend framework, database and AI provider should be documented here once confirmed in the implementation.

### Development Tools

- Git and GitHub – Version control and collaboration.
- Visual Studio Code – Development environment.
- Cursor – AI-assisted development.
- npm – Package management.

---

## 🔌 External Integrations and APIs

TenderPilot is designed to connect with external services to support its core workflow.

### 1. ThriveWave SMS API

**Purpose: Authentication**

ThriveWave provides the SMS API resources intended to support phone-number-based authentication.

The planned authentication workflow includes:

1. A user enters their phone number.
2. The system requests a one-time verification code.
3. The code is delivered through SMS.
4. The user enters the code.
5. The system verifies the code and grants access.

This removes the need for traditional password-based login.

### 2. UN Procurement Sources

**Purpose: Tender Discovery**

UN procurement opportunities are the starting point for TenderPilot's tender discovery functionality.

The platform is intended to retrieve relevant procurement information and filter opportunities according to user preferences.

The specific data access method and source integration should be documented alongside the implemented connector.

### 3. AI Services

**Purpose: Intelligent Analysis and Proposal Generation**

AI capabilities are central to TenderPilot's workflow.

They are intended to support:

- Tender requirement analysis.
- Organisational capability matching.
- Opportunity scoring and explanations.
- Document-grounded proposal generation.
- Context-aware content creation.

The production AI provider and model configuration should be documented once finalised.

### 4. RumptyCloud

**Purpose: Application Hosting and Deployment**

RumptyCloud is the designated hosting platform for the hackathon deployment.

It will be used to make the TenderPilot application accessible beyond the local development environment.

> Note: Integration descriptions distinguish the intended project architecture from features whose implementation and production configuration still need verification.

---

## 🏗️ Project Architecture

The repository is organised to separate documentation, frontend development and backend services.

```text
techyzens/
│
├── README.md
│
└── tenderpilot/
    │
    ├── docs/
    │   ├── PRD.md
    │   └── AUTH.md
    │
    ├── frontend/
    │   ├── public/
    │   ├── src/
    │   │   ├── components/
    │   │   ├── pages/
    │   │   ├── context/
    │   │   ├── App.tsx
    │   │   └── main.tsx
    │   │
    │   ├── index.html
    │   ├── package.json
    │   ├── vite.config.ts
    │   └── tsconfig.json
    │
    └── backend/
        └── ...
```

*The structure above describes the intended organisation. Individual folders and files may evolve as development progresses.*

### Application Architecture

At a high level, TenderPilot follows this workflow:

```text
          USER
            |
            v
     REACT FRONTEND
            |
            v
       BACKEND API
            |
     +------+------+
     |      |      |
     v      v      v
  KNOWLEDGE TENDER  AI
    BASE  SOURCES SERVICES
     |      |      |
     +------+------+
            |
            v
    TENDER ANALYSIS
            |
            v
    PROPOSAL GENERATION
            |
            v
      USER REVIEW
            |
            v
      WORD / PDF
```

---

## 💻 Getting Started

Follow these instructions to run the frontend locally.

### Prerequisites

Ensure you have installed:

- Node.js (LTS recommended).
- npm.
- Git.
- Visual Studio Code or another code editor.

### 1. Clone the Repository

```bash
git clone https://github.com/raymondmutiso40-ux/techyzens.git
```

### 2. Navigate to the Frontend

```bash
cd techyzens/tenderpilot/frontend
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

Vite will display a local development URL in your terminal, usually:

```text
http://localhost:5173
```

Open that address in your browser.

### 5. Build for Production

```bash
npm run build
```

### 6. Run Tests

```bash
npm test
```

---

## 🔐 Environment Configuration

TenderPilot may require environment variables for API credentials, authentication, AI services and backend communication.

Create your local environment file using the provided example when available:

```bash
cp .env.example .env
```

Populate the required values using the project's environment configuration documentation.

**Security guidelines:**

- Never commit `.env` files.
- Never expose API keys or secret credentials in frontend code.
- Keep sensitive credentials on the backend.
- Use environment variables for service configuration.
- Do not share authentication tokens or API secrets in public repositories.

---

## 🚀 Deployment

TenderPilot's hackathon deployment target is **RumptyCloud**.

The frontend production build is generated using:

```bash
npm run build
```

This produces the optimised frontend assets in the `dist/` directory.

The backend and frontend must be configured to communicate correctly in the deployed environment.

Production deployment should include:

- Correct environment variables.
- Secure API credentials.
- Backend API configuration.
- Authentication service configuration.
- Appropriate frontend-to-backend connectivity.
- Testing of the deployed application.

---

## 🗺️ Project Roadmap

TenderPilot is being developed incrementally.

| Feature | Development focus |
|---|---|
| Landing Page | Product introduction and user onboarding |
| Authentication | Phone-number login and SMS verification |
| Dashboard | Overview of relevant tender opportunities |
| Knowledge Base | Uploading and managing organisational documents |
| Tender Discovery | Retrieving opportunities from selected sources |
| Fit Ranking | AI-assisted opportunity scoring and explanations |
| Proposal Studio | Generating technical proposal drafts |
| Review and Export | Editing and exporting proposals |
| Deployment | Hosting the application on RumptyCloud |

The roadmap will evolve as features are implemented, tested and integrated.

---

## 👥 Team and Contributions

TenderPilot is being developed collaboratively by the Techyzens team.

We believe in building through collaboration, shared learning, code reviews and continuous improvement.

Contributions include:

- Product planning and requirements definition.
- UI/UX design and frontend development.
- Backend engineering and API integration.
- AI workflow development.
- Documentation and project coordination.
- Testing and deployment.

### Contributing

We welcome improvements that make TenderPilot more useful, reliable and accessible.

Our contribution workflow:

1. Create a feature branch.
2. Make your changes.
3. Test your implementation.
4. Commit your changes with a meaningful message.
5. Push your branch to GitHub.
6. Open a Pull Request for review.

Example:

```bash
git switch -c feature/your-feature-name
```

```bash
git add .
git commit -m "feat: describe your contribution"
```

```bash
git push -u origin feature/your-feature-name
```

---

## 🎯 Our Vision

We envision a future where consultancy firms no longer lose valuable time navigating fragmented procurement portals and repeatedly preparing proposals from scratch.

TenderPilot brings organisational knowledge, intelligent opportunity discovery and AI-assisted proposal development together to help firms make better decisions and pursue opportunities with confidence.

**TenderPilot — Find. Score. Draft. Win.**