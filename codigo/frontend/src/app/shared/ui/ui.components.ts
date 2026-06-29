import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="loading-overlay">
      <div class="spinner"></div>
      @if (message) { <p>{{ message }}</p> }
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() message = 'Cargando...';
}

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    @if (open) {
      <div class="modal-backdrop" (click)="cancel.emit()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="modal-close" (click)="cancel.emit()">✕</button>
          </div>
          <div class="modal-body">
            <p>{{ message }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cancel.emit()">{{ cancelLabel }}</button>
            <button class="btn" [class.btn-danger]="danger" [class.btn-primary]="!danger" (click)="confirm.emit()">
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmModalComponent {
  @Input() open = false;
  @Input() title = 'Confirmar';
  @Input() message = '¿Está seguro?';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';
  @Input() danger = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
