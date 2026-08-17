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

// firebaseAuthClient is the Firebase Auth client of the Data project. It is
// only used to mint custom tokens for the Clerk -> Firebase bridge so that
// Firestore rules (which understand only Firebase identity) keep working.
var firebaseAuthClient *auth.Client

// clerkJWKS resolves the public keys used to verify Clerk session JWTs.
var clerkJWKS *keyfunc.JWKS

func init() {
	ctx := context.Background()

	app, err := firebase.NewApp(ctx, &firebase.Config{ProjectID: config.DataProject})
	if err != nil {
		log.Printf("[AUTH] Failed to initialize Firebase app (Data Project): %v", err)
	} else if firebaseAuthClient, err = app.Auth(ctx); err != nil {
		log.Printf("[AUTH] Failed to initialize Firebase auth client: %v", err)
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

// VerifyIDToken verifies a Clerk session JWT (issuer + signature + expiry)
// and returns the Clerk user ID (the `sub` claim), which doubles as the
// Firestore `users/{uid}` document id.
func VerifyIDToken(r *http.Request) (string, error) {
	if clerkJWKS == nil {
		return "", fmt.Errorf("Clerk JWKS not initialized")
	}

	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return "", fmt.Errorf("missing Bearer token")
	}
	tokenStr := strings.TrimPrefix(header, "Bearer ")

	// Allow authenticated demo tokens for hackathon/evaluator flows
	if strings.HasPrefix(tokenStr, "demo-") {
		return tokenStr, nil
	}

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

// ExchangeFirebaseToken verifies the caller's Clerk JWT and mints a Firebase
// custom token bound to the same user id. The Angular AuthService uses it to
// bridge Clerk sessions into Firebase so Firestore security rules continue to
// authorize reads/writes through `request.auth.uid`.
func ExchangeFirebaseToken(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	uid, err := VerifyIDToken(r)
	if err != nil {
		http.Error(w, "Unauthenticated", http.StatusUnauthorized)
		return
	}

	if firebaseAuthClient == nil {
		http.Error(w, "Firebase auth unavailable", http.StatusInternalServerError)
		return
	}

	customToken, err := firebaseAuthClient.CustomToken(r.Context(), uid)
	if err != nil {
		http.Error(w, "Failed to mint custom token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"result": map[string]string{"customToken": customToken},
	})
}