export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
export type TipoDeporte = 'futbol' | 'voley';

export interface Cancha {
  id: number;
  nombre: string;
  ubicacion: string;
  tipo: string;
  activa: boolean;
}

export interface CanchaMetadata {
  canchaId: number;
  ownerUsername?: string;
  numeroCancha?: string;
  precioHora: number;
  telefono?: string;
  descripcion?: string;
  imagenUrl?: string;
  estado?: EstadoSolicitud;
}

export interface CanchaEnriquecida extends Cancha {
  metadata: CanchaMetadata;
}

export interface HorarioSlot {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

export interface SolicitudCancha {
  id: string;
  ownerUsername: string;
  ownerNombre?: string;
  nombre: string;
  ubicacion: string;
  tipo: TipoDeporte;
  numeroCancha: string;
  precioHora: number;
  telefono: string;
  descripcion: string;
  imagenUrl?: string;
  horarios: HorarioSlot[];
  estado: EstadoSolicitud;
  canchaId?: number;
  createdAt: string;
  motivoRechazo?: string;
}

export interface Horario {
  id: number;
  idCancha: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

export interface Reserva {
  id: number;
  idUsuario: number;
  idCancha: number;
  idHorario: number;
  fechaReserva: string;
  estado: string;
  cancha?: Cancha;
  horario?: Horario;
}

export interface Pago {
  id: number;
  idReserva: number;
  monto: number;
  metodoPago: string;
  estado: string;
  fechaPago: string;
  referencia?: string;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  rol: string;
  activo: boolean;
}
