export interface ActivoEnPortafolio {
  activoId: number;
  nombre: string;
  simbolo: string;
  cantidad: number;
  precioCompra: number; // Precio promedio de compra en EUR
  precioActual: number; // Precio actual del mercado en EUR
  valorTotal: number; // Precio actual * cantidad en EUR
  rendimiento: number; // Ganancia/pérdida en valor monetario EUR
  rendimientoPorcentaje: number; // Ganancia/pérdida en porcentaje
}

export interface Portafolio {
  id: number;
  nombre: string;
  usuarioId: number;
  saldo: number; // Saldo disponible en EUR
  activos?: ActivoEnPortafolio[]; // Usar la misma interfaz
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
  valorTotal?: number; // Valor total de SOLO los activos en EUR (no incluye saldo)
  rendimientoTotal?: number; // Rendimiento total en EUR
}