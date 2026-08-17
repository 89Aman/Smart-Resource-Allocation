import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Need, Task, VolunteerMatch, Activity, WeeklyStats } from '../../models';
import { FirestoreService } from '../../core/firebase/firestore.service';
import { AuthService } from '../../core/auth/auth.service';
import { AgentService } from '../../core/ai/agent.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NeedBottomSheetComponent } from '../../shared/components/need-bottom-sheet/need-bottom-sheet.component';
import { ReportNeedComponent } from '../../modals/report-need/report-need.component';
import { AddVolunteerComponent } from '../../modals/add-volunteer/add-volunteer.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatBottomSheetModule,
    MatDialogModule,
    SkeletonLoaderComponent
  ],
  template: `
    <div class="page-wrapper">
      <!-- Background Ambient Glows -->
      <div class="bg-blur-1"></div>
      <div class="bg-blur-2"></div>

      <main class="content-area">
        <!-- Hero Section -->
        <header class="hero-section">
          <div class="hero-content">
            <h1 class="greeting">Good morning, {{ firstName() }}</h1>
            <p class="status-pulse">
              <span class="pulse-dot"></span>
              Mumbai Ward 4 Command Center is <strong>operational</strong>.
              {{ criticalCount() }} critical incidents require attention.
            </p>
            <div class="ai-briefing">
              <mat-icon class="sparkle" fontSet="material-symbols-rounded">auto_awesome</mat-icon>
              @if (aiLoading()) {
                <app-skeleton-loader variant="paragraph" width="100%"></app-skeleton-loader>
              } @else {
                <p>{{ aiNarrative() }}</p>
              }
            </div>
          </div>
        </header>

        <!-- Stats Horizon -->
        <section class="stats-horizon">
          @if (isLoading()) {
            <app-skeleton-loader variant="stat-card" [count]="4"></app-skeleton-loader>
          } @else {
            <div class="stat-card" *ngFor="let stat of stats()">
              <div class="stat-icon" [ngClass]="stat.color">
                <mat-icon>{{ stat.icon }}</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">{{ stat.label }}</span>
                <h3 class="stat-value">{{ stat.value }}</h3>
              </div>
            </div>
          }
        </section>

        <!-- Dashboard Grid (2 Columns: Left Feed + Right shadcn Intel) -->
        <div class="dashboard-grid">
          <!-- Main Feed Column (Left) -->
          <div class="feed-column">
            <div class="section-header">
              <h2>Needs Requiring Action</h2>
              <a routerLink="/needs-map" class="link-btn">View All</a>
            </div>

            <div class="needs-feed">
              @if (isLoading()) {
                <app-skeleton-loader variant="need-row" [count]="3"></app-skeleton-loader>
              } @else if (recentNeeds().length > 0) {
                <div *ngFor="let need of recentNeeds() | slice:0:3"
                     class="need-row"
                     (click)="onNeedClick(need)">
                  <div class="urgency-indicator" [ngClass]="need.urgency"></div>
                  <div class="category-icon" [ngClass]="need.urgency">
                    <mat-icon>{{ getCategoryIcon(need.category) }}</mat-icon>
                  </div>
                  <div class="need-details">
                    <div class="title-row">
                      <h4>{{ need.title }}</h4>
                      <span class="urgency-tag" [ngClass]="need.urgency">{{ need.urgency }}</span>
                    </div>
                    <p class="meta-info">
                      <mat-icon>location_on</mat-icon> {{ need.locationName }}
                      <span class="dot-sep">•</span>
                      <mat-icon>schedule</mat-icon> {{ getTimeAgo(need.reportedAt) }}
                    </p>
                  </div>
                  <div class="need-action">
                    <button mat-flat-button class="assign-btn" (click)="onAssignClick($event, need)">Assign</button>
                  </div>
                </div>
              } @else {
                <div class="empty-feed">
                  <mat-icon fontSet="material-symbols-rounded">verified</mat-icon>
                  <p>Regional perimeter secured. No pending alerts.</p>
                </div>
              }
            </div>

            <!-- Quick Action Grid -->
            <div class="section-header mt-6">
              <h2>Operational Tools</h2>
            </div>
            <div class="action-grid">
              <button class="action-card" (click)="reportNeed()">
                <div class="icon-circle red">
                  <mat-icon fontSet="material-symbols-rounded">campaign</mat-icon>
                </div>
                <span>Report Need</span>
              </button>
              <button class="action-card" (click)="addVolunteer()">
                <div class="icon-circle green">
                  <mat-icon fontSet="material-symbols-rounded">group_add</mat-icon>
                </div>
                <span>Recruit Volunteer</span>
              </button>
              <button class="action-card" routerLink="/insights">
                <div class="icon-circle yellow">
                  <mat-icon fontSet="material-symbols-rounded">auto_awesome</mat-icon>
                </div>
                <span>AI Insights</span>
              </button>
              <button class="action-card" routerLink="/tasks">
                <div class="icon-circle blue">
                  <mat-icon fontSet="material-symbols-rounded">task</mat-icon>
                </div>
                <span>Task Board</span>
              </button>
            </div>
          </div>

          <!-- shadcn-style Intelligence & Activity Stream (Right) -->
          <div class="intel-column">
            
            <!-- Vertex AI Match Recommendation Card -->
            <div class="shadcn-card ai-match-card">
              <div class="card-header-compact">
                <div class="badge-tag ai-badge">
                  <mat-icon fontSet="material-symbols-rounded">auto_awesome</mat-icon>
                  <span>Vertex AI Match</span>
                </div>
                <span class="confidence-pill">{{ Math.round((latestMatch()?.confidenceScore || 0.92) * 100) }}% Alignment</span>
              </div>

              <div class="card-body">
                <h3 class="card-title">Medics Dispatch Ready</h3>
                <p class="card-desc">{{ latestMatch()?.reason || 'Found 3 volunteer medics within 1km of Sion Hospital Outpost restock request.' }}</p>

                <div class="metric-meter-box">
                  <div class="meter-labels">
                    <span class="meter-name">Skill & Proximity Fit</span>
                    <span class="meter-val">10m ETA</span>
                  </div>
                  <div class="hairline-meter">
                    <div class="meter-fill" [style.width.%]="(latestMatch()?.confidenceScore || 0.92) * 100"></div>
                  </div>
                </div>

                <div class="tag-row">
                  <span class="skill-tag">Medical</span>
                  <span class="skill-tag">Emergency</span>
                  <span class="skill-tag">Ward 4</span>
                </div>
              </div>

              <div class="card-footer">
                <button type="button" class="btn-shadcn-primary" (click)="reviewMatch()">
                  <span>Review & Deploy Match</span>
                  <mat-icon fontSet="material-symbols-rounded">arrow_forward</mat-icon>
                </button>
              </div>
            </div>

            <!-- Clean Scrollable Activity Stream -->
            <div class="shadcn-card activity-card">
              <div class="card-header-compact">
                <div class="header-title-group">
                  <h3 class="card-title">Activity Stream</h3>
                  <span class="live-dot-pill"><span class="dot"></span> LIVE</span>
                </div>
              </div>

              <!-- Filter Pills for Activities -->
              <div class="activity-filter-strip">
                <button type="button" class="af-pill" [class.active]="activityFilter() === 'all'" (click)="setActivityFilter('all')">All</button>
                <button type="button" class="af-pill" [class.active]="activityFilter() === 'needs'" (click)="setActivityFilter('needs')">Needs</button>
                <button type="button" class="af-pill" [class.active]="activityFilter() === 'tasks'" (click)="setActivityFilter('tasks')">Tasks</button>
                <button type="button" class="af-pill" [class.active]="activityFilter() === 'volunteers'" (click)="setActivityFilter('volunteers')">Volunteers</button>
              </div>

              <!-- Smooth Scroll Container with Custom Scrollbar -->
              <div class="activity-scroll-area">
                <div class="activity-stream-item" *ngFor="let act of displayActivities()">
                  <div class="stream-dot" [ngClass]="act.dotClass"></div>
                  <div class="stream-body">
                    <div class="stream-top-row">
                      <span class="stream-title">{{ act.title }}</span>
                      <span class="stream-time">{{ act.time }}</span>
                    </div>
                    <p class="stream-sub">{{ act.sub }}</p>
                  </div>
                </div>
                
                <div *ngIf="displayActivities().length === 0" class="empty-stream">
                  <p>No activity recorded in this category.</p>
                </div>
              </div>

              <div class="card-footer-subtle">
                <span class="ward-status-pill">
                  <span class="status-indicator-green"></span>
                  <span>Dharavi Ops Center • Normal Protocol</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .page-wrapper {
      position: relative;
      min-height: 100%;
      width: 100%;
      overflow: visible;
      box-sizing: border-box;
      scroll-behavior: smooth;
    }

    .bg-blur-1 {
      position: absolute;
      top: -100px;
      right: -100px;
      width: 400px;
      height: 400px;
      background: var(--color-primary-light);
      filter: blur(100px);
      opacity: 0.3;
      z-index: 0;
      pointer-events: none;
    }

    .bg-blur-2 {
      position: absolute;
      bottom: 100px;
      left: -100px;
      width: 300px;
      height: 300px;
      background: var(--color-info-light);
      filter: blur(100px);
      opacity: 0.25;
      z-index: 0;
      pointer-events: none;
    }

    .content-area {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 0 60px;
      box-sizing: border-box;
    }

    .hero-section {
      margin-bottom: 24px;
    }

    .greeting {
      font-size: 2.3rem;
      font-family: var(--font-display);
      margin: 0;
      letter-spacing: -0.02em;
      color: var(--color-text-primary);
      font-weight: 700;
    }

    .status-pulse {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.88rem;
      color: var(--color-text-secondary);
      margin: 6px 0 16px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e;
    }

    .ai-briefing {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 14px 18px;
      border-radius: 12px;
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-left: 4px solid var(--color-warning);
      box-shadow: var(--shadow-card);

      .sparkle {
        color: var(--color-warning);
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      p {
        margin: 0;
        font-size: 0.86rem;
        line-height: 1.5;
        color: var(--color-text-secondary);
      }
    }

    /* Stats Horizon */
    .stats-horizon {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: var(--shadow-card);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-elevated);
        border-color: var(--color-border);
      }
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.red { background: var(--color-danger-light); color: var(--color-danger); }
      &.green { background: var(--color-success-light); color: var(--color-success); }
      &.yellow { background: var(--color-warning-light); color: var(--color-warning); }
      &.blue { background: var(--color-info-light); color: var(--color-info); }

      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--color-text-hint);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-value {
      font-size: 1.45rem;
      font-weight: 800;
      margin: 0;
      color: var(--color-text-primary);
      line-height: 1.1;
    }

    /* 2-Column Dashboard Grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
      align-items: start;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      h2 {
        font-family: var(--font-display);
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        color: var(--color-text-primary);
      }

      .link-btn {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--color-primary);
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }

    .mt-6 { margin-top: 24px; }

    /* Feed Column Left */
    .needs-feed {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 14px;
      padding: 12px;
      box-shadow: var(--shadow-card);
    }

    .need-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 14px;
      border-radius: 10px;
      margin-bottom: 6px;
      cursor: pointer;
      position: relative;
      background: var(--color-surface-container-low);
      border: 1px solid transparent;
      transition: all 0.15s ease;

      &:hover {
        background: var(--color-card);
        border-color: var(--color-border);
        box-shadow: 0 2px 8px rgba(0, 81, 71, 0.04);
        transform: translateX(2px);
      }

      .urgency-indicator {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
        &.critical { background: var(--color-danger); }
        &.high { background: var(--color-warning); }
        &.medium { background: var(--color-info); }
        &.low { background: var(--color-text-hint); }
      }

      .category-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-surface-container);
        color: var(--color-primary);
        flex-shrink: 0;
        &.critical { color: var(--color-danger); background: var(--color-danger-light); }
        &.high { color: var(--color-warning); background: var(--color-warning-light); }
        mat-icon { font-size: 20px; width: 20px; height: 20px; }
      }
    }

    .need-details {
      flex: 1;
      min-width: 0;
      .title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
        h4 {
          margin: 0;
          font-size: 0.92rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      .urgency-tag {
        font-size: 0.65rem;
        font-weight: 800;
        text-transform: uppercase;
        padding: 1px 6px;
        border-radius: 4px;
        &.critical { background: var(--color-danger-light); color: var(--color-danger); }
        &.high { background: var(--color-warning-light); color: var(--color-warning); }
        &.medium { background: var(--color-info-light); color: var(--color-info); }
        &.low { background: var(--color-surface-container); color: var(--color-text-secondary); }
      }
      .meta-info {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.76rem;
        color: var(--color-text-secondary);
        margin: 0;
        mat-icon { font-size: 14px; width: 14px; height: 14px; }
        .dot-sep { margin: 0 2px; }
      }
    }

    .assign-btn {
      border-radius: 8px;
      background: var(--color-primary) !important;
      color: var(--color-on-primary) !important;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0 12px;
      height: 32px;
      line-height: 32px;
    }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .action-card {
      border: 1px solid var(--color-border);
      padding: 14px 10px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      background: var(--color-card);
      box-shadow: var(--shadow-card);
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--color-primary);
        transform: translateY(-2px);
        box-shadow: var(--shadow-elevated);
      }

      .icon-circle {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        &.red { background: var(--color-danger-light); color: var(--color-danger); }
        &.green { background: var(--color-success-light); color: var(--color-success); }
        &.yellow { background: var(--color-warning-light); color: var(--color-warning); }
        &.blue { background: var(--color-info-light); color: var(--color-info); }
        mat-icon { font-size: 20px; width: 20px; height: 20px; }
      }
      span { font-weight: 600; color: var(--color-text-primary); font-size: 0.8rem; }
    }

    .empty-feed {
      padding: 28px;
      text-align: center;
      color: var(--color-text-hint);
      mat-icon { font-size: 36px; width: 36px; height: 36px; margin-bottom: 8px; color: var(--color-success); }
      p { margin: 0; font-size: 0.86rem; }
    }

    /* shadcn Card Styling (Right Column) */
    .intel-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .shadcn-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 14px;
      box-shadow: var(--shadow-card);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .ai-match-card {
      border-left: 3px solid var(--color-primary);
    }

    .card-header-compact {
      padding: 14px 16px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      &.ai-badge { background: var(--color-primary-light); color: var(--color-primary); }
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    .confidence-pill {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--color-success);
      background: var(--color-success-light);
      padding: 2px 8px;
      border-radius: 12px;
    }

    .card-body {
      padding: 0 16px 14px;
    }

    .card-title {
      margin: 0 0 4px;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .card-desc {
      margin: 0 0 12px;
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      line-height: 1.45;
    }

    .metric-meter-box {
      margin-bottom: 10px;
    }
    .meter-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--color-text-hint);
      margin-bottom: 4px;
    }
    .meter-val { color: var(--color-primary); font-weight: 700; }
    .hairline-meter {
      height: 4px;
      background: var(--color-surface-container);
      border-radius: 2px;
      overflow: hidden;
    }
    .meter-fill {
      height: 100%;
      background: var(--color-primary);
      border-radius: 2px;
    }

    .tag-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .skill-tag {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      background: var(--color-surface-container);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .card-footer {
      padding: 10px 16px 14px;
      border-top: 1px solid var(--color-border-subtle);
    }

    .btn-shadcn-primary {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: var(--color-primary);
      color: var(--color-on-primary);
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--color-primary-container);
      }
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    /* Scrollable Activity Stream */
    .activity-card {
      display: flex;
      flex-direction: column;
    }

    .header-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .live-dot-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--color-success);
      background: var(--color-success-light);
      border: 1px solid var(--color-success);
      padding: 1px 6px;
      border-radius: 10px;

      .dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 5px #22c55e;
      }
    }

    .activity-filter-strip {
      display: flex;
      gap: 4px;
      padding: 0 16px 10px;
    }

    .af-pill {
      background: var(--color-surface-container);
      border: 1px solid var(--color-border-subtle);
      color: var(--color-text-secondary);
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover { color: var(--color-primary); }
      &.active {
        background: var(--color-primary);
        color: var(--color-on-primary);
        border-color: var(--color-primary);
      }
    }

    /* Smooth Scroll Area with Sleek Custom Scrollbar */
    .activity-scroll-area {
      max-height: 320px;
      overflow-y: auto;
      scroll-behavior: smooth;
      padding: 0 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .activity-stream-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--color-surface-container-low);
      border: 1px solid var(--color-border-subtle);
      transition: all 0.15s;

      &:hover {
        background: var(--color-card);
        border-color: var(--color-border);
      }
    }

    .stream-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      margin-top: 5px;
      flex-shrink: 0;
      &.needs { background: var(--color-danger); }
      &.tasks { background: var(--color-warning); }
      &.volunteers { background: var(--color-success); }
      &.dispatch { background: var(--color-info); }
    }

    .stream-body {
      flex: 1;
      min-width: 0;
    }

    .stream-top-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 4px;
    }

    .stream-title {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stream-time {
      font-size: 0.68rem;
      color: var(--color-text-hint);
      flex-shrink: 0;
    }

    .stream-sub {
      margin: 1px 0 0;
      font-size: 0.72rem;
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .empty-stream {
      padding: 20px;
      text-align: center;
      color: var(--color-text-hint);
      font-size: 0.78rem;
    }

    .card-footer-subtle {
      padding: 10px 16px;
      border-top: 1px solid var(--color-border-subtle);
      background: var(--color-card-subtle);
    }

    .ward-status-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.7rem;
      color: var(--color-text-secondary);
      font-weight: 600;
    }

    .status-indicator-green {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
    }

    @media (max-width: 1024px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .stats-horizon { grid-template-columns: repeat(2, 1fr); }
      .action-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class HomeComponent implements OnInit {
  private firestore = inject(FirestoreService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private bottomSheet = inject(MatBottomSheet);
  private dialog = inject(MatDialog);
  private agentService = inject(AgentService);

  user = toSignal(this.auth.currentUser$);
  recentNeeds = toSignal(this.firestore.getOpenNeeds(), { initialValue: [] });
  availableVolunteers = toSignal(this.firestore.getAvailableVolunteers(), { initialValue: [] });
  activeTasks = toSignal(this.firestore.getActiveTasks(), { initialValue: [] });
  allTasks = toSignal(this.firestore.getAllTasks(), { initialValue: [] });

  criticalCount = computed(() => this.recentNeeds().filter(n => n.urgency === 'critical').length);
  resolvedTodayCount = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.allTasks().filter(t => t.status === 'completed' && t.completedAt && t.completedAt.toDate() >= today).length;
  });

  stats = computed(() => [
    { label: 'Open Needs', value: this.recentNeeds().length, icon: 'notification_important', color: 'red' },
    { label: 'Volunteers', value: this.availableVolunteers().length, icon: 'volunteer_activism', color: 'green' },
    { label: 'In Progress', value: this.activeTasks().length, icon: 'pending_actions', color: 'yellow' },
    { label: 'Resolved (24h)', value: this.resolvedTodayCount(), icon: 'verified', color: 'blue' }
  ]);

  activityFilter = signal<'all' | 'needs' | 'tasks' | 'volunteers'>('all');

  seedActivities = [
    { category: 'needs', dotClass: 'needs', title: 'Critical Shelter Request', sub: 'Sector 4 Transit Camp • 40 tarpaulin kits requested', time: '4m ago' },
    { category: 'tasks', dotClass: 'tasks', title: 'Task Dispatched', sub: 'Drinking Water Tanker #3 assigned to Rahul Mehta', time: '18m ago' },
    { category: 'volunteers', dotClass: 'volunteers', title: 'New Volunteer Verified', sub: 'Dr. Ravi Deshmukh verified via Vision AI KYC', time: '35m ago' },
    { category: 'needs', dotClass: 'needs', title: 'Medical Supply Request', sub: 'Sion Hospital Outpost • 15 trauma kits dispatched', time: '1h ago' },
    { category: 'tasks', dotClass: 'tasks', title: 'Mission Completed', sub: 'Flood Barrier Sandbags Deployed in Kurla West', time: '2h ago' },
    { category: 'volunteers', dotClass: 'volunteers', title: 'Shift Check-in', sub: '12 volunteers clocked in at Dharavi Command Post', time: '3h ago' }
  ];

  displayActivities = computed(() => {
    const filter = this.activityFilter();
    if (filter === 'all') return this.seedActivities;
    return this.seedActivities.filter(a => a.category === filter);
  });

  latestMatch = signal<VolunteerMatch | null>(null);
  aiNarrative = signal<string>('Analyzing regional patterns...');
  isLoading = signal<boolean>(true);
  aiLoading = signal<boolean>(true);
  Math = Math;

  ngOnInit() {
    setTimeout(() => this.isLoading.set(false), 1200);

    setTimeout(() => {
      this.latestMatch.set({
        volunteerId: 'vol-123',
        reason: 'System found 3 volunteer medics within 1km of the Sion Hospital Outpost restock request.',
        confidenceScore: 0.92,
        estimatedArrival: '10 mins',
        skillMatchTags: ['Medical', 'Emergency']
      });
    }, 800);

    this.generateAiNarrative();
  }

  setActivityFilter(f: 'all' | 'needs' | 'tasks' | 'volunteers') {
    this.activityFilter.set(f);
  }

  async generateAiNarrative() {
    this.aiLoading.set(true);
    try {
      const topCategories = this.getTopNeedCategories();
      const stats: WeeklyStats = {
        week: new Date().toISOString().slice(0, 10),
        tasksCompleted: this.resolvedTodayCount(),
        criticalNeedsResolved: this.allTasks().filter(
          (task) => task.priority === 'critical' && task.status === 'completed',
        ).length,
        volunteersActive: this.availableVolunteers().length,
        topCategories,
      };

      const response = await this.agentService.narrateReport(stats);

      if (typeof response === 'object' && response !== null && 'narrative' in response) {
        this.aiNarrative.set(String((response as { narrative: unknown }).narrative));
      } else if (typeof response === 'string') {
        this.aiNarrative.set(response);
      }
    } catch {
      this.aiNarrative.set('Ground teams operational across Dharavi and Kurla. 19 verified volunteers available on call.');
    } finally {
      this.aiLoading.set(false);
    }
  }

  firstName = computed(() => this.user()?.displayName?.split(' ')[0] || 'Priya');

  private getTopNeedCategories(): string[] {
    const counts = this.recentNeeds().reduce<Record<string, number>>((accumulator, need) => {
      const current = accumulator[need.category] ?? 0;
      accumulator[need.category] = current + 1;
      return accumulator;
    }, {});

    const rankedCategories = Object.entries(counts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([category]) => category);

    return rankedCategories.length > 0 ? rankedCategories : ['medical', 'food'];
  }

  getTimeAgo(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      food: 'restaurant',
      medical: 'medical_services',
      water: 'water_drop',
      shelter: 'home',
      education: 'school',
      other: 'help_outline'
    };
    return icons[category] || 'help_outline';
  }

  reviewMatch() { this.router.navigate(['/tasks']); }

  onNeedClick(need: Need) {
    this.bottomSheet.open(NeedBottomSheetComponent, { data: { need } });
  }

  onAssignClick(event: Event, need: Need) {
    event.stopPropagation();
    this.onNeedClick(need);
  }

  reportNeed() {
    this.dialog.open(ReportNeedComponent, {
      width: '650px',
      maxWidth: '90vw',
      panelClass: 'glass-dialog'
    });
  }

  addVolunteer() {
    this.dialog.open(AddVolunteerComponent, {
      width: '650px',
      maxWidth: '90vw',
      panelClass: 'glass-dialog'
    });
  }
}
