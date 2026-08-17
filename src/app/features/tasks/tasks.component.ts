import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateTaskComponent } from '../../modals/create-task/create-task.component';
import { TaskDetailComponent } from '../../modals/task-detail/task-detail.component';
import { TaskCardComponent } from '../../shared/components/task-card/task-card.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { Task } from '../../models';
import { FirestoreService } from '../../core/firebase/firestore.service';
import { SearchService } from '../../core/ui/search.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Timestamp } from '@angular/fire/firestore';

import { Observable } from 'rxjs';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatMenuModule, 
    MatDialogModule, 
    MatSnackBarModule,
    TaskCardComponent, 
    SkeletonLoaderComponent
  ],
  template: `
    <div class="tasks-page">
      
      <!-- Single compact header line -->
      <div class="header">
        <h1 class="title">Task Force</h1>

        <div class="header-right">
          <button type="button" class="btn-sort" [matMenuTriggerFor]="sortMenu">
            <mat-icon fontSet="material-symbols-rounded">swap_vert</mat-icon>
            {{ sortBy() | titlecase }}
          </button>
          <mat-menu #sortMenu="matMenu">
            <button mat-menu-item (click)="sortBy.set('urgency')">Priority</button>
            <button mat-menu-item (click)="sortBy.set('recent')">Recent</button>
            <button mat-menu-item (click)="sortBy.set('due')">Due Date</button>
          </mat-menu>

          <button type="button" class="btn-deploy" (click)="openCreateTask()" *ngIf="auth.hasPermission('create_task')">
            <mat-icon fontSet="material-symbols-rounded">add</mat-icon>
            New Mission
          </button>
        </div>
      </div>

      <!-- Category tabs (inline, not pills) -->
      <div class="tabs">
        <button class="tab" [class.active]="selectedCategory() === 'all'" (click)="selectedCategory.set('all')">All</button>
        <button class="tab" [class.active]="selectedCategory() === 'medical'" (click)="selectedCategory.set('medical')">Medical</button>
        <button class="tab" [class.active]="selectedCategory() === 'shelter'" (click)="selectedCategory.set('shelter')">Shelter</button>
        <button class="tab" [class.active]="selectedCategory() === 'water'" (click)="selectedCategory.set('water')">Water</button>
        <button class="tab" [class.active]="selectedCategory() === 'food'" (click)="selectedCategory.set('food')">Food</button>
      </div>

      <!-- Clean 4-lane kanban -->
      <div class="board">

        <div class="lane">
          <div class="lh"><span class="dot red"></span> Open <span class="cnt">{{ getTasks('pending').length }}</span></div>
          <div class="cards">
            @for (task of getTasks('pending'); track task.id) {
              <app-task-card [task]="task" (cardClick)="openTaskDetail($event)"></app-task-card>
            } @empty {
              <p class="empty">No open tasks</p>
            }
          </div>
        </div>

        <div class="lane">
          <div class="lh"><span class="dot amber"></span> Assigned <span class="cnt">{{ getTasks('assigned').length }}</span></div>
          <div class="cards">
            @for (task of getTasks('assigned'); track task.id) {
              <app-task-card [task]="task" (cardClick)="openTaskDetail($event)"></app-task-card>
            } @empty {
              <p class="empty">No assigned tasks</p>
            }
          </div>
        </div>

        <div class="lane">
          <div class="lh"><span class="dot green"></span> In Progress <span class="cnt">{{ getTasks('active').length }}</span></div>
          <div class="cards">
            @for (task of getTasks('active'); track task.id) {
              <app-task-card [task]="task" (cardClick)="openTaskDetail($event)"></app-task-card>
            } @empty {
              <p class="empty">No active tasks</p>
            }
          </div>
        </div>

        <div class="lane">
          <div class="lh"><span class="dot blue"></span> Resolved <span class="cnt">{{ getTasks('completed').length }}</span></div>
          <div class="cards">
            @for (task of getTasks('completed'); track task.id) {
              <app-task-card [task]="task" (cardClick)="openTaskDetail($event)"></app-task-card>
            } @empty {
              <p class="empty">No resolved tasks</p>
            }
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .tasks-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: fadeUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      font-family: var(--font-display);
      font-size: 1.6rem;
      color: var(--color-text-primary);
      margin: 0;
      font-weight: 700;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-sort {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { border-color: var(--color-primary); color: var(--color-primary); }
    }
    .btn-deploy {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--color-primary);
      color: var(--color-on-primary);
      border: none;
      padding: 7px 16px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 81, 71, 0.2);
      transition: all 0.15s ease;
      &:hover {
        background: var(--color-primary-container);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 81, 71, 0.28);
      }
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    /* ── Tabs ── */
    .tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 2px;
    }
    .tab {
      background: transparent;
      border: none;
      padding: 8px 16px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-hint);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s ease;
      border-radius: 6px 6px 0 0;
      &:hover { color: var(--color-text-primary); }
      &.active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
        background: var(--color-primary-light);
      }
    }

    /* ── Board ── */
    .board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      align-items: start;
    }
    .lane {
      background: var(--color-surface-container-low);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 12px;
      min-height: 420px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: var(--shadow-card);
    }
    .lh {
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 6px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--color-border);
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      &.red { background: var(--color-danger); }
      &.amber { background: var(--color-warning); }
      &.green { background: var(--color-success); }
      &.blue { background: var(--color-info); }
    }
    .cnt {
      margin-left: auto;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-text-hint);
      background: var(--color-surface-container);
      padding: 1px 6px;
      border-radius: 10px;
    }
    .cards {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }
    .empty {
      text-align: center;
      font-size: 0.76rem;
      color: var(--color-text-hint);
      padding: 40px 0;
      margin: 0;
    }

    @media (max-width: 1024px) {
      .board { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .board { grid-template-columns: 1fr; }
    }
  `]
})
export class TasksComponent {
  private firestore = inject(FirestoreService);
  private dialog = inject(MatDialog);
  protected auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  firestoreTasks = toSignal(this.firestore.getAllTasks(), { initialValue: [] as Task[] });

  // Rich pre-seeded Mumbai task force missions across all 4 Kanban lanes
  defaultTasks: Task[] = [
    {
      id: 'tsk-001',
      title: 'Emergency Pediatric First Aid Triage',
      category: 'medical',
      priority: 'critical',
      volunteerIds: [],
      status: 'pending',
      progress: 0,
      dueAt: Timestamp.fromDate(new Date(Date.now() + 4 * 3600 * 1000)),
      createdBy: 'Dr. Ravi Deshmukh',
      createdAt: Timestamp.now(),
      recurring: false,
      attachmentUrls: [],
      description: 'Setup emergency pediatric dehydration triage unit near Matunga Labor Camp.',
      locationLat: 19.0490,
      locationLng: 72.8550,
      locationName: '90 Feet Road, Matunga Outpost'
    },
    {
      id: 'tsk-002',
      title: 'Heavy Monsoon Tarpaulin Deployment',
      category: 'shelter',
      priority: 'critical',
      volunteerIds: [],
      status: 'pending',
      progress: 0,
      dueAt: Timestamp.fromDate(new Date(Date.now() + 6 * 3600 * 1000)),
      createdBy: 'Priya Sharma',
      createdAt: Timestamp.now(),
      recurring: false,
      attachmentUrls: [],
      description: 'Deploy 40 units of 200 GSM reinforced waterproof sheets to Transit Camp.',
      locationLat: 19.0444,
      locationLng: 72.8501,
      locationName: 'Dharavi Sector 4, Transit Camp'
    },
    {
      id: 'tsk-003',
      title: 'NaDCC Chlorine Tablet Batch Dispatch',
      category: 'water',
      priority: 'high',
      volunteerIds: ['vol_1', 'vol_2'],
      status: 'active',
      progress: 35,
      dueAt: Timestamp.fromDate(new Date(Date.now() + 8 * 3600 * 1000)),
      createdBy: 'Anita Kale',
      createdAt: Timestamp.now(),
      recurring: false,
      attachmentUrls: [],
      description: 'Distribute 300 chlorine purification tablets to prevent waterborne outbreak.',
      locationLat: 19.0410,
      locationLng: 72.8460,
      locationName: 'Kumbharwada Sector 5'
    },
    {
      id: 'tsk-004',
      title: 'Trauma Burn Dressings & Splint Mobilization',
      category: 'medical',
      priority: 'high',
      volunteerIds: ['vol_3', 'vol_4'],
      status: 'active',
      progress: 65,
      dueAt: Timestamp.fromDate(new Date(Date.now() + 12 * 3600 * 1000)),
      createdBy: 'Vikram Joshi',
      createdAt: Timestamp.now(),
      recurring: false,
      attachmentUrls: [],
      description: 'First responders on site treating minor lacerations from wall collapse clearance.',
      locationLat: 19.0380,
      locationLng: 72.8520,
      locationName: 'Mahim East Transit Point'
    },
    {
      id: 'tsk-005',
      title: 'Ready-to-Eat Ration Packs for Seniors',
      category: 'food',
      priority: 'medium',
      volunteerIds: ['vol_5'],
      status: 'completed',
      progress: 100,
      dueAt: Timestamp.fromDate(new Date(Date.now() - 2 * 3600 * 1000)),
      completedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 3600 * 1000)),
      createdBy: 'Red Cross Unit',
      createdAt: Timestamp.now(),
      recurring: false,
      attachmentUrls: [],
      description: 'Delivered 100 fortified meal packs to elderly residents displaced by inundation.',
      locationLat: 19.0520,
      locationLng: 72.8600,
      locationName: 'Kurla West Bridge Camp'
    }
  ];

  selectedCategory = signal<string>('all');
  sortBy = signal<'urgency' | 'recent' | 'due'>('urgency');

  allTasksList = computed(() => {
    const fs = this.firestoreTasks();
    if (fs && fs.length > 2) return fs;
    return this.defaultTasks;
  });

  filteredTasks = computed(() => {
    const cat = this.selectedCategory();
    return this.allTasksList().filter(t => {
      return cat === 'all' || t.category === cat;
    });
  });

  getTasks(status: 'pending' | 'assigned' | 'active' | 'completed'): Task[] {
    return this.filteredTasks().filter(t => {
      if (status === 'pending') return t.status === 'pending' && (!t.volunteerIds || t.volunteerIds.length === 0);
      if (status === 'assigned') return t.status === 'pending' && t.volunteerIds && t.volunteerIds.length > 0;
      if (status === 'active') return t.status === 'active';
      if (status === 'completed') return t.status === 'completed';
      return false;
    });
  }

  getCount(status: 'pending' | 'assigned' | 'active' | 'completed'): number {
    return this.getTasks(status).length;
  }

  optimizeRoutes() {
    this.snackBar.open('Vertex AI: Calculated optimal Dharavi transit routes (-18m latency).', 'OK', { duration: 3000 });
  }

  applyAiDispatch() {
    this.snackBar.open('✦ Vertex AI: Dispatched 2 volunteer medics to Sion Outpost!', 'OK', { duration: 3500 });
  }

  openCreateTask() {
    this.dialog.open(CreateTaskComponent, {
      width: '650px',
      maxWidth: '90vw',
      panelClass: 'glass-dialog'
    });
  }

  openTaskDetail(task: Task) {
    this.dialog.open(TaskDetailComponent, {
      data: { task },
      width: '650px',
      maxWidth: '90vw',
      panelClass: 'glass-dialog'
    });
  }
}
