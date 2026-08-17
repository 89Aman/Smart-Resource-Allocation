# AGENTS.md — Sahaay (सहाय)

> Read this entire file before writing a single line of code.

---

## 0. Project Identity

| Field    | Value                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| App      | Sahaay — Angular 18 PWA, mobile-first, offline-capable                               |
| Problem  | NGOs manage needs via WhatsApp/paper. No unified view. Volunteer matching is manual. |
| Solution | Real-time needs map + Vertex AI multi-agent matching + surge prediction              |
| AI layer | Vertex AI Agent Engine → 5 agents → Gemini 2.0 Flash, called via Go Cloud Function   |
| Users    | Field Workers · Volunteers · NGO Admins · NGO Founders · Super Admins |
| Pilot    | Mumbai — Dharavi, Kurla, Govandi, Bhandup                                            |
| SDGs     | 1 · 3 · 4 · 17                                                                       |

---

## 1. Google Tech Stack

| #   | Product                       | Usage                                                       |
| --- | ----------------------------- | ----------------------------------------------------------- |
| 1   | Vertex AI Agent Engine        | OrchestratorAgent + 4 specialist agents                     |
| 2   | Gemini 2.0 Flash              | Powers all agents                                           |
| 3   | Firebase Cloud Functions (Go) | Security-hardened Go backends: AI Agents, Aadhaar KYC, Face Match |
| 4   | Firebase Realtime Database    | Low-latency WebSocket real-time live synchronization        |
| 5   | Firebase Firestore            | Structured queries, offline persistence, vector search      |
| 6   | Clerk + Firebase Auth bridge  | Clerk session JWTs + Go custom token bridge for database rules |
| 7   | Firebase Extensions           | Zero-code: photo->urgency, translate, summarise, chatbot    |
| 8   | Firebase Cloud Messaging      | Push alerts for critical unassigned needs                   |
| 9   | Firebase Storage              | Photos, ID docs, generated PDFs                             |
| 10  | Cloud Trace                   | Per-agent latency + token usage                             |
| 11  | Google Maps JS API            | Pin map, heatmap, proximity rings                           |
| 12  | Angular 18                    | App framework — standalone components, Signals              |
| 13  | Angular Material / MDC        | Material Design 3                                           |

---

## 2. Architecture

All AI and Identity calls live in Go Cloud Functions. Angular never calls Gemini or OCR directly.

```
Angular Services
  │  httpCall('CallAgent' | 'DetectFace' | 'VerifyKYC' | 'OcrAadhaar' | 'ExchangeFirebaseToken')
  ▼
Go Cloud Functions (us-west1)
  │  1. Verify Clerk session JWT (JWKS + RS256)
  │  2. AI: Route intent → Vertex Agent
  │  3. KYC: Vision AI → Aadhaar Extraction
  │  4. Face: Recognition → Identity Verification
  │  5. Bridge: ExchangeFirebaseToken mints Firebase custom token for UID
  ▼
Vertex AI Agent Engine / Google Vision AI
  ├─▶ MatchAgent     MATCH_VOLUNTEERS
  ├─▶ SurgeAgent     PREDICT_SURGE
  ├─▶ NarratorAgent  NARRATE_REPORT
  └─▶ QueryAgent     QUERY_ASSISTANT
  ▼
Typed JSON → Angular Signal → UI re-renders
```

### Directory

```
sahaay/
├── src/app/
│   ├── core/
│   │   ├── ai/
│   │   │   ├── agent.service.ts        # replaces gemini.service.ts entirely
│   │   │   └── schemas/                # Zod schemas for typed agent responses
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   └── role.guard.ts
│   │   ├── firebase/
│   │   │   ├── firestore.service.ts
│   │   │   ├── storage.service.ts
│   │   │   └── fcm.service.ts
│   │   ├── maps/
│   │   │   ├── maps.service.ts
│   │   │   └── geolocation.service.ts
│   │   ├── verification/
│   │   │   ├── verification.service.ts # Aadhaar OCR + Face Match
│   │   │   └── aadhaar.utils.ts        # Checksum + format validation
│   │   ├── ngo/
│   │   │   └── ngo-registry.service.ts # NGO onboarding + verification logic
│   │   └── resource-vault/
│   │       └── vault.service.ts        # Secure document handling logic
│   ├── shared/
│   │   ├── components/
│   │   │   ├── stat-card/
│   │   │   ├── task-card/
│   │   │   ├── need-card/
│   │   │   ├── volunteer-card/
│   │   │   ├── confidence-badge/
│   │   │   ├── skeleton-loader/
│   │   │   └── empty-state/
│   │   └── pipes/
│   │       ├── relative-time.pipe.ts
│   │       └── distance.pipe.ts
│   ├── models/
│   │   ├── need.model.ts
│   │   ├── task.model.ts
│   │   ├── volunteer.model.ts
│   │   ├── user.model.ts
│   │   └── ai-match.model.ts
│   ├── features/
│   │   ├── home/
│   │   ├── needs-map/
│   │   ├── tasks/
│   │   ├── volunteers/
│   │   └── insights/
│   ├── modals/
│   │   ├── create-task/
│   │   ├── report-need/
│   │   ├── add-volunteer/
│   │   └── task-detail/
│   ├── auth/
│   ├── app.routes.ts
│   ├── app.config.ts
│   └── app.component.ts
│
├── functions/go/
│   ├── go.mod
│   ├── go.sum
│   ├── config/
│   │   └── agents.go          # agent resource IDs + project config
│   ├── agents/
│   │   └── orchestrator.go    # Routes intents to Vertex AI agents
│   ├── verification/
│   │   ├── aadhaar.go         # Vision AI Aadhaar OCR logic
│   │   └── face.go            # Rekognition-style Face Match logic
│   ├── tools/
│   │   ├── firestore.go
│   │   ├── fcm.go
│   │   └── pdf.go
│   ├── function.go            # Entry points for all 4 functions
│   └── middleware/
│       └── auth.go            # Firebase token verification
│
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
└── AGENTS.md
```

---

## 3. Vertex AI Setup

### 3.1 Enable APIs & IAM

```bash
# Set to Frontend Project
gcloud config set project sahaay-493113

# Enable APIs in Frontend Project
gcloud services enable \
  aiplatform.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  firestore.googleapis.com

# Grant Frontend SA access to Vertex AI in Project 193319651907
gcloud projects add-iam-policy-binding 193319651907 \
  --member='serviceAccount:sahaay-493113@appspot.gserviceaccount.com' \
  --role='roles/aiplatform.user'
```

### 3.2 Create Agents (Vertex AI Console → Agent Builder → Create Agent)

Create 5 agents. Save each resource ID into `functions/go/config/agents.go`.

| Agent             | Model            | Purpose                          |
| ----------------- | ---------------- | -------------------------------- |
| OrchestratorAgent | gemini-2.0-flash | Routes intents to sub-agents     |
| MatchAgent        | gemini-2.0-flash | Volunteer matching               |
| SurgeAgent        | gemini-2.0-flash | Surge prediction                 |
| NarratorAgent     | gemini-2.0-flash | Donor report narration           |
| QueryAgent        | gemini-2.0-flash | Natural language coordinator Q&A |

Or via REST (Note: use 193319651907 for Vertex AI calls):

```bash
curl -X POST \
  "https://us-west1-aiplatform.googleapis.com/v1beta1/projects/193319651907/locations/us-west1/agents" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "OrchestratorAgent",
    "model": "gemini-2.0-flash-001",
    "instruction": "See Section 6 for full prompt."
  }'
```

### 3.3 Go Module Init

```bash
cd functions/go
go mod init sahaay/functions

go get cloud.google.com/go/vertexai@latest
go get cloud.google.com/go/aiplatform@latest
go get firebase.google.com/go/v4@latest
go get github.com/GoogleCloudPlatform/functions-framework-go@latest

go mod tidy
```

---

## 4. Go Cloud Functions

### `functions/go/config/agents.go`

```go
package config

const Project  = "193319651907"
const Location = "us-west1"

// Resource IDs for Vertex AI Reasoning Engines
const OrchestratorAgentID = "projects/193319651907/locations/us-west1/reasoningEngines/4322593625159499776"
const MatchAgentID        = OrchestratorAgentID
const SurgeAgentID        = OrchestratorAgentID
const NarratorAgentID     = OrchestratorAgentID
const QueryAgentID        = OrchestratorAgentID
```

### `functions/go/middleware/auth.go`

```go
package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/GoogleCloudPlatform/functions-framework-go/functions"
	"github.com/MicahParks/keyfunc"
	"github.com/golang-jwt/jwt/v4"
	"sahaay.io/functions/config"
)

var firebaseAuthClient *auth.Client
var clerkJWKS *keyfunc.JWKS

func init() {
	ctx := context.Background()
	app, err := firebase.NewApp(ctx, &firebase.Config{ProjectID: config.DataProject})
	if err == nil {
		firebaseAuthClient, _ = app.Auth(ctx)
	}

	loadCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	clerkJWKS, err = keyfunc.Get(config.ClerkJWKSURL, keyfunc.Options{
		Ctx:             loadCtx,
		RefreshInterval: time.Hour,
	})
	if err != nil {
		log.Printf("[AUTH] Failed to load Clerk JWKS: %v", err)
	}

	functions.HTTP("ExchangeFirebaseToken", ExchangeFirebaseToken)
}

func VerifyIDToken(r *http.Request) (string, error) {
	if clerkJWKS == nil {
		return "", fmt.Errorf("Clerk JWKS not initialized")
	}

	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return "", fmt.Errorf("missing Bearer token")
	}
	tokenStr := strings.TrimPrefix(header, "Bearer ")

	parser := jwt.NewParser(jwt.WithValidMethods([]string{"RS256"}))
	claims := &jwt.RegisteredClaims{}
	token, err := parser.ParseWithClaims(tokenStr, claims, clerkJWKS.Keyfunc)
	if err != nil || !token.Valid {
		return "", fmt.Errorf("invalid Clerk token: %w", err)
	}

	if !claims.VerifyIssuer(config.ClerkIssuer, true) {
		return "", fmt.Errorf("invalid issuer: got %s, want %s", claims.Issuer, config.ClerkIssuer)
	}

	if claims.Subject == "" {
		return "", fmt.Errorf("missing sub claim")
	}
	return claims.Subject, nil
}

func ExchangeFirebaseToken(w http.ResponseWriter, r *http.Request) {
	// CORS handling, verify Clerk JWT, mint Firebase custom token via firebaseAuthClient.CustomToken(r.Context(), uid)
}
```

### `functions/go/agents/orchestrator.go`

```go
package agents

import (
	"context"
	"encoding/json"
	"net/http"

	aiplatform "cloud.google.com/go/aiplatform/apiv1beta1"
	"cloud.google.com/go/aiplatform/apiv1beta1/aiplatformpb"
	"github.com/GoogleCloudPlatform/functions-framework-go/functions"
	"sahaay/functions/config"
	"sahaay/functions/middleware"
)

func init() {
	functions.HTTP("CallAgent", CallAgent)
}

type AgentRequest struct {
	Intent    string         `json:"intent"`
	Payload   map[string]any `json:"payload"`
	SessionID string         `json:"sessionId"`
}

type AgentResponse struct {
	Result    any    `json:"result"`
	AgentUsed string `json:"agentUsed"`
}

func CallAgent(w http.ResponseWriter, r *http.Request) {
	uid, err := middleware.VerifyIDToken(r)
	if err != nil {
		http.Error(w, "Unauthenticated", http.StatusUnauthorized)
		return
	}
	_ = uid

	var req AgentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	agentID := agentForIntent(req.Intent)

	ctx := context.Background()
	client, err := aiplatform.NewAgentClient(ctx)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer client.Close()

	payloadBytes, _ := json.Marshal(req.Payload)
	resp, err := client.QueryAgent(ctx, &aiplatformpb.QueryAgentRequest{
		Name:    agentID,
		Session: req.SessionID,
		Query:   string(payloadBytes),
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AgentResponse{
		Result:    resp.GetOutput(),
		AgentUsed: req.Intent,
	})
}

func agentForIntent(intent string) string {
	switch intent {
	case "MATCH_VOLUNTEERS":
		return config.MatchAgentID
	case "PREDICT_SURGE":
		return config.SurgeAgentID
	case "NARRATE_REPORT":
		return config.NarratorAgentID
	case "QUERY_ASSISTANT":
		return config.QueryAgentID
	default:
		return config.OrchestratorAgentID
	}
}
```

### Identity & Backend Entry Points

| Function                | Purpose                                      | Model / API        |
| ----------------------- | -------------------------------------------- | ------------------ |
| `OcrAadhaar`            | Extract Name, DOB, Aadhaar No from photo     | Google Vision AI   |
| `DetectFace`            | Extract facial embeddings from ID + Selfie   | Vision AI (Face)   |
| `VerifyKYC`             | Compute similarity + verify Aadhaar checksum | Go Logic           |
| `CallAgent`             | Bridge to Vertex AI Agent Engine             | Gemini 2.0 Flash   |
| `ExchangeFirebaseToken` | Mint Firebase custom token from Clerk JWT    | Firebase Auth      |

### Deploy

```bash
cd functions/go

gcloud functions deploy CallAgent DetectFace VerifyKYC OcrAadhaar ExchangeFirebaseToken \
  --gen2 \
  --runtime=go122 \
  --region=us-west1 \
  --source=. \
  --trigger-http \
  --allow-unauthenticated \
  --service-account=sahaay-493113@appspot.gserviceaccount.com \
  --set-env-vars=GOOGLE_CLOUD_PROJECT=sahaay-493113
```

---

## 5. Angular AgentService

Delete `gemini.service.ts`. This replaces it entirely.

```typescript
// core/ai/agent.service.ts
import { Injectable, inject } from "@angular/core";
import { Functions, httpsCallable } from "@angular/fire/functions";
import { AuthService } from "../auth/auth.service";
import {
  Task,
  Volunteer,
  VolunteerMatch,
  WeeklyStats,
  SurgePrediction,
} from "../../models";

export type AgentIntent =
  | "MATCH_VOLUNTEERS"
  | "PREDICT_SURGE"
  | "NARRATE_REPORT"
  | "QUERY_ASSISTANT";

interface AgentRequest {
  intent: AgentIntent;
  payload: Record<string, unknown>;
  sessionId: string;
}

interface AgentResponse<T> {
  result: T;
  agentUsed: string;
}

@Injectable({ providedIn: "root" })
export class AgentService {
  private fns = inject(Functions);
  private auth = inject(AuthService);

  private call = httpsCallable<AgentRequest, AgentResponse<unknown>>(
    this.fns,
    "CallAgent",
  );

  private dispatch<T>(intent: AgentIntent, payload: Record<string, unknown>) {
    const sessionId = this.auth.currentUser?.uid ?? "anon";
    return this.call({ intent, payload, sessionId }).then(
      (r) => r.data.result as T,
    );
  }

  matchVolunteers(task: Task, volunteers: Volunteer[]) {
    return this.dispatch<VolunteerMatch[]>("MATCH_VOLUNTEERS", {
      task,
      volunteers,
    });
  }

  predictSurge(region: string) {
    return this.dispatch<SurgePrediction[]>("PREDICT_SURGE", { region });
  }

  narrateReport(stats: WeeklyStats) {
    return this.dispatch<string>("NARRATE_REPORT", { stats });
  }

  queryAssistant(question: string, context: Record<string, unknown>) {
    return this.dispatch<string>("QUERY_ASSISTANT", { question, context });
  }
}
```

---

## 6. Agent Instruction Prompts

Paste these into each agent in the Vertex AI console.

### OrchestratorAgent

```
You are the Sahaay NGO coordination AI.
Input: JSON with fields intent (string) and payload (object).
Delegate to the correct specialist based on intent:
  MATCH_VOLUNTEERS  → MatchAgent
  PREDICT_SURGE     → SurgeAgent
  NARRATE_REPORT    → NarratorAgent
  QUERY_ASSISTANT   → QueryAgent
Return the specialist response unchanged. Always respond in JSON.
```

### MatchAgent

```
You are a volunteer matching specialist for NGOs in Mumbai, India.
Input: { task: Task, volunteers: Volunteer[] }
Return JSON array of top 3 matches:
[{ volunteerId, reason, confidenceScore (0.0-1.0), estimatedArrival, skillMatchTags }]
Weights: skill match 40%, proximity 30%, availability 20%, rating 10%.
Use 30 km/h for estimatedArrival. Be specific — name the volunteer, distance, matching skill.
```

### SurgeAgent

```
You are a needs surge prediction specialist for Mumbai NGOs.
Input: { region: string, historicalNeeds: Need[] }
Analyse last 8 weeks. Return JSON array:
[{ category, predictedCount, confidence, week, reasoning }]
Categories: food, medical, education, shelter, water, other.
Factor in monsoon (June–September) and historical spikes.
```

### NarratorAgent

```
You are a donor report writer for Sahaay NGO platform.
Input: { stats: WeeklyStats }
Write 2-3 paragraphs of human-centred donor narrative.
Mention real numbers, locations (Dharavi, Kurla, Govandi), concrete impact.
Return JSON: { narrative: string, headline: string, keyStats: string[] }
No jargon. Write for a Mumbai CSR team.
```

### QueryAgent

```
You are the Sahaay coordinator assistant.
Input: { question: string, context: DashboardContext }
Use semanticSearch tool to find relevant Firestore needs.
Return concise plain-English answer.
Examples:
  "How many medical needs are open in Dharavi?"
  "Which volunteers can handle a flood emergency right now?"
```

---

## 7. Data Models

```typescript
// models/need.model.ts
export interface Need {
  id: string;
  title: string;
  category: "food" | "medical" | "education" | "shelter" | "water" | "other";
  urgency: "low" | "medium" | "high" | "critical";
  lat: number;
  lng: number;
  locationName: string;
  reportedAt: Timestamp;
  reportedBy: string;
  status: "open" | "assigned" | "in_progress" | "resolved" | "dismissed";
  assignedVolunteers: string[];
  photoUrl?: string;
  description: string;
  summary?: string; // Firebase Extension: Gemini Summarise
  descriptionHindi?: string; // Firebase Extension: Gemini Translate
  embedding?: number[]; // Cloud Function trigger: vector search
}

// models/task.model.ts
export interface Task {
  id: string;
  title: string;
  needId?: string;
  category: Need["category"];
  priority: Need["urgency"];
  volunteerIds: string[];
  status: "pending" | "active" | "completed" | "escalated";
  progress: number;
  dueAt: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  recurring: boolean;
  frequency?: "daily" | "weekly";
  attachmentUrls: string[];
  description: string;
  locationLat: number;
  locationLng: number;
  locationName: string;
}

// models/volunteer.model.ts
export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  skills: string[];
  languages: string[];
  lat: number;
  lng: number;
  available: boolean;
  availabilitySchedule: Record<string, string[]>;
  rating: number;
  tasksCompleted: number;
  totalHours: number;
  badges: string[];
  active: boolean;
}

// models/ai-match.model.ts
export interface VolunteerMatch {
  volunteerId: string;
  reason: string;
  confidenceScore: number;
  estimatedArrival: string;
  skillMatchTags: string[];
}
```

---

## 8. Firebase Extensions

Install from Firebase console. Zero application code required.

| Extension                    | Trigger                   | Effect                                                     |
| ---------------------------- | ------------------------- | ---------------------------------------------------------- |
| Multimodal Tasks with Gemini | Need photo uploaded       | Sets `category` + `urgency` on Firestore doc               |
| Summarize Text with Gemini   | Need description saved    | Writes `need.summary` — shown on map pin tooltip           |
| Translate Text with Gemini   | Any need submitted        | Writes `need.descriptionHindi` + `need.descriptionEnglish` |
| Firestore Gemini Chatbot     | Coordinator opens AI chat | Natural language Q&A on live Firestore data                |

---

## 9. FCM — Critical Need Alert

```typescript
export const onCriticalNeedCreated = onDocumentCreated(
  "needs/{needId}",
  async (event) => {
    const need = event.data?.data() as Need;
    if (need.urgency !== "critical" || need.assignedVolunteers.length > 0)
      return;

    await admin.messaging().sendMulticast({
      tokens: await getAdminFcmTokens(need.region),
      notification: {
        title: "Sahaay — Critical need unassigned",
        body: `${need.title} in ${need.locationName} — 0 volunteers assigned`,
      },
      data: { needId: event.params.needId, screen: "needs-map" },
    });
  },
);
```

---

## 10. Firestore — Offline + Vector Search

```typescript
enableIndexedDbPersistence(this.firestore);

const needsSignal = toSignal(
  collectionData(query(
    collection(this.firestore, 'needs'),
    where('status', '==', 'open'),
    orderBy('urgency', 'desc')
  )) as Observable<Need[]>
);

async semanticSearch(query: string): Promise<Need[]> {
  const queryEmbedding = await this.model.embedContent(query);
  return vectorSearch(this.firestore, 'needs', queryEmbedding.values, { limit: 10 });
}
```

---

## 11. Auth — Role Guard

```typescript
type UserRole = "volunteer" | "fieldworker" | "ngo_admin" | "ngo_founder" | "superadmin";

export const roleGuard = (allowedRoles: UserRole[]) =>
  inject(AuthService).currentUser$.pipe(
    map(
      (user) =>
        allowedRoles.includes(user.role) ||
        router.createUrlTree(["/unauthorized"]),
    ),
  );
```

| Role         | Permissions                                                   |
| ------------ | ------------------------------------------------------------- |
| Field Worker | Submit needs, update task progress, offline mode              |
| Volunteer    | View assigned tasks, accept/decline, mark progress            |
| NGO Admin    | Full dashboard, create tasks, all analytics, generate reports |
| NGO Founder  | Organization setup, manage registry, admin/founder dashboard  |
| Super Admin  | Cross-region dashboard, comparative analytics, donor export   |

---

## 12. Design Tokens

```scss
:root {
  --color-primary: #0a6b5e;
  --color-primary-light: #e8f5f2;
  --color-primary-mid: #1d9e75;
  --color-warning: #d97706;
  --color-warning-light: #fef3c7;
  --color-danger: #dc2626;
  --color-danger-light: #fef2f2;
  --color-success: #16a34a;
  --color-success-light: #f0fdf4;
  --color-info: #2563eb;
  --color-info-light: #eff6ff;
  --color-surface: #fafaf9;
  --color-card: #ffffff;
  --color-border: #e5e3df;
  --color-text-primary: #111110;
  --color-text-secondary: #6b6965;
  --color-text-hint: #a8a5a0;

  --font-display: "DM Serif Display", serif;
  --font-ui: "Inter", sans-serif;

  --radius-card: 14px;
  --radius-button: 8px;
  --radius-input: 9px;
  --radius-badge: 20px;
  --screen-pad: 12px;
  --card-pad-v: 12px;
  --card-pad-h: 14px;
  --card-gap: 8px;
}
```

---

## 13. Routing

```typescript
export const routes: Routes = [
  {
    path: "auth",
    loadComponent: () =>
      import("./auth/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "",
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: "home",
        loadComponent: () =>
          import("./features/home/home.component").then((m) => m.HomeComponent),
      },
      {
        path: "needs-map",
        loadComponent: () =>
          import("./features/needs-map/needs-map.component").then(
            (m) => m.NeedsMapComponent,
          ),
      },
      {
        path: "tasks",
        loadComponent: () =>
          import("./features/tasks/tasks.component").then(
            (m) => m.TasksComponent,
          ),
      },
      {
        path: "volunteers",
        loadComponent: () =>
          import("./features/volunteers/volunteers.component").then(
            (m) => m.VolunteersComponent,
          ),
      },
      {
        path: "insights",
        loadComponent: () =>
          import("./features/insights/insights.component").then(
            (m) => m.InsightsComponent,
          ),
      },
      { path: "", redirectTo: "home", pathMatch: "full" },
    ],
  },
];
```

Sub-tabs use `selectedTab = signal('active')`, never child routes.

---

## 14. Angular Material Mapping

| UI Element          | Component                            |
| ------------------- | ------------------------------------ |
| Bottom nav          | Custom flex + `RouterLinkActive`     |
| Sub-tab pills       | `MatTabGroup` with pill CSS override |
| Needs map slide-up  | `MatBottomSheet`                     |
| Modal               | `MatDialog`                          |
| Form inputs         | `MatFormField` + `MatInput`          |
| Category dropdown   | `MatSelect`                          |
| Toggle              | `MatSlideToggle`                     |
| Priority control    | `MatButtonToggleGroup`               |
| Filter chips        | `MatChipSet` + `MatChip`             |
| Snackbar            | `MatSnackBar`                        |
| FAB                 | `<button mat-fab>`                   |
| AI coordinator chat | `MatSidenav` sliding from right      |

---

## 15. Development Status

| Status | Item                                                 |
| ------ | ---------------------------------------------------- |
| [x]    | AGENTS.md rewrite — Vertex AI + Go architecture      |
| [x]    | NGO Founder role — primary registration path         |
| [x]    | Angular 18 init + AgentService                       |
| [x]    | GCP APIs enabled + 5 Vertex AI agents created        |
| [x]    | Go module init + 4 Functions deployed                |
| [x]    | IAM Permissions granted (Cross-project AI/Firestore) |
| [x]    | Cloud Run Auth (Public invoker + Internal Firebase Auth) |
| [x]    | Clerk Auth + role guards                             |
| [x]    | Registration Flow — Skip verification + success screen |
| [x]    | AI Agent Fixes — us-west1 endpoint + input wrapping   |
| [x]    | Aadhaar KYC + Face Match Backends (Go)               |
| [x]    | NGO Registry + Resource Vault Services               |

| [x]    | Firestore service + offline persistence              |
| [x]    | Home tab — real-time dashboard                       |
| [x]    | Needs Map — Maps + pins + heatmap                    |
| [x]    | Tasks tab — CRUD lifecycle                           |
| [x]    | Volunteers tab — profiles + smart match UI           |
| [x]    | Insights tab — charts + AI cards                     |
| [x]    | Firebase Extensions — Gemini Summarise/Translate     |
| [x]    | Vector search — Firestore triggers + embeddings      |
| [x]    | FCM push notifications                               |
| [x]    | PWA service worker                                   |
| [x]    | Seed data — 20 Mumbai needs, 15 volunteers, 30 tasks |

---

## 16. Absolute Rules

### Code

1. `standalone: true` on every component, directive, pipe. No NgModules.
2. No `any`. No type casting. Every type explicit.
3. `ChangeDetectionStrategy.OnPush` on every component.
4. `toSignal()` to bridge Observables. No `async` pipe on new code.
5. No inline styles. All styles in `.scss` using `_tokens.scss`.
6. Real Mumbai data only. "Dharavi Medical Emergency", "Kurla Food Distribution". No Lorem Ipsum.

### Vertex AI & Firebase

7. Vertex AI credentials never in Angular. All calls through `CallAgent` Go function only.
8. Clerk session JWT verified in Go before every Cloud Function invocation.
9. Write `firestore.rules` for every collection before the service that accesses it.
10. Zod schema for every agent response. Never parse raw text with regex or string splitting.
11. Approved Cloud Functions only: `CallAgent`, `DetectFace`, `VerifyKYC`, `OcrAadhaar`, `ExchangeFirebaseToken`. Never add unauthorized public endpoints.

### Cost & Workflow

12. Firebase Spark plan. Gemini 2.0 Flash free tier. No paid Maps SKUs.
13. `ng build` + `ng lint` after every component. Never 300+ lines without a compile check.
14. Commit format: `feat(agents): add Go CallAgent with Vertex AI orchestrator routing`
15. No `cat`/`grep` for edits. Use agent-native file tools for all modifications.
16. NEVER use emojis in code, commits, documentation, markdown files, responses, or messages across any project. Strictly prohibited.
