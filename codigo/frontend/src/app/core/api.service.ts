import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Cancha,
  Horario,
  Pago,
  Reserva,
  Usuario
} from './models/cancha.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  getCanchas(): Observable<Cancha[]> {
    return this.http.get<Cancha[]>(`${this.base}/api/v1/canchas`);
  }

  getCancha(id: number): Observable<Cancha> {
    return this.http.get<Cancha>(`${this.base}/api/v1/canchas/${id}`);
  }

  createCancha(data: Partial<Cancha>): Observable<Cancha> {
    return this.http.post<Cancha>(`${this.base}/api/v1/canchas`, data, { headers: this.authHeaders() });
  }

  updateCancha(id: number, data: Partial<Cancha>): Observable<Cancha> {
    return this.http.put<Cancha>(`${this.base}/api/v1/canchas/${id}`, data, { headers: this.authHeaders() });
  }

  deleteCancha(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/v1/canchas/${id}`, { headers: this.authHeaders() });
  }

  getHorarios(): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.base}/api/v1/horarios`);
  }

  createHorario(data: Partial<Horario>): Observable<Horario> {
    return this.http.post<Horario>(`${this.base}/api/v1/horarios`, data, { headers: this.authHeaders() });
  }

  updateHorario(id: number, data: Partial<Horario>): Observable<Horario> {
    return this.http.put<Horario>(`${this.base}/api/v1/horarios/${id}`, data, { headers: this.authHeaders() });
  }

  deleteHorario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/v1/horarios/${id}`, { headers: this.authHeaders() });
  }

  getReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.base}/api/v1/reservas`, { headers: this.authHeaders() });
  }

  createReserva(data: Partial<Reserva>): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.base}/api/v1/reservas`, data, { headers: this.authHeaders() });
  }

  getDetalleReserva(id: number): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.base}/api/v1/reservas/detalle/${id}`, { headers: this.authHeaders() });
  }

  deleteReserva(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/v1/reservas/${id}`, { headers: this.authHeaders() });
  }

  updateReserva(id: number, data: Partial<Reserva>): Observable<Reserva> {
    return this.http.put<Reserva>(`${this.base}/api/v1/reservas/${id}`, data, { headers: this.authHeaders() });
  }

  getPagos(): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.base}/api/v1/pagos`, { headers: this.authHeaders() });
  }

  getPago(id: number): Observable<Pago> {
    return this.http.get<Pago>(`${this.base}/api/v1/pagos/${id}`, { headers: this.authHeaders() });
  }

  createPago(data: Partial<Pago>): Observable<Pago> {
    return this.http.post<Pago>(`${this.base}/api/v1/pagos`, data, { headers: this.authHeaders() });
  }

  updatePago(id: number, data: Partial<Pago>): Observable<Pago> {
    return this.http.put<Pago>(`${this.base}/api/v1/pagos/${id}`, data, { headers: this.authHeaders() });
  }

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.base}/api/v1/usuarios`, { headers: this.authHeaders() });
  }

  createUsuario(data: Partial<Usuario & { password: string }>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.base}/api/v1/usuarios`, data, { headers: this.authHeaders() });
  }

  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/v1/usuarios/${id}`, { headers: this.authHeaders() });
  }
}
