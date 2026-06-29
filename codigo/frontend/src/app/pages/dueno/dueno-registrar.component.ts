import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanchaMetadataService } from '../../core/cancha-metadata.service';
import { KeycloakService } from '../../core/keycloak.service';
import { UserProfileService } from '../../core/user-profile.service';
import { ToastService } from '../../core/toast.service';
import { TipoDeporte } from '../../core/models/cancha.model';

@Component({
  selector: 'app-dueno-registrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Dueño / <span>Registrar cancha</span></nav>
      <h1 class="page-title">Registrar nueva cancha</h1>
      <p class="page-subtitle">Envía una solicitud. Tras la aprobación podrás configurar horarios y agregar más canchas.</p>
    </div>

    <div class="card form-card">
      <div class="card-body">
        <form (ngSubmit)="enviar()" novalidate>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Nombre de la cancha *</label>
              <input class="form-control" [(ngModel)]="form.nombre" name="nombre" placeholder="Ej: Complejo Los Olivos" />
            </div>
            <div class="form-group">
              <label class="form-label">Ubicación *</label>
              <input class="form-control" [(ngModel)]="form.ubicacion" name="ubicacion" placeholder="Ej: Av. Principal 123" />
            </div>
            <div class="form-group">
              <label class="form-label">Tipo de deporte *</label>
              <select class="form-control" [(ngModel)]="form.tipo" name="tipo" (ngModelChange)="onTipoChange()">
                <option value="futbol">⚽ Fútbol</option>
                <option value="voley">🏐 Vóley</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Número de cancha *</label>
              <input class="form-control" [(ngModel)]="form.numeroCancha" name="numero" placeholder="Ej: 1, 2, A..." />
            </div>
            <div class="form-group">
              <label class="form-label">Precio por hora (S/) *</label>
              <input class="form-control" type="number" min="1" [(ngModel)]="form.precioHora" name="precio" />
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono de contacto *</label>
              <input class="form-control" [(ngModel)]="form.telefono" name="telefono" placeholder="+51 999 000 000" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea class="form-control" rows="3" [(ngModel)]="form.descripcion" name="desc"
              placeholder="Describe las características de tu cancha..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Imagen de la cancha</label>
            <div class="img-options">
              <label class="file-btn">
                📁 Subir desde archivo
                <input type="file" accept="image/*" (change)="onFileSelected($event)" hidden />
              </label>
              <span class="or">o</span>
              <input class="form-control" [(ngModel)]="form.imagenUrl" name="img"
                placeholder="Pegar URL de imagen (https://...)" (ngModelChange)="onUrlChange()" />
            </div>
            @if (imgError()) {
              <p class="form-error">{{ imgError() }}</p>
            }
            <div class="preview-wrap">
              <img [src]="previewImg()" alt="Vista previa" class="img-preview" (error)="onImgError()" />
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" [disabled]="submitting()">
            {{ submitting() ? 'Enviando...' : 'Enviar solicitud' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-card { max-width: 800px; margin: 0 auto; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
    .img-options { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 12px; }
    .file-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 16px; background: var(--color-bg); border: 1.5px dashed var(--color-border);
      border-radius: var(--radius-sm); cursor: pointer; font-size: 0.875rem; font-weight: 600;
      transition: all var(--transition);
    }
    .file-btn:hover { border-color: var(--color-accent); background: var(--color-accent-light); }
    .or { color: var(--color-text-muted); font-size: 0.8125rem; }
    .img-options .form-control { flex: 1; min-width: 200px; }
    .preview-wrap { border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--color-border); max-width: 420px; }
    .img-preview { width: 100%; height: 200px; object-fit: cover; display: block; background: var(--color-bg); }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class DuenoRegistrarComponent {
  submitting = signal(false);
  imgError = signal('');
  private filePreview = signal<string | null>(null);

  form = {
    nombre: '',
    ubicacion: '',
    tipo: 'futbol' as TipoDeporte,
    numeroCancha: '1',
    precioHora: 50,
    telefono: '',
    descripcion: '',
    imagenUrl: ''
  };

  constructor(
    private meta: CanchaMetadataService,
    private kc: KeycloakService,
    private profile: UserProfileService,
    private toast: ToastService
  ) {}

  previewImg = () => {
    if (this.filePreview()) return this.filePreview()!;
    if (this.form.imagenUrl?.trim()) return this.form.imagenUrl.trim();
    return this.meta.getDefaultImage(this.form.tipo);
  };

  onTipoChange(): void {
    if (!this.form.imagenUrl && !this.filePreview()) this.imgError.set('');
  }

  onUrlChange(): void {
    this.filePreview.set(null);
    this.imgError.set('');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.warning('Seleccione un archivo de imagen válido');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.toast.warning('La imagen no debe superar 3 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      this.filePreview.set(data);
      this.form.imagenUrl = data;
      this.imgError.set('');
    };
    reader.readAsDataURL(file);
  }

  onImgError(): void {
    if (this.form.imagenUrl && !this.filePreview()) {
      this.imgError.set('No se pudo cargar la imagen. Verifique la URL.');
    }
  }

  enviar(): void {
    if (!this.form.nombre || !this.form.ubicacion || !this.form.telefono) {
      this.toast.warning('Complete los campos obligatorios');
      return;
    }
    this.submitting.set(true);
    const user = this.kc.getUsername() ?? '';
    const imagen = this.filePreview() || this.form.imagenUrl?.trim() || undefined;

    this.meta.addSolicitud({
      ownerUsername: user,
      ownerNombre: this.profile.getDisplayName(user),
      nombre: this.form.nombre,
      ubicacion: this.form.ubicacion,
      tipo: this.form.tipo,
      numeroCancha: this.form.numeroCancha,
      precioHora: this.form.precioHora,
      telefono: this.form.telefono,
      descripcion: this.form.descripcion || 'Cancha deportiva de calidad.',
      imagenUrl: imagen,
      horarios: []
    });
    this.toast.success('Solicitud enviada. El administrador la revisará pronto.');
    this.form = {
      nombre: '', ubicacion: '', tipo: 'futbol', numeroCancha: '1',
      precioHora: 50, telefono: '', descripcion: '', imagenUrl: ''
    };
    this.filePreview.set(null);
    this.submitting.set(false);
  }
}
