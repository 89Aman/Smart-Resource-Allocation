import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgoRegistryService } from '../../core/ngo/ngo-registry.service';
import { Ngo } from '../../models';
import { AuthService } from '../../core/auth/auth.service';
import { RegisterNgoModalComponent } from '../../modals/register-ngo/register-ngo.component';

@Component({
  selector: 'app-ngo-registry',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
  template: `
    <div class="ngo-registry-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-text">
          <p class="directory-label">HUMANITARIAN DIRECTORY</p>
          <h1 class="page-title">Partner Registry</h1>
        </div>
        <button class="btn-primary" (click)="openNewRegistration()">
          <mat-icon fontSet="material-symbols-rounded">add_business</mat-icon>
          <span>New Registration</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-indicator"></div>
          <p class="stat-label">Total Verified NGOs</p>
          <div class="stat-value">
            <h2>{{ totalVerified() }}</h2>
            <span class="stat-trend positive">
              <mat-icon fontSet="material-symbols-rounded">trending_up</mat-icon>
              +12 this month
            </span>
          </div>
        </div>

        <div class="stat-card active">
          <div class="stat-indicator"></div>
          <p class="stat-label">Active (Last 24h)</p>
          <div class="stat-value">
            <h2>{{ activeCount() }}</h2>
            <span class="stat-trend">
              <mat-icon fontSet="material-symbols-rounded">bolt</mat-icon>
              High deployment
            </span>
          </div>
        </div>

        <div class="stat-card pending">
          <div class="stat-indicator"></div>
          <p class="stat-label">Pending Verifications</p>
          <div class="stat-value">
            <h2>{{ pendingCount() }}</h2>
            <span class="stat-trend warning">
              Requires review
            </span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <mat-icon fontSet="material-symbols-rounded">search</mat-icon>
          <input
            type="text"
            placeholder="Search NGO name, contact person, or registration number..."
            (input)="onSearch($event)"
          />
        </div>

        <div class="filter-select-box">
          <mat-icon fontSet="material-symbols-rounded">location_on</mat-icon>
          <select (change)="onWardChange($event)">
            <option value="">All Regions / Wards</option>
            <option value="Dharavi">Dharavi (Ward G/N)</option>
            <option value="Kurla">Kurla (Ward L)</option>
            <option value="Govandi">Govandi (Ward M/E)</option>
            <option value="Bhandup">Bhandup (Ward S)</option>
          </select>
        </div>

        <div class="filter-select-box">
          <mat-icon fontSet="material-symbols-rounded">category</mat-icon>
          <select (change)="onExpertiseChange($event)">
            <option value="">All Expertise Sectors</option>
            <option value="Medical">Medical Relief</option>
            <option value="Food">Food Distribution</option>
            <option value="Shelter">Emergency Shelter</option>
            <option value="Water">Clean Water Aid</option>
            <option value="Rescue">Flood Rescue</option>
          </select>
        </div>
      </div>

      <!-- NGO Grid -->
      <div class="ngo-grid">
        @for (ngo of filteredNGOs(); track ngo.id) {
          <div class="ngo-card" [class.active]="ngo.status === 'active'" [class.pending]="ngo.status === 'pending_review'">
            <div class="card-accent" [class.active]="ngo.status === 'active'" [class.pending]="ngo.status === 'pending_review'"></div>

            <div class="card-head">
              <div class="title-block">
                <div class="title-row">
                  <h3 class="ngo-title">{{ ngo.name }}</h3>
                  @if (ngo.status === 'active') {
                    <span class="verified-badge">
                      <mat-icon fontSet="material-symbols-rounded">verified</mat-icon>
                      Verified
                    </span>
                  }
                </div>
                <p class="reg-code mono">{{ ngo.registrationNumber || 'MH/REG-01' }}</p>
                <p class="ngo-ward">
                  <mat-icon fontSet="material-symbols-rounded">location_on</mat-icon>
                  {{ (ngo.operatingRegions || ['Mumbai Central']).join(', ') }}
                </p>
              </div>
              <span class="status-pill" [class.active]="ngo.status === 'active'" [class.pending]="ngo.status === 'pending_review'">
                <span class="pill-dot"></span>
                {{ ngo.status.replace('_', ' ') }}
              </span>
            </div>

            <p class="ngo-desc" *ngIf="ngo.description">{{ ngo.description }}</p>

            <div class="expertise-tags">
              @for (tag of ngo.focusAreas; track tag) {
                <span class="expertise-tag mono">{{ tag.replace('_', ' ') }}</span>
              }
            </div>

            <div class="meta-grid">
              <div class="meta-pair">
                <div class="meta-icon">
                  <mat-icon fontSet="material-symbols-rounded">person</mat-icon>
                </div>
                <div class="meta-text">
                  <p class="meta-label">Primary Contact</p>
                  <p class="meta-value">{{ ngo.primaryContact.name || 'Director' }}</p>
                </div>
              </div>
              <div class="meta-pair">
                <div class="meta-icon">
                  <mat-icon fontSet="material-symbols-rounded">military_tech</mat-icon>
                </div>
                <div class="meta-text">
                  <p class="meta-label">Tier</p>
                  <p class="meta-value">{{ ngo.tier | titlecase }}</p>
                </div>
              </div>
              <div class="meta-pair">
                <div class="meta-icon">
                  <mat-icon fontSet="material-symbols-rounded">groups</mat-icon>
                </div>
                <div class="meta-text">
                  <p class="meta-label">Volunteers</p>
                  <p class="meta-value">{{ ngo.volunteerCount || 0 }} on call</p>
                </div>
              </div>
              <div class="meta-pair">
                <div class="meta-icon">
                  <mat-icon fontSet="material-symbols-rounded">flag</mat-icon>
                </div>
                <div class="meta-text">
                  <p class="meta-label">Missions</p>
                  <p class="meta-value">{{ ngo.totalMissionsCompleted || 0 }} completed</p>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <mat-icon fontSet="material-symbols-rounded">search_off</mat-icon>
            <p>No NGOs found matching your criteria</p>
            <button class="btn-primary" style="margin: 16px auto 0;" (click)="openNewRegistration()">Register First Partner</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .ngo-registry-container {
      padding: 0 0 40px;
      max-width: 1400px;
      margin: 0 auto;
      animation: fadeUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .mono {
      font-family: var(--font-mono), ui-monospace, monospace;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 28px;
    }

    .directory-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--color-primary);
      margin: 0 0 4px;
    }

    .page-title {
      font-family: var(--font-display), serif;
      font-size: 34px;
      font-weight: 700;
      color: var(--color-primary);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
      color: var(--color-on-primary);
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(0, 81, 71, 0.2);
      transition: all 0.2s ease;
    }
    .btn-primary:hover {
      box-shadow: 0 6px 20px rgba(0, 81, 71, 0.3);
      transform: translateY(-1px);
    }
    .btn-primary mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 28px;
    }

    .stat-card {
      background: var(--color-card);
      padding: 20px 24px;
      border-radius: 14px;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-card);
      position: relative;
      overflow: hidden;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .stat-card:hover {
      box-shadow: var(--shadow-elevated);
      transform: translateY(-2px);
    }

    .stat-indicator {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 5px;
    }

    .stat-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-text-secondary);
      margin: 0 0 8px;
    }

    .stat-value {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }
    .stat-value h2 {
      font-family: var(--font-display), serif;
      font-size: 40px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }

    .stat-trend {
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .stat-trend mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .stat-trend.positive { color: var(--color-primary); background: var(--color-primary-light); }
    .stat-trend.warning { color: var(--color-warning); background: var(--color-warning-light); }

    .stat-card.primary .stat-indicator { background: var(--color-primary); }
    .stat-card.active .stat-indicator { background: #16a34a; }
    .stat-card.pending .stat-indicator { background: var(--color-warning); }

    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      padding: 14px 18px;
      background: var(--color-surface-container-low);
      border-radius: 14px;
      border: 1px solid var(--color-border);
      margin-bottom: 24px;
    }

    .search-box {
      flex: 1;
      min-width: 280px;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-box mat-icon {
      position: absolute;
      left: 12px;
      color: var(--color-text-secondary);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .search-box input {
      width: 100%;
      background: var(--color-card);
      border: 1.5px solid var(--color-border);
      border-radius: 10px;
      padding: 9px 16px 9px 40px;
      font-size: 14px;
      color: var(--color-text-primary);
      outline: none;
      transition: all 0.2s;
    }
    .search-box input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(0, 81, 71, 0.1);
    }

    .filter-select-box {
      min-width: 200px;
      position: relative;
      display: flex;
      align-items: center;
      background: var(--color-card);
      border: 1.5px solid var(--color-border);
      border-radius: 10px;
      padding: 0 12px;
    }
    .filter-select-box mat-icon {
      color: var(--color-primary);
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 6px;
    }
    .filter-select-box select {
      border: none;
      background: transparent;
      outline: none;
      font-size: 13px;
      color: var(--color-text-primary);
      cursor: pointer;
      padding: 9px 0;
      width: 100%;
      font-family: inherit;
    }

    .ngo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 22px;
    }

    .ngo-card {
      background: var(--color-card);
      border-radius: 12px;
      padding: 20px 20px 18px;
      box-shadow: 0 1px 2px rgba(0, 81, 71, 0.05), 0 10px 28px -10px rgba(0, 81, 71, 0.16);
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
    }
    .ngo-card:hover {
      box-shadow: 0 2px 4px rgba(0, 81, 71, 0.06), 0 18px 40px -12px rgba(0, 81, 71, 0.24);
      border-color: var(--color-primary);
      transform: translateY(-2px);
    }

    .card-accent {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      height: 4px;
      background: var(--color-border);
    }
    .card-accent.active {
      background: linear-gradient(90deg, var(--color-primary), var(--color-primary-mid));
    }
    .card-accent.pending {
      background: linear-gradient(90deg, #d97706, #f59e0b);
    }

    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .ngo-title {
      font-family: var(--font-ui), sans-serif;
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.01em;
      color: var(--color-text-primary);
      margin: 0;
      line-height: 1.25;
    }

    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 10.5px;
      font-weight: 700;
      color: #16a34a;
      background: var(--color-success-light);
      border: 1px solid rgba(22, 163, 74, 0.25);
      border-radius: 20px;
      padding: 2px 8px 2px 5px;
      white-space: nowrap;
    }
    .verified-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .reg-code {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.05em;
      color: var(--color-text-hint);
      margin: 6px 0 0;
      text-transform: uppercase;
    }

    .ngo-ward {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--color-text-secondary);
      margin: 3px 0 0;
    }
    .ngo-ward mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 4px 10px;
      border-radius: 20px;
      background: transparent;
      border: 1.5px solid var(--color-border);
      color: var(--color-text-secondary);
    }
    .status-pill.active {
      color: #16a34a;
      border-color: rgba(22, 163, 74, 0.45);
    }
    .status-pill.pending {
      color: #d97706;
      border-color: rgba(217, 119, 6, 0.45);
    }
    .pill-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .ngo-desc {
      font-size: 13px;
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0 0 12px;
    }

    .expertise-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 14px;
    }

    .expertise-tag {
      font-family: var(--font-mono), monospace;
      font-size: 10.5px;
      font-weight: 500;
      letter-spacing: 0.02em;
      padding: 3px 9px;
      border-radius: 6px;
      background: var(--color-primary-light);
      color: var(--color-primary);
      border: 1px solid rgba(0, 81, 71, 0.2);
      text-transform: uppercase;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 16px;
      padding-top: 14px;
      border-top: 1px solid var(--color-border);
      margin-top: auto;
    }

    .meta-pair {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .meta-icon {
      width: 34px;
      height: 34px;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      border-radius: 8px;
      background: var(--color-surface-container-low);
      border: 1px solid var(--color-border);
    }
    .meta-icon mat-icon {
      font-size: 17px;
      width: 17px;
      height: 17px;
      color: var(--color-primary);
    }

    .meta-text {
      min-width: 0;
    }
    .meta-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-text-hint);
      margin: 0 0 2px;
    }
    .meta-value {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 48px 16px;
      color: var(--color-text-secondary);
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--color-text-secondary);
      margin-bottom: 12px;
    }
  `]
})
export class NgoRegistryComponent {
  private ngoRegistry = inject(NgoRegistryService);
  private dialog = inject(MatDialog);
  auth = inject(AuthService);

  searchQuery = signal<string>('');
  selectedWard = signal<string>('');
  selectedExpertise = signal<string>('');

  // Initial seed NGOs so directory is immediately rich and functional
  private seedNgos: Ngo[] = [
    {
      id: 'ngo-1',
      name: 'Doctors for You Mumbai',
      registrationNumber: 'MH/BOM/2018/00421',
      founderId: 'dr-ravi',
      status: 'active',
      operatingRegions: ['Dharavi (Ward G/N)', 'Kurla (Ward L)'],
      primaryContact: {
        name: 'Dr. Ravi Deshmukh',
        email: 'ravi@doctorsforyou.org',
        phone: '+91 98201 12345',
        designation: 'Medical Director'
      },
      address: { line1: 'Sector 4', city: 'Mumbai', state: 'Maharashtra', pincode: '400017' },
      description: 'Disaster medical response teams with mobile clinical units and emergency medicine supply.',
      focusAreas: ['medical', 'disaster_relief'],
      sdgGoals: [3, 17],
      foundedYear: 2018,
      tier: 'national',
      memberIds: ['dr-ravi'],
      documents: [],
      volunteerCount: 48,
      activeMissionCount: 6,
      totalMissionsCompleted: 142,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'ngo-2',
      name: 'Sahaay Ground Response Force',
      registrationNumber: 'MH/MUM/2024/0912',
      founderId: 'priya-sharma',
      status: 'active',
      operatingRegions: ['Dharavi (Ward G/N)', 'Govandi (Ward M/E)'],
      primaryContact: {
        name: 'Priya Sharma',
        email: 'founder@sahaay.org',
        phone: '+91 98765 43210',
        designation: 'Managing Trustee'
      },
      address: { line1: 'Transit Camp, Dharavi', city: 'Mumbai', state: 'Maharashtra', pincode: '400017' },
      description: 'Rapid volunteer mobilization, flood relief coordination, and AI-driven emergency aid allocation.',
      focusAreas: ['food', 'water', 'shelter'],
      sdgGoals: [1, 2, 6, 17],
      foundedYear: 2021,
      tier: 'grassroots',
      memberIds: ['priya-sharma'],
      documents: [],
      volunteerCount: 85,
      activeMissionCount: 12,
      totalMissionsCompleted: 210,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'ngo-3',
      name: 'Goonj Relief Network Mumbai',
      registrationNumber: 'DL/2004/00231',
      founderId: 'anshu-gupta',
      status: 'active',
      operatingRegions: ['Kurla (Ward L)', 'Bhandup (Ward S)'],
      primaryContact: {
        name: 'Meera Iyer',
        email: 'meera.mumbai@goonj.org',
        phone: '+91 98190 54321',
        designation: 'Regional Lead'
      },
      address: { line1: 'LBS Marg, Kurla West', city: 'Mumbai', state: 'Maharashtra', pincode: '400070' },
      description: 'Large-scale dry ration kits, clothing, and household rehabilitation relief during monsoons.',
      focusAreas: ['food', 'shelter'],
      sdgGoals: [1, 2, 12],
      foundedYear: 2004,
      tier: 'national',
      memberIds: ['anshu-gupta'],
      documents: [],
      volunteerCount: 120,
      activeMissionCount: 8,
      totalMissionsCompleted: 350,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'ngo-4',
      name: 'Mumbai Slum Sanitation Alliance',
      registrationNumber: 'MH/2020/007812',
      founderId: 'arun-patil',
      status: 'active',
      operatingRegions: ['Dharavi (Ward G/N)', 'Govandi (Ward M/E)'],
      primaryContact: {
        name: 'Arun Patil',
        email: 'contact@mumbaisanitation.org',
        phone: '+91 98333 88122',
        designation: 'General Secretary'
      },
      address: { line1: 'Shatabdi Nagar, Govandi', city: 'Mumbai', state: 'Maharashtra', pincode: '400043' },
      description: 'Emergency clean water filtration supply tanks and high-density ward sanitization.',
      focusAreas: ['water', 'medical'],
      sdgGoals: [6, 3],
      foundedYear: 2020,
      tier: 'state',
      memberIds: ['arun-patil'],
      documents: [],
      volunteerCount: 32,
      activeMissionCount: 4,
      totalMissionsCompleted: 78,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }
  ];

  localNgos = signal<Ngo[]>(this.seedNgos);
  firestoreNgos = toSignal(this.ngoRegistry.getActiveNgos(), { initialValue: [] as Ngo[] });

  allNgos = computed(() => {
    const fs = this.firestoreNgos();
    if (fs && fs.length > 0) {
      // Merge Firestore NGOs with local seed list (avoiding duplicate IDs)
      const ids = new Set(fs.map(n => n.id));
      return [...fs, ...this.localNgos().filter(n => !ids.has(n.id))];
    }
    return this.localNgos();
  });

  filteredNGOs = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const ward = this.selectedWard();
    const expertise = this.selectedExpertise();
    const list = this.allNgos();

    return list.filter((ngo: Ngo) => {
      const matchesSearch = !query || 
                            ngo.name.toLowerCase().includes(query) ||
                            (ngo.primaryContact?.name && ngo.primaryContact.name.toLowerCase().includes(query)) ||
                            (ngo.registrationNumber && ngo.registrationNumber.toLowerCase().includes(query));

      const matchesWard = !ward || 
                          ngo.operatingRegions?.some((r: string) => r.toLowerCase().includes(ward.toLowerCase()));

      const matchesExpertise = !expertise || 
                               ngo.focusAreas?.some((e: string) => e.toLowerCase().includes(expertise.toLowerCase()));

      return matchesSearch && matchesWard && matchesExpertise;
    });
  });

  totalVerified = computed(() => this.allNgos().filter(n => n.status === 'active').length);
  activeCount = computed(() => this.allNgos().filter(n => n.status === 'active').length);
  pendingCount = computed(() => this.allNgos().filter(n => n.status === 'pending_review').length);

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onWardChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedWard.set(select.value);
  }

  onExpertiseChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedExpertise.set(select.value);
  }

  openNewRegistration() {
    const ref = this.dialog.open(RegisterNgoModalComponent, {
      width: '620px',
      maxWidth: '95vw',
      panelClass: 'glass-dialog'
    });

    ref.afterClosed().subscribe((res) => {
      if (res && typeof res === 'object' && res.name) {
        const now = new Date();
        // Add registered NGO to live list
        const newNgo: Ngo = {
          id: `ngo-${Date.now()}`,
          name: res.name,
          registrationNumber: res.registrationNumber || `MH/REG-${Math.floor(Math.random()*9000)+1000}`,
          founderId: this.auth.currentUser?.uid || 'user-founder',
          status: 'active',
          operatingRegions: [res.region || 'Dharavi (Ward G/N)'],
          primaryContact: {
            name: res.contactName || 'Coordinator',
            email: res.contactEmail || 'contact@ngo.org',
            phone: res.phone || '+91 98000 00000',
            designation: 'Director'
          },
          address: { line1: 'Sector 4', city: 'Mumbai', state: 'Maharashtra', pincode: '400017' },
          description: res.description || 'Verified humanitarian relief partner.',
          focusAreas: (res.focusAreas as any[]) || ['medical', 'food'],
          sdgGoals: [1, 3, 17],
          foundedYear: now.getFullYear(),
          tier: res.tier || 'grassroots',
          memberIds: [this.auth.currentUser?.uid || 'founder'],
          documents: [],
          volunteerCount: 10,
          activeMissionCount: 1,
          totalMissionsCompleted: 5,
          createdAt: now,
          updatedAt: now
        };
        this.localNgos.update(list => [newNgo, ...list]);
      }
    });
  }
}
