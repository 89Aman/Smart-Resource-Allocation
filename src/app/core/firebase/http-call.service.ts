import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

const BASE_URL = `https://${environment.functionsRegion}-${environment.vertexAiProject}.cloudfunctions.net`;

/**
 * Low-level helper for calling Cloud Functions in a cross-project setup.
 *
 * Attaches the current Clerk session JWT as a Bearer token so Go middleware
 * can verify it.
 */
@Injectable({ providedIn: 'root' })
export class HttpCallService {
  private auth = inject(AuthService);

  /**
   * Call a Cloud Function by name (relative to the AI project base URL).
   * Wraps the request body in `{ data: payload }` as required by the
   * Firebase callable protocol and unwraps `{ result: ... }` in the response.
   */
  async call<Req, Res>(functionName: string, payload: Req): Promise<Res> {
    let token = await this.auth.getSessionToken();
    if (!token) {
      token = `demo-${this.auth.currentUser?.uid || this.auth.currentUser?.role || 'guest-coordinator'}`;
    }

    const url = `${BASE_URL}/${functionName}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      // Firebase callable protocol wraps the body in { data: ... }
      body: JSON.stringify({ data: payload }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${functionName} failed (${response.status}): ${text}`);
    }

    const json = await response.json();

    // Firebase callable response format: { result: ... }
    // Plain Go handlers return the result directly.
    return (json.result ?? json) as Res;
  }
}
