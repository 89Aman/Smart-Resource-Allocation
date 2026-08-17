import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Need } from '../../../models';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-need-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, RelativeTimePipe, MatButtonModule],
  template: `
    <div class="card" [ngClass]="need().urgency" (click)="cardClick.emit(need())">
      <div class="card-content-wrap">
        <div class="card-header">
          <div class="header-left">
            <div class="circle-icon" [ngClass]="need().category">
              <mat-icon>{{ getIconForCategory(need().category) }}</mat-icon>
            </div>
            <div class="title-wrap">
              <h3 class="card-title">{{ need().locationName }} &mdash; {{ need().title }}</h3>
              <span class="urgency-badge" [ngClass]="need().urgency">{{ need().urgency }}</span>
            </div>
          </div>
        </div>
        
        <p class="description" *ngIf="need().summary">{{ need().summary }}</p>
        <p class="description" *ngIf="!need().summary">{{ need().description | slice:0:100 }}...</p>
        
        <div class="card-meta">
          <span>{{ need().reportedAt | relativeTime }}</span>
          <span class="dot">&middot;</span>
          <span>Reported by {{ need().reportedBy }}</span>
        </div>
        
        <div class="card-actions-row">
          <p class="footer-text">
             <ng-container *ngIf="need().status === 'open'; else statusBlock">
               <span class="highlight-text">{{ assignedVolunteersCount() }} assigned</span> &middot; {{ distanceText() }}
             </ng-container>
             <ng-template #statusBlock>
                Status: {{ need().status }}
             </ng-template>
          </p>
          <button mat-button class="action-btn" [ngClass]="getButtonClass(need())">
             {{ getButtonText(need()) }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      background: var(--color-card);
      border-radius: var(--radius-card);
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border: 1px solid var(--color-border);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      margin-bottom: 12px;
      overflow: hidden;
      border-left-width: 4px;
    }
    .card.critical { border-left-color: var(--color-danger); }
    .card.high { border-left-color: var(--color-warning); }
    .card.medium { border-left-color: var(--color-info); }
    .card.low { border-left-color: var(--color-success); }
    
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .card-content-wrap {
      padding: 14px 16px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .header-left {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    
    .circle-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .circle-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    /* Category tint colors */
    .circle-icon.medical { background: var(--color-danger-light); color: var(--color-danger); }
    .circle-icon.food { background: var(--color-warning-light); color: var(--color-warning); }
    .circle-icon.education { background: var(--color-info-light); color: var(--color-info); }
    .circle-icon.shelter { background: var(--color-success-light); color: var(--color-success); }
    .circle-icon.water { background: var(--color-info-light); color: var(--color-info); }
    .circle-icon.other { background: var(--color-surface-container); color: var(--color-text-secondary); }
    
    .title-wrap {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .card-title {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      font-family: var(--font-ui);
      color: var(--color-text-primary);
    }
    
    .urgency-badge {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: var(--radius-badge);
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .urgency-badge.critical { background: var(--color-danger); color: white; }
    .urgency-badge.high { background: var(--color-warning); color: white; }
    .urgency-badge.medium { background: var(--color-info); color: white; }
    .urgency-badge.low { background: var(--color-success); color: white; }
    
    .description {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin: 8px 0;
      line-height: 1.4;
    }
    
    .card-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--color-text-hint);
      margin-bottom: 12px;
    }
    .dot {
      font-weight: bold;
    }
    
    .card-actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
    }
    .footer-text {
      margin: 0;
      font-size: 11px;
      color: var(--color-primary);
    }
    .highlight-text {
      font-weight: 600;
    }
    
    .action-btn {
      border-radius: var(--radius-button);
      font-size: 13px;
      padding: 0 16px;
      height: 32px;
      font-weight: 600;
    }
    .action-btn.btn-filled {
      background-color: var(--color-primary);
      color: white;
    }
    .action-btn.btn-outline {
      border: 1px solid var(--color-primary);
      color: var(--color-primary);
    }
    .action-btn.btn-gray {
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
    }
  `]
})
export class NeedCardComponent {
  need = input.required<Need>();
  cardClick = output<Need>();
  
  assignedVolunteersCount(): number {
    return this.need().assignedVolunteers?.length || 0;
  }
  
  distanceText(): string {
    const need = this.need();
    if (!need.lat || !need.lng) return 'Unknown distance';
    
    // Using Mumbai center as a reference point for the field worker
    const refLat = 19.0760;
    const refLng = 72.8777;
    
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(need.lat - refLat);
    const dLng = this.deg2rad(need.lng - refLng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(refLat)) * Math.cos(this.deg2rad(need.lat)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distanceKm = R * c;
    
    return distanceKm.toFixed(1) + ' km';
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  getIconForCategory(category: string): string {
    switch(category) {
      case 'medical': return 'medical_services';
      case 'food': return 'restaurant';
      case 'education': return 'menu_book';
      case 'shelter': return 'home';
      case 'water': return 'water_drop';
      default: return 'help_outline';
    }
  }

  getButtonText(need: Need): string {
    if (need.urgency === 'critical') return 'Assign Now';
    if (need.urgency === 'high') return 'Assign';
    return 'View';
  }

  getButtonClass(need: Need): string {
    if (need.urgency === 'critical') return 'btn-filled';
    if (need.urgency === 'high') return 'btn-outline';
    return 'btn-gray';
  }
}
