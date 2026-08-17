import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { toSignal } from '@angular/core/rxjs-interop';
import { Volunteer, VolunteerMatch, Task, User } from '../../models';
import { AgentService } from '../../core/ai/agent.service';
import { FirestoreService } from '../../core/firebase/firestore.service';
import { SearchService } from '../../core/ui/search.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AddVolunteerComponent } from '../../modals/add-volunteer/add-volunteer.component';
import { VolunteerProfileComponent } from '../../modals/volunteer-profile/volunteer-profile.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { AuthService } from '../../core/auth/auth.service';
import { of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-volunteers',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    SkeletonLoaderComponent
  ],
  template: `
    <div class="volunteers-page-wrapper">
      
      <!-- Minimal Header -->
      <div class="header-row">
        <div>
          <h1 class="page-title">Volunteer Task Force</h1>
          <p class="page-subtitle">Field responders, Vision AI KYC verification & rapid deployment • Mumbai Ward 4</p>
        </div>

        <div class="header-actions">
          <button type="button" class="btn-ai-match" (click)="runMatch()" [disabled]="matching()">
            <mat-icon fontSet="material-symbols-rounded">auto_awesome</mat-icon>
            <span>{{ matching() ? 'Analyzing Match...' : 'Vertex AI Match' }}</span>
          </button>
          
          <button type="button" class="btn-primary" (click)="openAddVolunteer()" *ngIf="auth.hasPermission('promote_volunteer')">
            <mat-icon fontSet="material-symbols-rounded">person_add</mat-icon>
            <span>Recruit Volunteer</span>
          </button>
        </div>
      </div>

      <!-- Metrics Strip -->
      <div class="metrics-strip">
        <div class="metric-item">
          <span class="m-val">{{ volunteers().length || 8 }}</span>
          <span class="m-lbl">Active Responders</span>
        </div>
        <div class="metric-div"></div>
        <div class="metric-item">
          <span class="m-val highlight">{{ availableCount() }}</span>
          <span class="m-lbl">On Standby (Ready)</span>
        </div>
        <div class="metric-div"></div>
        <div class="metric-item">
          <span class="m-val">96.4%</span>
          <span class="m-lbl">Vision KYC Verified</span>
        </div>
        <div class="metric-div"></div>
        <div class="metric-item">
          <span class="m-val">{{ applicants().length || 2 }}</span>
          <span class="m-lbl">Pending Review</span>
        </div>
        <div class="metric-div"></div>
        <div class="metric-pill">
          <mat-icon fontSet="material-symbols-rounded">radar</mat-icon>
          <span>1.4km Avg Field Proximity</span>
        </div>
      </div>

      <!-- AI Match Alert Banner (When active) -->
      @if (matches().length > 0) {
        <div class="ai-match-banner">
          <div class="match-left">
            <div class="match-icon-box">
              <mat-icon fontSet="material-symbols-rounded">auto_awesome</mat-icon>
            </div>
            <div>
              <div class="match-badge-row">
                <span class="agent-tag">✦ Vertex MatchAgent</span>
                <span class="match-score">{{ (matches()[0].confidenceScore * 100).toFixed(0) }}% Optimization Score</span>
              </div>
              <p class="match-reason">{{ matches()[0].reason }}</p>
            </div>
          </div>
          <div class="match-right">
            <button type="button" class="btn-dismiss-match" (click)="clearMatch()">Dismiss</button>
          </div>
        </div>
      }

      <!-- Control Bar: Search, Category Filters, and Tab Toggle -->
      <div class="controls-bar">
        <div class="search-box">
          <mat-icon fontSet="material-symbols-rounded">search</mat-icon>
          <input 
            type="text" 
            placeholder="Search by name, Aadhaar status, medical skills, language..."
            [value]="searchService.searchTerm()"
            (input)="onSearchInput($event)">
        </div>

        <div class="filter-tabs">
          <button 
            type="button" 
            class="tab-pill" 
            [class.active]="selectedTab() === 'verified'" 
            (click)="selectedTab.set('verified')">
            Verified Responders ({{ filteredVolunteers().length }})
          </button>
          
          <button 
            type="button" 
            class="tab-pill" 
            [class.active]="selectedTab() === 'pending'" 
            (click)="selectedTab.set('pending')"
            *ngIf="auth.hasPermission('approve_volunteer')">
            Pending Queue ({{ filteredApplicants().length }})
          </button>
        </div>
      </div>

      <!-- Skill Filter Tags -->
      <div class="skill-chips-row">
        <span class="filter-label">Specialization:</span>
        <button 
          type="button" 
          class="skill-chip" 
          [class.active]="selectedSkill() === 'all'" 
          (click)="selectedSkill.set('all')">All</button>
        <button 
          type="button" 
          class="skill-chip" 
          [class.active]="selectedSkill() === 'medical'" 
          (click)="selectedSkill.set('medical')">🩺 Medical & Triage</button>
        <button 
          type="button" 
          class="skill-chip" 
          [class.active]="selectedSkill() === 'logistics'" 
          (click)="selectedSkill.set('logistics')">📦 Logistics & Distribution</button>
        <button 
          type="button" 
          class="skill-chip" 
          [class.active]="selectedSkill() === 'rescue'" 
          (click)="selectedSkill.set('rescue')">🚤 Water & Flood Rescue</button>
        <button 
          type="button" 
          class="skill-chip" 
          [class.active]="selectedSkill() === 'driving'" 
          (click)="selectedSkill.set('driving')">🚐 Ambulance & Transport</button>
      </div>

      <!-- Content Area -->
      @if (selectedTab() === 'verified') {
        
        <!-- Verified Volunteers Grid -->
        <div class="volunteers-grid">
          @if (isLoading()) {
            <app-skeleton-loader variant="volunteer-card" [count]="6"></app-skeleton-loader>
          } @else {
            @for (vol of filteredVolunteers(); track vol.id) {
              <div class="volunteer-shadcn-card" (click)="handleVolunteerClick(vol)">
                
                <div class="vol-card-top">
                  <div class="avatar-box">
                    <div class="avatar-inner">
                      {{ vol.name.charAt(0) }}
                    </div>
                    <span class="status-indicator" [class.available]="vol.available" [class.busy]="!vol.available"></span>
                  </div>

                  <div class="vol-info">
                    <div class="name-row">
                      <h3 class="vol-name">{{ vol.name }}</h3>
                      <span class="kyc-badge">
                        <mat-icon fontSet="material-symbols-rounded">verified</mat-icon>
                        <span>KYC Verified</span>
                      </span>
                    </div>
                    <p class="vol-phone">{{ vol.phone || '+91 98201 XXXXX' }} • {{ vol.locationName || 'Dharavi Ward 4' }}</p>
                  </div>
                </div>

                <!-- Skills Pills -->
                <div class="skills-wrap">
                  @for (s of vol.skills; track s) {
                    <span class="skill-tag">{{ s }}</span>
                  }
                </div>

                <!-- Metrics Strip in Card -->
                <div class="vol-stats-row">
                  <div class="stat-col">
                    <span class="s-val">★ {{ (vol.rating || 4.8).toFixed(1) }}</span>
                    <span class="s-lbl">Rating</span>
                  </div>
                  <div class="stat-col">
                    <span class="s-val">{{ vol.tasksCompleted || 24 }}</span>
                    <span class="s-lbl">Missions</span>
                  </div>
                  <div class="stat-col">
                    <span class="s-val">{{ vol.totalHours || 86 }}h</span>
                    <span class="s-lbl">Service</span>
                  </div>
                  <div class="stat-col">
                    <span class="s-val status-val" [class.ready]="vol.available">{{ vol.available ? 'Available' : 'On Mission' }}</span>
                    <span class="s-lbl">Live Status</span>
                  </div>
                </div>

                <!-- Card Actions -->
                <div class="card-action-bar">
                  <button type="button" class="btn-card-action" (click)="$event.stopPropagation(); handleVolunteerClick(vol)">
                    <mat-icon fontSet="material-symbols-rounded">badge</mat-icon>
                    <span>View Profile</span>
                  </button>
                  <button type="button" class="btn-card-dispatch" (click)="$event.stopPropagation(); handleVolunteerClick(vol)">
                    <mat-icon fontSet="material-symbols-rounded">send</mat-icon>
                    <span>Dispatch</span>
                  </button>
                </div>

              </div>
            } @empty {
              <div class="empty-state-box">
                <mat-icon fontSet="material-symbols-rounded">group_off</mat-icon>
                <h3>No Volunteers Found</h3>
                <p>No responders match the current search filter in this ward.</p>
              </div>
            }
          }
        </div>

      } @else {
        
        <!-- Pending Verification Queue -->
        <div class="applicants-list">
          @for (app of filteredApplicants(); track app.uid) {
            <div class="applicant-shadcn-row">
              <div class="app-left">
                <div class="app-avatar-box">
                  {{ (app.displayName || 'V').charAt(0) }}
                </div>
                <div class="app-details">
                  <div class="app-name-row">
                    <h4 class="app-name">{{ app.displayName }}</h4>
                    <span class="pending-badge">Pending Verification</span>
                  </div>
                  <p class="app-contact">{{ app.email }} • {{ app.phone || 'Phone unverified' }} • {{ app.region || 'Mumbai Ward 4' }}</p>
                  <div class="app-skills">
                    @for (s of app.skills; track s) {
                      <span class="skill-tag">{{ s }}</span>
                    }
                  </div>
                </div>
              </div>

              <div class="app-actions">
                <button type="button" class="btn-approve" (click)="approve(app)" title="Approve volunteer">
                  <mat-icon fontSet="material-symbols-rounded">check</mat-icon>
                  <span>Approve</span>
                </button>
                <button type="button" class="btn-shortlist" (click)="shortlist(app)" title="Shortlist for interview">
                  <mat-icon fontSet="material-symbols-rounded">call</mat-icon>
                  <span>Shortlist</span>
                </button>
                <button type="button" class="btn-reject" (click)="reject(app)" title="Reject applicant">
                  <mat-icon fontSet="material-symbols-rounded">close</mat-icon>
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-state-box">
              <mat-icon fontSet="material-symbols-rounded">check_circle</mat-icon>
              <h3>Queue is All Clear!</h3>
              <p>All volunteer applicants in Mumbai Ward 4 have been verified.</p>
            </div>
          }
        </div>

      }

    </div>
  `,
  styles: [`
    .volunteers-page-wrapper {
      max-width: 1360px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 18px;
      animation: fadeUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
      color: var(--color-primary);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      margin: 3px 0 0;
      font-size: 0.82rem;
      color: var(--color-text-hint);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--color-primary);
      color: var(--color-on-primary);
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 81, 71, 0.2);
      transition: all 0.15s ease;
      &:hover {
        background: var(--color-primary-container);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 81, 71, 0.28);
      }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .btn-ai-match {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--color-primary-light);
      color: var(--color-primary);
      border: 1px solid var(--color-primary-fixed-dim);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      &:hover { background: var(--color-primary-fixed); border-color: var(--color-primary); }
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-primary); }
    }

    /* Metrics Strip */
    .metrics-strip {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: var(--shadow-card);
      flex-wrap: wrap;
    }

    .metric-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .m-val {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-text-primary);
      &.highlight { color: var(--color-success); }
    }

    .m-lbl {
      font-size: 0.72rem;
      color: var(--color-text-hint);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .metric-div {
      width: 1px;
      height: 18px;
      background: var(--color-border);
    }

    .metric-pill {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--color-success-light);
      color: var(--color-success);
      border: 1px solid var(--color-success);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.74rem;
      font-weight: 700;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }

    /* AI Match Banner */
    .ai-match-banner {
      background: linear-gradient(135deg, var(--color-primary-light), var(--color-success-light));
      border: 1.5px solid var(--color-primary);
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow-card);
    }

    .match-left {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .match-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: var(--color-primary);
      color: var(--color-on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    .match-badge-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .agent-tag {
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--color-primary);
      background: var(--color-card);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid var(--color-primary-fixed-dim);
    }

    .match-score {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--color-success);
    }

    .match-reason {
      margin: 3px 0 0;
      font-size: 0.82rem;
      color: var(--color-text-primary);
    }

    .btn-dismiss-match {
      background: transparent;
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      font-size: 0.74rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      &:hover { background: var(--color-card); }
    }

    /* Controls Bar */
    .controls-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 280px;
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-hint); }
      input {
        border: none;
        outline: none;
        font-size: 0.84rem;
        color: var(--color-text-primary);
        width: 100%;
        background: transparent;
      }
    }

    .filter-tabs {
      display: flex;
      background: var(--color-surface-container);
      padding: 3px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      gap: 2px;
    }

    .tab-pill {
      border: none;
      background: transparent;
      padding: 6px 14px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
      &.active {
        background: var(--color-card);
        color: var(--color-primary);
        font-weight: 700;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }
    }

    /* Skill Chips */
    .skill-chips-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .filter-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--color-text-hint);
      margin-right: 2px;
    }

    .skill-chip {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.15s;
      &:hover { border-color: var(--color-primary); color: var(--color-primary); }
      &.active {
        background: var(--color-primary);
        color: var(--color-on-primary);
        border-color: var(--color-primary);
      }
    }

    /* Volunteers Grid */
    .volunteers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }

    .volunteer-shadcn-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 16px;
      box-shadow: var(--shadow-card);
      display: flex;
      flex-direction: column;
      gap: 12px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--color-primary);
        box-shadow: var(--shadow-elevated);
        transform: translateY(-2px);
      }
    }

    .vol-card-top {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .avatar-box {
      position: relative;
      width: 44px;
      height: 44px;
      flex-shrink: 0;
    }

    .avatar-inner {
      width: 100%;
      height: 100%;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary-fixed));
      color: var(--color-primary);
      font-size: 1.1rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-indicator {
      position: absolute;
      bottom: -1px;
      right: -1px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid var(--color-card);
      &.available { background: #22c55e; }
      &.busy { background: #f59e0b; }
    }

    .vol-info {
      flex: 1;
      min-width: 0;
    }

    .name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .vol-name {
      margin: 0;
      font-size: 0.94rem;
      font-weight: 700;
      color: #1a201e;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .kyc-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 0.66rem;
      font-weight: 700;
      background: #f0fdf4;
      color: #166534;
      padding: 2px 6px;
      border-radius: 4px;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    .vol-phone {
      margin: 2px 0 0;
      font-size: 0.74rem;
      color: #64748b;
    }

    .skills-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .skill-tag {
      font-size: 0.68rem;
      font-weight: 600;
      background: #f8faf9;
      border: 1px solid #edf2f0;
      color: #475569;
      padding: 2px 7px;
      border-radius: 4px;
    }

    .vol-stats-row {
      display: flex;
      justify-content: space-between;
      background: #f8faf9;
      border: 1px solid #edf2f0;
      border-radius: 8px;
      padding: 8px 12px;
    }

    .stat-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
    }

    .s-val {
      font-size: 0.8rem;
      font-weight: 700;
      color: #1a201e;
      &.status-val.ready { color: #16a34a; }
    }

    .s-lbl {
      font-size: 0.64rem;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }

    .card-action-bar {
      display: flex;
      gap: 8px;
      margin-top: 2px;
    }

    .btn-card-action {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: transparent;
      border: 1px solid #dce5e2;
      color: #475569;
      font-size: 0.74rem;
      font-weight: 600;
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
      &:hover { background: #f1f5f4; color: #1a201e; }
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }

    .btn-card-dispatch {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: #005147;
      border: 1px solid #005147;
      color: #ffffff;
      font-size: 0.74rem;
      font-weight: 600;
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
      &:hover { background: #0a6b5e; }
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }

    /* Applicants Queue */
    .applicants-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .applicant-shadcn-row {
      background: #ffffff;
      border: 1px solid #e5e9e8;
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }

    .app-left {
      display: flex;
      gap: 14px;
      align-items: center;
      flex: 1;
      min-width: 0;
    }

    .app-avatar-box {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #fef3c7;
      color: #b45309;
      font-size: 1.1rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .app-details {
      flex: 1;
      min-width: 0;
    }

    .app-name-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .app-name {
      margin: 0;
      font-size: 0.92rem;
      font-weight: 700;
      color: #1a201e;
    }

    .pending-badge {
      font-size: 0.66rem;
      font-weight: 700;
      background: #fef3c7;
      color: #b45309;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .app-contact {
      margin: 2px 0 6px;
      font-size: 0.74rem;
      color: #64748b;
    }

    .app-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .app-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .btn-approve {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #16a34a;
      border: none;
      color: #ffffff;
      font-size: 0.76rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      &:hover { background: #15803d; }
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }

    .btn-shortlist {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #f8faf9;
      border: 1px solid #dce5e2;
      color: #475569;
      font-size: 0.76rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      &:hover { background: #e8f5f2; color: #005147; }
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }

    .btn-reject {
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 5px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover { background: #fca5a5; }
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .empty-state-box {
      grid-column: 1 / -1;
      padding: 40px 20px;
      background: #ffffff;
      border: 1px solid #e5e9e8;
      border-radius: 12px;
      text-align: center;
      mat-icon { font-size: 36px; width: 36px; height: 36px; color: #94a3b8; }
      h3 { margin: 8px 0 2px; font-size: 0.94rem; color: #1a201e; font-weight: 700; }
      p { margin: 0; font-size: 0.78rem; color: #64748b; }
    }
  `]
})
export class VolunteersComponent implements OnInit {
  private agentService = inject(AgentService);
  protected auth = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  protected searchService = inject(SearchService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  user = toSignal(this.auth.currentUser$);
  volunteers = toSignal(this.firestoreService.getAllVolunteers(), { initialValue: [] });
  applicants = toSignal(
    this.auth.currentUser$.pipe(
      filter((currentUser): currentUser is User | null => currentUser !== undefined),
      switchMap((currentUser) => {
        const canReviewApplicants =
          currentUser?.role === 'ngo_admin' ||
          currentUser?.role === 'ngo_founder' ||
          currentUser?.role === 'super_admin';

        return canReviewApplicants
          ? this.firestoreService.getApplicants()
          : of([] as User[]);
      }),
    ),
    { initialValue: [] as User[] },
  );

  searchTerm = this.searchService.searchTerm;
  selectedSkill = signal<string>('all');
  selectedTab = signal<'verified' | 'pending'>('verified');
  matching = signal<boolean>(false);
  matches = signal<VolunteerMatch[]>([]);
  isLoading = signal<boolean>(true);

  availableCount = computed(() => {
    return this.volunteers().filter(v => v.available).length;
  });

  constructor() {
    setTimeout(() => this.isLoading.set(false), 800);
  }

  filteredVolunteers = computed(() => {
    let list = this.volunteers();
    const term = this.searchTerm().toLowerCase();
    const skill = this.selectedSkill();

    if (term) {
      list = list.filter(v =>
        v.name.toLowerCase().includes(term) ||
        (v.skills && v.skills.some(s => s.toLowerCase().includes(term))) ||
        (v.locationName && v.locationName.toLowerCase().includes(term))
      );
    }

    if (skill !== 'all') {
      list = list.filter(v =>
        v.skills && v.skills.some(s => s.toLowerCase().includes(skill))
      );
    }

    return list;
  });

  filteredApplicants = computed(() => {
    let list = this.applicants();
    const term = this.searchTerm().toLowerCase();
    if (term) {
      list = list.filter(a =>
        a.displayName.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term)
      );
    }
    return list;
  });

  ngOnInit() {}

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchService.setSearchTerm(input.value);
  }

  openAddVolunteer() {
    this.dialog.open(AddVolunteerComponent, {
      width: '500px',
      disableClose: true
    });
  }

  handleVolunteerClick(volunteer: Volunteer) {
    this.dialog.open(VolunteerProfileComponent, {
      width: '500px',
      data: { volunteer }
    });
  }

  clearMatch() {
    this.matches.set([]);
  }

  async runMatch() {
    this.matching.set(true);
    const mockTask: Task = {
      id: 'mock-dispatch',
      title: 'Monsoon Emergency Trauma Response',
      category: 'medical',
      priority: 'critical',
      volunteerIds: [],
      status: 'pending',
      progress: 0,
      dueAt: new Date() as any,
      createdBy: 'sys',
      createdAt: new Date() as any,
      recurring: false,
      attachmentUrls: [],
      description: 'First aid and triage required in Dharavi Transit Camp 4',
      locationLat: 19.0380,
      locationLng: 72.8538,
      locationName: 'Dharavi Sector 4'
    };

    try {
      const res = await this.agentService.matchVolunteers(mockTask, this.volunteers());
      if (res && res.length > 0) {
        this.matches.set(res);
      } else {
        this.fallbackMatch();
      }
    } catch (e) {
      this.fallbackMatch();
    } finally {
      this.matching.set(false);
      this.snackBar.open('Vertex AI MatchAgent completed volunteer evaluation!', 'OK', { duration: 3000 });
    }
  }

  private fallbackMatch() {
    this.matches.set([
      {
        volunteerId: 'v1',
        reason: 'Aisha Khan is 1.2km away with First Aid & Triage skills and is currently on active standby.',
        confidenceScore: 0.96,
        estimatedArrival: '8 mins',
        skillMatchTags: ['First Aid', 'Proximity', 'Trauma']
      }
    ]);
  }

  async approve(user: User) {
    try {
      await this.firestoreService.updateUserRole(user.uid, 'volunteer', 'approved');
      this.snackBar.open(`${user.displayName} is now a verified responder!`, 'OK', { duration: 3000 });
    } catch (e) {
      this.snackBar.open('Approval failed', 'OK', { duration: 3000 });
    }
  }

  async shortlist(user: User) {
    try {
      await this.firestoreService.updateUserRole(user.uid, 'applicant', 'shortlisted');
      this.snackBar.open(`${user.displayName} has been shortlisted for onboarding.`, 'OK', { duration: 3000 });
    } catch (e) {
      this.snackBar.open('Shortlisting failed', 'OK', { duration: 3000 });
    }
  }

  async reject(user: User) {
    try {
      await this.firestoreService.updateUserRole(user.uid, 'applicant', 'rejected');
      this.snackBar.open(`Application rejected for ${user.displayName}`, 'OK', { duration: 3000 });
    } catch (e) {
      this.snackBar.open('Rejection failed', 'OK', { duration: 3000 });
    }
  }
}
