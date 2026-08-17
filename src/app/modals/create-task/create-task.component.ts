import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FirestoreService } from '../../core/firebase/firestore.service';
import { AuthService } from '../../core/auth/auth.service';
import { TaskContact } from '../../models';
import { Timestamp } from '@angular/fire/firestore';
import type { Task } from '../../models';

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule
  ],
  template: `
    <div class="modal-wrapper">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="badge-icon">
            <mat-icon fontSet="material-symbols-rounded">assignment_add</mat-icon>
          </div>
          <div>
            <h2 class="modal-title">Assign New Operation</h2>
            <p class="modal-subtitle">Deploy a coordinated relief task force to ground teams</p>
          </div>
        </div>
        <button type="button" class="close-btn" (click)="close()">
          <mat-icon fontSet="material-symbols-rounded">close</mat-icon>
        </button>
      </div>

      <!-- Modal Body -->
      <mat-dialog-content class="modal-body">
        <form [formGroup]="taskForm" class="form-container">

          <!-- Operation Title -->
          <div class="sahaay-input-group">
            <label class="sahaay-label">Operation Title *</label>
            <div class="sahaay-control-box">
              <mat-icon fontSet="material-symbols-rounded">campaign</mat-icon>
              <input type="text" formControlName="title" placeholder="e.g. Medical Supply Drop & Health Camp">
            </div>
          </div>

          <!-- Category & Priority in a 2-col row -->
          <div class="form-row-2">
            <!-- Category -->
            <div class="sahaay-input-group flex-1">
              <label class="sahaay-label">Operation Category *</label>
              <div class="sahaay-control-box">
                <mat-icon fontSet="material-symbols-rounded">category</mat-icon>
                <select formControlName="category" class="custom-select">
                  <option value="medical">Medical Relief</option>
                  <option value="food">Food Rationing</option>
                  <option value="water">Clean Water</option>
                  <option value="shelter">Emergency Shelter</option>
                  <option value="education">Education</option>
                  <option value="other">General Operations</option>
                </select>
              </div>
            </div>

            <!-- Priority -->
            <div class="sahaay-input-group flex-1">
              <label class="sahaay-label">Urgency Priority *</label>
              <div class="sahaay-control-box" [ngClass]="getPriorityClass()">
                <mat-icon fontSet="material-symbols-rounded">priority_high</mat-icon>
                <select formControlName="priority" class="custom-select">
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical / Emergency</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Location Name -->
          <div class="sahaay-input-group">
            <label class="sahaay-label">Target Location / Ward *</label>
            <div class="sahaay-control-box">
              <mat-icon fontSet="material-symbols-rounded">location_on</mat-icon>
              <input type="text" formControlName="locationName" placeholder="e.g. Sector 4, Transit Camp, Dharavi">
            </div>
          </div>

          <!-- Detailed Objectives -->
          <div class="sahaay-input-group">
            <label class="sahaay-label">Mission Scope & Objectives *</label>
            <div class="sahaay-control-box align-top">
              <mat-icon fontSet="material-symbols-rounded" class="mt-1">notes</mat-icon>
              <textarea formControlName="description" rows="3" placeholder="Outline specific action items, required equipment, and ground contact notes..."></textarea>
            </div>
          </div>

        </form>
      </mat-dialog-content>

      <!-- Modal Footer -->
      <mat-dialog-actions class="modal-footer">
        <button type="button" class="cancel-btn" (click)="close()" [disabled]="loading">Cancel</button>
        <button type="button" class="submit-btn" [disabled]="taskForm.invalid || loading" (click)="submit()">
          <mat-icon fontSet="material-symbols-rounded">{{ loading ? 'sync' : 'rocket_launch' }}</mat-icon>
          <span>{{ loading ? 'Deploying Operation...' : 'Deploy Operation' }}</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .modal-wrapper {
      display: flex;
      flex-direction: column;
      background: var(--color-card);
      min-width: 480px;
      max-width: 560px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--color-border);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .badge-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--color-primary-light);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .badge-icon mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .modal-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    .modal-subtitle {
      margin: 2px 0 0;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
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
      max-height: 68vh;
    }

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .form-row-2 {
      display: flex;
      gap: 12px;
    }
    .flex-1 { flex: 1; }

    .align-top {
      align-items: flex-start;
    }
    .mt-1 { margin-top: 4px; }

    .custom-select {
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
      transition: all 0.2s;
    }
    .cancel-btn:hover {
      background: var(--color-surface-container-low);
    }

    .submit-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
      color: var(--color-on-primary);
      border: none;
      padding: 9px 22px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0, 81, 71, 0.25);
      transition: all 0.2s;
    }
    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }
    .submit-btn:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(0, 81, 71, 0.35);
    }
  `]
})
export class CreateTaskComponent {
  private fb = inject(FormBuilder);
  private firestore = inject(FirestoreService);
  private auth = inject(AuthService);
  private dialogRef = inject(MatDialogRef<CreateTaskComponent>);

  loading = false;

  taskForm = this.fb.group({
    title: ['', Validators.required],
    category: ['medical', Validators.required],
    priority: ['medium', Validators.required],
    locationName: ['', Validators.required],
    description: ['', Validators.required],
    locationLat: [19.0443], // Default Dharavi
    locationLng: [72.8550]
  });

  getPriorityClass(): string {
    const p = this.taskForm.get('priority')?.value;
    if (p === 'critical') return 'border-red-400 bg-red-50';
    if (p === 'high') return 'border-amber-400 bg-amber-50';
    return '';
  }

  async submit() {
    if (this.taskForm.valid) {
      this.loading = true;
      try {
        const user = this.auth.currentUser;
        const now = new Date();
        const v = this.taskForm.getRawValue();

        const safeCategory: Task['category'] =
          v.category === 'food' ||
          v.category === 'medical' ||
          v.category === 'education' ||
          v.category === 'shelter' ||
          v.category === 'water'
            ? v.category
            : 'other';

        const safePriority: Task['priority'] =
          v.priority === 'low' ||
          v.priority === 'medium' ||
          v.priority === 'high'
            ? v.priority
            : 'critical';

        const taskData: Partial<Task> = {
          title: v.title ?? '',
          category: safeCategory,
          priority: safePriority,
          locationName: v.locationName ?? '',
          description: v.description ?? '',
          locationLat: v.locationLat ?? 0,
          locationLng: v.locationLng ?? 0,
          createdBy: user?.uid || 'system',
          dueAt: Timestamp.fromDate(now),
          volunteerIds: [],
          progress: 0,
          status: 'pending',
          attachmentUrls: [],
          recurring: false,
        };

        const taskId = await this.firestore.addTask(taskData);

        if (user?.uid) {
          const contact: TaskContact = {
            id: taskId,
            taskId,
            primary: {
              name: user.displayName || 'Coordinator',
              phone: user.phone,
              whatsapp: user.phone,
            },
            createdBy: user.uid,
            createdAt: now,
            region: user.region,
          };
          await this.firestore.upsertTaskContact(contact);
        }

        await this.firestore.logActivity({
          type: 'task_created',
          text: `New operation <b>${taskData.title}</b> deployed in ${taskData.locationName}.`,
          dotClass: 'bg-info',
          userId: user?.uid || 'system'
        });

        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error adding task:', error);
      } finally {
        this.loading = false;
      }
    }
  }

  close() {
    this.dialogRef.close();
  }
}
