import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReportNeedComponent } from '../modals/report-need/report-need.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { SearchService } from '../core/ui/search.service';
import { FcmService } from '../core/firebase/fcm.service';
import { ThemeService } from '../core/ui/theme.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { AiChatComponent } from '../shared/components/ai-chat/ai-chat.component';
import { OfflineBannerComponent } from '../shared/components/offline-banner/offline-banner.component';
import { UserRole } from '../models';

export interface SahaayNotification {
  id: string;
  type: 'critical' | 'ai' | 'logistics' | 'volunteer';
  icon: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  route?: string;
}

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    MatDialogModule,
    MatSidenavModule,
    MatTooltipModule,
    MatDividerModule,
    AiChatComponent,
    OfflineBannerComponent
  ],
  template: `
    <app-offline-banner></app-offline-banner>
    <mat-sidenav-container class="shell-wrapper">
      <mat-sidenav #chatSidenav mode="over" position="end" class="chat-sidenav">
        <app-ai-chat></app-ai-chat>
      </mat-sidenav>

      <mat-sidenav-content class="shell-content">
        <!-- Side Navigation -->
        <nav class="sidebar">
          <div class="sidebar-header">
            <div class="logo-container">
              <div class="pulse-ring-indicator"></div>
              <h1 class="logo">Sahaay</h1>
            </div>
            <div class="ward-status-strip">
              <span class="pulse-live-dot"></span>
              <p class="ward-label">MUMBAI WARD 4 • COMMAND</p>
            </div>
          </div>

          <ul class="nav-list">
            @if (auth.hasPermission('view_home')) {
              <li>
                <a routerLink="/home" routerLinkActive="active" class="nav-link">
                  <mat-icon fontSet="material-symbols-rounded">space_dashboard</mat-icon>
                  <span>Command Center</span>
                </a>
              </li>
            }
            @if (auth.hasPermission('view_map')) {
              <li>
                <a routerLink="/needs-map" routerLinkActive="active" class="nav-link">
                  <mat-icon fontSet="material-symbols-rounded">map</mat-icon>
                  <span>Crisis Map</span>
                </a>
              </li>
            }
            @if (auth.hasPermission('view_tasks')) {
              <li>
                <a routerLink="/tasks" routerLinkActive="active" class="nav-link">
                  <mat-icon fontSet="material-symbols-rounded">task</mat-icon>
                  <span>Task Force</span>
                </a>
              </li>
            }
            @if (auth.hasPermission('view_all_volunteers') || auth.hasPermission('view_team_profiles')) {
              <li>
                <a routerLink="/volunteers" routerLinkActive="active" class="nav-link">
                  <mat-icon fontSet="material-symbols-rounded">group</mat-icon>
                  <span>Volunteers</span>
                </a>
              </li>
            }
            @if (auth.hasPermission('view_registry')) {
              <li>
                <a routerLink="/ngo-registry" routerLinkActive="active" class="nav-link">
                  <mat-icon fontSet="material-symbols-rounded">volunteer_activism</mat-icon>
                  <span>NGO Registry</span>
                </a>
              </li>
            }
            @if (auth.hasPermission('view_inventory')) {
              <li>
                <a routerLink="/resource-vault" routerLinkActive="active" class="nav-link">
                  <mat-icon fontSet="material-symbols-rounded">inventory_2</mat-icon>
                  <span>Resource Vault</span>
                </a>
              </li>
            }
            @if (auth.hasPermission('view_insights_own') || auth.hasPermission('view_insights_team') || auth.hasPermission('view_insights_ngo')) {
              <li>
                <a routerLink="/insights" routerLinkActive="active" class="nav-link">
                  <mat-icon fontSet="material-symbols-rounded">insights</mat-icon>
                  <span>Insights</span>
                </a>
              </li>
            }
            @if (auth.hasPermission('view_application_status')) {
              <li>
                <a routerLink="/verification-status" routerLinkActive="active" class="nav-link">
                  <mat-icon fontSet="material-symbols-rounded">verified_user</mat-icon>
                  <span>Status</span>
                </a>
              </li>
            }
            <li>
              <a routerLink="/settings" routerLinkActive="active" class="nav-link">
                <mat-icon fontSet="material-symbols-rounded">settings</mat-icon>
                <span>Settings</span>
              </a>
            </li>
          </ul>

          <div class="sidebar-footer">
            @if (auth.hasPermission('create_need')) {
              <button mat-flat-button class="urgent-report-btn" (click)="openReportNeed()">
                <mat-icon fontSet="material-symbols-rounded" style="font-variation-settings: 'FILL' 1;">add_alert</mat-icon>
                <span>Urgent Report</span>
              </button>
            }
            <a class="help-link">
              <mat-icon fontSet="material-symbols-rounded">help_outline</mat-icon>
              <span>Help Center</span>
            </a>
            <div class="org-logo-section">
              <div class="org-avatar">OL</div>
              <div>
                <p class="org-name">Sahaay Foundation</p>
              </div>
            </div>
          </div>
        </nav>

        <!-- Main Content Container -->
        <div class="main-container">
          <!-- Refined, Balanced, Fixed Top App Bar -->
          <header class="top-bar">
            <!-- Enhanced Search Bar with Ctrl+K shortcut -->
            <div class="search-bar" (click)="focusSearchInput()">
              <mat-icon fontSet="material-symbols-rounded">search</mat-icon>
              <input 
                #searchInput
                type="text" 
                placeholder="Search across Dharavi grid..."
                [value]="searchService.searchTerm()"
                (input)="onSearch($event)">
              <kbd class="kbd-badge">Ctrl K</kbd>
            </div>
            
            <!-- Balanced Right Action Controls -->
            <div class="top-actions">
              <!-- Dark / Light Theme Quick Toggle -->
              <button mat-icon-button class="action-btn" (click)="toggleTheme()" [matTooltip]="themeService.theme() === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
                <mat-icon fontSet="material-symbols-rounded">
                  {{ themeService.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}
                </mat-icon>
              </button>

              <!-- Notifications with interactive dropdown menu -->
              <button mat-icon-button class="action-btn" [matMenuTriggerFor]="notificationsMenu" matTooltip="Alerts & Dispatches">
                <mat-icon fontSet="material-symbols-rounded">notifications</mat-icon>
                <span class="notification-badge" *ngIf="unreadCount() > 0"></span>
              </button>

              <!-- Notifications Menu -->
              <mat-menu #notificationsMenu="matMenu" class="notifications-dropdown-menu" xPosition="before">
                <div class="menu-notif-header" (click)="$event.stopPropagation()">
                  <div class="notif-title-row">
                    <span class="notif-heading">Alerts & Dispatches</span>
                    <span class="badge-count" *ngIf="unreadCount() > 0">{{ unreadCount() }} New</span>
                  </div>
                  <button type="button" class="btn-mark-read" (click)="markAllNotificationsRead($event)" *ngIf="unreadCount() > 0">
                    Mark read
                  </button>
                </div>
                <mat-divider></mat-divider>

                <div class="notif-list-container" (click)="$event.stopPropagation()">
                  @for (n of notifications(); track n.id) {
                    <div class="notif-item-row" [class.unread]="!n.read" (click)="handleNotificationClick(n)">
                      <div class="notif-icon-box" [ngClass]="n.type">
                        <mat-icon fontSet="material-symbols-rounded">{{ n.icon }}</mat-icon>
                      </div>
                      <div class="notif-text-col">
                        <div class="notif-top">
                          <span class="notif-subject">{{ n.title }}</span>
                          <span class="notif-time">{{ n.time }}</span>
                        </div>
                        <p class="notif-body">{{ n.body }}</p>
                      </div>
                      <button type="button" class="btn-dismiss-mini" (click)="dismissNotification(n.id, $event)" title="Dismiss">
                        <mat-icon fontSet="material-symbols-rounded">close</mat-icon>
                      </button>
                    </div>
                  } @empty {
                    <div class="empty-notifs">
                      <mat-icon fontSet="material-symbols-rounded">notifications_off</mat-icon>
                      <p>No unread alerts. All clear!</p>
                    </div>
                  }
                </div>

                <mat-divider></mat-divider>
                <div class="notif-footer-row" (click)="$event.stopPropagation()">
                  <a routerLink="/needs-map" class="notif-footer-link">Crisis Map</a>
                  <span class="dot-sep">•</span>
                  <a routerLink="/tasks" class="notif-footer-link">Task Force</a>
                  <span class="dot-sep">•</span>
                  <a routerLink="/resource-vault" class="notif-footer-link">Vault</a>
                </div>
              </mat-menu>

              <!-- AI Coordinator Assistant (Brand Harmonized Color) -->
              <button mat-icon-button class="action-btn ai-assistant-btn" (click)="chatSidenav.toggle()" matTooltip="AI Coordinator Assistant">
                <mat-icon fontSet="material-symbols-rounded">auto_awesome</mat-icon>
              </button>

              <!-- User Profile Dropdown Button -->
              <div class="user-profile-trigger" [matMenuTriggerFor]="userMenu">
                <div class="avatar-circle">
                  <img *ngIf="user()?.photoURL; else initialTpl" [src]="user()?.photoURL" [alt]="displayName()" class="avatar-img">
                  <ng-template #initialTpl>
                    <span class="avatar-initial">{{ userInitial() }}</span>
                  </ng-template>
                  <span class="status-indicator"></span>
                </div>
                <div class="user-meta-text hidden-mobile">
                  <span class="user-name">{{ displayName() }}</span>
                  <span class="user-role">{{ formatRole(user()?.role) }}</span>
                </div>
                <mat-icon class="dropdown-chevron" fontSet="material-symbols-rounded">expand_more</mat-icon>
              </div>

              <!-- User Dropdown Menu -->
              <mat-menu #userMenu="matMenu" class="user-dropdown-menu" xPosition="before">
                <div class="menu-user-header" (click)="$event.stopPropagation()">
                  <p class="menu-user-name">{{ displayName() }}</p>
                  <p class="menu-user-email">{{ user()?.email || 'coordinator@sahaay.org' }}</p>
                  <div class="menu-badges">
                    <span class="role-tag">{{ formatRole(user()?.role) }}</span>
                    <span class="kyc-tag" *ngIf="user()?.faceVerified">✓ Vision KYC</span>
                  </div>
                </div>
                <mat-divider></mat-divider>
                
                <button mat-menu-item routerLink="/settings">
                  <mat-icon fontSet="material-symbols-rounded">manage_accounts</mat-icon>
                  <span>Account & Settings</span>
                </button>

                <button mat-menu-item (click)="toggleTheme()">
                  <mat-icon fontSet="material-symbols-rounded">{{ themeService.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
                  <span>{{ themeService.theme() === 'dark' ? 'Light Theme' : 'Dark Theme' }}</span>
                </button>

                <mat-divider></mat-divider>

                <!-- Quick Switch Testing Roles -->
                <div class="menu-role-section" (click)="$event.stopPropagation()">
                  <span class="role-switch-title">Switch Testing Role:</span>
                  <div class="role-pill-list">
                    <button type="button" class="role-pill" [class.active]="user()?.role === 'ngo_founder'" (click)="switchRole('ngo_founder', 'Priya Sharma (Founder)', 'founder@sahaay.org')">Founder</button>
                    <button type="button" class="role-pill" [class.active]="user()?.role === 'ngo_admin'" (click)="switchRole('ngo_admin', 'Aman Patel (Admin)', 'ngo.admin@sahaay.org')">Admin</button>
                    <button type="button" class="role-pill" [class.active]="user()?.role === 'field_lead'" (click)="switchRole('field_lead', 'Vikram Joshi (Field Lead)', 'field.lead@sahaay.org')">Lead</button>
                    <button type="button" class="role-pill" [class.active]="user()?.role === 'volunteer'" (click)="switchRole('volunteer', 'Rahul Mehta (Volunteer)', 'volunteer@sahaay.org')">Volunteer</button>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <button mat-menu-item class="signout-item" (click)="signOut()">
                  <mat-icon fontSet="material-symbols-rounded" class="text-danger">logout</mat-icon>
                  <span class="text-danger">Sign Out</span>
                </button>
              </mat-menu>

              <!-- Clerk fallback anchor if needed -->
              <div #clerkUserButton class="profile-avatar-clerk" style="display: none;"></div>
            </div>
          </header>

          <!-- Dynamic Page Content -->
          <main class="page-content">
            <router-outlet></router-outlet>
          </main>

          <!-- Mobile Bottom Nav -->
          <div class="bottom-nav hidden-desktop">
            @if (auth.hasPermission('view_home')) {
              <a routerLink="/home" routerLinkActive="active" class="bottom-nav-item">
                <mat-icon fontSet="material-symbols-rounded">space_dashboard</mat-icon>
                <span>Home</span>
              </a>
            }
            @if (auth.hasPermission('view_map')) {
              <a routerLink="/needs-map" routerLinkActive="active" class="bottom-nav-item">
                <mat-icon fontSet="material-symbols-rounded">map</mat-icon>
                <span>Map</span>
              </a>
            }
            @if (auth.hasPermission('view_tasks')) {
              <a routerLink="/tasks" routerLinkActive="active" class="bottom-nav-item">
                <mat-icon fontSet="material-symbols-rounded">task</mat-icon>
                <span>Tasks</span>
              </a>
            }
            @if (auth.hasPermission('view_inventory')) {
              <a routerLink="/resource-vault" routerLinkActive="active" class="bottom-nav-item">
                <mat-icon fontSet="material-symbols-rounded">inventory_2</mat-icon>
                <span>Vault</span>
              </a>
            }
            <a routerLink="/settings" routerLinkActive="active" class="bottom-nav-item">
              <mat-icon fontSet="material-symbols-rounded">settings</mat-icon>
              <span>Settings</span>
            </a>
          </div>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-wrapper {
      height: 100vh;
      width: 100vw;
      background-color: var(--color-surface);
    }
    
    .chat-sidenav {
      width: 400px;
      max-width: 100vw;
      border-left: 1px solid var(--color-border);
    }

    .shell-content {
      display: flex;
      height: 100%;
      overflow: hidden;
    }

    /* Fixed & Locked Sidebar */
    .sidebar {
      width: 260px !important;
      min-width: 260px !important;
      max-width: 260px !important;
      flex-shrink: 0 !important;
      height: 100%;
      background-color: var(--color-surface-container);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      padding: 24px 16px 18px;
      z-index: 50;
      box-sizing: border-box;
    }

    .sidebar-header {
      padding: 0 8px;
      margin-bottom: 22px;
      flex-shrink: 0;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
    }

    .pulse-ring-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--color-primary);
      animation: pulseRing 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      flex-shrink: 0;
    }

    .logo {
      font-family: var(--font-display), serif;
      font-size: 28px;
      margin: 0;
      color: var(--color-primary);
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    .ward-status-strip {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 6px;
    }

    .pulse-live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
      animation: breatheGlow 2s ease-in-out infinite;
    }

    .ward-label {
      font-size: 9.5px;
      font-weight: 700;
      color: var(--color-text-hint);
      letter-spacing: 0.14em;
      margin: 0;
      text-transform: uppercase;
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
      flex-grow: 1;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      text-decoration: none;
      color: var(--color-text-secondary);
      font-size: 11px;
      font-weight: 600;
      transition: all 0.15s ease;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      border: 1px solid transparent;
    }

    .nav-link mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      transition: transform 0.15s ease;
    }

    .nav-link:hover {
      background-color: var(--color-card);
      color: var(--color-primary);
      border-color: var(--color-border-subtle);
      transform: translateX(2px);
    }

    .nav-link.active {
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
      color: var(--color-on-primary);
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(0, 81, 71, 0.22);
      border-color: transparent;
    }

    .nav-link.active mat-icon {
      font-variation-settings: 'FILL' 1;
    }

    .sidebar-footer {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .urgent-report-btn {
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
      color: var(--color-on-primary) !important;
      border-radius: 10px;
      height: 40px;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow: 0 8px 24px rgba(0, 81, 71, 0.18);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      white-space: nowrap;

      mat-icon { font-size: 18px; }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(0, 81, 71, 0.28);
      }
    }

    .help-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 14px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-secondary);
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        background: var(--color-card);
        color: var(--color-primary);
      }

      mat-icon { font-size: 18px; flex-shrink: 0; }
    }

    .org-logo-section {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--color-card);
      border: 1px solid var(--color-border-subtle);
      box-shadow: var(--shadow-card);

      .org-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--color-primary-fixed), var(--color-primary-fixed-dim));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 800;
        color: var(--color-on-primary-fixed);
        flex-shrink: 0;
      }

      .org-name {
        font-size: 10.5px;
        font-weight: 700;
        color: var(--color-primary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    /* Main Container & Sticky Fixed Top Bar */
    .main-container {
      flex: 1 1 0 !important;
      min-width: 0 !important;
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      background: var(--color-surface);
    }

    .top-bar {
      height: 68px !important;
      min-height: 68px !important;
      max-height: 68px !important;
      flex-shrink: 0 !important;
      position: sticky;
      top: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      background-color: rgba(246, 244, 240, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--color-border);
      z-index: 40;
      box-sizing: border-box;
    }

    html.dark-theme .top-bar,
    body.dark-theme .top-bar {
      background-color: rgba(16, 22, 20, 0.88);
    }

    /* Search Bar with Keyboard Badge */
    .search-bar {
      display: flex;
      align-items: center;
      background-color: var(--color-surface-container);
      border-radius: 10px;
      padding: 7px 14px;
      width: 380px;
      max-width: 48vw;
      border: 1px solid var(--color-border);
      transition: all 0.2s ease;
      box-sizing: border-box;
      cursor: text;
    }

    .search-bar:focus-within {
      background-color: var(--color-card);
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(0, 81, 71, 0.12);
    }

    .search-bar mat-icon {
      color: var(--color-text-hint);
      font-size: 19px;
      width: 19px;
      height: 19px;
      margin-right: 8px;
      flex-shrink: 0;
    }

    .search-bar input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 13px;
      width: 100%;
      color: var(--color-text-primary);
    }

    .kbd-badge {
      display: inline-block;
      font-family: inherit;
      font-size: 10px;
      font-weight: 700;
      color: var(--color-text-hint);
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 5px;
      padding: 2px 6px;
      line-height: 1;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      flex-shrink: 0;
    }

    /* Right Action Grouping */
    .top-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .action-btn {
      color: var(--color-text-secondary);
      position: relative;
      transition: all 0.15s;
    }
    .action-btn:hover {
      color: var(--color-primary);
      background-color: var(--color-primary-light);
    }

    .notification-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 8px;
      height: 8px;
      background-color: var(--color-danger);
      border-radius: 50%;
      border: 2px solid var(--color-card);
      animation: breatheGlow 2s infinite;
    }

    .ai-assistant-btn {
      color: var(--color-primary);
      background: var(--color-primary-light);
      border-radius: 50%;
    }
    .ai-assistant-btn:hover {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    /* User Profile Trigger */
    .user-profile-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 10px 4px 4px;
      border-radius: 24px;
      background: rgba(0, 81, 71, 0.04);
      border: 1px solid rgba(0, 81, 71, 0.1);
      cursor: pointer;
      transition: all 0.2s;
      margin-left: 4px;
    }
    .user-profile-trigger:hover {
      background: rgba(0, 81, 71, 0.08);
      border-color: rgba(0, 81, 71, 0.2);
    }

    .avatar-circle {
      position: relative;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #005147, #0a6b5e);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      flex-shrink: 0;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .status-indicator {
      position: absolute;
      bottom: -1px;
      right: -1px;
      width: 8px;
      height: 8px;
      background: #22c55e;
      border: 1.5px solid #ffffff;
      border-radius: 50%;
    }

    .user-meta-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .user-name {
      font-size: 12px;
      font-weight: 700;
      color: #1a201e;
    }
    .user-role {
      font-size: 10px;
      font-weight: 600;
      color: #005147;
      text-transform: capitalize;
    }

    .dropdown-chevron {
      color: #64748b;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Notifications Dropdown */
    .menu-notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px 8px;
    }
    .notif-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .notif-heading {
      font-size: 13px;
      font-weight: 700;
      color: #1a201e;
    }
    .badge-count {
      font-size: 10px;
      font-weight: 800;
      background: #fee2e2;
      color: #dc2626;
      padding: 1px 6px;
      border-radius: 10px;
    }
    .btn-mark-read {
      background: transparent;
      border: none;
      font-size: 11px;
      font-weight: 600;
      color: #005147;
      cursor: pointer;
      &:hover { text-decoration: underline; }
    }

    .notif-list-container {
      max-height: 340px;
      width: 360px;
      max-width: 88vw;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
    }

    .notif-item-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid #f1f5f4;
      position: relative;

      &:hover { background: #f8faf9; }
      &.unread {
        background: #f0fdf4;
        border-left: 3px solid #16a34a;
      }
    }

    .notif-icon-box {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }

      &.critical { background: #fee2e2; color: #dc2626; }
      &.ai { background: #e8f5f2; color: #005147; }
      &.logistics { background: #e0f2fe; color: #0284c7; }
      &.volunteer { background: #dcfce7; color: #16a34a; }
    }

    .notif-text-col {
      flex: 1;
      min-width: 0;
    }

    .notif-top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 4px;
    }

    .notif-subject {
      font-size: 12px;
      font-weight: 700;
      color: #1a201e;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notif-time {
      font-size: 10px;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .notif-body {
      margin: 2px 0 0;
      font-size: 11px;
      color: #64748b;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .btn-dismiss-mini {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0;
      margin-top: 2px;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &:hover { color: #dc2626; }
    }

    .empty-notifs {
      padding: 24px;
      text-align: center;
      color: #94a3b8;
      mat-icon { font-size: 28px; width: 28px; height: 28px; margin-bottom: 4px; }
      p { margin: 0; font-size: 12px; }
    }

    .notif-footer-row {
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .notif-footer-link {
      font-size: 11px;
      font-weight: 600;
      color: #005147;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
    .dot-sep { color: #cbd5e1; font-size: 10px; }

    /* User Dropdown Menu */
    .menu-user-header {
      padding: 12px 16px 8px;
      outline: none;
    }
    .menu-user-name {
      margin: 0;
      font-weight: 700;
      font-size: 13px;
      color: #1a201e;
    }
    .menu-user-email {
      margin: 2px 0 6px;
      font-size: 11px;
      color: #64748b;
    }
    .menu-badges {
      display: flex;
      gap: 6px;
    }
    .role-tag {
      font-size: 10px;
      font-weight: 700;
      background: #e8f5f2;
      color: #005147;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .kyc-tag {
      font-size: 10px;
      font-weight: 700;
      background: #f0fdf4;
      color: #15803d;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .menu-role-section {
      padding: 8px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .role-switch-title {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .role-pill-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .role-pill {
      background: #f1f5f4;
      border: 1px solid #dce5e2;
      color: #3e4946;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .role-pill:hover { background: #e8f5f2; color: #005147; }
    .role-pill.active {
      background: #005147;
      color: #ffffff;
      border-color: #005147;
    }

    .text-danger { color: #dc2626 !important; }

    .page-content {
      flex: 1 1 auto !important;
      min-width: 0 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      padding: 24px 28px !important;
      box-sizing: border-box;
    }

    /* Bottom Nav (Mobile) */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 68px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98));
      backdrop-filter: blur(16px);
      display: flex;
      justify-content: space-around;
      align-items: center;
      border-top: 1px solid var(--color-outline-variant, #bec9c5);
      box-shadow: 0 -4px 20px rgba(0, 81, 71, 0.08);
      z-index: 100;
      padding-bottom: max(0px, env(safe-area-inset-bottom));
    }

    .bottom-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-decoration: none;
      color: var(--color-on-surface-variant, #3e4946);
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 8px 12px;
      border-radius: 8px;
      transition: all 0.15s ease;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        transition: all 0.15s ease;
      }

      &:hover {
        background: rgba(0, 81, 71, 0.05);
        color: var(--color-primary, #005147);
      }
    }

    .bottom-nav-item.active {
      color: var(--color-primary, #005147);

      mat-icon {
        font-variation-settings: 'FILL' 1;
        transform: scale(1.1);
      }
    }

    /* Responsive Queries */
    @media (max-width: 768px) {
      .hidden-mobile { display: none !important; }
      .top-bar { padding: 0 16px; }
      .search-bar { width: auto; flex-grow: 1; margin-right: 8px; }
      .page-content { padding: 16px; padding-bottom: 80px; }
    }

    @media (min-width: 769px) {
      .hidden-desktop { display: none !important; }
    }
  `]
})
export class AppShellComponent implements AfterViewInit, OnDestroy {
  protected auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  protected searchService = inject(SearchService);
  protected themeService = inject(ThemeService);
  private fcm = inject(FcmService);
  user = toSignal(this.auth.currentUser$);

  notifications = signal<SahaayNotification[]>([
    {
      id: 'n1',
      type: 'critical',
      icon: 'warning',
      title: 'Critical Need Unassigned',
      body: 'Dharavi Sector 4 • 40 tarpaulin shelter kits requested with 0 volunteers assigned.',
      time: '3m ago',
      read: false,
      route: '/needs-map'
    },
    {
      id: 'n2',
      type: 'ai',
      icon: 'auto_awesome',
      title: 'Vertex AI Match Ready',
      body: 'Found 3 volunteer medics within 1km for Sion Hospital Outpost mission.',
      time: '18m ago',
      read: false,
      route: '/tasks'
    },
    {
      id: 'n3',
      type: 'logistics',
      icon: 'inventory_2',
      title: 'QR Handover Logged',
      body: '15 units of Emergency Trauma First Aid Kit verified for Ward Dispatch.',
      time: '45m ago',
      read: false,
      route: '/resource-vault'
    },
    {
      id: 'n4',
      type: 'volunteer',
      icon: 'verified_user',
      title: 'Vision AI KYC Verified',
      body: 'Dr. Ravi Deshmukh successfully verified via Aadhaar biometrics.',
      time: '2h ago',
      read: true,
      route: '/volunteers'
    }
  ]);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('clerkUserButton') clerkUserButtonRef?: ElementRef<HTMLDivElement>;

  constructor() {
    this.fcm.init();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.focusSearchInput();
    }
  }

  focusSearchInput() {
    this.searchInputRef?.nativeElement?.focus();
  }

  displayName(): string {
    const u = this.user();
    if (u?.displayName) return u.displayName;
    return 'Priya Sharma';
  }

  userInitial(): string {
    const name = this.displayName();
    return name ? name.charAt(0).toUpperCase() : 'P';
  }

  formatRole(role?: string): string {
    if (!role) return 'Coordinator';
    const map: Record<string, string> = {
      super_admin: 'Super Admin',
      ngo_founder: 'NGO Founder',
      ngo_admin: 'NGO Admin',
      field_lead: 'Field Lead',
      volunteer: 'Volunteer',
      applicant: 'Applicant'
    };
    return map[role] || role;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  switchRole(role: UserRole, name: string, email: string) {
    this.auth.loginAsDemoUser(role, name, email);
  }

  markAllNotificationsRead(event?: Event) {
    event?.stopPropagation();
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  dismissNotification(id: string, event: Event) {
    event.stopPropagation();
    this.notifications.update(list => list.filter(n => n.id !== id));
  }

  handleNotificationClick(n: SahaayNotification) {
    this.notifications.update(list => list.map(item => item.id === n.id ? { ...item, read: true } : item));
    if (n.route) {
      this.router.navigate([n.route]);
    }
  }

  async signOut() {
    await this.auth.signOut();
    this.router.navigate(['/auth']);
  }

  async ngAfterViewInit() {
    await this.auth.ready;
    if (this.clerkUserButtonRef?.nativeElement && this.auth.clerkInstance) {
      this.auth.clerkInstance.mountUserButton(this.clerkUserButtonRef.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.clerkUserButtonRef?.nativeElement && this.auth.clerkInstance) {
      this.auth.clerkInstance.unmountUserButton(this.clerkUserButtonRef.nativeElement);
    }
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchService.setSearchTerm(input.value);
  }

  openReportNeed() {
    this.dialog.open(ReportNeedComponent, {
      width: '650px',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'glass-dialog'
    });
  }
}
