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
  id?: number; // Identificador único del portafolio
  nombre: string; // Nombre del portafolio
  usuarioId: number;
  activos: ActivoEnPortafolio[];
  valorTotal: number; // Suma del valor de todos los activos
  rendimientoTotal: number; // Suma de los rendimientos
  fechaCreacion?: Date; // Fecha de creación del portafolio
  descripcion?: string; // Descripción opcional del portafolio
}