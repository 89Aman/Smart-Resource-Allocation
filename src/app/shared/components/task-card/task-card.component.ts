import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Task } from '../../../models';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, RelativeTimePipe],
  template: `
    <div class="tc" 
         [class.tc-critical]="task().priority === 'critical'"
         [class.tc-high]="task().priority === 'high'"
         [class.tc-done]="task().status === 'completed'"
         (click)="cardClick.emit(task())">

      <h4 class="tc-title">{{ task().title }}</h4>

      <div class="tc-loc">
        <mat-icon fontSet="material-symbols-rounded">location_on</mat-icon>
        <span>{{ task().locationName }}</span>
      </div>

      <!-- Only show progress for active tasks — keep it minimal -->
      <div class="tc-bar" *ngIf="task().status === 'active'">
        <div class="tc-bar-fill" [style.width.%]="task().progress || 50"></div>
      </div>

      <div class="tc-foot">
        <span class="tc-cat">{{ task().category }}</span>
        <span class="tc-time">{{ (task().completedAt || task().dueAt) | relativeTime }}</span>
      </div>
    </div>
  `,
  styles: [`
    .tc {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 10px 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: var(--shadow-card);

      &:hover {
        border-color: var(--color-primary);
        box-shadow: var(--shadow-elevated);
        transform: translateY(-1px);
      }

      &.tc-critical { border-left: 3px solid var(--color-danger); }
      &.tc-high { border-left: 3px solid var(--color-warning); }
      &.tc-done { opacity: 0.75; }
    }

    .tc-title {
      margin: 0;
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 1.3;
    }

    .tc-loc {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 0.7rem;
      color: var(--color-text-secondary);
      mat-icon { font-size: 12px; width: 12px; height: 12px; color: var(--color-text-hint); }
      span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .tc-bar {
      height: 3px;
      background: var(--color-surface-container);
      border-radius: 2px;
      overflow: hidden;
    }
    .tc-bar-fill {
      height: 100%;
      background: var(--color-primary);
      border-radius: 2px;
    }

    .tc-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.68rem;
      color: var(--color-text-hint);
    }
    .tc-cat {
      text-transform: capitalize;
      font-weight: 600;
      color: var(--color-text-secondary);
    }
  `]
})
export class TaskCardComponent {
  task = input.required<Task>();
  cardClick = output<Task>();
}
