package config
// Project B: AI + Functions
const Project = "sahaay-26007"
// Project A: Auth + Firestore + Storage
const DataProject = "sahaay-18eb3"
// Location for Cloud Functions and Vertex AI Agent Engine
const Location = "us-west1"
// GeminiProject is the GCP project where Gemini publisher models are accessible.
// This is the main Firebase project where ToS was accepted via Agent Studio.
const GeminiProject = "sahaay-26007"
// GeminiLocation is where Gemini publisher models are available.
// us-central1 is the primary region for Gemini publisher models in Vertex AI.
const GeminiLocation = "us-central1"
// GeminiModel is the Vertex AI publisher model ID for Gemini.
const GeminiModel = "gemini-2.0-flash-001"

// Clerk authentication (dev instance).
// JWKS URL serves the public keys used to verify Clerk session JWTs.
const ClerkIssuer = "https://classic-slug-92.clerk.accounts.dev"
const ClerkJWKSURL = "https://classic-slug-92.clerk.accounts.dev/.well-known/jwks.json"
const OrchestratorAgentID = "projects/sahaay-26007/locations/us-central1/agents/agent_1786968510298"
// Using Orchestrator as fallback for now.
const MatchAgentID        = OrchestratorAgentID
const SurgeAgentID        = OrchestratorAgentID
const NarratorAgentID     = OrchestratorAgentID
const QueryAgentID        = OrchestratorAgentID

func IsConfigured() bool {
	if OrchestratorAgentID == "" || OrchestratorAgentID == "REPLACE" {
		return false
	}
	return true
}
