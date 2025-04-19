export interface Activo {
  id: number;
  nombre: string;
  simbolo: string;
  ultimo_precio: number;
  precio?: number;
  ultima_actualizacion?: Date;
  tipo: 'accion' | 'criptomoneda' | 'materia_prima' | 'divisa'; // Tipo de activo
  // Propiedades adicionales para la UI
  variacion?: number; // Variación porcentual del precio
  tendencia?: 'alza' | 'baja' | 'estable'; // Tendencia del activo
}