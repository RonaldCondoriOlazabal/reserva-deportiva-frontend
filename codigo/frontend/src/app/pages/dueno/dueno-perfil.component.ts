import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeycloakService } from '../../core/keycloak.service';
import { UserProfileService } from '../../core/user-profile.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-dueno-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <nav class="breadcrumb">Dueño / <span>Perfil</span></nav>
      <h1 class="page-title">Mi perfil</h1>
    </div>

    <div class="profile-card card">
      <div class="card-body">
        <div class="profile-header">
          <div class="avatar-wrap">
            @if (photoUrl()) {
              <img [src]="photoUrl()" alt="Foto" class="avatar-img" />
            } @else {
              <div class="avatar-lg">{{ initials() }}</div>
            }
            <label class="photo-btn">
              📷 Cambiar foto
              <input type="file" accept="image/*" (change)="onPhotoChange($event)" hidden />
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Nombre completo</label>
          <input class="form-control" [(ngModel)]="displayName" placeholder="Tu nombre" />
        </div>
        <div class="form-group">
          <label class="form-label">Usuario</label>
          <input class="form-control" [value]="username" disabled />
        </div>

        <button class="btn btn-primary" (click)="guardar()" [disabled]="saving()">
          {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .profile-card { max-width: 480px; margin: 0 auto; }
    .profile-header { margin-bottom: 28px; }
    .avatar-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .avatar-lg, .avatar-img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; }
    .avatar-lg {
      background: linear-gradient(135deg, #F59E0B, #D97706);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; font-weight: 800;
    }
    .photo-btn { font-size: 0.8125rem; color: var(--color-accent); cursor: pointer; font-weight: 600; }
  `]
})
export class DuenoPerfilComponent {
  username = '';
  displayName = '';
  photoUrl = signal<string | undefined>(undefined);
  initials = signal('');
  saving = signal(false);

  constructor(
    private kc: KeycloakService,
    private profile: UserProfileService,
    private toast: ToastService
  ) {
    this.username = this.kc.getUsername() ?? '';
    const p = this.profile.getProfile(this.username);
    this.displayName = p.displayName;
    this.photoUrl.set(p.photoUrl);
    this.initials.set(this.profile.getInitials(this.username));
  }

  onPhotoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      this.toast.warning('La imagen no debe superar 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.photoUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  guardar(): void {
    if (!this.displayName.trim()) {
      this.toast.warning('El nombre no puede estar vacío');
      return;
    }
    this.saving.set(true);
    this.profile.saveProfile(this.username, {
      displayName: this.displayName.trim(),
      photoUrl: this.photoUrl()
    });
    this.initials.set(this.displayName.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase());
    this.toast.success('Perfil actualizado');
    this.saving.set(false);
  }
}
