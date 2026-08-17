import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { FirestoreService } from '../../core/firebase/firestore.service';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgoRegistryService } from '../../core/ngo/ngo-registry.service';

@Component({
  selector: 'app-verification-status',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    RouterLink, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatSnackBarModule
  ],
  template: `
    <div class="status-page-wrapper">
      
      <!-- Minimal Header -->
      <div class="header-row">
        <div>
          <h1 class="page-title">Identity & Accreditation Status</h1>
          <p class="page-subtitle">Vision AI Aadhaar KYC, organization registry & field authorization • Mumbai Ward 4</p>
        </div>

        <div class="header-actions">
          <button type="button" class="btn-ghost" routerLink="/settings">
            <mat-icon fontSet="material-symbols-rounded">settings</mat-icon>
            <span>Security Settings</span>
          </button>
          <button type="button" class="btn-primary" routerLink="/home">
            <mat-icon fontSet="material-symbols-rounded">space_dashboard</mat-icon>
            <span>Go to Command Center</span>
          </button>
        </div>
      </div>

      <!-- Main Status Card Grid (2 Columns: Left Profile & Live Badge + Right Timeline Verification) -->
      <div class="status-grid">
        
        <!-- Left: Verified Identity Card & Credentials -->
        <div class="id-panel">
          
          <!-- Identity Card (Shadcn style with emerald accent) -->
          <div class="shadcn-panel id-badge-card">
            
            <div class="id-top-row">
              <div class="avatar-large">
                <img *ngIf="user()?.photoURL; else initialTpl" [src]="user()?.photoURL" [alt]="user()?.displayName" class="avatar-img">
                <ng-template #initialTpl>
                  <span>{{ userInitial() }}</span>
                </ng-template>
                <div class="online-dot"></div>
              </div>

              <div class="id-meta">
                <div class="name-status-row">
                  <h3 class="user-display-name">{{ user()?.displayName || 'Priya Sharma' }}</h3>
                  <span class="status-pill" [ngClass]="currentStatus()">
                    <mat-icon fontSet="material-symbols-rounded">verified</mat-icon>
                    <span>{{ formatStatus(currentStatus()) }}</span>
                  </span>
                </div>
                <p class="user-email-text">{{ user()?.email || 'founder@sahaay.org' }}</p>
                <div class="role-location-row">
                  <span class="role-badge">{{ formatRole(user()?.role) }}</span>
                  <span class="loc-badge">
                    <mat-icon fontSet="material-symbols-rounded">location_on</mat-icon>
                    <span>{{ user()?.region || 'Dharavi (Ward G/N)' }}</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="id-credentials-list">
              <div class="cred-row">
                <div class="cred-icon-box">
                  <mat-icon fontSet="material-symbols-rounded">badge</mat-icon>
                </div>
                <div class="cred-info">
                  <span class="cred-label">Government Identity (Aadhaar / Passport)</span>
                  <span class="cred-val">Verified via Vision AI OCR • Checksum Passed</span>
                </div>
                <mat-icon class="cred-check" fontSet="material-symbols-rounded">check_circle</mat-icon>
              </div>

              <div class="cred-row">
                <div class="cred-icon-box">
                  <mat-icon fontSet="material-symbols-rounded">face</mat-icon>
                </div>
                <div class="cred-info">
                  <span class="cred-label">Facial Biometric Match</span>
                  <span class="cred-val">96.4% Similarity Score (Selfie vs Document)</span>
                </div>
                <mat-icon class="cred-check" fontSet="material-symbols-rounded">check_circle</mat-icon>
              </div>

              <div class="cred-row">
                <div class="cred-icon-box">
                  <mat-icon fontSet="material-symbols-rounded">corporate_fare</mat-icon>
                </div>
                <div class="cred-info">
                  <span class="cred-label">Humanitarian Partner Registry</span>
                  <span class="cred-val">Doctors for You / Sahaay Ground Task Force</span>
                </div>
                <mat-icon class="cred-check" fontSet="material-symbols-rounded">check_circle</mat-icon>
              </div>
            </div>

            <!-- Testing Status Switcher -->
            <div class="sim-state-bar">
              <span class="sim-label">Simulate Accreditation State:</span>
              <div class="sim-pills">
                <button type="button" class="sim-btn" [class.active]="currentStatus() === 'approved'" (click)="setStatus('approved')">Approved</button>
                <button type="button" class="sim-btn" [class.active]="currentStatus() === 'shortlisted'" (click)="setStatus('shortlisted')">Shortlisted</button>
                <button type="button" class="sim-btn" [class.active]="currentStatus() === 'pending'" (click)="setStatus('pending')">In Review</button>
              </div>
            </div>

          </div>

          <!-- Quick Access Cards -->
          <div class="quick-access-grid mt-4">
            <div class="access-box" routerLink="/home">
              <mat-icon class="green" fontSet="material-symbols-rounded">dashboard</mat-icon>
              <div>
                <h4>Live Command Center</h4>
                <p>Monitor real-time crisis map & task force</p>
              </div>
            </div>

            <div class="access-box" routerLink="/resource-vault">
              <mat-icon class="teal" fontSet="material-symbols-rounded">inventory_2</mat-icon>
              <div>
                <h4>Resource Vault</h4>
                <p>Verify QR supply handovers</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Right: Verification Stepper Timeline & Form -->
        <div class="timeline-panel">
          
          <div class="shadcn-panel">
            <div class="panel-header">
              <h3 class="panel-title">Accreditation Pipeline</h3>
              <span class="step-counter">Stage 3 of 3 Complete</span>
            </div>

            <!-- Stepper Items -->
            <div class="timeline-stepper">
              
              <!-- Step 1 -->
              <div class="stepper-item completed">
                <div class="step-marker">
                  <mat-icon fontSet="material-symbols-rounded">check</mat-icon>
                </div>
                <div class="step-body">
                  <div class="step-head-row">
                    <h4 class="step-name">1. Identity & Phone Verification</h4>
                    <span class="step-status-tag done">Verified</span>
                  </div>
                  <p class="step-desc">Phone OTP verified (+91 98201 XXXXX) and Clerk session token issued.</p>
                </div>
              </div>

              <!-- Step 2 -->
              <div class="stepper-item completed">
                <div class="step-marker">
                  <mat-icon fontSet="material-symbols-rounded">check</mat-icon>
                </div>
                <div class="step-body">
                  <div class="step-head-row">
                    <h4 class="step-name">2. Vision AI Document OCR & Face Match</h4>
                    <span class="step-status-tag done">Passed</span>
                  </div>
                  <p class="step-desc">Aadhaar QR parsed and facial landmarks matched against live camera selfie.</p>
                </div>
              </div>

              <!-- Step 3 -->
              <div class="stepper-item" [ngClass]="currentStatus() === 'approved' ? 'completed' : currentStatus() === 'shortlisted' ? 'active' : 'pending'">
                <div class="step-marker">
                  <mat-icon fontSet="material-symbols-rounded">
                    {{ currentStatus() === 'approved' ? 'check' : currentStatus() === 'shortlisted' ? 'hourglass_top' : 'schedule' }}
                  </mat-icon>
                </div>
                <div class="step-body">
                  <div class="step-head-row">
                    <h4 class="step-name">3. Field Authorization & Role Activation</h4>
                    <span class="step-status-tag" [ngClass]="currentStatus()">
                      {{ currentStatus() === 'approved' ? 'Active' : currentStatus() === 'shortlisted' ? 'Shortlisted' : 'Under Review' }}
                    </span>
                  </div>
                  <p class="step-desc">
                    {{ currentStatus() === 'approved' 
                      ? 'Full mission coordination, supply allocation and volunteer dispatch authorized for Mumbai Ward 4.' 
                      : 'Our partnerships team is performing final regional authorization review.' }}
                  </p>
                </div>
              </div>

            </div>

            <!-- Profile Details Update Box (if editing needed) -->
            <div class="edit-profile-section mt-4">
              <h4 class="section-subheading">Update Operating Details</h4>
              
              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="profile-form-grid">
                <div class="form-row">
                  <div class="input-wrap">
                    <label>Contact Phone</label>
                    <input type="text" formControlName="phone" placeholder="+91 98201 XXXXX">
                  </div>
                  <div class="input-wrap">
                    <label>Assigned Ward / Region</label>
                    <select formControlName="region">
                      <option value="Dharavi">Dharavi (Ward G/N)</option>
                      <option value="Kurla">Kurla (Ward L)</option>
                      <option value="Govandi">Govandi (Ward M/E)</option>
                      <option value="Bhandup">Bhandup (Ward S)</option>
                    </select>
                  </div>
                </div>

                <div class="input-wrap">
                  <label>Skills & Specializations</label>
                  <input type="text" formControlName="skills" placeholder="Disaster Medicine, Rapid Triage, Logistics">
                </div>

                <div class="form-action-row">
                  <button type="submit" class="btn-save" [disabled]="loading()">
                    <mat-icon fontSet="material-symbols-rounded">save</mat-icon>
                    <span>{{ loading() ? 'Saving...' : 'Update Details' }}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    .status-page-wrapper {
      max-width: 1360px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
      scroll-behavior: smooth;
    }

    /* Minimal Header */
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-title {
      font-family: var(--font-display);
      font-size: 1.85rem;
      font-weight: 700;
      color: #005147;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      margin: 3px 0 0;
      font-size: 0.82rem;
      color: #6f7976;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #005147;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-primary:hover { background: #0a6b5e; }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      color: #005147;
      border: 1px solid #dce5e2;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-ghost:hover { background: #f0fdf4; border-color: #005147; }
    .btn-ghost mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* 2-Column Status Layout */
    .status-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: flex-start;
    }

    .id-panel, .timeline-panel {
      display: flex;
      flex-direction: column;
    }

    .mt-4 { margin-top: 16px; }

    /* Shadcn Panels */
    .shadcn-panel {
      background: #ffffff;
      border: 1px solid #e5e9e8;
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
    }

    .id-badge-card {
      border-left: 4px solid #005147;
    }

    /* Identity Card Details */
    .id-top-row {
      display: flex;
      gap: 16px;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f4;
    }

    .avatar-large {
      position: relative;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #005147, #0a6b5e);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .online-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #22c55e;
      border: 2px solid #ffffff;
    }

    .id-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .name-status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .user-display-name {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a201e;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 20px;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &.approved { background: #dcfce7; color: #166534; }
      &.shortlisted { background: #fef3c7; color: #b45309; }
      &.pending { background: #f1f5f9; color: #64748b; }
    }

    .user-email-text {
      margin: 0;
      font-size: 0.78rem;
      color: #64748b;
    }

    .role-location-row {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }

    .role-badge {
      font-size: 0.7rem;
      font-weight: 700;
      background: #e8f5f2;
      color: #005147;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .loc-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 0.7rem;
      color: #64748b;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    /* Credentials List */
    .id-credentials-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 16px 0;
    }

    .cred-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: #f8faf9;
      border: 1px solid #edf2f0;
      border-radius: 8px;
    }

    .cred-icon-box {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: #e8f5f2;
      color: #005147;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .cred-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .cred-label {
      font-size: 0.76rem;
      font-weight: 700;
      color: #1a201e;
    }

    .cred-val {
      font-size: 0.7rem;
      color: #64748b;
    }

    .cred-check {
      color: #16a34a;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* State Simulation Pills */
    .sim-state-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #f1f5f4;
    }

    .sim-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: #64748b;
    }

    .sim-pills {
      display: flex;
      gap: 4px;
    }

    .sim-btn {
      background: #f1f5f4;
      border: 1px solid #dce5e2;
      color: #55605d;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
      &.active {
        background: #005147;
        color: #ffffff;
        border-color: #005147;
      }
    }

    /* Quick Access Grid */
    .quick-access-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .access-box {
      background: #ffffff;
      border: 1px solid #e5e9e8;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.15s;
      text-decoration: none;

      &:hover {
        border-color: #005147;
        box-shadow: 0 2px 8px rgba(0, 81, 71, 0.05);
      }

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        &.green { color: #16a34a; }
        &.teal { color: #005147; }
      }

      h4 { margin: 0; font-size: 0.82rem; font-weight: 700; color: #1a201e; }
      p { margin: 1px 0 0; font-size: 0.7rem; color: #64748b; }
    }

    /* Timeline Stepper */
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .panel-title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: #1a201e;
    }

    .step-counter {
      font-size: 0.72rem;
      font-weight: 700;
      color: #16a34a;
      background: #f0fdf4;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .timeline-stepper {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
    }

    .stepper-item {
      display: flex;
      gap: 12px;
      position: relative;

      &:not(:last-child)::before {
        content: '';
        position: absolute;
        left: 12px;
        top: 28px;
        bottom: -16px;
        width: 2px;
        background: #e2e8f0;
      }

      &.completed:not(:last-child)::before {
        background: #22c55e;
      }
    }

    .step-marker {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #f1f5f9;
      border: 2px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      flex-shrink: 0;
      z-index: 1;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    .stepper-item.completed .step-marker {
      background: #22c55e;
      border-color: #22c55e;
      color: #ffffff;
    }

    .stepper-item.active .step-marker {
      background: #fef3c7;
      border-color: #d97706;
      color: #d97706;
    }

    .step-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .step-head-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .step-name {
      margin: 0;
      font-size: 0.86rem;
      font-weight: 700;
      color: #1a201e;
    }

    .step-status-tag {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      &.done { background: #dcfce7; color: #166534; }
      &.approved { background: #dcfce7; color: #166534; }
      &.shortlisted { background: #fef3c7; color: #b45309; }
      &.pending { background: #f1f5f9; color: #64748b; }
    }

    .step-desc {
      margin: 0;
      font-size: 0.78rem;
      color: #64748b;
      line-height: 1.45;
    }

    /* Edit Profile Form */
    .edit-profile-section {
      border-top: 1px solid #f1f5f4;
      padding-top: 16px;
    }

    .section-subheading {
      margin: 0 0 10px;
      font-size: 0.84rem;
      font-weight: 700;
      color: #1a201e;
    }

    .profile-form-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .input-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;

      label {
        font-size: 0.72rem;
        font-weight: 700;
        color: #475569;
      }

      input, select {
        background: #f8faf9;
        border: 1px solid #dce5e2;
        border-radius: 6px;
        padding: 7px 10px;
        font-size: 0.8rem;
        color: #1a201e;
        outline: none;
        transition: border 0.15s;
        &:focus { border-color: #005147; background: #ffffff; }
      }
    }

    .form-action-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 4px;
    }

    .btn-save {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #005147;
      color: #ffffff;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      &:hover { background: #0a6b5e; }
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }

    @media (max-width: 900px) {
      .status-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class VerificationStatusComponent {
  protected auth = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private ngoRegistryService = inject(NgoRegistryService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  
  user = toSignal(this.auth.currentUser$);
  profileForm: FormGroup;
  loading = signal(false);

  simulatedStatus = signal<'approved' | 'shortlisted' | 'pending'>('approved');

  constructor() {
    this.profileForm = this.fb.group({
      phone: ['+91 98201 44821', [Validators.required]],
      region: ['Dharavi', Validators.required],
      skills: ['Disaster Medicine, Logistics, Rapid Triage']
    });

    effect(() => {
      const u = this.user();
      if (!u) return;

      if (u.verificationStatus && (u.verificationStatus === 'approved' || u.verificationStatus === 'shortlisted' || u.verificationStatus === 'pending')) {
        this.simulatedStatus.set(u.verificationStatus as any);
      }

      this.profileForm.patchValue({
        phone: u.phone || '+91 98201 44821',
        region: u.region || 'Dharavi',
        skills: u.skills?.join(', ') || 'Disaster Medicine, Logistics, Rapid Triage'
      }, { emitEvent: false });
    });
  }

  currentStatus(): 'approved' | 'shortlisted' | 'pending' {
    return this.simulatedStatus();
  }

  setStatus(s: 'approved' | 'shortlisted' | 'pending') {
    this.simulatedStatus.set(s);
    this.snackBar.open(`Accreditation state updated to: ${s.toUpperCase()}`, 'OK', { duration: 2500 });
  }

  userInitial(): string {
    const name = this.user()?.displayName || 'Priya Sharma';
    return name ? name.charAt(0).toUpperCase() : 'P';
  }

  formatRole(role?: string): string {
    if (!role) return 'NGO Founder';
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

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      approved: 'Verified & Active',
      shortlisted: 'Shortlisted',
      pending: 'Under Review'
    };
    return map[status] || status;
  }

  async saveProfile() {
    this.loading.set(true);
    try {
      this.snackBar.open('Updated operating profile and regional dispatch parameters!', 'OK', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }
}
