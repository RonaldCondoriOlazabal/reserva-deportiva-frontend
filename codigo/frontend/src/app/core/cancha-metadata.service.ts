import { Injectable } from '@angular/core';
import {
  Cancha,
  CanchaEnriquecida,
  CanchaMetadata,
  SolicitudCancha,
  EstadoSolicitud
} from './models/cancha.model';

const META_KEY = 'reservas_cancha_metadata';
const SOL_KEY = 'reservas_solicitudes';

const DEFAULT_IMAGES: Record<string, string> = {
  futbol: 'https://images.unsplash.com/photo-1459865269929-5b1c658c80b5?w=800&q=80',
  voley: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'
};

@Injectable({ providedIn: 'root' })
export class CanchaMetadataService {
  private loadMeta(): Record<number, CanchaMetadata> {
    try {
      return JSON.parse(localStorage.getItem(META_KEY) ?? '{}');
    } catch {
      return {};
    }
  }

  private saveMeta(data: Record<number, CanchaMetadata>): void {
    localStorage.setItem(META_KEY, JSON.stringify(data));
  }

  getDefaultImage(tipo: string): string {
    const key = tipo?.toLowerCase().includes('vole') ? 'voley' : tipo?.toLowerCase().includes('fut') ? 'futbol' : 'default';
    return DEFAULT_IMAGES[key] ?? DEFAULT_IMAGES['default'];
  }

  getMetadata(canchaId: number): CanchaMetadata {
    const all = this.loadMeta();
    return all[canchaId] ?? {
      canchaId,
      precioHora: 50,
      descripcion: 'Cancha deportiva disponible para reservas.',
      telefono: '+51 999 000 000',
      numeroCancha: '1',
      imagenUrl: this.getDefaultImage('futbol'),
      estado: 'APROBADA'
    };
  }

  saveMetadata(meta: CanchaMetadata): void {
    const all = this.loadMeta();
    all[meta.canchaId] = meta;
    this.saveMeta(all);
  }

  enrich(cancha: Cancha): CanchaEnriquecida {
    return { ...cancha, metadata: this.getMetadata(cancha.id) };
  }

  enrichAll(canchas: Cancha[]): CanchaEnriquecida[] {
    return canchas.map(c => this.enrich(c));
  }

  getSolicitudes(): SolicitudCancha[] {
    try {
      return JSON.parse(localStorage.getItem(SOL_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  saveSolicitudes(list: SolicitudCancha[]): void {
    localStorage.setItem(SOL_KEY, JSON.stringify(list));
  }

  addSolicitud(sol: Omit<SolicitudCancha, 'id' | 'createdAt' | 'estado'>): SolicitudCancha {
    const item: SolicitudCancha = {
      ...sol,
      id: crypto.randomUUID(),
      estado: 'PENDIENTE',
      createdAt: new Date().toISOString(),
      imagenUrl: sol.imagenUrl || this.getDefaultImage(sol.tipo)
    };
    const list = this.getSolicitudes();
    list.unshift(item);
    this.saveSolicitudes(list);
    return item;
  }

  updateSolicitud(id: string, patch: Partial<SolicitudCancha>): void {
    const list = this.getSolicitudes().map(s => (s.id === id ? { ...s, ...patch } : s));
    this.saveSolicitudes(list);
  }

  getSolicitudesByOwner(username: string): SolicitudCancha[] {
    return this.getSolicitudes().filter(s => s.ownerUsername === username);
  }

  getPendingSolicitudes(): SolicitudCancha[] {
    return this.getSolicitudes().filter(s => s.estado === 'PENDIENTE');
  }

  getCanchasByOwner(username: string, canchas: Cancha[]): CanchaEnriquecida[] {
    const solicitudes = this.getSolicitudesByOwner(username);
    const approvedIds = new Set(
      solicitudes.filter(s => s.estado === 'APROBADA' && s.canchaId).map(s => s.canchaId!)
    );
    const meta = this.loadMeta();
    // También buscar por ownerUsername en metadata (clave puede ser string o number)
    const metaOwnedIds = new Set(
      Object.entries(meta)
        .filter(([, m]) => m.ownerUsername === username)
        .map(([k]) => Number(k))
    );
    return canchas
      .filter(c => approvedIds.has(c.id) || metaOwnedIds.has(c.id))
      .map(c => this.enrich(c));
  }

  getEstadoForCancha(canchaId: number, ownerUsername?: string): EstadoSolicitud {
    const meta = this.getMetadata(canchaId);
    if (meta.estado) return meta.estado;
    const sol = this.getSolicitudes().find(s => s.canchaId === canchaId && s.ownerUsername === ownerUsername);
    return sol?.estado ?? 'APROBADA';
  }
}
