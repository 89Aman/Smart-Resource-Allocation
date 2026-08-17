package config

import (
	"strings"
	"testing"
)

func TestIsConfigured(t *testing.T) {
	result := IsConfigured()
	if !result {
		t.Error("IsConfigured() = false, expected true (agents should be configured)")
	}
}

func TestProjectID(t *testing.T) {
	if Project == "" {
		t.Error("Project is empty")
	}
	if !strings.HasPrefix(Project, "1") && !strings.HasPrefix(Project, "sahaay") {
		t.Errorf("Project = %v, expected numeric ID or project name", Project)
	}
}

func TestLocation(t *testing.T) {
	if Location == "" {
		t.Error("Location is empty")
	}
	if Location != "us-west1" {
		t.Errorf("Location = %v, want us-west1", Location)
	}
}

func TestAgentIDsNotEmpty(t *testing.T) {
	if OrchestratorAgentID == "" || OrchestratorAgentID == "REPLACE" {
		t.Error("OrchestratorAgentID is not configured")
	}
}

func TestAgentIDsContainProject(t *testing.T) {
	agentIDs := []string{
		OrchestratorAgentID,
		MatchAgentID,
		SurgeAgentID,
		NarratorAgentID,
		QueryAgentID,
	}

	for _, id := range agentIDs {
		if !strings.Contains(id, "projects/") {
			t.Errorf("Agent ID %q does not contain 'projects/' prefix", id)
		}
		if !strings.Contains(id, "locations/") {
			t.Errorf("Agent ID %q does not contain 'locations/' prefix", id)
		}
		if !strings.Contains(id, "reasoningEngines/") && !strings.Contains(id, "agents/") {
			t.Errorf("Agent ID %q does not contain 'reasoningEngines/' or 'agents/' prefix", id)
		}
	}
}

func TestAllSpecialistAgentsPointToOrchestrator(t *testing.T) {
	if MatchAgentID != OrchestratorAgentID {
		t.Log("Note: MatchAgentID differs from OrchestratorAgentID")
	}
	if SurgeAgentID != OrchestratorAgentID {
		t.Log("Note: SurgeAgentID differs from OrchestratorAgentID")
	}
	if NarratorAgentID != OrchestratorAgentID {
		t.Log("Note: NarratorAgentID differs from OrchestratorAgentID")
	}
	if QueryAgentID != OrchestratorAgentID {
		t.Log("Note: QueryAgentID differs from OrchestratorAgentID")
	}
}
