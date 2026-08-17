import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../core/auth/auth.service';
import { FirestoreService } from '../../core/firebase/firestore.service';
import { VerificationService, FaceMatchResult, AadhaarOcrResult } from '../../core/verification/verification.service';
import { NgoRegistryService } from '../../core/ngo/ngo-registry.service';
import { NgoDocument } from '../../models';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatSnackBarModule,
    MatStepperModule, MatChipsModule, MatProgressBarModule,
    MatCheckboxModule
  ],
  template: `
    <div class="register-page">
      <div class="ambient-blob blob-1"></div>
      <div class="ambient-blob blob-2"></div>

      <main class="register-main">
        <div class="register-card">
          <div class="brand-header">
            <div class="brand-icon">
              <mat-icon fontSet="material-symbols-rounded"
                style="font-variation-settings: 'FILL' 1, 'wght' 300;">volunteer_activism</mat-icon>
            </div>
            <h1 class="brand-name">Join Sahaay</h1>
            <p class="brand-tagline">Complete your profile to get started</p>
          </div>
          <div class="step-bar">
            @for (s of steps; track s; let i = $index) {
              <div class="step-dot" [class.active]="currentStep() === i" [class.done]="currentStep() > i">
                <span class="dot">{{ currentStep() > i ? '✓' : i + 1 }}</span>
                <span class="step-label">{{ s }}</span>
              </div>
              @if (i < steps.length - 1) { <div class="step-line" [class.done]="currentStep() > i"></div> }
            }
          </div>

          <!-- Step 0: Personal Details -->
          @if (currentStep() === 0) {
            <form class="form-section" [formGroup]="personalForm">
              <h2 class="section-title">Personal Details</h2>

              <div class="field-group">
                <label class="field-label">Full Name</label>
                <div class="input-wrapper">
                  <span class="input-icon"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">person</mat-icon></span>
                  <input class="auth-input" formControlName="displayName" placeholder="Enter your full name">
                </div>
              </div>

              <div class="field-group">
                <label class="field-label">Phone Number</label>
                <div class="input-wrapper">
                  <span class="input-icon"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">call</mat-icon></span>
                  <input class="auth-input" formControlName="phone" placeholder="+91 XXXXX XXXXX">
                </div>
              </div>

              <div class="row-2">
                <div class="field-group">
                  <label class="field-label">Date of Birth</label>
                  <div class="input-wrapper">
                    <span class="input-icon"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">calendar_today</mat-icon></span>
                    <input class="auth-input" type="date" formControlName="dateOfBirth">
                  </div>
                </div>
                <div class="field-group">
                  <label class="field-label">Gender</label>
                  <div class="input-wrapper">
                    <span class="input-icon"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">wc</mat-icon></span>
                    <select class="auth-input auth-select" formControlName="gender">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="field-group">
                <label class="field-label">Address</label>
                <div class="input-wrapper">
                  <span class="input-icon" style="align-self:flex-start;margin-top:12px"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">home</mat-icon></span>
                  <textarea class="auth-input auth-textarea" formControlName="address" placeholder="Street, Area, City" rows="2"></textarea>
                </div>
              </div>

              <button type="button" class="next-btn" (click)="goToStep(1)">
                Continue <mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">arrow_forward</mat-icon>
              </button>
            </form>
          }

          <!-- Step 1: Role & Skills / Setup NGO -->
          @if (currentStep() === 1) {
            <form class="form-section" [formGroup]="roleForm">
              <h2 class="section-title">Role & Setup</h2>

              <div class="field-group">
                <label class="field-label">Preferred Role</label>
                <div class="role-grid">
                  @for (r of roleOptions; track r.value) {
                    <button type="button" class="role-card" [class.selected]="roleForm.get('preferredRole')?.value === r.value"
                      (click)="roleForm.get('preferredRole')?.setValue(r.value)">
                      <mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 1, 'wght' 300;">{{ r.icon }}</mat-icon>
                      <span class="role-name">{{ r.label }}</span>
                      <span class="role-desc">{{ r.desc }}</span>
                    </button>
                  }
                </div>
              </div>

              @if (roleForm.get('preferredRole')?.value !== 'ngo_founder' && roleForm.get('preferredRole')?.value !== 'ngo_admin') {
                <div class="field-group">
                  <label class="field-label">Ward / Region</label>
                  <div class="input-wrapper">
                    <span class="input-icon"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">location_on</mat-icon></span>
                    <select class="auth-input auth-select" formControlName="region">
                      <option value="">Select region</option>
                      <option value="Dharavi">Dharavi</option>
                      <option value="Kurla">Kurla</option>
                      <option value="Govandi">Govandi</option>
                      <option value="Bhandup">Bhandup</option>
                    </select>
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label">Skills (comma separated)</label>
                  <div class="input-wrapper">
                    <span class="input-icon"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">construction</mat-icon></span>
                    <input class="auth-input" formControlName="skills" placeholder="Medical, Logistics, Driving, Teaching">
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label">Languages Spoken</label>
                  <div class="input-wrapper">
                    <span class="input-icon"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">translate</mat-icon></span>
                    <input class="auth-input" formControlName="languages" placeholder="Hindi, Marathi, English">
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label">NGO Affiliation (optional)</label>
                  <div class="input-wrapper">
                    <span class="input-icon"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">corporate_fare</mat-icon></span>
                    <input class="auth-input" formControlName="ngoAffiliation" placeholder="Organization name">
                  </div>
                </div>
              } @else {
                <div class="row-2">
                  <div class="field-group">
                    <label class="field-label">NGO Name</label>
                    <div class="input-wrapper" [class.invalid]="roleForm.get('ngoName')?.invalid && roleForm.get('ngoName')?.touched">
                      <span class="input-icon"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">business</mat-icon></span>
                      <input class="auth-input" formControlName="ngoName" placeholder="Organization Name">
                    </div>
                    @if (roleForm.get('ngoName')?.invalid && roleForm.get('ngoName')?.touched) {
                      <span class="error-text">NGO Name is required</span>
                    }
                  </div>
                  <div class="field-group">
                    <label class="field-label">Official Email</label>
                    <div class="input-wrapper" [class.invalid]="roleForm.get('ngoEmail')?.invalid && roleForm.get('ngoEmail')?.touched">
                      <span class="input-icon"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">mail</mat-icon></span>
                      <input class="auth-input" type="email" formControlName="ngoEmail" placeholder="contact@ngo.org">
                    </div>
                    @if (roleForm.get('ngoEmail')?.invalid && roleForm.get('ngoEmail')?.touched) {
                      <span class="error-text">Valid official email is required</span>
                    }
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label">NGO Logo (Optional)</label>
                  <div class="logo-upload-row">
                    <div class="logo-preview" (click)="logoInput.click()">
                      @if (ngoLogoPreview()) {
                        <img [src]="ngoLogoPreview()" alt="NGO Logo">
                      } @else {
                        <mat-icon fontSet="material-symbols-rounded">add_a_photo</mat-icon>
                      }
                      <input #logoInput type="file" accept="image/*" hidden (change)="onLogoFile($event)">
                    </div>
                    <div class="logo-info">
                      <span class="upload-hint">Square logo preferred. Max 2MB.</span>
                      @if (ngoLogoFile()) {
                        <span class="file-name">{{ ngoLogoFile()?.name }}</span>
                      }
                    </div>
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label">About the NGO</label>
                  <div class="input-wrapper" [class.invalid]="roleForm.get('ngoDescription')?.invalid && roleForm.get('ngoDescription')?.touched">
                    <span class="input-icon" style="align-self:flex-start;margin-top:12px"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">description</mat-icon></span>
                    <textarea class="auth-input auth-textarea" formControlName="ngoDescription" 
                      placeholder="Describe your organization's mission and history (min 20 chars)" rows="3"></textarea>
                  </div>
                  @if (roleForm.get('ngoDescription')?.invalid && roleForm.get('ngoDescription')?.touched) {
                    <span class="error-text">Description must be at least 20 characters</span>
                  }
                </div>

                <div class="field-group">
                  <label class="field-label">Focus Areas</label>
                  <div class="chip-grid">
                    @for (area of focusAreaOptions; track area.value) {
                      <button type="button" class="chip-btn" 
                        [class.selected]="roleForm.get('ngoFocusAreas')?.value.includes(area.value)"
                        (click)="toggleFocusArea(area.value)">
                        <mat-icon fontSet="material-symbols-rounded" style="font-size:18px">{{ area.icon }}</mat-icon>
                        {{ area.label }}
                      </button>
                    }
                  </div>
                  @if (roleForm.get('ngoFocusAreas')?.invalid && roleForm.get('ngoFocusAreas')?.touched) {
                    <span class="error-text">Select at least one focus area</span>
                  }
                </div>

                <div class="field-group">
                  <label class="field-label">Relevant SDG Goals</label>
                  <div class="sdg-grid">
                    @for (sdg of sdgOptions; track sdg.value) {
                      <button type="button" class="sdg-chip"
                        [class.selected]="roleForm.get('ngoSdgGoals')?.value.includes(sdg.value)"
                        (click)="toggleSdg(sdg.value)">
                        SDG {{ sdg.value }}: {{ sdg.label }}
                      </button>
                    }
                  </div>
                </div>

                <div class="row-2">
                  <div class="field-group">
                    <label class="field-label">Registration No.</label>
                    <div class="input-wrapper">
                      <span class="input-icon"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">app_registration</mat-icon></span>
                      <input class="auth-input" formControlName="ngoRegistrationNumber" placeholder="e.g. E-12345">
                    </div>
                  </div>
                  <div class="field-group">
                    <label class="field-label">Operating Region</label>
                    <div class="input-wrapper" [class.invalid]="roleForm.get('region')?.invalid && roleForm.get('region')?.touched">
                      <span class="input-icon"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">location_on</mat-icon></span>
                      <select class="auth-input auth-select" formControlName="region">
                        <option value="">Select region</option>
                        <option value="Dharavi">Dharavi</option>
                        <option value="Kurla">Kurla</option>
                        <option value="Govandi">Govandi</option>
                        <option value="Bhandup">Bhandup</option>
                      </select>
                    </div>
                    @if (roleForm.get('region')?.invalid && roleForm.get('region')?.touched) {
                      <span class="error-text">Operating region is required</span>
                    }
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label">Registration Certificate</label>
                  <div class="upload-zone" (click)="certInput.click()" [class.has-file]="ngoCertFile()">
                    <input #certInput type="file" accept="image/*,application/pdf" hidden (change)="onCertFile($event)">
                    @if (ngoCertFile()) {
                      <mat-icon fontSet="material-symbols-rounded" class="upload-done-icon"
                        style="font-variation-settings: 'FILL' 1, 'wght' 300;">check_circle</mat-icon>
                      <span class="upload-name">{{ ngoCertFile()!.name }}</span>
                      <span class="upload-change">Click to change</span>
                    } @else {
                      <mat-icon fontSet="material-symbols-rounded"
                        style="font-variation-settings: 'FILL' 0, 'wght' 300;">description</mat-icon>
                      <span class="upload-text">Upload Registration Certificate</span>
                      <span class="upload-hint">PDF, JPG, PNG — max 10 MB</span>
                    }
                  </div>
                </div>
              }

              <div class="btn-row">
                <button type="button" class="back-btn" (click)="currentStep.set(0)">
                  <mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">arrow_back</mat-icon> Back
                </button>
                <button type="button" class="next-btn" (click)="goToStep(2)">
                  Continue <mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          }

          <!-- Step 2: Aadhaar & Face Verification -->
          @if (currentStep() === 2 && !registrationSuccess()) {
            <div class="form-section">
              <h2 class="section-title">Identity Verification</h2>

              <!-- Aadhaar -->
              <div class="field-group">
                <label class="field-label">Aadhaar Number</label>
                <div class="input-wrapper">
                  <span class="input-icon"><mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 0, 'wght' 300;">badge</mat-icon></span>
                  <input class="auth-input" [(ngModel)]="aadhaarNumber" placeholder="XXXX XXXX XXXX" maxlength="14"
                    (input)="formatAadhaar($event)">
                </div>
                <p class="field-hint">Your 12-digit Aadhaar number. Data is encrypted and used only for verification.</p>
              </div>

              <!-- Aadhaar Upload -->
              <div class="field-group">
                <label class="field-label">Upload Aadhaar Card (Front)</label>
                <div class="upload-zone" (click)="aadhaarInput.click()"
                     [class.has-file]="aadhaarFile()">
                  <input #aadhaarInput type="file" accept="image/*" hidden (change)="onAadhaarFile($event)">
                  @if (aadhaarFile()) {
                    <mat-icon fontSet="material-symbols-rounded" class="upload-done-icon"
                      style="font-variation-settings: 'FILL' 1, 'wght' 300;">check_circle</mat-icon>
                    <span class="upload-name">{{ aadhaarFile()!.name }}</span>
                    <span class="upload-change">Click to change</span>
                  } @else {
                    <mat-icon fontSet="material-symbols-rounded"
                      style="font-variation-settings: 'FILL' 0, 'wght' 300;">cloud_upload</mat-icon>
                    <span class="upload-text">Click to upload or drag & drop</span>
                    <span class="upload-hint">JPG, PNG — max 5 MB</span>
                  }
                </div>
                @if (ocrProcessing()) {
                  <div class="ocr-status">
                    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                    <span class="status-text">Reading Aadhaar card...</span>
                  </div>
                }
                @if (ocrResult()) {
                  <div class="ocr-result" [class.success]="ocrResult()!.aadhaarNumber" [class.warn]="!ocrResult()!.aadhaarNumber">
                    <mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 1, 'wght' 300;">
                      {{ ocrResult()!.aadhaarNumber ? 'verified' : 'info' }}
                    </mat-icon>
                    <div class="ocr-details">
                      @if (ocrResult()!.aadhaarNumber) {
                        <span>Aadhaar detected: <strong>{{ formatOcrAadhaar(ocrResult()!.aadhaarNumber!) }}</strong></span>
                        @if (ocrResult()!.dob) { <span>DOB: {{ ocrResult()!.dob }}</span> }
                        @if (ocrResult()!.gender) { <span>Gender: {{ ocrResult()!.gender }}</span> }
                        <span class="confidence">OCR Confidence: {{ ocrResult()!.confidence | number:'1.0-0' }}%</span>
                      } @else {
                        <span>Could not read Aadhaar number from image. Please enter manually.</span>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Face Verification -->
              <div class="field-group">
                <label class="field-label">Face Verification</label>
                <div class="face-verify-zone">
                  @if (!faceCapturing() && !faceCaptured()) {
                    <div class="face-placeholder" (click)="startFaceCapture()">
                      <mat-icon fontSet="material-symbols-rounded"
                        style="font-variation-settings: 'FILL' 0, 'wght' 300; font-size:48px; width:48px; height:48px;">
                        face_retouching_natural
                      </mat-icon>
                      <span class="face-text">Tap to start face verification</span>
                      <span class="face-hint">We'll use your camera for a quick selfie</span>
                    </div>
                  }
                  @if (faceCapturing()) {
                    <div class="face-camera">
                      <video #videoEl autoplay playsinline class="face-video"></video>
                      <canvas #canvasEl hidden></canvas>
                      <div class="face-overlay">
                        <div class="face-ring"></div>
                      </div>
                      <button type="button" class="capture-btn" (click)="captureFace()">
                        <mat-icon fontSet="material-symbols-rounded"
                          style="font-variation-settings: 'FILL' 1, 'wght' 300;">photo_camera</mat-icon>
                        Capture
                      </button>
                    </div>
                  }
                  @if (faceCaptured()) {
                    <div class="face-done">
                      <img [src]="faceDataUrl()" class="face-preview" alt="Face capture">
                      @if (faceVerifying()) {
                        <div class="verify-progress">
                          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                          <span class="status-text">{{ verificationStatus() }}</span>
                        </div>
                      } @else if (faceMatchResult()) {
                        <div class="face-match-result" [class.matched]="faceMatchResult()!.matched" [class.failed]="!faceMatchResult()!.matched">
                          <mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 1, 'wght' 300;">
                            {{ faceMatchResult()!.matched ? 'check_circle' : 'cancel' }}
                          </mat-icon>
                          <div class="match-details">
                            <span class="match-title">{{ faceMatchResult()!.matched ? 'Face Verified!' : 'Face Mismatch' }}</span>
                            <span class="match-score">Confidence: {{ faceMatchResult()!.confidence }}%</span>
                            @if (faceMatchResult()!.visionResult) {
                              <span class="vision-badge">Cloud Vision: {{ faceMatchResult()!.visionResult!.confidence * 100 | number:'1.0-0' }}% detection</span>
                            }
                          </div>
                        </div>
                      } @else {
                        <div class="face-success">
                          <mat-icon fontSet="material-symbols-rounded"
                            style="font-variation-settings: 'FILL' 1, 'wght' 300;">verified</mat-icon>
                          <span>Face captured successfully</span>
                        </div>
                      }
                      <button type="button" class="retake-btn" (click)="retakeFace()">Retake</button>
                    </div>
                  }
                </div>
              </div>

              <!-- Privacy Policy Agreement -->
              <div class="field-group privacy-policy-group" style="margin-top: 16px;">
                <mat-checkbox (change)="acceptedPrivacyPolicy.set($event.checked)" [checked]="acceptedPrivacyPolicy()" class="privacy-checkbox">
                  I agree to the <a href="/privacy-policy" target="_blank" class="policy-link">Privacy Policy</a> and <a href="/terms" target="_blank" class="policy-link">Terms of Use</a>.
                </mat-checkbox>
                <p class="field-hint" style="margin-left: 28px; margin-top: -4px;">We process your Aadhaar and face data strictly for one-time verification. Images are not stored.</p>
              </div>

              <div class="btn-row">
              <button type="button" class="back-btn" (click)="prevStep()">
                <mat-icon fontSet="material-symbols-rounded">arrow_back</mat-icon>
                Back
              </button>
              
              <button type="button" class="skip-btn" (click)="submitRegistration(true)" [disabled]="submitting()">
                Skip for now
              </button>

              <button type="button" class="submit-btn" 
                      [disabled]="submitting() || !canSubmit()"
                      (click)="submitRegistration(false)">
                @if (submitting()) {
                    <span class="btn-spinner"></span> Submitting...
                  } @else {
                    Submit Application
                  }
                </button>
              </div>
            </div>
          }

          <!-- Success State -->
          @if (registrationSuccess()) {
            <div class="success-screen">
              <div class="success-icon">
                <mat-icon fontSet="material-symbols-rounded">task_alt</mat-icon>
              </div>
              <h2 class="success-title">Application Submitted!</h2>
              <p class="success-message">
                Your profile has been successfully created and submitted for verification. 
                Our team will review your application shortly.
              </p>
              <div class="info-card">
                <mat-icon fontSet="material-symbols-rounded">info</mat-icon>
                <p>You will receive a notification once your account is activated.</p>
              </div>
              <button class="login-btn" (click)="router.navigate(['/auth'])">
                <mat-icon fontSet="material-symbols-rounded" style="margin-right: 8px;">login</mat-icon>
                Go back and login
              </button>
            </div>
          }
        </div>
        @if (!registrationSuccess()) {
          <p class="login-footer">Already registered? <a class="footer-link" (click)="router.navigate(['/auth'])">Sign in</a></p>
        }
      </main>
    </div>
  `,
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private auth = inject(AuthService);
  protected router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private firestoreService = inject(FirestoreService);
  private verificationService = inject(VerificationService);
  private ngoRegistry = inject(NgoRegistryService);

  currentStep = signal(0);
  steps = ['Personal', 'Role & Skills', 'Verification'];

  nextStep() { this.currentStep.update(s => s + 1); }
  prevStep() { this.currentStep.update(s => s - 1); }

  goToStep(step: number) {
    if (step > this.currentStep()) {
      if (this.currentStep() === 0) {
        if (this.personalForm.invalid) {
          this.personalForm.markAllAsTouched();
          return;
        }
      } else if (this.currentStep() === 1) {
        if (this.roleForm.invalid) {
          this.roleForm.markAllAsTouched();
          return;
        }
      }
    }
    this.currentStep.set(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  aadhaarNumber = '';
  aadhaarFile = signal<File | null>(null);
  aadhaarImageDataUrl = signal('');
  faceCapturing = signal(false);
  faceCaptured = signal(false);
  faceDataUrl = signal('');
  submitting = signal(false);
  registrationSuccess = signal(false);
  ngoCertFile = signal<File | null>(null);

  // Verification state
  ocrProcessing = signal(false);
  ocrResult = signal<AadhaarOcrResult | null>(null);
  faceVerifying = signal(false);
  faceMatchResult = signal<FaceMatchResult | null>(null);
  verificationStatus = signal('');
  acceptedPrivacyPolicy = signal(false);

  private mediaStream: MediaStream | null = null;

  roleOptions = [
    { value: 'volunteer', label: 'Volunteer', icon: 'handshake', desc: 'Help on ground' },
    { value: 'field_lead', label: 'Field Lead', icon: 'supervisor_account', desc: 'Coordinate teams' },
    { value: 'ngo_founder', label: 'NGO Founder', icon: 'domain', desc: 'Register your NGO' }
  ];

  personalForm: FormGroup;
  roleForm: FormGroup;

  constructor() {
    const user = this.auth.currentUser;
    this.personalForm = this.fb.group({
      displayName: [user?.displayName || '', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[0-9\s]{10,14}$/)]],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      address: ['', Validators.required]
    });

    this.roleForm = this.fb.group({
      preferredRole: ['volunteer', Validators.required],
      region: [''],
      skills: [''],
      languages: [''],
      ngoAffiliation: [''],
      ngoName: [''],
      ngoRegistrationNumber: [''],
      ngoEmail: [''],
      ngoFocusAreas: [[]],
      ngoSdgGoals: [[]],
      ngoDescription: ['']
    });

    this.roleForm.get('preferredRole')?.valueChanges.subscribe(role => {
      if (role === 'ngo_founder' || role === 'ngo_admin') {
        this.roleForm.get('ngoName')?.setValidators([Validators.required]);
        this.roleForm.get('ngoEmail')?.setValidators([Validators.required, Validators.email]);
        this.roleForm.get('region')?.setValidators([Validators.required]);
        this.roleForm.get('ngoFocusAreas')?.setValidators([Validators.required, Validators.minLength(1)]);
        this.roleForm.get('ngoDescription')?.setValidators([Validators.required, Validators.minLength(20)]);
      } else {
        this.roleForm.get('ngoName')?.clearValidators();
        this.roleForm.get('ngoEmail')?.clearValidators();
        this.roleForm.get('region')?.clearValidators();
        this.roleForm.get('ngoFocusAreas')?.clearValidators();
        this.roleForm.get('ngoDescription')?.clearValidators();
      }
      this.roleForm.get('ngoName')?.updateValueAndValidity();
      this.roleForm.get('ngoEmail')?.updateValueAndValidity();
      this.roleForm.get('region')?.updateValueAndValidity();
      this.roleForm.get('ngoFocusAreas')?.updateValueAndValidity();
      this.roleForm.get('ngoDescription')?.updateValueAndValidity();
    });
  }

  focusAreaOptions = [
    { value: 'food', label: 'Food Security', icon: 'restaurant' },
    { value: 'medical', label: 'Healthcare', icon: 'medical_services' },
    { value: 'education', label: 'Education', icon: 'school' },
    { value: 'shelter', label: 'Housing', icon: 'home' },
    { value: 'water', label: 'Clean Water', icon: 'water_drop' },
    { value: 'livelihood', label: 'Livelihood', icon: 'work' },
    { value: 'disaster_relief', label: 'Disaster Relief', icon: 'emergency' }
  ];

  sdgOptions = [
    { value: 1, label: 'No Poverty' },
    { value: 2, label: 'Zero Hunger' },
    { value: 3, label: 'Good Health' },
    { value: 4, label: 'Quality Education' },
    { value: 5, label: 'Gender Equality' },
    { value: 6, label: 'Clean Water' },
    { value: 13, label: 'Climate Action' }
  ];

  ngoLogoFile = signal<File | null>(null);
  ngoLogoPreview = signal<string>('');

  formatAadhaar(event: Event) {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').substring(0, 12);
    v = v.replace(/(.{4})/g, '$1 ').trim();
    this.aadhaarNumber = v;
    input.value = v;
  }

  async onAadhaarFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      this.aadhaarFile.set(file);

      // Convert to data URL for face matching later
      this.aadhaarImageDataUrl.set(await this.verificationService.fileToDataUrl(file));

      // Run OCR to extract Aadhaar number automatically
      this.ocrProcessing.set(true);
      this.ocrResult.set(null);
      try {
        const result = await this.verificationService.ocrAadhaarCard(file);
        this.ocrResult.set(result);

        // Auto-fill Aadhaar number if OCR found it
        if (result.aadhaarNumber && result.aadhaarNumber.length === 12) {
          const formatted = result.aadhaarNumber.replace(/(.{4})/g, '$1 ').trim();
          this.aadhaarNumber = formatted;
          this.snackBar.open('Aadhaar number auto-detected from card!', 'OK', { duration: 3000 });
        }
      } catch (e) {
        console.warn('OCR failed, user can enter manually:', e);
      } finally {
        this.ocrProcessing.set(false);
      }
    } else {
      this.snackBar.open('File must be under 5 MB', 'OK', { duration: 3000 });
    }
  }

  onCertFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.size <= 10 * 1024 * 1024) {
      this.ngoCertFile.set(file);
      this.snackBar.open('Certificate uploaded successfully', 'OK', { duration: 2000 });
    } else if (file) {
      this.snackBar.open('File must be under 10 MB', 'OK', { duration: 3000 });
    }
  }

  async onLogoFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.size <= 2 * 1024 * 1024) {
      this.ngoLogoFile.set(file);
      const reader = new FileReader();
      reader.onload = () => this.ngoLogoPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    } else if (file) {
      this.snackBar.open('Logo must be under 2 MB', 'OK', { duration: 3000 });
    }
  }

  toggleFocusArea(area: string) {
    const current = this.roleForm.get('ngoFocusAreas')?.value as string[];
    const index = current.indexOf(area);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(area);
    }
    this.roleForm.get('ngoFocusAreas')?.setValue([...current]);
  }

  toggleSdg(goal: number) {
    const current = this.roleForm.get('ngoSdgGoals')?.value as number[];
    const index = current.indexOf(goal);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(goal);
    }
    this.roleForm.get('ngoSdgGoals')?.setValue([...current]);
  }

  formatOcrAadhaar(num: string): string {
    return num.replace(/(.{4})/g, '$1 ').trim();
  }

  async startFaceCapture() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 320 } });
      this.faceCapturing.set(true);
      setTimeout(() => {
        const video = document.querySelector('.face-video') as HTMLVideoElement;
        if (video && this.mediaStream) video.srcObject = this.mediaStream;
      }, 100);
    } catch {
      this.snackBar.open('Camera access denied. Please allow camera permission.', 'OK', { duration: 4000 });
    }
  }

  async captureFace() {
    const video = document.querySelector('.face-video') as HTMLVideoElement;
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const selfieDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    this.faceDataUrl.set(selfieDataUrl);
    this.faceCaptured.set(true);
    this.faceCapturing.set(false);
    this.stopCamera();

    // Run face verification if Aadhaar card was uploaded
    if (this.aadhaarImageDataUrl()) {
      this.faceVerifying.set(true);
      this.faceMatchResult.set(null);
      try {
        this.verificationStatus.set('Loading AI models...');
        const result = await this.verificationService.verifyFaceMatch(
          this.aadhaarImageDataUrl(), selfieDataUrl
        );
        this.faceMatchResult.set(result);
        this.verificationStatus.set('');

        if (result.matched) {
          this.snackBar.open(`Face verified with ${result.confidence}% confidence!`, 'OK', { duration: 3000 });
        } else if (!result.selfieDetected) {
          this.snackBar.open('No face detected in selfie. Please retake.', 'Retake', { duration: 4000 });
        } else if (!result.aadhaarFaceDetected) {
          this.snackBar.open('No face found on Aadhaar card. Try a clearer photo.', 'OK', { duration: 4000 });
        } else {
          this.snackBar.open('Face does not match Aadhaar photo. Please retake.', 'OK', { duration: 4000 });
        }
      } catch (e) {
        console.warn('Face verification error:', e);
        this.snackBar.open('Verification service unavailable. You can still submit.', 'OK', { duration: 3000 });
      } finally {
        this.faceVerifying.set(false);
      }
    }
  }

  retakeFace() {
    this.faceCaptured.set(false);
    this.faceDataUrl.set('');
    this.faceMatchResult.set(null);
    this.faceVerifying.set(false);
    this.startFaceCapture();
  }

  private stopCamera() {
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.mediaStream = null;
  }

  canSubmit(): boolean {
    const role = this.roleForm.get('preferredRole')?.value;
    const commonValid = this.aadhaarNumber.replace(/\s/g, '').length === 12
      && !!this.aadhaarFile()
      && this.faceCaptured()
      && this.acceptedPrivacyPolicy();
    
    if (role === 'ngo_founder' || role === 'ngo_admin') {
      return commonValid && !!this.ngoCertFile() && this.roleForm.valid;
    }
    
    return commonValid;
  }

  async submitRegistration(skipped: boolean = false) {
    let user = this.auth.currentUser;
    const p = this.personalForm.value;
    const r = this.roleForm.value;

    if (!user) {
      user = this.auth.loginAsDemoUser(
        r.preferredRole || 'volunteer',
        p.displayName || 'Registered User',
        p.phone ? `${p.phone.replace(/\D/g, '')}@sahaay.org` : 'applicant@sahaay.org'
      );
    }

    this.submitting.set(true);
    try {
      const skills = (r.skills || '').split(',').map((s: string) => s.trim()).filter((s: string) => s);
      const languages = (r.languages || '').split(',').map((s: string) => s.trim()).filter((s: string) => s);

      const faceResult = this.faceMatchResult();
      const faceVerified = faceResult?.matched ?? false;

      await this.firestoreService.updateUserProfile(user.uid, {
        displayName: p.displayName,
        phone: p.phone,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        address: p.address,
        role: r.preferredRole,
        region: r.region,
        skills: skills.length ? skills : [],
        languages: languages.length ? languages : [],
        ngoAffiliation: r.ngoAffiliation || '',
        ngoName: r.ngoName || '',
        ngoRegistrationNumber: r.ngoRegistrationNumber || '',
        ngoEmail: r.ngoEmail || '',
        aadhaarNumber: this.aadhaarNumber.replace(/\s/g, ''),
        faceVerified: skipped ? false : faceVerified,
        faceMatchConfidence: skipped ? 0 : (faceResult?.confidence ?? 0),
        ocrConfidence: skipped ? 0 : (this.ocrResult()?.confidence ?? 0),
        verificationStatus: (faceVerified && !skipped) ? 'approved' : 'pending',
        isRegistered: true,
        registrationCompletedAt: new Date()
      });

      if ((r.preferredRole === 'ngo_founder' || r.preferredRole === 'ngo_admin') && this.ngoCertFile()) {
        const ngoId = await this.ngoRegistry.registerNgo({
          name: r.ngoName,
          registrationNumber: r.ngoRegistrationNumber,
          operatingRegions: [r.region],
          primaryContact: {
            name: p.displayName,
            email: r.ngoEmail,
            phone: p.phone,
            designation: 'Founder'
          },
          address: {
            line1: p.address,
            city: 'Mumbai', // Default for pilot
            state: 'Maharashtra',
            pincode: ''
          },
          description: r.ngoDescription,
          focusAreas: r.ngoFocusAreas,
          sdgGoals: r.ngoSdgGoals,
          foundedYear: new Date().getFullYear(),
          tier: 'grassroots'
        }, [
          { file: this.ngoCertFile()!, type: 'registration_certificate' }
        ], this.ngoLogoFile() || undefined);

        // Save ngoId to user profile
        await this.firestoreService.updateUserProfile(user.uid, { ngoId });
      }

      this.registrationSuccess.set(true);
      // Explicitly sign out the user after ALL registration steps are complete
      // This forces them to 'Go back and login' as requested by the user
      await this.auth.signOut();
      this.snackBar.open('Registration complete! Please sign in.', 'OK', { duration: 5000 });
    } catch (e) {
      console.error(e);
      this.snackBar.open('Registration failed. Please try again.', 'OK', { duration: 4000 });
    } finally {
      this.submitting.set(false);
    }
  }

  ngOnDestroy() {
    this.stopCamera();
  }
}
