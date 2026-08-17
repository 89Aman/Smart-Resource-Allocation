import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FirestoreService } from '../../core/firebase/firestore.service';

@Component({
  selector: 'app-add-volunteer',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="modal-wrapper">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="badge-icon">
            <mat-icon fontSet="material-symbols-rounded">person_add</mat-icon>
          </div>
          <div>
            <h2 class="modal-title">Register New Volunteer</h2>
            <p class="modal-subtitle">Add qualified personnel to the regional disaster response roster</p>
          </div>
        </div>
        <button type="button" class="close-btn" (click)="onCancel()">
          <mat-icon fontSet="material-symbols-rounded">close</mat-icon>
        </button>
      </div>

      <!-- Modal Body -->
      <mat-dialog-content class="modal-body">
        <form [formGroup]="volunteerForm" class="form-container">
          
          <!-- Full Name -->
          <div class="sahaay-input-group">
            <label class="sahaay-label">Full Name *</label>
            <div class="sahaay-control-box">
              <mat-icon fontSet="material-symbols-rounded">badge</mat-icon>
              <input type="text" formControlName="name" placeholder="e.g. Aisha Khan">
            </div>
          </div>

          <!-- Phone Number -->
          <div class="sahaay-input-group">
            <label class="sahaay-label">Phone Number *</label>
            <div class="sahaay-control-box">
              <mat-icon fontSet="material-symbols-rounded">call</mat-icon>
              <input type="tel" formControlName="phone" placeholder="+91 98765 43210">
            </div>
          </div>

          <!-- Skills Selection -->
          <div class="sahaay-input-group">
            <label class="sahaay-label">Specialized Skills *</label>
            <div class="skills-grid">
              @for (skill of availableSkills; track skill) {
                <button type="button" class="skill-chip" 
                        [class.selected]="isSkillSelected(skill)"
                        (click)="toggleSkill(skill)">
                  <mat-icon fontSet="material-symbols-rounded">{{ isSkillSelected(skill) ? 'check' : 'add' }}</mat-icon>
                  <span>{{ skill }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Location Coordinates -->
          <div class="sahaay-input-group">
            <label class="sahaay-label">Deployment Coordinates *</label>
            <div class="coords-row">
              <div class="sahaay-control-box flex-1">
                <mat-icon fontSet="material-symbols-rounded">explore</mat-icon>
                <input type="number" formControlName="lat" placeholder="Latitude" step="0.0001">
              </div>
              <div class="sahaay-control-box flex-1">
                <mat-icon fontSet="material-symbols-rounded">explore</mat-icon>
                <input type="number" formControlName="lng" placeholder="Longitude" step="0.0001">
              </div>
              <button type="button" class="gps-btn" (click)="getCurrentLocation()" matTooltip="Fetch GPS Location">
                <mat-icon fontSet="material-symbols-rounded">my_location</mat-icon>
              </button>
            </div>
          </div>

        </form>
      </mat-dialog-content>

      <!-- Modal Footer -->
      <mat-dialog-actions class="modal-footer">
        <button type="button" class="cancel-btn" (click)="onCancel()">Cancel</button>
        <button type="button" class="submit-btn" [disabled]="volunteerForm.invalid" (click)="onSubmit()">
          <mat-icon fontSet="material-symbols-rounded">how_to_reg</mat-icon>
          <span>Register Volunteer</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .modal-wrapper {
      display: flex;
      flex-direction: column;
      background: var(--color-card);
      min-width: 460px;
      max-width: 540px;
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
      background: var(--color-success-light);
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
      max-height: 65vh;
    }

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }

    .skill-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: var(--color-surface-container-low);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .skill-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .skill-chip.selected {
      background: var(--color-primary);
      color: var(--color-on-primary);
      border-color: var(--color-primary);
    }

    .coords-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .flex-1 { flex: 1; }

    .gps-btn {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: var(--color-primary-light);
      color: var(--color-primary);
      border: 1px solid #85d5c5;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .gps-btn:hover {
      background: var(--color-primary);
      color: var(--color-on-primary);
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
      padding: 9px 20px;
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
export class AddVolunteerComponent {
  private fb = inject(FormBuilder);
  private firestore = inject(FirestoreService);
  private dialogRef = inject(MatDialogRef<AddVolunteerComponent>);

  availableSkills = [
    'Medical',
    'Logistics',
    'First Aid',
    'Translation',
    'Teaching',
    'Construction',
    'Disaster Relief',
    'Rescue Ops'
  ];

  volunteerForm = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    skills: [[] as string[], Validators.required],
    lat: [19.0444, Validators.required],
    lng: [72.8501, Validators.required]
  });

  isSkillSelected(skill: string): boolean {
    const current = (this.volunteerForm.get('skills')?.value as string[]) || [];
    return current.includes(skill);
  }

  toggleSkill(skill: string) {
    const current = (this.volunteerForm.get('skills')?.value as string[]) || [];
    const idx = current.indexOf(skill);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(skill);
    }
    this.volunteerForm.get('skills')?.setValue([...current]);
    this.volunteerForm.get('skills')?.markAsDirty();
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.volunteerForm.patchValue({
            lat: Number(position.coords.latitude.toFixed(4)),
            lng: Number(position.coords.longitude.toFixed(4))
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 5000 }
      );
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  async onSubmit() {
    if (this.volunteerForm.valid) {
      const data = this.volunteerForm.value;
      await this.firestore.addVolunteer(data as any);
      await this.firestore.logActivity({
        type: 'volunteer_joined',
        text: `<b>${data.name}</b> joined the volunteer force.`,
        dotClass: 'bg-primary',
        userId: 'admin'
      });
      this.dialogRef.close(true);
    }
  }
}
