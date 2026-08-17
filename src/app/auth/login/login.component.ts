import { Component, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { UserRole } from '../../models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule
  ],
  template: `
    <div class="login-page">
      <!-- Ambient background blobs -->
      <div class="ambient-blob blob-1"></div>
      <div class="ambient-blob blob-2"></div>
      <div class="ambient-blob blob-3"></div>

      <main class="login-main">
        <div class="login-card">

          <!-- Brand Header -->
          <div class="brand-header">
            <div class="brand-icon">
              <mat-icon fontSet="material-symbols-rounded"
                        style="font-variation-settings: 'FILL' 1, 'wght' 300;">volunteer_activism</mat-icon>
            </div>
            <h1 class="brand-name">Sahaay</h1>
            <p class="brand-tagline">Humanitarian Coordination Platform</p>
          </div>

          <!-- Auth Mode Tabs -->
          <div class="auth-tabs">
            <button type="button" class="tab-btn" [class.active]="activeTab() === 'clerk'" (click)="setTab('clerk')">
              <mat-icon fontSet="material-symbols-rounded">lock</mat-icon>
              <span>Clerk Auth</span>
            </button>
            <button type="button" class="tab-btn" [class.active]="activeTab() === 'demo'" (click)="setTab('demo')">
              <mat-icon fontSet="material-symbols-rounded">badge</mat-icon>
              <span>Quick Roles</span>
            </button>
            <button type="button" class="tab-btn" [class.active]="activeTab() === 'direct'" (click)="setTab('direct')">
              <mat-icon fontSet="material-symbols-rounded">login</mat-icon>
              <span>Direct Sign In</span>
            </button>
          </div>

          <!-- TAB 1: Clerk Auth Container -->
          <div class="clerk-tab-content" [class.hidden]="activeTab() !== 'clerk'">
            <div class="clerk-container">
              @if (clerkLoading()) {
                <div class="clerk-loading-state">
                  <div class="spinner"></div>
                  <p>Connecting to Clerk Authentication...</p>
                </div>
              }
              @if (clerkLoadFailed()) {
                <div class="clerk-fallback-banner">
                  <mat-icon fontSet="material-symbols-rounded">cloud_off</mat-icon>
                  <div>
                    <strong>Clerk Service Unavailable</strong>
                    <p>Use Quick Roles or Direct Sign In below for instant access.</p>
                  </div>
                  <button type="button" class="switch-demo-btn" (click)="setTab('demo')">Switch to Demo Roles</button>
                </div>
              }
              <div #clerkHost class="clerk-host" [class.invisible]="clerkLoading() && !clerkMounted()"></div>
            </div>
          </div>

          <!-- TAB 2: Quick Demo Roles -->
          @if (activeTab() === 'demo') {
            <div class="demo-roles-container">
              <p class="section-lead">Select a role to test Sahaay with preloaded permissions and data:</p>
              <div class="roles-grid">
                @for (role of demoRoles; track role.id) {
                  <button type="button" class="role-tile" (click)="selectDemoRole(role.id, role.name, role.email)">
                    <div class="role-tile-header">
                      <div class="role-badge-icon" [style.background]="role.bg" [style.color]="role.color">
                        <mat-icon fontSet="material-symbols-rounded">{{ role.icon }}</mat-icon>
                      </div>
                      <div class="role-meta">
                        <span class="role-title">{{ role.title }}</span>
                        <span class="role-subtitle">{{ role.name }}</span>
                      </div>
                    </div>
                    <p class="role-desc">{{ role.desc }}</p>
                  </button>
                }
              </div>
            </div>
          }

          <!-- TAB 3: Direct Email Sign In -->
          @if (activeTab() === 'direct') {
            <div class="direct-auth-container">
              <form (submit)="onDirectSubmit($event)" class="direct-form">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <div class="input-box">
                    <mat-icon fontSet="material-symbols-rounded">person</mat-icon>
                    <input type="text" [(ngModel)]="directName" name="directName" placeholder="e.g. Priya Sharma" required>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <div class="input-box">
                    <mat-icon fontSet="material-symbols-rounded">mail</mat-icon>
                    <input type="email" [(ngModel)]="directEmail" name="directEmail" placeholder="coordinator@sahaay.org" required>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Access Role</label>
                  <div class="input-box">
                    <mat-icon fontSet="material-symbols-rounded">admin_panel_settings</mat-icon>
                    <select [(ngModel)]="directRole" name="directRole" class="role-select">
                      <option value="ngo_founder">NGO Founder</option>
                      <option value="ngo_admin">NGO Admin</option>
                      <option value="field_lead">Field Lead</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                </div>

                <button type="submit" class="submit-auth-btn">
                  <span>Sign In to Dashboard</span>
                  <mat-icon fontSet="material-symbols-rounded">arrow_forward</mat-icon>
                </button>
              </form>
            </div>
          }

          <!-- Registration Link -->
          <div class="register-prompt">
            <span>New organization or volunteer?</span>
            <button type="button" class="register-link-btn" (click)="goToRegister()">Complete Registration</button>
          </div>

        </div>

        <!-- Footer -->
        <p class="login-footer">© 2024 Sahaay — Empowering Communities</p>
      </main>
    </div>
  `,
  styles: [`
    /* ===== Page Layout ===== */
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-surface);
      position: relative;
      overflow: hidden;
      font-family: var(--font-ui);
    }

    /* ===== Ambient Topographic Grid ===== */
    .ambient-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.18;
      pointer-events: none;
    }
    .blob-1 {
      width: 500px; height: 500px;
      background: var(--color-primary-fixed-dim);
      top: -140px; left: -100px;
    }
    .blob-2 {
      width: 400px; height: 400px;
      background: var(--color-secondary-fixed-dim);
      bottom: -80px; right: -60px;
    }
    .blob-3 {
      width: 260px; height: 260px;
      background: var(--color-warning-light);
      top: 35%; right: 8%;
      opacity: 0.12;
    }

    /* ===== Main Container ===== */
    .login-main {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 480px;
      padding: 24px;
      animation: fadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* ===== Card ===== */
    .login-card {
      background: var(--color-card);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: var(--shadow-elevated);
      border: 1px solid var(--color-border);
    }

    /* ===== Brand Header ===== */
    .brand-header {
      text-align: center;
      padding: 32px 24px 18px;
    }

    .brand-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 54px; height: 54px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
      color: var(--color-on-primary);
      margin-bottom: 12px;
      box-shadow: 0 8px 24px rgba(0, 81, 71, 0.28);
    }
    .brand-icon mat-icon {
      font-size: 28px;
      width: 28px; height: 28px;
    }

    .brand-name {
      margin: 0;
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-primary);
      letter-spacing: -0.02em;
    }

    .brand-tagline {
      margin: 4px 0 0;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    /* ===== Auth Tabs ===== */
    .auth-tabs {
      display: flex;
      background: var(--color-surface-container);
      margin: 0 20px 16px;
      padding: 4px;
      border-radius: 12px;
      gap: 4px;
      border: 1px solid var(--color-border);
    }

    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 6px;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .tab-btn.active {
      background: var(--color-card);
      color: var(--color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    /* ===== Clerk Content ===== */
    .clerk-tab-content {
      padding: 0 16px 12px;
    }
    .clerk-tab-content.hidden {
      display: none;
    }

    .clerk-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 320px;
    }

    .clerk-host {
      width: 100%;
      display: flex;
      justify-content: center;
    }
    .clerk-host.invisible {
      display: none;
    }

    .clerk-loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--color-text-secondary);
      font-size: 0.85rem;
      padding: 40px 0;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(0, 81, 71, 0.15);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .clerk-fallback-banner {
      background: var(--color-warning-light);
      border: 1px solid var(--color-warning);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
      color: #9a3412;
      font-size: 0.85rem;
      margin-bottom: 12px;
    }
    .clerk-fallback-banner mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #ea580c;
    }
    .switch-demo-btn {
      margin-top: 6px;
      background: var(--color-primary);
      color: var(--color-on-primary);
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
    }

    /* ===== Demo Roles Grid ===== */
    .demo-roles-container {
      padding: 4px 20px 16px;
    }

    .section-lead {
      margin: 0 0 12px;
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      line-height: 1.4;
    }

    .roles-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .role-tile {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 12px 14px;
      background: var(--color-surface-container-low);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }
    .role-tile:hover {
      background: var(--color-card);
      border-color: var(--color-primary);
      box-shadow: var(--shadow-card);
      transform: translateY(-2px);
    }

    .role-tile-header {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }

    .role-badge-icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .role-badge-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .role-meta {
      display: flex;
      flex-direction: column;
    }
    .role-title {
      font-size: 0.86rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .role-subtitle {
      font-size: 0.72rem;
      color: var(--color-text-secondary);
    }

    .role-desc {
      margin: 6px 0 0 44px;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      line-height: 1.35;
    }

    /* ===== Direct Sign In Form ===== */
    .direct-auth-container {
      padding: 8px 20px 16px;
    }

    .direct-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-text-secondary);
    }

    .input-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--color-surface-container-low);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 8px 12px;
      transition: border-color 0.2s;
    }
    .input-box:focus-within {
      border-color: var(--color-primary);
      background: var(--color-card);
      box-shadow: 0 0 0 2px rgba(0, 81, 71, 0.12);
    }
    .input-box mat-icon {
      color: var(--color-text-secondary);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .input-box input, .role-select {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.85rem;
      color: var(--color-text-primary);
      font-family: inherit;
    }

    .submit-auth-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
      color: var(--color-on-primary);
      border: none;
      border-radius: 10px;
      padding: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 4px;
      box-shadow: 0 4px 14px rgba(0, 81, 71, 0.25);
      transition: all 0.2s ease;
    }
    .submit-auth-btn:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }

    /* ===== Register Prompt ===== */
    .register-prompt {
      padding: 14px 20px;
      background: var(--color-surface-container-low);
      border-top: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 0.8rem;
      color: var(--color-text-secondary);
    }

    .register-link-btn {
      background: none;
      border: none;
      color: var(--color-primary);
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
    }

    .login-footer {
      text-align: center;
      margin-top: 16px;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
    }
  `]
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);

  @ViewChild('clerkHost') clerkHost?: ElementRef<HTMLDivElement>;
  private authSub?: Subscription;

  activeTab = signal<'clerk' | 'demo' | 'direct'>('clerk');
  clerkLoading = signal(true);
  clerkMounted = signal(false);
  clerkLoadFailed = signal(false);

  directName = 'Aman Patel';
  directEmail = 'admin@sahaay.org';
  directRole: UserRole = 'ngo_admin';

  demoRoles = [
    {
      id: 'ngo_founder' as UserRole,
      title: 'NGO Founder',
      name: 'Priya Sharma',
      email: 'founder@sahaay.org',
      icon: 'domain',
      bg: 'var(--color-success-light)',
      color: '#137333',
      desc: 'Full org registry, NGO setup, resource vault and team analytics.'
    },
    {
      id: 'ngo_admin' as UserRole,
      title: 'NGO Coordinator / Admin',
      name: 'Aman Patel',
      email: 'admin@sahaay.org',
      icon: 'admin_panel_settings',
      bg: 'var(--color-info-light)',
      color: '#1a73e8',
      desc: 'AI Volunteer Matching, task dispatching, crisis heatmap & reports.'
    },
    {
      id: 'field_lead' as UserRole,
      title: 'Field Lead',
      name: 'Vikram Joshi',
      email: 'lead.mumbai@sahaay.org',
      icon: 'supervisor_account',
      bg: '#fef7e0',
      color: '#b06000',
      desc: 'On-ground field coordination, live incident reports & team updates.'
    },
    {
      id: 'volunteer' as UserRole,
      title: 'Volunteer',
      name: 'Rohan Deshmukh',
      email: 'rohan.volunteer@sahaay.org',
      icon: 'handshake',
      bg: '#fce8e6',
      color: '#c5221f',
      desc: 'Task acceptance, volunteer dashboard, hours logged & badges.'
    },
    {
      id: 'super_admin' as UserRole,
      title: 'Super Admin',
      name: 'Central Command',
      email: 'superadmin@sahaay.org',
      icon: 'shield_person',
      bg: '#f3e8fd',
      color: '#7b1fa2',
      desc: 'Cross-city analytics, system monitoring & humanitarian governance.'
    }
  ];

  ngOnInit() {
    this.authSub = this.auth.currentUser$.subscribe(user => {
      if (user) {
        if (user.isRegistered) {
          this.router.navigate(['/home']);
        } else {
          this.router.navigate(['/register']);
        }
      }
    });
  }

  async ngAfterViewInit() {
    try {
      // 5-second timeout for Clerk to avoid hanging
      const clerkTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Clerk load timeout')), 5000)
      );

      await Promise.race([this.auth.ready, clerkTimeout]);

      if (this.clerkHost?.nativeElement && this.auth.clerkInstance) {
        this.auth.clerkInstance.mountSignIn(this.clerkHost.nativeElement, {
          routing: 'hash',
          appearance: {
            variables: {
              colorPrimary: '#005147',
              colorBackground: '#ffffff',
              borderRadius: '0.75rem',
              fontFamily: 'Inter, sans-serif',
            },
            elements: {
              card: 'shadow-none border-none p-0 bg-transparent',
              rootBox: 'w-full',
            }
          }
        });
        this.clerkMounted.set(true);
        this.clerkLoading.set(false);
      } else {
        throw new Error('Clerk instance not ready');
      }
    } catch (e) {
      console.warn('[Auth] Clerk initialization fallback active:', e);
      this.clerkLoading.set(false);
      this.clerkLoadFailed.set(true);
      // Auto-switch to Demo tab if Clerk cannot be loaded
      this.activeTab.set('demo');
    }
  }

  setTab(tab: 'clerk' | 'demo' | 'direct') {
    this.activeTab.set(tab);
  }

  selectDemoRole(role: UserRole, name: string, email: string) {
    this.auth.loginAsDemoUser(role, name, email);
    this.router.navigate(['/home']);
  }

  onDirectSubmit(event: Event) {
    event.preventDefault();
    if (!this.directEmail) return;
    this.auth.loginAsDemoUser(this.directRole, this.directName, this.directEmail);
    this.router.navigate(['/home']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
    if (this.clerkHost?.nativeElement && this.auth.clerkInstance) {
      this.auth.clerkInstance.unmountSignIn(this.clerkHost.nativeElement);
    }
  }
}
