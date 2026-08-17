import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Task, TaskAssignment, TaskContact, Volunteer, VolunteerMatch } from '../../models';
import { FirestoreService } from '../../core/firebase/firestore.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';
import { AgentService } from '../../core/ai/agent.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { combineLatest, filter, of, switchMap } from 'rxjs';
import type { User, TaskAssignmentStatus } from '../../models';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="modal-wrapper" *ngIf="task">
      <!-- Modal Header -->
      <header class="modal-header">
        <div class="header-main">
          <div class="task-id-badge">
            <mat-icon fontSet="material-symbols-rounded">tag</mat-icon>
            <span>TSK-{{ task.id.slice(0, 5).toUpperCase() }}</span>
          </div>
          <h2 class="modal-title">{{ task.title }}</h2>
        </div>
        <button type="button" class="close-btn" (click)="close()">
          <mat-icon fontSet="material-symbols-rounded">close</mat-icon>
        </button>
      </header>

      <mat-dialog-content class="modal-body">
        <!-- Status & Priority Badges -->
        <div class="badges-row">
          <span class="badge priority" [ngClass]="task.priority">
            <mat-icon fontSet="material-symbols-rounded">flag</mat-icon>
            {{ task.priority }} Priority
          </span>
          <span class="badge category">
            <mat-icon fontSet="material-symbols-rounded">category</mat-icon>
            {{ task.category }}
          </span>
          <span class="badge status" [ngClass]="task.status">
            <mat-icon fontSet="material-symbols-rounded">{{ task.status === 'completed' ? 'check_circle' : 'pending' }}</mat-icon>
            {{ task.status }}
          </span>
        </div>

        <!-- Description -->
        <section class="info-section">
          <h3 class="section-label">Mission Scope & Objectives</h3>
          <p class="description-text">{{ task.description }}</p>
        </section>

        <!-- Location -->
        <section class="info-section">
          <h3 class="section-label">Deployment Location</h3>
          <div class="location-box">
            <mat-icon fontSet="material-symbols-rounded">location_on</mat-icon>
            <span>{{ task.locationName }}</span>
          </div>
        </section>

        <!-- Progress Bar -->
        <section class="info-section">
          <div class="progress-header">
            <h3 class="section-label">Completion Progress</h3>
            <span class="progress-val">{{ task.progress }}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="task.progress" [ngClass]="task.status"></div>
          </div>
        </section>

        <!-- Deployed Team -->
        <section class="info-section" *ngIf="canAssign()">
          <h3 class="section-label">Active Team on Ground</h3>
          <div class="volunteers-list">
            <div *ngFor="let a of acceptedAssignments()" class="volunteer-pill">
              <mat-icon fontSet="material-symbols-rounded">verified_user</mat-icon>
              <span>{{ a.volunteerId }}</span>
            </div>
            <div *ngIf="acceptedAssignments().length === 0" class="empty-state">
              <mat-icon fontSet="material-symbols-rounded">group_off</mat-icon>
              <span>No volunteers deployed yet. Use AI Match below to assign.</span>
            </div>
          </div>
        </section>

        <!-- Contact Section -->
        <section class="info-section" *ngIf="canSeeContacts()">
          <h3 class="section-label">Emergency Coordinator Contact</h3>
          <div class="contact-card" *ngIf="taskContact() as c; else missingContact">
            <div class="contact-block">
              <div class="contact-name">{{ c.primary.name }}</div>
              <div class="contact-links">
                <a *ngIf="c.primary.phone" [href]="'tel:' + c.primary.phone" class="contact-link call">
                  <mat-icon fontSet="material-symbols-rounded">call</mat-icon> Call Direct
                </a>
                <a *ngIf="c.primary.whatsapp" [href]="whatsAppLink(c.primary.whatsapp)" target="_blank" rel="noopener" class="contact-link whatsapp">
                  <mat-icon fontSet="material-symbols-rounded">chat</mat-icon> WhatsApp
                </a>
              </div>
            </div>
          </div>
          <ng-template #missingContact>
            <div class="empty-state">Contact details not configured for this task.</div>
          </ng-template>
        </section>

        <!-- AI Suggested Matches -->
        <section class="info-section" *ngIf="canAssign()">
          <div class="ai-header">
            <h3 class="section-label">Vertex AI Volunteer Matches</h3>
            <button type="button" class="ai-match-btn" (click)="runMatch()" [disabled]="actionLoading()">
              <mat-icon fontSet="material-symbols-rounded">{{ actionLoading() ? 'sync' : 'psychology' }}</mat-icon>
              <span>{{ actionLoading() ? 'Matching...' : 'Run Vertex AI Match' }}</span>
            </button>
          </div>

          <div class="matches-container" *ngIf="matches().length > 0">
            <div class="match-card" *ngFor="let m of matches()">
              <div class="match-meta">
                <div class="match-top">
                  <span class="vol-name">{{ m.volunteerId }}</span>
                  <span class="match-score">Confidence: {{ (m.confidenceScore * 100).toFixed(0) }}%</span>
                </div>
                <p class="match-reason">{{ m.reason }}</p>
                <div class="match-tags" *ngIf="m.skillMatchTags?.length">
                  <span class="match-tag" *ngFor="let tag of m.skillMatchTags">{{ tag }}</span>
                </div>
              </div>
              <button type="button" class="request-btn" (click)="sendRequest(m.volunteerId)" [disabled]="actionLoading()">
                Deploy
              </button>
            </div>
          </div>
        </section>
      </mat-dialog-content>

      <!-- Modal Footer -->
      <mat-dialog-actions class="modal-footer">
        <button type="button" class="cancel-btn" (click)="close()">Close</button>
        <button type="button" class="status-btn" *ngIf="task.status === 'pending'" (click)="updateStatus('active')">
          <mat-icon fontSet="material-symbols-rounded">play_arrow</mat-icon>
          <span>Start Operation</span>
        </button>
        <button type="button" class="complete-btn" *ngIf="task.status === 'active'" (click)="updateStatus('completed')">
          <mat-icon fontSet="material-symbols-rounded">task_alt</mat-icon>
          <span>Mark Resolved</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .modal-wrapper {
      display: flex;
      flex-direction: column;
      background: var(--color-card);
      min-width: 520px;
      max-width: 620px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--color-border);
    }

    .task-id-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--color-surface-container-low);
      color: #005147;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      margin-bottom: 6px;
    }
    .task-id-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .modal-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.35rem;
      font-weight: 700;
      color: #005147;
      line-height: 1.3;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .close-btn:hover {
      background: var(--color-surface-container-low);
      color: var(--color-text-primary);
    }

    .modal-body {
      padding: 20px 24px !important;
      max-height: 70vh;
      overflow-y: auto;
    }

    .badges-row {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: capitalize;
      padding: 4px 12px;
      border-radius: 20px;
    }
    .badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .priority.critical { background: var(--color-danger-light); color: #dc2626; }
    .priority.high { background: var(--color-warning-light); color: #d97706; }
    .priority.medium { background: var(--color-info-light); color: #0284c7; }
    .priority.low { background: var(--color-surface-container-low); color: var(--color-text-secondary); }
    .category { background: var(--color-success-light); color: #16a34a; border: 1px solid #dcfce7; }
    .status.active { background: var(--color-primary-light); color: #005147; }
    .status.completed { background: var(--color-success-light); color: #16a34a; }
    .status.pending { background: #fff7ed; color: #ea580c; }

    .info-section {
      margin-bottom: 20px;
    }

    .section-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text-secondary);
      font-weight: 700;
      margin: 0 0 8px;
    }

    .description-text {
      font-size: 0.88rem;
      line-height: 1.55;
      color: var(--color-text-primary);
      margin: 0;
    }

    .location-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--color-surface-container-low);
      border: 1px solid var(--color-border);
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 0.86rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .location-box mat-icon {
      color: #005147;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .progress-val {
      font-size: 0.82rem;
      font-weight: 700;
      color: #005147;
    }

    .progress-track {
      width: 100%;
      height: 8px;
      background: var(--color-surface-container-low);
      border-radius: 10px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--color-primary);
      border-radius: 10px;
      transition: width 0.4s ease;
    }
    .progress-fill.completed {
      background: #16a34a;
    }

    .volunteers-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .volunteer-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--color-success-light);
      border: 1px solid #bbf7d0;
      color: #166534;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
    }
    .volunteer-pill mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .empty-state {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--color-surface-container-low);
      border: 1px dashed var(--color-border);
      border-radius: 10px;
      font-size: 0.82rem;
      color: var(--color-text-secondary);
    }
    .empty-state mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .contact-card {
      background: var(--color-surface-container-low);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 14px 16px;
    }
    .contact-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 8px;
    }
    .contact-links {
      display: flex;
      gap: 10px;
    }
    .contact-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 8px;
      transition: opacity 0.2s;
    }
    .contact-link.call {
      background: var(--color-primary-light);
      color: #005147;
      border: 1px solid #85d5c5;
    }
    .contact-link.whatsapp {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .contact-link mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .ai-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .ai-match-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-mid));
      color: var(--color-on-primary);
      border: none;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 81, 71, 0.2);
    }
    .ai-match-btn:disabled {
      opacity: 0.6;
    }

    .matches-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
    }
    .match-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--color-card);
      border: 1.5px solid #005147;
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 0 4px 12px rgba(0, 81, 71, 0.06);
    }
    .match-meta {
      flex: 1;
      padding-right: 12px;
    }
    .match-top {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }
    .vol-name {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .match-score {
      font-size: 0.72rem;
      font-weight: 700;
      background: var(--color-primary-light);
      color: #005147;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .match-reason {
      font-size: 0.78rem;
      color: var(--color-text-secondary);
      margin: 0 0 6px;
      line-height: 1.35;
    }
    .match-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .match-tag {
      font-size: 0.68rem;
      font-weight: 600;
      background: var(--color-surface-container-low);
      color: var(--color-text-secondary);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .request-btn {
      background: var(--color-primary);
      color: var(--color-on-primary);
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px 20px !important;
      border-top: 1px solid var(--color-border);
    }

    .cancel-btn {
      background: transparent;
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      padding: 9px 18px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .status-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #0284c7;
      color: var(--color-on-primary);
      border: none;
      padding: 9px 20px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .complete-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #16a34a;
      color: var(--color-on-primary);
      border: none;
      padding: 9px 20px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
    }
  `]
})
export class TaskDetailComponent {
  private firestore = inject(FirestoreService);
  private dialogRef = inject(MatDialogRef<TaskDetailComponent>);
  private auth = inject(AuthService);
  private agent = inject(AgentService);
  private snackBar = inject(MatSnackBar);
  data = inject(MAT_DIALOG_DATA);
  task: Task = this.data.task;

  private user$ = this.auth.currentUser$.pipe(filter((u): u is User | null => u !== undefined));
  readonly user = toSignal(this.user$, { initialValue: null });

  readonly actionLoading = signal(false);
  readonly matches = signal<VolunteerMatch[]>([]);

  private readonly isAssignerRole = (u: User | null): boolean => {
    if (!u) return false;
    return u.role === 'field_lead' || u.role === 'ngo_admin' || u.role === 'ngo_founder' || u.role === 'super_admin';
  };

  readonly canAssign = computed(() => this.isAssignerRole(this.user()));

  readonly assignments = toSignal(
    this.user$.pipe(
      switchMap((u) => (this.isAssignerRole(u) ? this.firestore.getTaskAssignmentsForTask(this.task.id) : of([] as TaskAssignment[]))),
    ),
    { initialValue: [] as TaskAssignment[] },
  );

  private myAssignment$ = this.user$.pipe(
    switchMap((u) => (u ? this.firestore.getTaskAssignment(this.task.id, u.uid) : of(undefined))),
  );

  readonly myAssignment = toSignal(this.myAssignment$, { initialValue: undefined });
  readonly acceptedAssignments = computed(() => this.assignments().filter((a) => a.status === 'accepted'));

  readonly canSeeContacts = computed(() => {
    const u = this.user();
    if (!u) return false;
    if (this.isAssignerRole(u)) return true;
    return this.myAssignment()?.status === 'accepted';
  });

  readonly taskContact = toSignal(
    combineLatest([this.user$, this.myAssignment$]).pipe(
      switchMap(([u, a]) => {
        if (!u) return of(undefined);
        if (this.isAssignerRole(u) || a?.status === 'accepted') {
          return this.firestore.getTaskContact(this.task.id);
        }
        return of(undefined);
      }),
    ),
    { initialValue: undefined },
  );

  close() {
    this.dialogRef.close();
  }

  async updateStatus(status: 'pending' | 'active' | 'completed') {
    try {
      const u = this.user();
      await this.firestore.updateTask(this.task.id, { 
        status,
        progress: status === 'completed' ? 100 : (status === 'active' ? 10 : 0),
        completedAt: status === 'completed' ? Timestamp.fromDate(new Date()) : undefined
      });
      
      await this.firestore.logActivity({
        type: status === 'completed' ? 'task_resolved' : 'task_updated',
        text: status === 'completed' ? 
          `Operation <b>${this.task.title}</b> successfully resolved.` : 
          `Operation <b>${this.task.title}</b> shifted to In Progress.`,
        dotClass: status === 'completed' ? 'bg-success' : 'bg-warning',
        userId: u?.uid || 'system'
      });

      this.task.status = status;
      if (status === 'completed') this.task.progress = 100;
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  async runMatch() {
    const u = this.user();
    if (!this.isAssignerRole(u)) return;

    this.actionLoading.set(true);
    try {
      const volunteers = await new Promise<Volunteer[]>((resolve, reject) => {
        const sub = this.firestore.getAvailableVolunteers().subscribe({
          next: (v) => {
            resolve(v);
            sub.unsubscribe();
          },
          error: (e) => {
            reject(e);
            sub.unsubscribe();
          },
        });
      });

      const res = await this.agent.matchVolunteers(this.task, volunteers);
      this.matches.set(res);
      this.snackBar.open('AI suggestions updated.', 'OK', { duration: 2500 });
    } catch (e) {
      console.error('AI match failed', e);
      this.snackBar.open('AI match failed.', 'OK', { duration: 3000 });
    } finally {
      this.actionLoading.set(false);
    }
  }

  async sendRequest(volunteerId: string) {
    const u = this.user();
    if (!this.isAssignerRole(u) || !u) return;

    this.actionLoading.set(true);
    try {
      await this.firestore.createTaskAssignmentRequests({
        taskId: this.task.id,
        volunteerIds: [volunteerId],
        requestedBy: u.uid,
        region: u.region,
      });
      this.snackBar.open('Request sent.', 'OK', { duration: 2500 });
    } catch (e) {
      console.error('Send request failed', e);
      this.snackBar.open('Failed to send request.', 'OK', { duration: 3000 });
    } finally {
      this.actionLoading.set(false);
    }
  }

  whatsAppLink(phone: string): string {
    const normalized = phone.replace(/\s+/g, '');
    return `https://wa.me/${encodeURIComponent(normalized)}`;
  }
}
