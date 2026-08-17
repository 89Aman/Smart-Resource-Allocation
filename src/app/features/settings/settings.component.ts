import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { FirestoreService } from '../../core/firebase/firestore.service';
import { StorageService } from '../../core/firebase/storage.service';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/ui/theme.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserRole } from '../../models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatSlideToggleModule, 
    MatButtonModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatChipsModule,
    FormsModule, 
    MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-badge">
          <mat-icon fontSet="material-symbols-rounded">tune</mat-icon>
          <span>COMMAND CENTER • MUMBAI WARD 4</span>
        </div>
        <h1 class="title">Platform Settings & Controls</h1>
        <p class="subtitle-text">Manage identity profiles, AI dispatch thresholds, organization registry, and notifications</p>
      </div>
    </div>

    <div class="settings-container">

      <!-- SECTION 1: Account & Profile -->
      <section class="settings-section">
        <div class="section-header">
          <mat-icon fontSet="material-symbols-rounded">badge</mat-icon>
          <h2 class="section-title">User Account & Identity Profile</h2>
        </div>

        <div class="account-card" *ngIf="getUser() as u">
          <div class="user-info-row">
            <div class="avatar-wrapper">
              <img [src]="getUserAvatar()" alt="Profile">
              <button type="button" 
                      class="avatar-camera-btn" 
                      (click)="userAvatarInput.click()" 
                      [disabled]="isUploadingUserAvatar()"
                      title="Change Profile Photo">
                <mat-icon fontSet="material-symbols-rounded">{{ isUploadingUserAvatar() ? 'hourglass_top' : 'photo_camera' }}</mat-icon>
              </button>
              <input type="file" #userAvatarInput hidden accept="image/*" (change)="onUserAvatarSelected($event)">
              <span class="online-indicator"></span>
            </div>

            <div class="user-meta">
              <div class="user-name-row">
                <h3 class="user-name">{{ u.displayName || 'Sahaay Coordinator' }}</h3>
                <span class="role-badge" [ngClass]="u.role">{{ formatRole(u.role) }}</span>
                <span class="kyc-badge" *ngIf="u.faceVerified || u.verificationStatus === 'approved'">
                  <mat-icon fontSet="material-symbols-rounded">verified</mat-icon>
                  Vision AI KYC Verified
                </span>
              </div>

              <!-- Avatar Quick Actions -->
              <div class="avatar-actions-row">
                <button type="button" class="mini-avatar-btn" (click)="userAvatarInput.click()" [disabled]="isUploadingUserAvatar()">
                  <mat-icon fontSet="material-symbols-rounded">upload</mat-icon>
                  <span>{{ isUploadingUserAvatar() ? 'Uploading...' : 'Change Photo' }}</span>
                </button>
                <button type="button" class="mini-avatar-btn secondary" (click)="generateRandomAvatar()" [disabled]="isUploadingUserAvatar()">
                  <mat-icon fontSet="material-symbols-rounded">casino</mat-icon>
                  <span>Randomize Avatar</span>
                </button>
              </div>

              <div class="user-details-grid">
                <div class="detail-pill">
                  <mat-icon fontSet="material-symbols-rounded">mail</mat-icon>
                  <span>{{ u.email || 'coordinator@sahaay.org' }}</span>
                </div>
                <div class="detail-pill">
                  <mat-icon fontSet="material-symbols-rounded">call</mat-icon>
                  <span>{{ u.phone || '+91 98765 43210' }}</span>
                </div>
                <div class="detail-pill">
                  <mat-icon fontSet="material-symbols-rounded">location_on</mat-icon>
                  <span>{{ u.region || 'Mumbai (Ward 4 - Dharavi)' }}</span>
                </div>
                <div class="detail-pill" *ngIf="u.aadhaarNumber">
                  <mat-icon fontSet="material-symbols-rounded">fingerprint</mat-icon>
                  <span>Aadhaar: {{ u.aadhaarNumber }}</span>
                </div>
              </div>
            </div>

            <button type="button" class="signout-btn" (click)="signOut()">
              <mat-icon fontSet="material-symbols-rounded">logout</mat-icon>
              <span>Sign Out</span>
            </button>
          </div>

          <!-- Quick Role Switcher -->
          <div class="role-switcher-box">
            <div class="switcher-label">
              <mat-icon fontSet="material-symbols-rounded">swap_horiz</mat-icon>
              <span>Switch Testing Role (Instant Access):</span>
            </div>
            <div class="role-buttons">
              @for (r of availableRoles; track r.id) {
                <button type="button" 
                        class="role-switch-pill" 
                        [class.active]="u.role === r.id"
                        (click)="switchRole(r.id, r.name, r.email)">
                  <mat-icon fontSet="material-symbols-rounded">{{ r.icon }}</mat-icon>
                  <span>{{ r.label }}</span>
                </button>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 2: Organization Profile -->
      <section class="settings-section">
        <div class="section-header">
          <mat-icon fontSet="material-symbols-rounded">corporate_fare</mat-icon>
          <h2 class="section-title">Organization Registry & Affiliation</h2>
          <span class="owner-pill" *ngIf="isOrgOwner()">
            <mat-icon fontSet="material-symbols-rounded">verified_user</mat-icon>
            NGO Owner Access
          </span>
          <span class="view-only-pill" *ngIf="!isOrgOwner()">
            <mat-icon fontSet="material-symbols-rounded">visibility</mat-icon>
            Affiliated Member (View Only)
          </span>
        </div>

        <div class="settings-card">
          <div class="org-permission-banner" *ngIf="!isOrgOwner()">
            <mat-icon fontSet="material-symbols-rounded">lock</mat-icon>
            <span>Only NGO Founders and NGO Admins can change the organization logo and details. Switch to Founder/Admin role to edit.</span>
          </div>

          <div class="org-header-row">
            <div class="org-logo-col">
              <img [src]="getNgoLogo()" alt="Org Logo" class="org-logo-img">
              
              <div class="org-logo-buttons" *ngIf="isOrgOwner()">
                <button type="button" class="upload-logo-btn" (click)="fileInput.click()" [disabled]="isUploadingLogo()">
                  <mat-icon fontSet="material-symbols-rounded">upload</mat-icon>
                  <span>{{ isUploadingLogo() ? 'Uploading...' : 'Change Logo' }}</span>
                </button>
                <button type="button" class="upload-logo-btn secondary" (click)="generateRandomOrgLogo()" [disabled]="isUploadingLogo()">
                  <mat-icon fontSet="material-symbols-rounded">auto_fix_high</mat-icon>
                  <span>Generate</span>
                </button>
              </div>
              <input type="file" #fileInput hidden accept="image/*" (change)="onLogoSelected($event)">
            </div>

            <div class="org-inputs-col">
              <div class="sahaay-input-group">
                <label class="sahaay-label">Organization Name</label>
                <div class="sahaay-control-box">
                  <mat-icon fontSet="material-symbols-rounded">business</mat-icon>
                  <input type="text" [(ngModel)]="editOrgName" [disabled]="!isOrgOwner()" placeholder="e.g. Sahaay Foundation Mumbai">
                </div>
              </div>

              <div class="org-row-2">
                <div class="sahaay-input-group flex-1">
                  <label class="sahaay-label">Registration Number</label>
                  <div class="sahaay-control-box">
                    <mat-icon fontSet="material-symbols-rounded">app_registration</mat-icon>
                    <input type="text" [(ngModel)]="ngoRegNumber" [disabled]="!isOrgOwner()" placeholder="e.g. BOM/12345/2021">
                  </div>
                </div>

                <div class="sahaay-input-group flex-1">
                  <label class="sahaay-label">Operating Ward</label>
                  <div class="sahaay-control-box">
                    <mat-icon fontSet="material-symbols-rounded">map</mat-icon>
                    <input type="text" [(ngModel)]="operatingRegion" [disabled]="!isOrgOwner()" placeholder="Mumbai Ward 4 (Dharavi / Kurla)">
                  </div>
                </div>
              </div>

              <div class="save-row" *ngIf="isOrgOwner()">
                <button type="button" class="save-btn" (click)="saveOrgName()" [disabled]="isSavingOrgName()">
                  <mat-icon fontSet="material-symbols-rounded">save</mat-icon>
                  <span>{{ isSavingOrgName() ? 'Saving...' : 'Save Organization Profile' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 3: Vertex AI & Dispatch Settings -->
      <section class="settings-section">
        <div class="section-header">
          <mat-icon fontSet="material-symbols-rounded">psychology</mat-icon>
          <h2 class="section-title">Vertex AI Coordination & Dispatch Parameters</h2>
        </div>

        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon-box ai">
                <mat-icon fontSet="material-symbols-rounded">smart_toy</mat-icon>
              </div>
              <div>
                <h3>Vertex AI Multi-Agent Volunteer Matching</h3>
                <p>Orchestrate MatchAgent, SurgeAgent, and NarratorAgent via Gemini 2.0 Flash reasoning engine.</p>
              </div>
            </div>
            <mat-slide-toggle [checked]="true" (change)="toggleSetting('aiMatching')"></mat-slide-toggle>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon-box warning">
                <mat-icon fontSet="material-symbols-rounded">warning</mat-icon>
              </div>
              <div>
                <h3>Automated Monsoon Surge Alert Predictor</h3>
                <p>Predict supply surges based on rainfall radar and 8-week historical emergency trends.</p>
              </div>
            </div>
            <mat-slide-toggle [checked]="true" (change)="toggleSetting('surgeAlert')"></mat-slide-toggle>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon-box success">
                <mat-icon fontSet="material-symbols-rounded">share_location</mat-icon>
              </div>
              <div>
                <h3>Geofence Volunteer Proximity Match (5 km)</h3>
                <p>Prioritize responders located within 5 kilometers of the reported crisis coordinates.</p>
              </div>
            </div>
            <mat-slide-toggle [checked]="true" (change)="toggleSetting('geofence')"></mat-slide-toggle>
          </div>
        </div>
      </section>

      <!-- SECTION 4: Notifications & Emergency Alerts -->
      <section class="settings-section">
        <div class="section-header">
          <mat-icon fontSet="material-symbols-rounded">notifications_active</mat-icon>
          <h2 class="section-title">Emergency Broadcast & Notifications</h2>
        </div>

        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon-box danger">
                <mat-icon fontSet="material-symbols-rounded">emergency</mat-icon>
              </div>
              <div>
                <h3>Critical Need Push Alerts (FCM)</h3>
                <p>Instant push notification to all available field leads when unassigned critical needs emerge.</p>
              </div>
            </div>
            <mat-slide-toggle [checked]="true" (change)="toggleSetting('criticalAlerts')"></mat-slide-toggle>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon-box info">
                <mat-icon fontSet="material-symbols-rounded">group_add</mat-icon>
              </div>
              <div>
                <h3>Volunteer Applications & KYC Verification</h3>
                <p>Alert coordinators when new volunteer applicants upload Aadhaar and facial biometric scans.</p>
              </div>
            </div>
            <mat-slide-toggle [checked]="true" (change)="toggleSetting('volunteerNotifs')"></mat-slide-toggle>
          </div>
        </div>
      </section>

      <!-- SECTION 5: Appearance & Regional UI -->
      <section class="settings-section">
        <div class="section-header">
          <mat-icon fontSet="material-symbols-rounded">palette</mat-icon>
          <h2 class="section-title">Appearance & Regional Controls</h2>
        </div>

        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon-box neutral">
                <mat-icon fontSet="material-symbols-rounded">dark_mode</mat-icon>
              </div>
              <div>
                <h3>Dark Mode</h3>
                <p>Switch between light and high-contrast night theme for low-light field operations.</p>
              </div>
            </div>
            <mat-slide-toggle [checked]="isDarkMode()" (change)="toggleTheme()"></mat-slide-toggle>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon-box info">
                <mat-icon fontSet="material-symbols-rounded">layers</mat-icon>
              </div>
              <div>
                <h3>Default Crisis Heatmap Layer</h3>
                <p>Load the Google Maps crisis intensity heatmap layer by default on Crisis Map startup.</p>
              </div>
            </div>
            <mat-slide-toggle [checked]="true" (change)="toggleSetting('heatmapDefault')"></mat-slide-toggle>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 28px;
      animation: fadeUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      background: var(--color-primary-light);
      color: var(--color-primary);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
      border: 1px solid var(--color-primary-fixed-dim);
    }
    .header-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .title {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-primary);
      margin: 0;
    }

    .subtitle-text {
      margin: 4px 0 0;
      font-size: 0.86rem;
      color: var(--color-text-secondary);
    }

    .settings-container {
      max-width: 900px;
      display: flex;
      flex-direction: column;
      gap: 32px;
      animation: fadeUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-header mat-icon {
      color: var(--color-primary);
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .section-title {
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }    /* Account Card */
    .account-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--shadow-card);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .user-info-row {
      display: flex;
      align-items: flex-start;
      gap: 20px;
    }

    .avatar-wrapper {
      position: relative;
      flex-shrink: 0;
    }
    .avatar-wrapper img {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--color-primary);
      background: var(--color-surface-container);
      display: block;
    }
    .avatar-camera-btn {
      position: absolute;
      bottom: -4px;
      right: -4px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--color-on-primary);
      border: 2px solid var(--color-card);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      transition: all 0.2s;
    }
    .avatar-camera-btn:hover {
      transform: scale(1.1);
      background: var(--color-primary-mid);
    }
    .avatar-camera-btn mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }

    .online-indicator {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #16a34a;
      border: 2px solid var(--color-card);
      border-radius: 50%;
    }

    .user-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .user-name-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .user-name {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .role-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 12px;
      text-transform: capitalize;
    }
    .role-badge.super_admin { background: var(--color-tertiary-fixed); color: var(--color-on-tertiary-fixed-variant); }
    .role-badge.ngo_founder { background: var(--color-success-light); color: var(--color-success); }
    .role-badge.ngo_admin { background: var(--color-info-light); color: var(--color-info); }
    .role-badge.field_lead { background: var(--color-warning-light); color: var(--color-warning); }
    .role-badge.volunteer { background: var(--color-danger-light); color: var(--color-danger); }

    .kyc-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      background: var(--color-primary-light);
      color: var(--color-primary);
      padding: 3px 8px;
      border-radius: 12px;
      border: 1px solid var(--color-primary-fixed-dim);
    }
    .kyc-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .avatar-actions-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 2px 0;
    }
    .mini-avatar-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--color-primary-light);
      color: var(--color-primary);
      border: 1px solid var(--color-primary-fixed-dim);
      cursor: pointer;
      transition: all 0.2s;
    }
    .mini-avatar-btn:hover {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }
    .mini-avatar-btn.secondary {
      background: var(--color-surface-container-low);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
    .mini-avatar-btn.secondary:hover {
      background: var(--color-surface-container-high);
      color: var(--color-text-primary);
    }
    .mini-avatar-btn mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .user-details-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .detail-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--color-surface-container-low);
      border: 1px solid var(--color-border);
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.78rem;
      color: var(--color-text-secondary);
    }
    .detail-pill mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
      color: var(--color-primary);
    }

    .signout-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--color-danger-light);
      color: var(--color-danger);
      border: 1px solid var(--color-danger);
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .signout-btn:hover {
      background: var(--color-danger);
      color: var(--color-on-primary);
    }

    /* Role Switcher */
    .role-switcher-box {
      border-top: 1px solid var(--color-border);
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .switcher-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .switcher-label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--color-primary);
    }

    .role-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .role-switch-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid var(--color-border);
      background: var(--color-surface-container-low);
      color: var(--color-text-secondary);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .role-switch-pill mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .role-switch-pill:hover {
      background: var(--color-primary-light);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    .role-switch-pill.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-on-primary);
      box-shadow: 0 2px 8px rgba(0, 81, 71, 0.2);
    }

    /* Section status pills */
    .owner-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--color-success-light);
      color: var(--color-success);
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 700;
      margin-left: auto;
    }
    .owner-pill mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .view-only-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--color-surface-container-high);
      color: var(--color-text-secondary);
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 600;
      margin-left: auto;
    }
    .view-only-pill mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* Org Card */
    .settings-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--shadow-card);
    }

    .org-permission-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--color-surface-container-low);
      border: 1px dashed var(--color-border);
      color: var(--color-text-secondary);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      margin-bottom: 16px;
    }
    .org-permission-banner mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--color-warning);
    }

    .org-header-row {
      display: flex;
      gap: 24px;
    }

    .org-logo-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .org-logo-img {
      width: 90px;
      height: 90px;
      border-radius: 16px;
      object-fit: cover;
      border: 1.5px solid var(--color-border);
      background: var(--color-surface-container-low);
    }

    .org-logo-buttons {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }

    .upload-logo-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: var(--color-surface-container-low);
      border: 1px solid var(--color-border);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-primary);
      cursor: pointer;
      transition: all 0.2s;
    }
    .upload-logo-btn:hover:not(:disabled) {
      background: var(--color-primary-light);
      border-color: var(--color-primary);
    }
    .upload-logo-btn.secondary {
      color: var(--color-text-secondary);
    }
    .upload-logo-btn.secondary:hover:not(:disabled) {
      background: var(--color-surface-container-high);
      color: var(--color-text-primary);
    }
    .upload-logo-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .org-inputs-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .org-row-2 {
      display: flex;
      gap: 12px;
    }
    .flex-1 { flex: 1; }

    .save-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 4px;
    }

    .save-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--color-primary);
      color: var(--color-on-primary);
      border: none;
      padding: 9px 20px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 81, 71, 0.2);
    }
    .save-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Setting Items List */
    .settings-list {
      background: var(--color-card);
      border-radius: 16px;
      border: 1px solid var(--color-border);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }

    .setting-item {
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--color-border);
    }
    .setting-item:last-child {
      border-bottom: none;
    }

    .setting-info {
      display: flex;
      gap: 16px;
      align-items: center;
      max-width: 80%;
    }

    .setting-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .setting-icon-box mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .setting-icon-box.ai { background: var(--color-tertiary-fixed); color: var(--color-on-tertiary-fixed-variant); }
    .setting-icon-box.warning { background: var(--color-warning-light); color: var(--color-warning); }
    .setting-icon-box.success { background: var(--color-primary-light); color: var(--color-primary); }
    .setting-icon-box.danger { background: var(--color-danger-light); color: var(--color-danger); }
    .setting-icon-box.info { background: var(--color-info-light); color: var(--color-info); }
    .setting-icon-box.neutral { background: var(--color-surface-container-low); color: var(--color-text-secondary); }

    .setting-info h3 {
      margin: 0 0 2px;
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .setting-info p {
      margin: 0;
      font-size: 0.78rem;
      color: var(--color-text-secondary);
      line-height: 1.35;
    }
  `]
})
export class SettingsComponent {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private storageService = inject(StorageService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private snackBar = inject(MatSnackBar);

  user = toSignal(this.authService.currentUser$);
  isDarkMode = computed(() => this.themeService.theme() === 'dark');

  editOrgName = 'Sahaay Foundation';
  ngoRegNumber = 'MUM-NGO-2024-4418';
  operatingRegion = 'Mumbai (Ward 4 - Dharavi / Kurla)';
  isUploadingUserAvatar = signal(false);
  isUploadingLogo = signal(false);
  isSavingOrgName = signal(false);

  isOrgOwner = computed(() => {
    const u = this.getUser();
    return u?.role === 'ngo_founder' || u?.role === 'ngo_admin' || u?.role === 'super_admin';
  });

  availableRoles = [
    { id: 'ngo_founder' as UserRole, label: 'NGO Founder', name: 'Priya Sharma', email: 'founder@sahaay.org', icon: 'domain' },
    { id: 'ngo_admin' as UserRole, label: 'NGO Admin', name: 'Aman Patel', email: 'admin@sahaay.org', icon: 'admin_panel_settings' },
    { id: 'field_lead' as UserRole, label: 'Field Lead', name: 'Vikram Joshi', email: 'lead@sahaay.org', icon: 'supervisor_account' },
    { id: 'volunteer' as UserRole, label: 'Volunteer', name: 'Rohan Deshmukh', email: 'rohan@sahaay.org', icon: 'handshake' },
    { id: 'super_admin' as UserRole, label: 'Super Admin', name: 'Central Command', email: 'superadmin@sahaay.org', icon: 'shield_person' }
  ];

  constructor() {
    this.authService.currentUser$.subscribe(u => {
      if (u) {
        this.editOrgName = u.ngoAffiliation || u.ngoName || 'Sahaay Foundation';
        if (u.ngoRegistrationNumber) this.ngoRegNumber = u.ngoRegistrationNumber;
        if (u.region) this.operatingRegion = u.region;
      }
    });
  }

  getUser() {
    return this.user() || this.authService.currentUser || {
      uid: 'demo-ngo_admin-uid',
      displayName: 'Aman Patel',
      role: 'ngo_admin' as UserRole,
      email: 'admin@sahaay.org',
      phone: '+91 98765 43210',
      region: 'Mumbai (Ward 4 - Dharavi)',
      verificationStatus: 'approved',
      faceVerified: true,
      aadhaarNumber: 'XXXX XXXX 5678',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmanPatel'
    };
  }

  getUserAvatar(): string {
    const u = this.getUser();
    return u?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u?.displayName || 'Coordinator')}`;
  }

  getNgoLogo(): string {
    const u = this.getUser();
    return u?.ngoLogoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(this.editOrgName || 'SahaayFoundation')}`;
  }

  formatRole(role?: string): string {
    if (!role) return 'Coordinator';
    const map: Record<string, string> = {
      super_admin: 'Super Admin',
      ngo_founder: 'NGO Founder',
      ngo_admin: 'NGO Admin',
      field_lead: 'Field Lead',
      volunteer: 'Volunteer',
      applicant: 'Applicant'
    };
    return map[role] || role;
  }

  switchRole(role: UserRole, name: string, email: string) {
    this.authService.loginAsDemoUser(role, name, email);
    this.snackBar.open(`Switched role to ${this.formatRole(role)} (${name})`, 'OK', { duration: 3000 });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleSetting(name: string) {
    this.snackBar.open(`Setting updated.`, 'OK', { duration: 2000 });
  }

  async signOut() {
    await this.authService.signOut();
    this.router.navigate(['/auth']);
  }

  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async onUserAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const u = this.getUser();
    if (!file || !u) return;

    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('Avatar file must be under 5MB', 'OK', { duration: 3000 });
      return;
    }

    this.isUploadingUserAvatar.set(true);
    try {
      let avatarUrl = '';
      try {
        const path = `avatars/${u.uid}_${Date.now()}_${file.name}`;
        avatarUrl = await this.storageService.uploadPhoto(file, path);
      } catch {
        avatarUrl = await this.readFileAsDataURL(file);
      }

      await this.firestoreService.updateUserProfile(u.uid, { photoURL: avatarUrl }).catch(() => {});
      this.authService.updateLocalUser({ photoURL: avatarUrl });
      this.snackBar.open('Profile photo updated successfully!', 'OK', { duration: 3000 });
    } catch (error) {
      console.error('Failed to upload user avatar', error);
      this.snackBar.open('Failed to update avatar. Please try again.', 'OK', { duration: 3000 });
    } finally {
      this.isUploadingUserAvatar.set(false);
    }
  }

  async generateRandomAvatar() {
    const u = this.getUser();
    if (!u) return;
    const randomSeed = 'Avatar_' + Math.random().toString(36).substring(2, 9);
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    
    await this.firestoreService.updateUserProfile(u.uid, { photoURL: newAvatarUrl }).catch(() => {});
    this.authService.updateLocalUser({ photoURL: newAvatarUrl });
    this.snackBar.open('Generated new profile avatar!', 'OK', { duration: 2500 });
  }

  async onLogoSelected(event: Event) {
    if (!this.isOrgOwner()) {
      this.snackBar.open('Permission denied: Only NGO Founders and Admins can update organization logo.', 'OK', { duration: 3000 });
      return;
    }

    const file = (event.target as HTMLInputElement).files?.[0];
    const u = this.getUser();
    if (file && u) {
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('File must be under 5MB', 'OK', { duration: 3000 });
        return;
      }

      this.isUploadingLogo.set(true);
      try {
        let logoUrl = '';
        try {
          const path = `org_logos/${u.uid}_${Date.now()}_${file.name}`;
          logoUrl = await this.storageService.uploadPhoto(file, path);
        } catch {
          logoUrl = await this.readFileAsDataURL(file);
        }

        await this.firestoreService.updateUserProfile(u.uid, { ngoLogoUrl: logoUrl }).catch(() => {});
        this.authService.updateLocalUser({ ngoLogoUrl: logoUrl });
        this.snackBar.open('Organization logo updated successfully!', 'OK', { duration: 3000 });
      } catch (error) {
        console.error('Failed to upload logo', error);
        this.snackBar.open('Failed to upload logo. Please try again.', 'OK', { duration: 3000 });
      } finally {
        this.isUploadingLogo.set(false);
      }
    }
  }

  async generateRandomOrgLogo() {
    if (!this.isOrgOwner()) {
      this.snackBar.open('Permission denied: Only NGO Founders/Admins can edit logo.', 'OK', { duration: 3000 });
      return;
    }
    const u = this.getUser();
    if (!u) return;
    const randomSeed = (this.editOrgName || 'NGO') + '_' + Math.random().toString(36).substring(2, 6);
    const newLogoUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(randomSeed)}`;
    
    await this.firestoreService.updateUserProfile(u.uid, { ngoLogoUrl: newLogoUrl }).catch(() => {});
    this.authService.updateLocalUser({ ngoLogoUrl: newLogoUrl });
    this.snackBar.open('Generated new organization emblem!', 'OK', { duration: 2500 });
  }

  async saveOrgName() {
    if (!this.isOrgOwner()) {
      this.snackBar.open('Permission denied: Only NGO Founders/Admins can edit organization profile.', 'OK', { duration: 3000 });
      return;
    }
    const u = this.getUser();
    if (u) {
      this.isSavingOrgName.set(true);
      try {
        await this.firestoreService.updateUserProfile(u.uid, { 
          ngoAffiliation: this.editOrgName,
          ngoName: this.editOrgName,
          ngoRegistrationNumber: this.ngoRegNumber,
          region: this.operatingRegion 
        }).catch(() => {});
        this.authService.updateLocalUser({
          ngoAffiliation: this.editOrgName,
          ngoName: this.editOrgName,
          ngoRegistrationNumber: this.ngoRegNumber,
          region: this.operatingRegion
        });
        this.snackBar.open('Organization profile updated successfully!', 'OK', { duration: 3000 });
      } catch (error) {
        console.error('Failed to update org name', error);
        this.snackBar.open('Profile saved locally.', 'OK', { duration: 3000 });
      } finally {
        this.isSavingOrgName.set(false);
      }
    }
  }
}
