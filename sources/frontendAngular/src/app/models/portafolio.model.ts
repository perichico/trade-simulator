export interface ActivoEnPortafolio {
  activoId: number;
  nombre: string;
  simbolo: string;
  cantidad: number;
  precioCompra: number; // Precio promedio de compra
  precioActual: number; // Precio actual del mercado
  valorTotal: number; // Precio actual * cantidad
  rendimiento: number; // Ganancia/pérdida en valor monetario
  rendimientoPorcentaje: number; // Ganancia/pérdida en porcentaje
}

export interface Portafolio {
  id: number;
  nombre: string;
  usuarioId: number;
  saldo: number;
  activos?: ActivoPortafolio[];
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
  valorTotal?: number;
  rendimientoTotal?: number;
}

export interface ActivoPortafolio {
  activoId: number;
  simbolo: string;
  nombre: string;
  cantidad: number;
  precioCompra: number;
  precioActual: number;
  valorTotal: number;
  rendimiento: number;
  rendimientoPorcentaje: number;
}