import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { InventoryItem } from '../../models';

@Component({
  selector: 'app-scan-handover-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="modal-wrapper">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="badge-icon">
            <mat-icon fontSet="material-symbols-rounded">qr_code_scanner</mat-icon>
          </div>
          <div>
            <h2 class="modal-title">QR Handover & Dispatch Log</h2>
            <p class="modal-subtitle">Scan equipment barcode or select supply item for instant field handover</p>
          </div>
        </div>
        <button type="button" class="close-btn" (click)="onCancel()">
          <mat-icon fontSet="material-symbols-rounded">close</mat-icon>
        </button>
      </div>

      <!-- Body -->
      <mat-dialog-content class="modal-body">
        
        <!-- Scanner Viewfinder Simulation -->
        <div class="scanner-viewport" [class.scanned]="scannedCode()">
          <div class="viewfinder-box">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
            <div class="laser-line"></div>
            
            <div class="viewfinder-content">
              <mat-icon class="camera-icon">barcode_scanner</mat-icon>
              <p class="viewfinder-text">{{ scannedCode() ? 'Barcode Verified: ' + scannedCode() : 'Point camera at Supply QR Code' }}</p>
            </div>
          </div>

          <div class="quick-barcode-pills">
            <span class="pill-label">Quick Scan Demo:</span>
            <button type="button" class="demo-code-pill" (click)="selectDemoBarcode('MED-TRAUMA-01', 'Emergency Trauma First Aid Kit', 10)">MED-TRAUMA-01</button>
            <button type="button" class="demo-code-pill" (click)="selectDemoBarcode('WAT-PURIF-04', 'Water Purification Chlorine Tablets (10,000L)', 500)">WAT-PURIF-04</button>
            <button type="button" class="demo-code-pill" (click)="selectDemoBarcode('SHT-TARP-09', 'Heavy Duty Monsoon Tarpaulin Shelter Kits', 25)">SHT-TARP-09</button>
          </div>
        </div>

        <!-- Form Details -->
        <div class="form-grid">
          <div class="sahaay-input-group">
            <label class="sahaay-label">Selected Resource Item *</label>
            <div class="sahaay-control-box">
              <mat-icon fontSet="material-symbols-rounded">inventory_2</mat-icon>
              <input type="text" [(ngModel)]="selectedItemName" placeholder="Scan QR or enter item name">
            </div>
          </div>

          <div class="form-row-2">
            <div class="sahaay-input-group flex-1">
              <label class="sahaay-label">Dispatch Quantity *</label>
              <div class="sahaay-control-box">
                <mat-icon fontSet="material-symbols-rounded">format_list_numbered</mat-icon>
                <input type="number" [(ngModel)]="quantity" min="1" placeholder="10">
              </div>
            </div>

            <div class="sahaay-input-group flex-1">
              <label class="sahaay-label">Transaction Mode *</label>
              <div class="sahaay-control-box">
                <mat-icon fontSet="material-symbols-rounded">sync_alt</mat-icon>
                <select [(ngModel)]="txType" class="custom-select">
                  <option value="outbound">Outbound (Field Handover)</option>
                  <option value="inbound">Inbound (Stock Restock)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-row-2">
            <div class="sahaay-input-group flex-1">
              <label class="sahaay-label">Recipient Field Volunteer / Lead *</label>
              <div class="sahaay-control-box">
                <mat-icon fontSet="material-symbols-rounded">badge</mat-icon>
                <input type="text" [(ngModel)]="recipient" placeholder="e.g. Vikram Joshi (Sector 4 Task Force)">
              </div>
            </div>

            <div class="sahaay-input-group flex-1">
              <label class="sahaay-label">Destination Ward / Hub *</label>
              <div class="sahaay-control-box">
                <mat-icon fontSet="material-symbols-rounded">near_me</mat-icon>
                <input type="text" [(ngModel)]="destination" placeholder="Dharavi Transit Camp 4">
              </div>
            </div>
          </div>

          <div class="sahaay-input-group">
            <label class="sahaay-label">Handover Purpose / Notes</label>
            <div class="sahaay-control-box">
              <mat-icon fontSet="material-symbols-rounded">notes</mat-icon>
              <input type="text" [(ngModel)]="notes" placeholder="e.g. Urgent deployment for flood water rescue operation">
            </div>
          </div>
        </div>

      </mat-dialog-content>

      <!-- Footer -->
      <mat-dialog-actions class="modal-footer">
        <button type="button" class="cancel-btn" (click)="onCancel()" [disabled]="isSubmitting()">Cancel</button>
        <button type="button" class="submit-btn" [disabled]="!selectedItemName || quantity <= 0 || isSubmitting()" (click)="confirmHandover()">
          <mat-icon fontSet="material-symbols-rounded">{{ isSubmitting() ? 'sync' : 'check_circle' }}</mat-icon>
          <span>{{ isSubmitting() ? 'Logging Handover...' : 'Confirm QR Handover' }}</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .modal-wrapper {
      display: flex;
      flex-direction: column;
      background: #ffffff;
      min-width: 540px;
      max-width: 640px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #edf2f0;
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
      background: #e8f5f2;
      color: #005147;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .badge-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }

    .modal-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 700;
      color: #005147;
    }

    .modal-subtitle {
      margin: 2px 0 0;
      font-size: 0.75rem;
      color: #6f7976;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #6f7976;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-body {
      padding: 20px 24px !important;
      max-height: 75vh;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Viewfinder */
    .scanner-viewport {
      background: #0f172a;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      border: 2px dashed #334155;
      position: relative;
      overflow: hidden;
    }
    .scanner-viewport.scanned {
      border-color: #10b981;
      background: #064e3b;
    }

    .viewfinder-box {
      width: 260px;
      height: 120px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .corner {
      position: absolute;
      width: 20px;
      height: 20px;
      border-color: #10b981;
      border-style: solid;
    }
    .corner.top-left { top: 0; left: 0; border-width: 3px 0 0 3px; }
    .corner.top-right { top: 0; right: 0; border-width: 3px 3px 0 0; }
    .corner.bottom-left { bottom: 0; left: 0; border-width: 0 0 3px 3px; }
    .corner.bottom-right { bottom: 0; right: 0; border-width: 0 3px 3px 0; }

    .laser-line {
      position: absolute;
      width: 100%;
      height: 2px;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: scan 2s infinite ease-in-out;
    }
    @keyframes scan {
      0% { top: 10%; opacity: 0.2; }
      50% { top: 90%; opacity: 1; }
      100% { top: 10%; opacity: 0.2; }
    }

    .viewfinder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: #e2e8f0;
      z-index: 2;
    }
    .camera-icon { font-size: 32px; width: 32px; height: 32px; color: #10b981; }
    .viewfinder-text { margin: 0; font-size: 0.78rem; font-weight: 600; text-align: center; }

    .quick-barcode-pills {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      z-index: 2;
    }
    .pill-label { font-size: 0.72rem; color: #94a3b8; font-weight: 600; }
    .demo-code-pill {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .demo-code-pill:hover {
      background: #10b981;
      border-color: #10b981;
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .form-row-2 { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }

    .custom-select { cursor: pointer; }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px 20px !important;
      border-top: 1px solid #edf2f0;
    }

    .cancel-btn {
      background: transparent;
      border: 1px solid #dce5e2;
      color: #55605d;
      padding: 9px 18px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .submit-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #005147, #0a6b5e);
      color: #ffffff;
      border: none;
      padding: 9px 22px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0, 81, 71, 0.25);
    }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class ScanHandoverModalComponent {
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ScanHandoverModalComponent>);

  isSubmitting = signal(false);
  scannedCode = signal<string>('');
  selectedItemName = 'Emergency Trauma First Aid Kit';
  quantity = 5;
  txType: 'outbound' | 'inbound' = 'outbound';
  recipient = 'Vikram Joshi (Sector 4 Task Force)';
  destination = 'Dharavi Transit Camp 4';
  notes = 'Monsoon flood emergency first response kit dispatch';

  selectDemoBarcode(code: string, name: string, qty: number) {
    this.scannedCode.set(code);
    this.selectedItemName = name;
    this.quantity = Math.min(qty, 10);
    this.snackBar.open(`Scanned QR: ${code} (${name})`, 'OK', { duration: 2500 });
  }

  onCancel() {
    this.dialogRef.close();
  }

  confirmHandover() {
    this.isSubmitting.set(true);
    setTimeout(() => {
      const transactionData = {
        itemName: this.selectedItemName,
        quantity: this.quantity,
        type: this.txType,
        recipient: this.recipient,
        destination: this.destination,
        notes: this.notes,
        qrCode: this.scannedCode() || 'QR-DISPATCH-AUTO',
        timestamp: new Date()
      };

      this.snackBar.open(`Logged ${this.txType} handover of ${this.quantity} units to ${this.recipient}!`, 'OK', { duration: 4000 });
      this.isSubmitting.set(false);
      this.dialogRef.close(transactionData);
    }, 600);
  }
}
