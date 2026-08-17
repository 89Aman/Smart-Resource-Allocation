import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { FirestoreService } from '../../core/firebase/firestore.service';
import { InventoryItem, InventoryCategory } from '../../models';
import { toSignal } from '@angular/core/rxjs-interop';
import { ScanHandoverModalComponent } from '../../modals/scan-handover/scan-handover.component';

@Component({
  selector: 'app-resource-vault',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule, MatSnackBarModule],
  template: `
    <div class="vault-container">
      
      <!-- Minimalist Header -->
      <div class="header-row">
        <div class="header-main">
          <h1 class="title">Resource Vault</h1>
          <p class="subtitle">Disaster supply buffer & QR handover verification • Mumbai Ward 4</p>
        </div>

        <div class="header-actions">
          <button type="button" class="btn-ghost" (click)="openQuickInward()">
            <mat-icon fontSet="material-symbols-rounded">add</mat-icon>
            <span>Inward Stock</span>
          </button>

          <button type="button" class="btn-primary" (click)="openScanHandover()">
            <mat-icon fontSet="material-symbols-rounded">qr_code_scanner</mat-icon>
            <span>Scan Handover</span>
          </button>
        </div>
      </div>

      <!-- Minimal Inline Metrics Strip -->
      <div class="metrics-strip">
        <div class="metric-item">
          <span class="metric-num">{{ totalQuantity() }}</span>
          <span class="metric-desc">Units in Buffer</span>
        </div>
        <div class="divider"></div>
        <div class="metric-item">
          <span class="metric-num" [class.alert]="criticalCount() > 0">{{ criticalCount() }}</span>
          <span class="metric-desc">Critical Stock</span>
        </div>
        <div class="divider"></div>
        <div class="metric-item">
          <span class="metric-num">3</span>
          <span class="metric-desc">Active Hubs</span>
        </div>
        <div class="divider"></div>
        <div class="metric-item">
          <span class="metric-num">{{ recentLogistics().length + 12 }}</span>
          <span class="metric-desc">24h QR Dispatches</span>
        </div>

        <!-- Inline AI Surge Pill -->
        <div class="ai-surge-pill" (click)="reviewAllocation()">
          <mat-icon fontSet="material-symbols-rounded">auto_awesome</mat-icon>
          <span>Monsoon surge predicted (+40% demand in Dharavi Sector 4)</span>
          <mat-icon class="arrow-icon" fontSet="material-symbols-rounded">chevron_right</mat-icon>
        </div>
      </div>

      <!-- Content Area: Left Supply Catalog + Right Logistics Feed -->
      <div class="content-grid">
        
        <!-- Left: Search, Filter Tabs & Supply Cards -->
        <div class="catalog-col">
          
          <!-- Sleek Search & Category Tabs -->
          <div class="filter-bar">
            <div class="search-wrap">
              <mat-icon fontSet="material-symbols-rounded">search</mat-icon>
              <input type="text" placeholder="Search supplies, barcodes, rack locations..." (input)="onSearch($event)">
            </div>

            <div class="tabs-wrap">
              @for (cat of categoryFilters; track cat.id) {
                <button type="button" 
                        class="tab-btn" 
                        [class.active]="selectedCategory() === cat.id"
                        (click)="setCategory(cat.id)">
                  {{ cat.label }}
                </button>
              }
            </div>
          </div>

          <!-- Clean Minimal Supply Cards -->
          <div class="supply-list">
            @for (item of filteredItems(); track item.id) {
              <div class="item-row" [class.critical-row]="item.status === 'critical'">
                <div class="item-icon-box" [ngClass]="item.category">
                  <mat-icon fontSet="material-symbols-rounded">{{ getCategoryIcon(item.category) }}</mat-icon>
                </div>

                <div class="item-primary">
                  <div class="item-name-row">
                    <h3 class="name">{{ item.name }}</h3>
                    <span class="status-dot-tag" [ngClass]="item.status">
                      <span class="dot"></span> {{ formatStatus(item.status) }}
                    </span>
                  </div>
                  <p class="meta">
                    <span>{{ item.location }}</span>
                    <span class="sep">•</span>
                    <span class="code">{{ item.qrCode }}</span>
                    <span class="sep">•</span>
                    <span class="desc">{{ item.description }}</span>
                  </p>
                </div>

                <!-- Hairline Stock Progress -->
                <div class="item-stock-box">
                  <div class="stock-digits">
                    <span class="qty">{{ item.quantity }}</span>
                    <span class="unit">{{ item.unit }}</span>
                  </div>
                  <div class="hairline-bar">
                    <div class="bar-fill" [ngClass]="item.status" [style.width.%]="getCapacityPct(item)"></div>
                  </div>
                  <span class="min-sub">Safety min: {{ item.minimumThreshold }}</span>
                </div>

                <!-- Minimal Actions -->
                <div class="item-actions">
                  <button type="button" class="btn-icon-label" (click)="dispatchItem(item)">
                    <mat-icon fontSet="material-symbols-rounded">qr_code</mat-icon>
                    <span>Handover</span>
                  </button>
                  <button type="button" class="btn-mini-add" (click)="restockItem(item)" title="Add Stock">
                    <mat-icon fontSet="material-symbols-rounded">add</mat-icon>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <p>No supplies match the filter criteria.</p>
              </div>
            }
          </div>

        </div>

        <!-- Right: Compact Logistics Stream -->
        <div class="feed-col">
          <div class="feed-panel">
            <div class="feed-head">
              <h4>Recent Logistics Activity</h4>
              <span class="live-tag">LIVE</span>
            </div>

            <div class="timeline">
              @for (tx of recentLogistics(); track tx.id) {
                <div class="timeline-item">
                  <div class="timeline-dot" [class.outbound]="tx.type === 'outbound'"></div>
                  <div class="timeline-body">
                    <div class="timeline-title-row">
                      <span class="tx-type">{{ tx.type === 'outbound' ? 'Handover' : 'Inward Stock' }}</span>
                      <span class="tx-time">{{ tx.timeAgo }}</span>
                    </div>
                    <p class="tx-detail"><strong>{{ tx.quantity }} units</strong> {{ tx.itemName }}</p>
                    <p class="tx-sub" *ngIf="tx.destination">{{ tx.destination }} • {{ tx.recipient }}</p>
                  </div>
                </div>
              }
            </div>

            <div class="facility-strip">
              <div class="facility-dot"></div>
              <div>
                <span class="f-name">HQ Warehouse Alpha</span>
                <span class="f-sub">Transit Camp Sector 4 • Operational 24/7</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .vault-container {
      max-width: 1360px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Minimal Header */
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .title {
      font-family: var(--font-display);
      font-size: 1.85rem;
      font-weight: 700;
      color: #005147;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .subtitle {
      margin: 3px 0 0;
      font-size: 0.82rem;
      color: #6f7976;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #005147;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-primary:hover { background: var(--color-primary-container); }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--color-card);
      color: var(--color-primary);
      border: 1px solid var(--color-border);
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-ghost:hover { background: var(--color-primary-light); border-color: var(--color-primary); }
    .btn-ghost mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Minimal Metrics Strip */
    .metrics-strip {
      display: flex;
      align-items: center;
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 12px 20px;
      gap: 20px;
      flex-wrap: wrap;
      box-shadow: var(--shadow-card);
    }

    .metric-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .metric-num {
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1;
    }
    .metric-num.alert { color: var(--color-danger); }

    .metric-desc {
      font-size: 0.76rem;
      color: var(--color-text-hint);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .divider {
      width: 1px;
      height: 24px;
      background: var(--color-border);
    }

    .ai-surge-pill {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--color-success-light);
      border: 1px solid var(--color-success);
      color: var(--color-success);
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .ai-surge-pill:hover { background: var(--color-primary-light); }
    .ai-surge-pill mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--color-success); }
    .ai-surge-pill .arrow-icon { font-size: 14px; width: 14px; height: 14px; margin-left: 2px; }

    /* Content Layout */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 20px;
      align-items: flex-start;
      animation: fadeUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* Left Catalog Column */
    .catalog-col {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .search-wrap {
      position: relative;
      flex: 1;
      min-width: 240px;
      display: flex;
      align-items: center;
    }
    .search-wrap mat-icon {
      position: absolute;
      left: 10px;
      color: var(--color-text-hint);
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .search-wrap input {
      width: 100%;
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 7px 12px 7px 34px;
      font-size: 0.84rem;
      color: var(--color-text-primary);
      outline: none;
      transition: border 0.15s;
    }
    .search-wrap input:focus {
      border-color: var(--color-primary);
    }

    .tabs-wrap {
      display: flex;
      gap: 4px;
      background: var(--color-surface-container);
      padding: 3px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      font-size: 0.78rem;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn:hover { color: var(--color-primary); }
    .tab-btn.active {
      background: var(--color-card);
      color: var(--color-primary);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }

    /* Minimal Supply Item List */
    .supply-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .item-row {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.15s;
    }
    .item-row:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-card);
      transform: translateY(-1px);
    }
    .item-row.critical-row {
      border-left: 3px solid var(--color-danger);
    }

    .item-icon-box {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .item-icon-box mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .item-icon-box.medical { background: var(--color-danger-light); color: var(--color-danger); }
    .item-icon-box.water { background: var(--color-info-light); color: var(--color-info); }
    .item-icon-box.shelter { background: var(--color-warning-light); color: var(--color-warning); }
    .item-icon-box.food { background: var(--color-success-light); color: var(--color-success); }
    .item-icon-box.other { background: var(--color-tertiary-fixed); color: var(--color-on-tertiary-fixed-variant); }

    .item-primary {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .name {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .status-dot-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .status-dot-tag .dot { width: 5px; height: 5px; border-radius: 50%; }
    .status-dot-tag.optimal { color: var(--color-success); .dot { background: #22c55e; } }
    .status-dot-tag.low { color: var(--color-warning); .dot { background: #f59e0b; } }
    .status-dot-tag.critical { color: var(--color-danger); .dot { background: #ef4444; } }

    .meta {
      margin: 0;
      font-size: 0.74rem;
      color: var(--color-text-hint);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .sep { color: var(--color-border); }
    .code { font-family: monospace; color: var(--color-text-secondary); font-weight: 600; }
    .desc { color: var(--color-text-hint); }

    /* Hairline Stock Box */
    .item-stock-box {
      width: 140px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex-shrink: 0;
    }

    .stock-digits {
      display: flex;
      align-items: baseline;
      gap: 3px;
    }
    .qty { font-weight: 700; font-size: 0.95rem; color: var(--color-text-primary); line-height: 1; }
    .unit { font-size: 0.72rem; color: var(--color-text-hint); font-weight: 500; }

    .hairline-bar {
      height: 4px;
      background: var(--color-surface-container);
      border-radius: 2px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: var(--color-primary);
      border-radius: 2px;
    }
    .bar-fill.low { background: var(--color-warning); }
    .bar-fill.critical { background: var(--color-danger); }

    .min-sub {
      font-size: 0.68rem;
      color: var(--color-text-hint);
    }

    /* Minimal Action Buttons */
    .item-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .btn-icon-label {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--color-primary-light);
      color: var(--color-primary);
      border: 1px solid var(--color-primary-fixed-dim);
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-icon-label:hover { background: var(--color-primary); color: var(--color-on-primary); border-color: var(--color-primary); }
    .btn-icon-label mat-icon { font-size: 15px; width: 15px; height: 15px; }

    .btn-mini-add {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid var(--color-border);
      background: var(--color-card);
      color: var(--color-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-mini-add:hover { background: var(--color-primary-light); color: var(--color-primary); }
    .btn-mini-add mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .empty-state {
      padding: 30px;
      text-align: center;
      color: var(--color-text-hint);
      font-size: 0.85rem;
    }

    /* Right Feed Column */
    .feed-col {
      display: flex;
      flex-direction: column;
    }

    .feed-panel {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: var(--shadow-card);
    }

    .feed-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .feed-head h4 {
      margin: 0;
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .live-tag {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--color-success);
      background: var(--color-success-light);
      padding: 1px 6px;
      border-radius: 6px;
      border: 1px solid #bbf7d0;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .timeline-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #16a34a;
      margin-top: 5px;
      flex-shrink: 0;
    }
    .timeline-dot.outbound { background: #dc2626; }

    .timeline-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .timeline-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tx-type { font-size: 0.74rem; font-weight: 700; color: #1a201e; }
    .tx-time { font-size: 0.68rem; color: #94a3b8; }

    .tx-detail {
      margin: 0;
      font-size: 0.74rem;
      color: #475569;
    }

    .tx-sub {
      margin: 1px 0 0;
      font-size: 0.68rem;
      color: #889592;
    }

    .facility-strip {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8faf9;
      border: 1px solid #edf2f0;
      border-radius: 8px;
      padding: 8px 10px;
      margin-top: 4px;
    }
    .facility-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 6px #22c55e;
    }
    .f-name { display: block; font-size: 0.74rem; font-weight: 700; color: #1a201e; }
    .f-sub { display: block; font-size: 0.68rem; color: #64748b; }

    @media (max-width: 1024px) {
      .content-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ResourceVaultComponent implements OnInit {
  auth = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');

  categoryFilters = [
    { id: 'all', label: 'All' },
    { id: 'medical', label: 'Medical' },
    { id: 'water', label: 'Water' },
    { id: 'shelter', label: 'Shelter' },
    { id: 'food', label: 'Food' },
    { id: 'other', label: 'Rescue' }
  ];

  private seedItems: InventoryItem[] = [
    {
      id: 'inv-1',
      name: 'Emergency Trauma First Aid Kit',
      category: 'medical',
      description: 'Sterile bandages, tourniquets, burn dressings',
      quantity: 140,
      unit: 'kits',
      location: 'HQ Warehouse (Rack A-1)',
      qrCode: 'MED-TRAUMA-01',
      minimumThreshold: 50,
      lastUpdated: new Date(),
      status: 'optimal'
    },
    {
      id: 'inv-2',
      name: 'Water Purification Chlorine Tablets (10,000L)',
      category: 'water',
      description: 'NaDCC flood water potability tablets',
      quantity: 320,
      unit: 'strips',
      location: 'Transit Point Sector 4',
      qrCode: 'WAT-PURIF-04',
      minimumThreshold: 100,
      lastUpdated: new Date(),
      status: 'optimal'
    },
    {
      id: 'inv-3',
      name: 'Heavy Duty Monsoon Tarpaulin Shelter Kits',
      category: 'shelter',
      description: '200 GSM reinforced waterproof sheets with tie ropes',
      quantity: 35,
      unit: 'kits',
      location: 'HQ Warehouse (Bay B-02)',
      qrCode: 'SHT-TARP-09',
      minimumThreshold: 80,
      lastUpdated: new Date(),
      status: 'critical'
    },
    {
      id: 'inv-4',
      name: 'High-Calorie Ready-to-Eat Ration Packs',
      category: 'food',
      description: 'Fortified ready-to-eat khichdi & pulse bars',
      quantity: 480,
      unit: 'packs',
      location: 'Central Storage (Shelf F-12)',
      qrCode: 'FOD-RATION-11',
      minimumThreshold: 150,
      lastUpdated: new Date(),
      status: 'optimal'
    },
    {
      id: 'inv-5',
      name: 'Inflatable Flood Rescue Life Jackets',
      category: 'other',
      description: 'ISO-certified 150N high-buoyancy vests',
      quantity: 28,
      unit: 'vests',
      location: 'Dharavi Rapid Hub',
      qrCode: 'RSC-VEST-22',
      minimumThreshold: 50,
      lastUpdated: new Date(),
      status: 'low'
    },
    {
      id: 'inv-6',
      name: 'ORS Electrolyte Rehydration Sachets',
      category: 'medical',
      description: 'WHO-standard Oral Rehydration Salts',
      quantity: 650,
      unit: 'sachets',
      location: 'Sector 4 Dispensary',
      qrCode: 'MED-ORS-77',
      minimumThreshold: 200,
      lastUpdated: new Date(),
      status: 'optimal'
    }
  ];

  localItems = signal<InventoryItem[]>(this.seedItems);
  firestoreItems = toSignal(this.firestoreService.getInventoryItems(), { initialValue: [] as InventoryItem[] });

  allItems = computed(() => {
    const fs = this.firestoreItems();
    if (fs && fs.length > 0) {
      const ids = new Set(fs.map(i => i.id));
      return [...fs, ...this.localItems().filter(i => !ids.has(i.id))];
    }
    return this.localItems();
  });

  filteredItems = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const cat = this.selectedCategory();
    const list = this.allItems();

    return list.filter(item => {
      const matchesQuery = !q || 
                           item.name.toLowerCase().includes(q) || 
                           item.description.toLowerCase().includes(q) ||
                           item.location.toLowerCase().includes(q) ||
                           (item.qrCode && item.qrCode.toLowerCase().includes(q));

      const matchesCat = cat === 'all' || item.category === cat;
      return matchesQuery && matchesCat;
    });
  });

  totalQuantity = computed(() => this.allItems().reduce((sum, item) => sum + item.quantity, 0));
  criticalCount = computed(() => this.allItems().filter(item => item.status === 'critical' || item.status === 'low').length);

  recentLogistics = signal<Array<{ id: string; type: 'outbound' | 'inbound'; itemName: string; quantity: number; recipient: string; destination: string; timeAgo: string }>>([
    { id: '1', type: 'outbound', itemName: 'Trauma First Aid Kit', quantity: 15, recipient: 'Vikram Joshi', destination: 'Sector 4 Post', timeAgo: '12m ago' },
    { id: '2', type: 'inbound', itemName: 'Water Purification Tablets', quantity: 200, recipient: 'Red Cross', destination: 'HQ Warehouse', timeAgo: '45m ago' },
    { id: '3', type: 'outbound', itemName: 'Monsoon Tarpaulin Kits', quantity: 20, recipient: 'Priya Sharma', destination: 'Transit Camp 2', timeAgo: '2h ago' }
  ]);

  ngOnInit() {}

  onSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  setCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  getCategoryIcon(category: InventoryCategory): string {
    const map: Record<InventoryCategory, string> = {
      medical: 'medical_services',
      water: 'water_drop',
      shelter: 'roofing',
      food: 'restaurant',
      other: 'emergency'
    };
    return map[category] || 'inventory_2';
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      optimal: 'Optimal',
      low: 'Low',
      critical: 'Critical',
      out_of_stock: 'Out of Stock'
    };
    return map[status] || status;
  }

  getCapacityPct(item: InventoryItem): number {
    const target = item.minimumThreshold * 3 || 100;
    const pct = Math.round((item.quantity / target) * 100);
    return Math.min(pct, 100);
  }

  openScanHandover() {
    const ref = this.dialog.open(ScanHandoverModalComponent, {
      width: '560px',
      maxWidth: '95vw',
      panelClass: 'glass-dialog'
    });

    ref.afterClosed().subscribe((res) => {
      if (res && res.itemName) {
        const newLog = {
          id: `${Date.now()}`,
          type: res.type || 'outbound',
          itemName: res.itemName,
          quantity: res.quantity || 5,
          recipient: res.recipient || 'Field Lead',
          destination: res.destination || 'Ward Dispatch Point',
          timeAgo: 'Just now'
        };
        this.recentLogistics.update(list => [newLog, ...list]);

        this.localItems.update(items => items.map(i => {
          if (i.name === res.itemName) {
            const newQty = res.type === 'outbound' ? Math.max(0, i.quantity - res.quantity) : i.quantity + res.quantity;
            const newStatus = newQty <= i.minimumThreshold * 0.5 ? 'critical' : newQty <= i.minimumThreshold ? 'low' : 'optimal';
            return { ...i, quantity: newQty, status: newStatus };
          }
          return i;
        }));
      }
    });
  }

  openQuickInward() {
    this.openScanHandover();
  }

  dispatchItem(item: InventoryItem) {
    this.openScanHandover();
  }

  restockItem(item: InventoryItem) {
    this.localItems.update(items => items.map(i => {
      if (i.id === item.id) {
        const added = i.minimumThreshold;
        const newQty = i.quantity + added;
        this.snackBar.open(`Restocked +${added} ${i.unit} of ${i.name}!`, 'OK', { duration: 3000 });
        return { ...i, quantity: newQty, status: 'optimal' };
      }
      return i;
    }));
  }

  reviewAllocation() {
    this.snackBar.open('Vertex AI: Allocation model prioritized 200 Shelter Kits to Dharavi Sector 4.', 'OK', { duration: 4000 });
  }
}
