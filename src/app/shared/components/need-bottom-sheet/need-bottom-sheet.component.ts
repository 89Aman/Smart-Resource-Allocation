import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Need } from '../../../models';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { Router } from '@angular/router';

@Component({
  selector: 'app-need-bottom-sheet',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RelativeTimePipe],
  template: `
    <div class="need-sheet-card">
      
      <!-- Top Header Row -->
      <div class="sheet-top-row">
        <div class="sheet-title-group">
          <div class="category-icon-box" [ngClass]="data.need.category">
            <mat-icon fontSet="material-symbols-rounded">{{ getCategoryIcon(data.need.category) }}</mat-icon>
          </div>
          <div>
            <div class="badge-row">
              <span class="urgency-pill" [ngClass]="data.need.urgency">{{ data.need.urgency | uppercase }}</span>
              <span class="cat-pill">{{ data.need.category | uppercase }}</span>
              <span class="status-pill" [ngClass]="data.need.status">{{ data.need.status | uppercase }}</span>
            </div>
            <h2 class="need-sheet-title">{{ data.need.title }}</h2>
          </div>
        </div>

        <button type="button" class="btn-close" (click)="close()" title="Close details">
          <mat-icon fontSet="material-symbols-rounded">close</mat-icon>
        </button>
      </div>

      <!-- Description Body -->
      <div class="sheet-body-content">
        <p class="desc-text">{{ data.need.description }}</p>
        
        <div class="summary-box" *ngIf="data.need.summary">
          <mat-icon fontSet="material-symbols-rounded">auto_awesome</mat-icon>
          <p><strong>AI Summary:</strong> {{ data.need.summary }}</p>
        </div>
      </div>

      <!-- Key Location & Field Meta Info -->
      <div class="meta-strip">
        <div class="meta-col">
          <span class="meta-lbl">Incident Location</span>
          <div class="meta-val">
            <mat-icon fontSet="material-symbols-rounded">location_on</mat-icon>
            <span>{{ data.need.locationName }}</span>
          </div>
        </div>

        <div class="meta-col">
          <span class="meta-lbl">Reported By & Time</span>
          <div class="meta-val">
            <mat-icon fontSet="material-symbols-rounded">schedule</mat-icon>
            <span>{{ data.need.reportedBy || 'Field Unit' }} • {{ data.need.reportedAt | relativeTime }}</span>
          </div>
        </div>

        <div class="meta-col">
          <span class="meta-lbl">Assigned Responders</span>
          <div class="meta-val">
            <mat-icon fontSet="material-symbols-rounded">group</mat-icon>
            <span>{{ data.need.assignedVolunteers.length }} volunteers active</span>
          </div>
        </div>
      </div>

      <!-- Bottom Action Row -->
      <div class="sheet-actions-row">
        <button type="button" class="btn-secondary" (click)="openDirections()">
          <mat-icon fontSet="material-symbols-rounded">directions</mat-icon>
          <span>Get Directions</span>
        </button>
        <button type="button" class="btn-primary" (click)="assignVolunteers()">
          <mat-icon fontSet="material-symbols-rounded">auto_awesome</mat-icon>
          <span>Assign Volunteers (AI Match)</span>
        </button>
      </div>

    </div>
  `,
  styles: [`
    .need-sheet-card {
      padding: 20px 24px;
      font-family: var(--font-ui), sans-serif;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: var(--color-card, #ffffff);
      color: var(--color-text-primary, #111827);
    }

    /* Top Row */
    .sheet-top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .sheet-title-group {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .category-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }

      &.medical { background: #fee2e2; color: #dc2626; }
      &.shelter { background: #fef3c7; color: #b45309; }
      &.water { background: #e0f2fe; color: #0284c7; }
      &.food { background: #f0fdf4; color: #16a34a; }
      &.rescue { background: #f3e8ff; color: #7e22ce; }
    }

    .badge-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .urgency-pill {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.05em;
      &.critical { background: #fee2e2; color: #dc2626; }
      &.high { background: #fef3c7; color: #b45309; }
      &.medium { background: #e0f2fe; color: #0284c7; }
      &.low { background: #f1f5f9; color: #64748b; }
    }

    .cat-pill {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f1f5f4;
      color: #55605d;
    }

    .status-pill {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      &.open { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
      &.assigned { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    }

    .need-sheet-title {
      font-family: var(--font-display);
      font-size: 1.35rem;
      font-weight: 700;
      color: #005147;
      margin: 0;
      line-height: 1.25;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      &:hover { background: rgba(0, 0, 0, 0.05); color: #1a201e; }
    }

    /* Body */
    .sheet-body-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .desc-text {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.5;
      color: #475569;
    }

    .summary-box {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #f0fdf4;
      border-left: 3px solid #005147;
      padding: 8px 12px;
      border-radius: 4px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #005147; margin-top: 2px; }
      p { margin: 0; font-size: 0.78rem; color: #166534; line-height: 1.4; }
    }

    /* Meta Strip */
    .meta-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      background: #f8faf9;
      border: 1px solid #edf2f0;
      border-radius: 8px;
      padding: 10px 14px;
    }

    .meta-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .meta-lbl {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }

    .meta-val {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #1a201e;
      mat-icon { font-size: 15px; width: 15px; height: 15px; color: #005147; }
    }

    /* Actions */
    .sheet-actions-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-top: 4px;
    }

    .btn-primary {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #005147;
      color: #ffffff;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
      &:hover { background: #0a6b5e; }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: transparent;
      color: #005147;
      border: 1.5px solid #dce5e2;
      padding: 9px 16px;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
      &:hover { background: #f0fdf4; border-color: #005147; }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
  `]
})
export class NeedBottomSheetComponent {
  private router = inject(Router);

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { need: Need },
    private bottomSheetRef: MatBottomSheetRef<NeedBottomSheetComponent>
  ) {}

  close(): void {
    this.bottomSheetRef.dismiss();
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      medical: 'medical_services',
      shelter: 'home',
      water: 'water_drop',
      food: 'restaurant',
      rescue: 'kayaking'
    };
    return icons[category] || 'emergency';
  }

  openDirections() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${this.data.need.lat},${this.data.need.lng}`;
    window.open(url, '_blank');
  }

  assignVolunteers() {
    this.close();
    this.router.navigate(['/tasks']);
  }
}
