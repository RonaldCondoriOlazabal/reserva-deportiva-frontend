import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card" [style.--accent]="color">
      <div class="stat-icon">{{ icon }}</div>
      <div class="stat-content">
        <span class="stat-label">{{ label }}</span>
        <span class="stat-value">{{ value }}</span>
        @if (trend) {
          <span class="stat-trend" [class.up]="trendUp" [class.down]="!trendUp">{{ trend }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: var(--color-bg-card);
      border-radius: var(--radius-lg);
      padding: 24px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      transition: transform var(--transition), box-shadow var(--transition);
      animation: fadeInUp 0.4s ease both;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--accent, var(--color-accent)) 15%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      flex-shrink: 0;
    }
    .stat-label {
      display: block;
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      font-weight: 500;
      margin-bottom: 4px;
    }
    .stat-value {
      display: block;
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--color-primary);
      letter-spacing: -0.02em;
    }
    .stat-trend {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      margin-top: 4px;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .stat-trend.up { background: #D1FAE5; color: #065F46; }
    .stat-trend.down { background: #FEE2E2; color: #991B1B; }
  `]
})
export class StatCardComponent {
  @Input() icon = '📊';
  @Input() label = '';
  @Input() value: string | number = 0;
  @Input() trend = '';
  @Input() trendUp = true;
  @Input() color = '#10B981';
}
