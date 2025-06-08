export interface ActivoEnPortafolio {
  activoId: number;
  id?: number; // ID alternativo para compatibilidad
  activo_id?: number; // ID del backend
  nombre: string;
  simbolo: string;
  cantidad: number;
  precioCompra: number; // Precio promedio de compra en EUR
  precio_compra?: number; // Alias para compatibilidad con backend
  precioActual: number; // Precio actual del mercado en EUR
  valorTotal: number; // Precio actual * cantidad en EUR
  rendimiento: number; // Ganancia/pérdida en valor monetario EUR
  rendimientoPorcentaje: number; // Ganancia/pérdida en porcentaje
  tipoActivo?: any; // Información del tipo de activo
  ultima_actualizacion?: Date; // Fecha de última actualización
  variacion?: number; // Variación del precio
}

export interface Portafolio {
  id: number;
  nombre: string;
  usuarioId: number;
  usuario_id?: number; // Alias para compatibilidad con backend
  saldo: number; // Saldo disponible en EUR
  activos?: ActivoEnPortafolio[]; // Usar la misma interfaz
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
  valorTotal?: number; // Valor total de SOLO los activos en EUR (no incluye saldo)
  rendimientoTotal?: number; // Rendimiento total en EUR
}