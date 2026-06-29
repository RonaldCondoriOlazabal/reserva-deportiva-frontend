import { Component, OnInit, inject } from '@angular/core';
import { KeycloakService } from '../../core/keycloak.service';

@Component({
  selector: 'app-registro-keycloak',
  standalone: true,
  template: `
    <div class="redirect-page">
      <div class="spinner"></div>
      <p>Preparando registro...</p>
    </div>
  `,
  styles: [`
    .redirect-page {
      min-height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 16px;
      background: linear-gradient(135deg, #0B1F33, #1E4D2B); color: white;
    }
  `]
})
export class RegistroKeycloakComponent implements OnInit {
  private kc = inject(KeycloakService);

  ngOnInit(): void {
    window.location.href = this.kc.getKeycloakRegistrationUrl();
  }
}
