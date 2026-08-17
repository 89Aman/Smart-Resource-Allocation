import { Component, inject, signal, effect, ElementRef, ViewChild, AfterViewInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../core/firebase/firestore.service';
import { MapsService } from '../../core/maps/maps.service';
import { GeolocationService } from '../../core/maps/geolocation.service';
import { Need } from '../../models';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NeedBottomSheetComponent } from '../../shared/components/need-bottom-sheet/need-bottom-sheet.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { ReportNeedComponent } from '../../modals/report-need/report-need.component';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-needs-map',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatBottomSheetModule, 
    MatDialogModule, 
    MatSnackBarModule, 
    RelativeTimePipe
  ],
  template: `
    <div class="crisis-map-wrapper">
      
      <!-- Top Control Bar (Search, Ward Filters, Layer Toggles) -->
      <div class="map-top-bar">
        <div class="map-search-box">
          <mat-icon fontSet="material-symbols-rounded">search</mat-icon>
          <input 
            type="text" 
            placeholder="Search Dharavi coordinates, wards, supplies..." 
            (input)="onSearch($event)" />
          <button type="button" class="btn-locate" (click)="centerOnUser()" title="My Location">
            <mat-icon fontSet="material-symbols-rounded">my_location</mat-icon>
          </button>
        </div>

        <div class="filter-pill-group">
          <button type="button" class="f-pill" [class.active]="filter() === 'all'" (click)="setFilter('all')">
            All Needs ({{ allNeedsList().length }})
          </button>
          <button type="button" class="f-pill critical" [class.active]="filter() === 'critical'" (click)="setFilter('critical')">
            <mat-icon fontSet="material-symbols-rounded">local_fire_department</mat-icon>
            <span>Critical</span>
          </button>
          <button type="button" class="f-pill" [class.active]="filter() === 'medical'" (click)="setFilter('medical')">
            🩺 Medical
          </button>
          <button type="button" class="f-pill" [class.active]="filter() === 'shelter'" (click)="setFilter('shelter')">
            ⛺ Shelter
          </button>
          <button type="button" class="f-pill" [class.active]="filter() === 'food'" (click)="setFilter('food')">
            🍲 Food
          </button>
          <button type="button" class="f-pill" [class.active]="filter() === 'water'" (click)="setFilter('water')">
            💧 Water
          </button>
          <button type="button" class="f-pill heatmap-pill" [class.active]="showHeatmap()" (click)="toggleHeatmap()">
            <mat-icon fontSet="material-symbols-rounded">radar</mat-icon>
            <span>Surge Heatmap</span>
          </button>
        </div>
      </div>

      <!-- Map Canvas Area -->
      <div class="map-canvas-container">
        <div #mapContainer class="map-surface"></div>

        <!-- Right Side: Live Intelligence Stream Panel -->
        <div class="live-intel-panel">
          <div class="intel-header">
            <div class="intel-badge">
              <span class="pulse-dot"></span>
              <span>✦ Vertex AI Dispatch</span>
            </div>
            <h3 class="intel-title">Active Crisis Reports</h3>
            <p class="intel-sub">{{ filteredNeeds().length }} emergency incidents in Mumbai Ward 4</p>
          </div>

          <div class="intel-cards-list">
            @for (need of filteredNeeds(); track need.id) {
              <div class="intel-card" [ngClass]="need.urgency" (click)="focusOnNeed(need)">
                <div class="intel-card-top">
                  <span class="urgency-pill" [ngClass]="need.urgency">
                    {{ need.urgency | uppercase }}
                  </span>
                  <span class="intel-time">{{ need.reportedAt | relativeTime }}</span>
                </div>

                <h4 class="need-title">{{ need.title }}</h4>
                <p class="need-desc">{{ need.description }}</p>

                <div class="intel-card-footer">
                  <div class="loc-tag">
                    <mat-icon fontSet="material-symbols-rounded">location_on</mat-icon>
                    <span>{{ need.locationName }}</span>
                  </div>
                  <button type="button" class="btn-dispatch-mini" (click)="$event.stopPropagation(); focusOnNeed(need)">
                    <mat-icon fontSet="material-symbols-rounded">near_me</mat-icon>
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="empty-intel">
                <mat-icon fontSet="material-symbols-rounded">check_circle</mat-icon>
                <h4>No Incidents in Filter</h4>
                <p>All emergency needs in this category are assigned.</p>
              </div>
            }
          </div>
        </div>

        <!-- Map Legend Box (Bottom Left) -->
        <div class="map-legend-card">
          <span class="legend-title">Incident Urgency</span>
          <div class="legend-row">
            <div class="legend-dot critical"></div>
            <span>Critical Emergency</span>
          </div>
          <div class="legend-row">
            <div class="legend-dot high"></div>
            <span>High Priority</span>
          </div>
          <div class="legend-row">
            <div class="legend-dot medium"></div>
            <span>Medium Priority</span>
          </div>
          <div class="legend-row">
            <div class="legend-dot low"></div>
            <span>Low / Stable</span>
          </div>
        </div>

        <!-- Floating Urgent Report Button -->
        <button type="button" class="btn-report-fab" (click)="onReportNeed()" title="Report Emergency Need">
          <mat-icon fontSet="material-symbols-rounded">add_alert</mat-icon>
          <span>Report Need</span>
        </button>

      </div>

    </div>
  `,
  styles: [`
    .crisis-map-wrapper {
      position: relative;
      width: 100%;
      height: calc(100vh - 116px);
      display: flex;
      flex-direction: column;
      gap: 12px;
      animation: fadeUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* Top Control Bar */
    .map-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      z-index: 20;
    }

    .map-search-box {
      display: flex;
      align-items: center;
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 6px 12px;
      width: 340px;
      max-width: 40vw;
      box-shadow: var(--shadow-card);

      mat-icon { font-size: 18px; color: var(--color-text-hint); margin-right: 8px; flex-shrink: 0; }
      input {
        border: none;
        background: transparent;
        font-size: 0.82rem;
        color: var(--color-text-primary);
        width: 100%;
        outline: none;
        &::placeholder { color: var(--color-text-hint); }
      }
    }

    .btn-locate {
      background: transparent;
      border: none;
      color: var(--color-primary);
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 18px; margin: 0; }
      &:hover { color: var(--color-primary-container); }
    }

    .filter-pill-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    }

    .f-pill {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 0.76rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;

      &:hover { background: var(--color-primary-light); color: var(--color-primary); border-color: var(--color-primary); }
      &.active {
        background: var(--color-primary);
        color: var(--color-on-primary);
        border-color: var(--color-primary);
      }
      &.critical {
        color: var(--color-danger);
        &.active { background: var(--color-danger); color: var(--color-on-primary); border-color: var(--color-danger); }
        mat-icon { font-size: 14px; width: 14px; height: 14px; }
      }
      &.heatmap-pill {
        mat-icon { font-size: 14px; width: 14px; height: 14px; }
        &.active { background: var(--color-info); border-color: var(--color-info); color: var(--color-on-primary); }
      }
    }

    /* Map Canvas Container */
    .map-canvas-container {
      position: relative;
      flex: 1;
      width: 100%;
      min-height: 480px;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-card);
    }

    .map-surface {
      width: 100%;
      height: 100%;
      background: #0f1413;
    }

    /* Live Intelligence Stream Panel */
    .live-intel-panel {
      position: absolute;
      top: 14px;
      right: 14px;
      bottom: 14px;
      width: 340px;
      max-width: 38vw;
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      z-index: 10;
      box-shadow: var(--shadow-elevated);
      overflow: hidden;
    }

    .intel-header {
      padding: 14px 16px 10px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-surface-container);
    }

    .intel-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--color-primary);
      background: var(--color-primary-light);
      padding: 2px 6px;
      border-radius: 4px;
      margin-bottom: 6px;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 6px #22c55e;
    }

    .intel-title {
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }

    .intel-sub {
      margin: 2px 0 0;
      font-size: 0.72rem;
      color: var(--color-text-secondary);
    }

    .intel-cards-list {
      flex: 1;
      overflow-y: auto;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .intel-card {
      background: var(--color-surface-container-low);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 10px 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;

      &:hover {
        background: var(--color-card);
        border-color: var(--color-primary);
        box-shadow: var(--shadow-card);
        transform: translateY(-1px);
      }

      &.critical { border-left: 3px solid var(--color-danger); }
      &.high { border-left: 3px solid var(--color-warning); }
      &.medium { border-left: 3px solid var(--color-info); }
    }

    .intel-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .urgency-pill {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
      &.critical { background: var(--color-danger-light); color: var(--color-danger); }
      &.high { background: var(--color-warning-light); color: var(--color-warning); }
      &.medium { background: var(--color-info-light); color: var(--color-info); }
      &.low { background: var(--color-surface-container); color: var(--color-text-secondary); }
    }

    .intel-time {
      font-size: 0.68rem;
      color: var(--color-text-hint);
    }

    .need-title {
      margin: 0;
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .need-desc {
      margin: 3px 0 8px;
      font-size: 0.74rem;
      color: var(--color-text-secondary);
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .intel-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .loc-tag {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 0.68rem;
      color: var(--color-text-secondary);
      mat-icon { font-size: 13px; width: 13px; height: 13px; color: var(--color-primary); }
    }

    .btn-dispatch-mini {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: var(--color-primary-light);
      color: var(--color-primary);
      border: none;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
      &:hover { background: var(--color-primary); color: var(--color-on-primary); }
      mat-icon { font-size: 12px; width: 12px; height: 12px; }
    }

    .empty-intel {
      padding: 32px 16px;
      text-align: center;
      color: var(--color-text-hint);
      mat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 6px; }
      h4 { margin: 0; font-size: 0.86rem; color: var(--color-text-primary); }
      p { margin: 2px 0 0; font-size: 0.74rem; }
    }

    /* Map Legend */
    .map-legend-card {
      position: absolute;
      bottom: 14px;
      left: 14px;
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 8px 12px;
      z-index: 10;
      box-shadow: var(--shadow-card);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .legend-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: #1a201e;
      margin-bottom: 2px;
    }

    .legend-row {
      display: flex;
      align-items: center;
      gap: 6px;
      span { font-size: 0.68rem; color: #64748b; }
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      &.critical { background: #dc2626; }
      &.high { background: #d97706; }
      &.medium { background: #0284c7; }
      &.low { background: #94a3b8; }
    }

    /* Floating Report FAB */
    .btn-report-fab {
      position: absolute;
      bottom: 14px;
      right: 370px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #005147, #0a6b5e);
      color: #ffffff;
      border: none;
      padding: 10px 18px;
      border-radius: 24px;
      font-size: 0.82rem;
      font-weight: 700;
      box-shadow: 0 8px 24px rgba(0, 81, 71, 0.3);
      cursor: pointer;
      z-index: 10;
      transition: all 0.15s ease;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 28px rgba(0, 81, 71, 0.35);
      }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    @media (max-width: 900px) {
      .live-intel-panel { display: none; }
      .btn-report-fab { right: 14px; }
    }
  `]
})
export class NeedsMapComponent implements AfterViewInit {
  @ViewChild('mapContainer') mapElement!: ElementRef;

  private firestore = inject(FirestoreService);
  private mapsService = inject(MapsService);
  private geo = inject(GeolocationService);
  private bottomSheet = inject(MatBottomSheet);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  firestoreNeeds = toSignal(this.firestore.getOpenNeeds(), { initialValue: [] });
  
  // Real-world Mumbai Dharavi pre-seeded crisis reports
  defaultNeeds: Need[] = [
    {
      id: 'dharavi-1',
      title: 'Waterlogging & Tarpaulin Emergency',
      category: 'shelter',
      urgency: 'critical',
      lat: 19.0444,
      lng: 72.8501,
      locationName: 'Dharavi Sector 4, Transit Camp',
      reportedAt: Timestamp.now(),
      reportedBy: 'Field Lead Vikram',
      status: 'open',
      assignedVolunteers: [],
      description: 'Heavy rainfall overflow in low-lying transit camps. 40 families require heavy waterproof tarpaulins and tie ropes immediately.'
    },
    {
      id: 'dharavi-2',
      title: 'Pediatric ORS & First Aid Kits',
      category: 'medical',
      urgency: 'critical',
      lat: 19.0490,
      lng: 72.8550,
      locationName: '90 Feet Road, Near Matunga Labor Camp',
      reportedAt: Timestamp.fromDate(new Date(Date.now() - 25 * 60 * 1000)),
      reportedBy: 'Dr. Ravi Deshmukh',
      status: 'open',
      assignedVolunteers: [],
      description: 'Waterborne gastroenteritis outbreak reported among infants. Requesting 50 ORS electrolyte sachets and sterile triage kits.'
    },
    {
      id: 'dharavi-3',
      title: 'Water Potability Chlorine Tablets',
      category: 'water',
      urgency: 'high',
      lat: 19.0410,
      lng: 72.8460,
      locationName: 'Kumbharwada Sector 5',
      reportedAt: Timestamp.fromDate(new Date(Date.now() - 45 * 60 * 1000)),
      reportedBy: 'Anita Kale (Community Head)',
      status: 'open',
      assignedVolunteers: [],
      description: 'Municipal pipeline contamination. Community requires 300 chlorine purification tablets (NaDCC 10,000L).'
    },
    {
      id: 'dharavi-4',
      title: 'Ready-to-Eat Ration Packs for Seniors',
      category: 'food',
      urgency: 'medium',
      lat: 19.0520,
      lng: 72.8600,
      locationName: 'Kurla West Bridge Outpost',
      reportedAt: Timestamp.fromDate(new Date(Date.now() - 90 * 60 * 1000)),
      reportedBy: 'Sahaay Volunteer Unit',
      status: 'open',
      assignedVolunteers: [],
      description: '100 high-calorie fortified meal packs needed for elderly residents displaced by rail line inundation.'
    },
    {
      id: 'dharavi-5',
      title: 'Trauma Burn Dressings & Splints',
      category: 'medical',
      urgency: 'high',
      lat: 19.0380,
      lng: 72.8520,
      locationName: 'Mahim East Transit Point',
      reportedAt: Timestamp.fromDate(new Date(Date.now() - 120 * 60 * 1000)),
      reportedBy: 'Red Cross First Responder',
      status: 'open',
      assignedVolunteers: [],
      description: 'Minor injuries reported during wall collapse clearance. Emergency sterile bandages and splints requested.'
    }
  ];

  allNeedsList = computed(() => {
    const fs = this.firestoreNeeds();
    if (fs && fs.length > 0) return fs;
    return this.defaultNeeds;
  });

  filter = signal<string>('all');
  searchTerm = signal<string>('');
  showHeatmap = signal<boolean>(false);

  filteredNeeds = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const activeFilter = this.filter();

    return this.allNeedsList().filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(term) || n.description.toLowerCase().includes(term) || n.locationName.toLowerCase().includes(term);
      const matchesFilter = activeFilter === 'all' ||
                           (activeFilter === 'critical' ? n.urgency === 'critical' : n.category === activeFilter);
      return matchesSearch && matchesFilter;
    });
  });

  private map?: google.maps.Map;
  private mapInitialized = false;
  private markers: any[] = [];
  private heatmap?: google.maps.visualization.HeatmapLayer;

  constructor() {
    effect(() => {
      this.updateMarkers(this.filteredNeeds());
    });

    effect(() => {
      if (this.mapsService.isLoaded() && this.mapElement && !this.mapInitialized) {
        void this.initMap();
      }
    });
  }

  ngAfterViewInit() {
    if (this.mapsService.isLoaded() && !this.mapInitialized) {
      void this.initMap();
    }
  }

  private async initMap(): Promise<void> {
    if (this.mapInitialized || !this.mapElement?.nativeElement) {
      return;
    }

    this.mapInitialized = true;
    try {
      this.map = await this.mapsService.createMap(this.mapElement.nativeElement, {
        zoom: 15,
        center: { lat: 19.0444, lng: 72.8501 }, // Dharavi center
        mapTypeId: 'hybrid', // Real high-res satellite view with road labels
        mapTypeControl: false, // Locked to Satellite only
        disableDefaultUI: false
      });

      this.updateMarkers(this.filteredNeeds());
    } catch (error) {
      this.mapInitialized = false;
      console.error('Failed to initialize map:', error);
    }
  }

  private updateMarkers(needs: Need[]) {
    if (!this.map || typeof google === 'undefined' || !google.maps) return;

    this.markers.forEach(m => m.setMap(null));
    this.markers = [];

    needs.forEach(need => {
      const position = { lat: need.lat, lng: need.lng };
      const color = need.urgency === 'critical' ? '#dc2626' : need.urgency === 'high' ? '#d97706' : need.urgency === 'medium' ? '#0284c7' : '#16a34a';

      const marker = new google.maps.Marker({
        position,
        map: this.map,
        title: need.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: need.urgency === 'critical' ? 10 : 8,
          fillColor: color,
          fillOpacity: 0.9,
          strokeWeight: 2,
          strokeColor: '#ffffff'
        }
      });

      marker.addListener('click', () => {
        this.openNeedDetail(need);
      });

      this.markers.push(marker);
    });

    if (this.showHeatmap()) {
      this.updateHeatmap();
    }
  }

  private updateHeatmap() {
    if (!this.map) return;
    if (this.heatmap) {
      this.heatmap.setMap(null);
    }
    const data = this.filteredNeeds().map(n => ({ lat: n.lat, lng: n.lng }));
    this.heatmap = this.mapsService.createHeatmap(this.map, data);
  }

  setFilter(f: string) {
    this.filter.set(f);
  }

  toggleHeatmap() {
    this.showHeatmap.update(v => !v);
    if (this.showHeatmap()) {
      this.updateHeatmap();
    } else if (this.heatmap) {
      this.heatmap.setMap(null);
    }
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  async centerOnUser() {
    try {
      const coords = await Promise.race([
        this.geo.getCurrentPosition(),
        new Promise<{ lat: number; lng: number }>((_, reject) =>
          setTimeout(() => reject(new Error('Location timeout')), 4000)
        )
      ]);
      this.map?.setCenter(coords);
      this.map?.setZoom(16);
    } catch (error) {
      this.map?.setCenter({ lat: 19.0444, lng: 72.8501 });
      this.snackBar.open('Centered on Dharavi Command Sector 4.', 'OK', { duration: 2500 });
    }
  }

  focusOnNeed(need: Need) {
    this.map?.panTo({ lat: need.lat, lng: need.lng });
    this.map?.setZoom(16);
    this.openNeedDetail(need);
  }

  onReportNeed() {
    this.dialog.open(ReportNeedComponent, {
      width: '650px',
      maxWidth: '90vw',
      panelClass: 'glass-dialog'
    });
  }

  private openNeedDetail(need: Need) {
    this.bottomSheet.open(NeedBottomSheetComponent, {
      data: { need }
    });
  }
}
