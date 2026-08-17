import { Component, inject, signal, ElementRef, ViewChild, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgentService } from '../../../core/ai/agent.service';
import { AuthService } from '../../../core/auth/auth.service';

interface QuickAction {
  label: string;
  query?: string;
  route?: string;
  icon?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  formattedHtml?: SafeHtml;
  agentUsed?: string;
  agentIcon?: string;
  agentColor?: string;
  quickActions?: QuickAction[];
  timestamp: string;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTooltipModule, 
    FormsModule, 
    MatProgressSpinnerModule
  ],
  template: `
    <aside class="ai-console-drawer" aria-label="Sahaay AI Coordinator Command">
      <!-- 1. Top Telemetry Header -->
      <header class="console-header">
        <div class="header-brand-block">
          <div class="agent-orb-container">
            <div class="agent-orb">
              <mat-icon fontSet="material-symbols-rounded">auto_awesome</mat-icon>
            </div>
            <span class="live-signal-beacon" title="Vertex AI Reasoning Mesh Online"></span>
          </div>
          <div class="header-text-block">
            <div class="header-title-line">
              <h2 class="console-title">Sahaay Coordinator AI</h2>
              <span class="model-badge">
                <span class="pulse-dot-green"></span>
                Gemini 2.0
              </span>
            </div>
            <div class="telemetry-sub-line">
              <span class="telemetry-item">MUMBAI WARD 4</span>
              <span class="telemetry-sep">•</span>
              <span class="telemetry-item">MESH ONLINE</span>
              <span class="telemetry-sep">•</span>
              <span class="telemetry-item">LATENCY 140ms</span>
            </div>
          </div>
        </div>

        <div class="header-ctrl-group">
          <button 
            type="button" 
            class="console-btn-tool" 
            (click)="clearChat()" 
            matTooltip="Clear Console Stream">
            <mat-icon fontSet="material-symbols-rounded">delete_sweep</mat-icon>
          </button>
          <button 
            type="button" 
            class="console-btn-tool close-btn" 
            (click)="closeChat.emit()" 
            matTooltip="Close Assistant Drawer">
            <mat-icon fontSet="material-symbols-rounded">close</mat-icon>
          </button>
        </div>
      </header>

      <!-- 2. Fast Command Filter Bar -->
      <nav class="command-filters-bar" aria-label="Quick Agent Shortcuts">
        <div class="command-chips-track">
          @for (cmd of commandChips; track cmd.label) {
            <button 
              type="button" 
              class="command-chip" 
              (click)="sendQuickQuery(cmd.query)" 
              [disabled]="isLoading()">
              <mat-icon fontSet="material-symbols-rounded" class="chip-icon">{{ cmd.icon }}</mat-icon>
              <span>{{ cmd.label }}</span>
            </button>
          }
        </div>
      </nav>

      <!-- 3. Message Stream -->
      <main class="console-stream-area" #scrollContainer>
        @for (msg of messages(); track msg.id) {
          <article class="stream-row" [ngClass]="msg.role">
            <!-- Assistant Avatar -->
            @if (msg.role === 'assistant') {
              <div class="msg-avatar-col assistant-avatar-col">
                <div class="bot-badge-icon" [ngClass]="msg.agentColor || 'default-agent'">
                  <mat-icon fontSet="material-symbols-rounded">{{ msg.agentIcon || 'smart_toy' }}</mat-icon>
                </div>
              </div>
            }

            <div class="msg-bubble-group">
              <!-- Agent Header Strip -->
              @if (msg.role === 'assistant') {
                <div class="agent-source-strip">
                  <div class="agent-name-tag">
                    <span class="agent-source-name">{{ msg.agentUsed || 'Sahaay Orchestrator' }}</span>
                  </div>
                  <time class="msg-time">{{ msg.timestamp }}</time>
                </div>
              }

              <!-- Content Bubble Card -->
              <div class="message-card" [ngClass]="msg.role">
                <div class="message-rich-text" [innerHTML]="msg.formattedHtml || msg.content"></div>

                <!-- 1-Click Action Buttons inside response -->
                @if (msg.quickActions && msg.quickActions.length > 0) {
                  <div class="action-dock">
                    @for (action of msg.quickActions; track action.label) {
                      <button 
                        type="button" 
                        class="dock-action-pill" 
                        (click)="handleActionClick(action)">
                        <mat-icon fontSet="material-symbols-rounded" class="action-icon">
                          {{ action.icon || 'arrow_outward' }}
                        </mat-icon>
                        <span>{{ action.label }}</span>
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- Message Utility Footer -->
              <footer class="msg-utility-footer" [ngClass]="msg.role">
                @if (msg.role === 'user') {
                  <time class="msg-time user-time">{{ msg.timestamp }}</time>
                } @else {
                  <button 
                    type="button" 
                    class="util-copy-btn" 
                    (click)="copyMessage(msg.content, $event)" 
                    matTooltip="Copy intelligence card">
                    <mat-icon fontSet="material-symbols-rounded">content_copy</mat-icon>
                    <span>Copy</span>
                  </button>
                }
              </footer>
            </div>

            <!-- User Avatar -->
            @if (msg.role === 'user') {
              <div class="msg-avatar-col user-avatar-col">
                <div class="user-badge-initial">
                  {{ userInitial() }}
                </div>
              </div>
            }
          </article>
        }

        <!-- Thinking State -->
        @if (isLoading()) {
          <article class="stream-row assistant thinking-row">
            <div class="msg-avatar-col assistant-avatar-col">
              <div class="bot-badge-icon pulse-orb-glow">
                <mat-icon fontSet="material-symbols-rounded">sync</mat-icon>
              </div>
            </div>
            <div class="msg-bubble-group">
              <div class="message-card assistant thinking-card-box">
                <div class="thinking-inner-flex">
                  <div class="wave-spinner">
                    <span class="bar bar-1"></span>
                    <span class="bar bar-2"></span>
                    <span class="bar bar-3"></span>
                    <span class="bar bar-4"></span>
                  </div>
                  <div class="thinking-text-wrap">
                    <span class="thinking-headline">Synthesizing Mumbai Command Grid...</span>
                    <span class="thinking-subline">Querying Vertex Reasoning Mesh & Live Ward 4 Telemetry</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        }
      </main>

      <!-- 4. Modern Input Command Console -->
      <footer class="console-input-deck">
        <div class="input-command-bar">
          <div class="command-prefix-badge" (click)="focusInput()">
            <span class="prefix-symbol">/</span>
          </div>
          <input 
            #commandInput
            type="text" 
            class="console-text-input" 
            [(ngModel)]="currentQuery" 
            (keyup.enter)="sendMessage()" 
            placeholder="Type command (/status, /volunteers, /critical) or question..." 
            [disabled]="isLoading()"
          />
          <button 
            type="button" 
            class="console-send-trigger" 
            (click)="sendMessage()" 
            [disabled]="!currentQuery.trim() || isLoading()"
            matTooltip="Dispatch Query (Enter)">
            <mat-icon fontSet="material-symbols-rounded">arrow_upward</mat-icon>
          </button>
        </div>

        <div class="command-deck-footer-hints">
          <span class="hint-text"><strong>Tip:</strong> Ask for volunteer skills, critical needs in Dharavi, or monsoon surge forecast</span>
        </div>
      </footer>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }

    .ai-console-drawer {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background: var(--color-surface, #f6f4f0);
      color: var(--color-on-surface, #0e1513);
      font-family: var(--font-ui, 'Inter', sans-serif);
      box-sizing: border-box;
      position: relative;
    }

    /* ─── 1. Header ─── */
    .console-header {
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #003830 0%, #005147 60%, #0a6b5e 100%);
      color: #ffffff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 4px 24px rgba(0, 56, 48, 0.25);
      z-index: 10;
      flex-shrink: 0;
    }

    .header-brand-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .agent-orb-container {
      position: relative;
      flex-shrink: 0;
    }

    .agent-orb {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.08));
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255, 255, 255, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fbbf24;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        animation: spinSlow 16s linear infinite;
      }
    }

    @keyframes spinSlow {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .live-signal-beacon {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: #10b981;
      border: 2px solid #003830;
      box-shadow: 0 0 10px #10b981;
      animation: signalPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes signalPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.25); opacity: 0.7; }
    }

    .header-text-block {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .header-title-line {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .console-title {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.2rem;
      margin: 0;
      color: #ffffff;
      font-weight: 700;
      letter-spacing: -0.01em;
      line-height: 1.1;
    }

    .model-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 9.5px;
      font-weight: 800;
      background: rgba(161, 242, 225, 0.2);
      color: #a1f2e1;
      padding: 2px 7px;
      border-radius: 12px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border: 1px solid rgba(161, 242, 225, 0.35);
    }

    .pulse-dot-green {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }

    .telemetry-sub-line {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.72);
      letter-spacing: 0.06em;
      font-family: var(--font-mono, monospace);
    }

    .telemetry-sep {
      opacity: 0.5;
    }

    .header-ctrl-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .console-btn-tool {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #ffffff;
      width: 34px;
      height: 34px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.18s ease;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: translateY(-1px);
      }

      &.close-btn:hover {
        background: rgba(239, 68, 68, 0.4);
        border-color: rgba(239, 68, 68, 0.6);
      }
    }

    /* ─── 2. Fast Command Filters Bar ─── */
    .command-filters-bar {
      padding: 10px 14px;
      background: var(--color-surface-container-low, #f1ede6);
      border-bottom: 1px solid var(--color-border, #e3ded6);
      flex-shrink: 0;
    }

    .command-chips-track {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .command-chip {
      background: var(--color-card, #ffffff);
      border: 1px solid var(--color-border, #e3ded6);
      border-radius: 20px;
      padding: 5px 12px;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--color-primary, #005147);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);

      .chip-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
        color: var(--color-primary-container, #0a6b5e);
      }

      &:hover:not([disabled]) {
        background: var(--color-primary, #005147);
        color: #ffffff;
        border-color: var(--color-primary, #005147);
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(0, 81, 71, 0.18);

        .chip-icon {
          color: #a1f2e1;
        }
      }

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    }

    /* ─── 3. Message Stream ─── */
    .console-stream-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .stream-row {
      display: flex;
      gap: 10px;
      max-width: 100%;

      &.user {
        justify-content: flex-end;
      }

      &.assistant {
        justify-content: flex-start;
      }
    }

    .msg-avatar-col {
      flex-shrink: 0;
      padding-top: 2px;
    }

    .bot-badge-icon {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: linear-gradient(135deg, #005147, #0a6b5e);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 81, 71, 0.2);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &.match-agent {
        background: linear-gradient(135deg, #0284c7, #0369a1);
      }

      &.surge-agent {
        background: linear-gradient(135deg, #d97706, #b45309);
      }

      &.narrator-agent {
        background: linear-gradient(135deg, #7c3aed, #6d28d9);
      }
    }

    .user-badge-initial {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: #394744;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .msg-bubble-group {
      display: flex;
      flex-direction: column;
      max-width: 86%;
    }

    .agent-source-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 5px;
      padding: 0 4px;
    }

    .agent-source-name {
      font-size: 10.5px;
      font-weight: 800;
      color: var(--color-primary, #005147);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-family: var(--font-mono, monospace);
    }

    .msg-time {
      font-size: 10px;
      color: var(--color-text-hint, #7a8a86);
      font-weight: 500;
      font-family: var(--font-mono, monospace);

      &.user-time {
        margin-top: 4px;
        display: block;
        text-align: right;
        padding-right: 4px;
      }
    }

    .message-card {
      padding: 14px 16px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.55;
      position: relative;
      box-sizing: border-box;

      &.user {
        background: linear-gradient(135deg, #005147 0%, #0a6b5e 100%);
        color: #ffffff;
        border-bottom-right-radius: 4px;
        box-shadow: 0 3px 12px rgba(0, 81, 71, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      &.assistant {
        background: var(--color-card, #ffffff);
        color: var(--color-text-primary, #0e1513);
        border: 1px solid var(--color-border, #e3ded6);
        border-bottom-left-radius: 4px;
        box-shadow: 0 3px 14px rgba(0, 0, 0, 0.05);
      }
    }

    .message-rich-text {
      white-space: pre-wrap;
      word-break: break-word;

      ::ng-deep p { margin: 0 0 8px 0; &:last-child { margin-bottom: 0; } }
      ::ng-deep strong { font-weight: 700; color: var(--color-primary, #005147); }
      ::ng-deep ul { margin: 6px 0 8px 18px; padding: 0; }
      ::ng-deep li { margin-bottom: 4px; }
      ::ng-deep .badge-critical { 
        background: #fee2e2; 
        color: #991b1b; 
        padding: 2px 7px; 
        border-radius: 4px; 
        font-weight: 800; 
        font-size: 10px; 
        letter-spacing: 0.04em;
        border: 1px solid #fca5a5;
      }
      ::ng-deep .badge-optimal { 
        background: #dcfce7; 
        color: #15803d; 
        padding: 2px 7px; 
        border-radius: 4px; 
        font-weight: 800; 
        font-size: 10px; 
        border: 1px solid #86efac;
      }
      ::ng-deep .stat-highlight-box {
        background: var(--color-surface-container-low, #f1ede6);
        border-left: 3px solid var(--color-primary, #005147);
        padding: 8px 12px;
        margin: 8px 0;
        border-radius: 0 8px 8px 0;
        font-size: 12.5px;
      }
    }

    .action-dock {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid var(--color-border-subtle, #eeeae3);
    }

    .dock-action-pill {
      background: var(--color-surface-container, #ece8e1);
      border: 1px solid var(--color-border, #e3ded6);
      border-radius: 8px;
      padding: 5px 11px;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--color-primary, #005147);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      transition: all 0.15s ease;

      .action-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      &:hover {
        background: var(--color-primary, #005147);
        color: #ffffff;
        border-color: var(--color-primary, #005147);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 81, 71, 0.18);
      }
    }

    .msg-utility-footer {
      display: flex;
      align-items: center;
      margin-top: 4px;
      padding: 0 4px;

      &.user {
        justify-content: flex-end;
      }

      &.assistant {
        justify-content: flex-start;
      }
    }

    .util-copy-btn {
      background: transparent;
      border: none;
      font-size: 10px;
      font-weight: 700;
      color: var(--color-text-hint, #7a8a86);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: all 0.15s;

      mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }

      &:hover {
        background: var(--color-surface-container, #ece8e1);
        color: var(--color-primary, #005147);
      }
    }

    /* ─── Thinking Card ─── */
    .thinking-card-box {
      background: var(--color-card, #ffffff) !important;
      border: 1.5px dashed var(--color-primary, #005147) !important;
      padding: 12px 16px !important;
    }

    .thinking-inner-flex {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .wave-spinner {
      display: flex;
      align-items: center;
      gap: 3px;
      height: 20px;

      .bar {
        width: 3px;
        height: 100%;
        background: var(--color-primary, #005147);
        border-radius: 3px;
        animation: waveGrow 1.2s ease-in-out infinite;

        &.bar-1 { animation-delay: 0s; }
        &.bar-2 { animation-delay: 0.15s; }
        &.bar-3 { animation-delay: 0.3s; }
        &.bar-4 { animation-delay: 0.45s; }
      }
    }

    @keyframes waveGrow {
      0%, 40%, 100% { transform: scaleY(0.4); opacity: 0.4; }
      20% { transform: scaleY(1); opacity: 1; }
    }

    .thinking-text-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .thinking-headline {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--color-primary, #005147);
    }

    .thinking-subline {
      font-size: 10.5px;
      color: var(--color-text-hint, #7a8a86);
      font-family: var(--font-mono, monospace);
    }

    /* ─── 4. Input Console Deck ─── */
    .console-input-deck {
      padding: 14px 16px 12px;
      background: var(--color-card, #ffffff);
      border-top: 1px solid var(--color-border, #e3ded6);
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-shrink: 0;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.03);
    }

    .input-command-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--color-surface-container-low, #f1ede6);
      border: 1.5px solid var(--color-border, #e3ded6);
      border-radius: 30px;
      padding: 4px 6px 4px 10px;
      transition: all 0.2s ease;

      &:focus-within {
        background: #ffffff;
        border-color: var(--color-primary, #005147);
        box-shadow: 0 0 0 3px rgba(0, 81, 71, 0.12);
      }
    }

    .command-prefix-badge {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: var(--color-surface-container-high, #e5e0d7);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;

      .prefix-symbol {
        font-family: var(--font-mono, monospace);
        font-weight: 800;
        font-size: 13px;
        color: var(--color-primary, #005147);
      }
    }

    .console-text-input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 13px;
      color: var(--color-text-primary, #0e1513);
      font-family: inherit;

      &::placeholder {
        color: var(--color-text-hint, #7a8a86);
        font-size: 12.5px;
      }
    }

    .console-send-trigger {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--color-primary, #005147);
      color: #ffffff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      flex-shrink: 0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover:not([disabled]) {
        background: #0a6b5e;
        transform: scale(1.06);
        box-shadow: 0 3px 10px rgba(0, 81, 71, 0.25);
      }

      &:disabled {
        background: var(--color-border, #e3ded6);
        color: var(--color-text-hint, #7a8a86);
        cursor: not-allowed;
      }
    }

    .command-deck-footer-hints {
      display: flex;
      align-items: center;
      justify-content: center;

      .hint-text {
        font-size: 10px;
        color: var(--color-text-hint, #7a8a86);
        text-align: center;
      }
    }
  `]
})
export class AiChatComponent implements OnInit {
  private agentService = inject(AgentService);
  private auth = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);

  @Output() closeChat = new EventEmitter<void>();
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('commandInput') private commandInput!: ElementRef;

  commandChips = [
    { label: 'Ward Status', query: 'What is the status of Mumbai Ward 4?', icon: 'space_dashboard' },
    { label: 'Volunteers', query: 'How many volunteers are available right now?', icon: 'group' },
    { label: 'Critical Needs', query: 'Show critical emergency needs in Dharavi and Kurla', icon: 'emergency' },
    { label: 'Surge Forecast', query: 'What is the 7-day monsoon surge forecast?', icon: 'storm' },
    { label: 'Vault Inventory', query: 'Check resource vault supply levels', icon: 'inventory_2' }
  ];

  messages = signal<ChatMessage[]>([]);
  currentQuery = '';
  isLoading = signal<boolean>(false);

  ngOnInit() {
    this.messages.set([
      {
        id: 'msg_initial_ready',
        role: 'assistant',
        agentUsed: 'OrchestratorAgent · Mumbai Command',
        agentIcon: 'hub',
        agentColor: 'default-agent',
        content: '**Sahaay Multi-Agent Operations Mesh Online**\n\nI am your live Operational Intelligence Coordinator for Mumbai Ward 4.\n\n• **Real-Time Grid**: 5 Crisis Tickets active in Dharavi & Kurla\n• **Volunteer Standby**: **23 Verified Responders** ready for emergency dispatch\n• **Predictive Surge**: Monsoon surge probability at 85%\n\n*Select a command chip above or ask any question to begin.*',
        formattedHtml: this.formatMarkdown('**Sahaay Multi-Agent Operations Mesh Online**\n\nI am your live Operational Intelligence Coordinator for Mumbai Ward 4.\n\n• **Real-Time Grid**: 5 Crisis Tickets active in Dharavi & Kurla\n• **Volunteer Standby**: **23 Verified Responders** ready for emergency dispatch\n• **Predictive Surge**: Monsoon surge probability at 85%\n\n*Select a command chip above or ask any question to begin.*'),
        quickActions: [
          { label: '📊 Ward Status', query: 'What is the status of Mumbai Ward 4?', icon: 'space_dashboard' },
          { label: '🚨 Critical Needs', query: 'Show critical emergency needs in Dharavi and Kurla', icon: 'emergency' },
          { label: '🗺️ Open Crisis Map', route: '/needs-map', icon: 'map' }
        ],
        timestamp: this.getCurrentTimeString()
      }
    ]);
  }

  userInitial(): string {
    const user = this.auth.currentUser;
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'C';
  }

  focusInput() {
    if (this.commandInput) {
      this.commandInput.nativeElement.focus();
    }
  }

  sendQuickQuery(query?: string) {
    if (!query || this.isLoading()) return;
    this.currentQuery = query;
    this.sendMessage();
  }

  async sendMessage() {
    if (!this.currentQuery.trim() || this.isLoading()) return;

    let query = this.currentQuery.trim();
    this.currentQuery = '';

    // Handle slash commands
    if (query === '/status') query = 'What is the status of Mumbai Ward 4?';
    else if (query === '/volunteers') query = 'How many volunteers are available right now?';
    else if (query === '/critical') query = 'Show critical emergency needs in Dharavi and Kurla';
    else if (query === '/surge') query = 'What is the 7-day monsoon surge forecast?';
    else if (query === '/vault') query = 'Check resource vault supply levels';

    const now = this.getCurrentTimeString();

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      formattedHtml: this.formatMarkdown(query),
      timestamp: now
    };

    this.messages.update(m => [...m, userMsg]);
    this.isLoading.set(true);
    this.scrollToBottom();

    try {
      const response = await this.agentService.queryAssistant(query, {
        ward: 'Mumbai Ward 4',
        userRole: this.auth.currentUser?.role || 'ngo_admin'
      });

      let rawText = '';
      let agentUsed = 'QueryAgent (Vertex AI)';
      let quickActions: QuickAction[] = [];

      if (response && typeof response === 'object') {
        rawText = response.answer || JSON.stringify(response);
        agentUsed = response.agentUsed || 'QueryAgent (Vertex AI)';
        quickActions = response.quickActions || [];
      } else if (typeof response === 'string') {
        rawText = response;
      }

      // Determine agent icon and accent color
      let agentIcon = 'smart_toy';
      let agentColor = 'default-agent';
      if (agentUsed.toLowerCase().includes('match')) {
        agentIcon = 'group';
        agentColor = 'match-agent';
      } else if (agentUsed.toLowerCase().includes('surge')) {
        agentIcon = 'storm';
        agentColor = 'surge-agent';
      } else if (agentUsed.toLowerCase().includes('narrator')) {
        agentIcon = 'description';
        agentColor = 'narrator-agent';
      } else if (agentUsed.toLowerCase().includes('orchestrator')) {
        agentIcon = 'hub';
        agentColor = 'default-agent';
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        agentUsed: agentUsed,
        agentIcon: agentIcon,
        agentColor: agentColor,
        content: rawText,
        formattedHtml: this.formatMarkdown(rawText),
        quickActions: quickActions.length > 0 ? quickActions : this.extractAutoActions(rawText),
        timestamp: this.getCurrentTimeString()
      };

      this.messages.update(m => [...m, botMsg]);
    } catch (e) {
      console.error('Chat dispatch error:', e);
      const fallbackMsg: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        role: 'assistant',
        agentUsed: 'Sahaay Edge Coordinator',
        agentIcon: 'hub',
        agentColor: 'default-agent',
        content: '**Mumbai Ward 4 Command Summary**\n\n• **5 Open Crisis Needs** (Dharavi & Kurla)\n• **23 Verified Volunteers** active and ready\n• **6 Relief Missions** underway',
        formattedHtml: this.formatMarkdown('**Mumbai Ward 4 Command Summary**\n\n• **5 Open Crisis Needs** (Dharavi & Kurla)\n• **23 Verified Volunteers** active and ready\n• **6 Relief Missions** underway'),
        quickActions: [
          { label: 'Open Crisis Map', route: '/needs-map', icon: 'map' },
          { label: 'Volunteer Roster', route: '/volunteers', icon: 'group' }
        ],
        timestamp: this.getCurrentTimeString()
      };
      this.messages.update(m => [...m, fallbackMsg]);
    } finally {
      this.isLoading.set(false);
      this.scrollToBottom();
    }
  }

  handleActionClick(action: QuickAction) {
    if (action.route) {
      this.router.navigate([action.route]);
      this.closeChat.emit();
    } else if (action.query) {
      this.sendQuickQuery(action.query);
    }
  }

  copyMessage(content: string, event: Event) {
    navigator.clipboard.writeText(content).then(() => {
      const target = event.currentTarget as HTMLElement;
      if (target) {
        const span = target.querySelector('span');
        if (span) {
          const original = span.innerText;
          span.innerText = 'Copied!';
          setTimeout(() => span.innerText = original, 2000);
        }
      }
    });
  }

  clearChat() {
    this.messages.set([
      {
        id: 'msg_cleared',
        role: 'assistant',
        agentUsed: 'OrchestratorAgent · Mumbai Command',
        agentIcon: 'hub',
        agentColor: 'default-agent',
        content: 'Console stream reset. What operational intelligence do you require?',
        formattedHtml: this.formatMarkdown('Console stream reset. What operational intelligence do you require?'),
        quickActions: [
          { label: '📊 Ward Status', query: 'What is the status of Mumbai Ward 4?', icon: 'space_dashboard' },
          { label: '🚨 Critical Needs', query: 'Show critical emergency needs in Dharavi and Kurla', icon: 'emergency' }
        ],
        timestamp: this.getCurrentTimeString()
      }
    ]);
  }

  private extractAutoActions(text: string): QuickAction[] {
    const actions: QuickAction[] = [];
    const lower = text.toLowerCase();
    if (lower.includes('crisis map') || lower.includes('map') || lower.includes('dharavi')) {
      actions.push({ label: 'View Crisis Map', route: '/needs-map', icon: 'map' });
    }
    if (lower.includes('task') || lower.includes('mission')) {
      actions.push({ label: 'View Tasks', route: '/tasks', icon: 'task' });
    }
    if (lower.includes('volunteer') || lower.includes('dispatch')) {
      actions.push({ label: 'Volunteers Roster', route: '/volunteers', icon: 'group' });
    }
    if (lower.includes('vault') || lower.includes('inventory') || lower.includes('supplies')) {
      actions.push({ label: 'Resource Vault', route: '/resource-vault', icon: 'inventory_2' });
    }
    return actions.slice(0, 3);
  }

  private formatMarkdown(raw: string): SafeHtml {
    if (!raw) return '';
    let html = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^[•\-]\s+(.*)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/g, '')
      .replace(/🔴\s*<strong>Critical/gi, '<span class="badge-critical">CRITICAL</span> <strong>')
      .replace(/Optimal/gi, '<span class="badge-optimal">Optimal</span>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private getCurrentTimeString(): string {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 80);
  }
}
