import { Component } from '@angular/core';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="toast.type" (click)="toastService.dismiss(toast.id)">
          <span class="toast-icon">{{ icons[toast.type] }}</span>
          <span class="toast-msg">{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      cursor: pointer;
      animation: slideInRight 0.35s ease;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid transparent;
    }
    .toast.success { background: #ECFDF5; color: #065F46; border-color: #A7F3D0; }
    .toast.error { background: #FEF2F2; color: #991B1B; border-color: #FECACA; }
    .toast.warning { background: #FFFBEB; color: #92400E; border-color: #FDE68A; }
    .toast.info { background: #EFF6FF; color: #1E40AF; border-color: #BFDBFE; }
    .toast-icon { font-size: 1.1rem; flex-shrink: 0; }
  `]
})
export class ToastContainerComponent {
  readonly icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  constructor(readonly toastService: ToastService) {}
}
