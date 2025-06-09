export interface Dividendo {
  id?: number;
  activo_id: number;
  fecha: Date | string;
  monto_por_accion: number;
  estado: 'pendiente' | 'pagado' | 'cancelado';
  fecha_creacion?: Date | string;
  fecha_actualizacion?: Date | string;
  
  // Datos del activo asociado
  activo?: {
    id: number;
    nombre: string;
    simbolo: string;
    tipo_activo_id?: number;
    ultimo_precio?: number;
  };
  
  // Datos calculados para el usuario
  cantidadAcciones?: number;
  montoTotal?: number;
}