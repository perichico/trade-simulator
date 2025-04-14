export interface Activo {
  id: number;
  nombre: string;
  simbolo: string;
  precio: number;
  // Propiedades adicionales para la UI
  variacion?: number; // Variación porcentual del precio
  tendencia?: 'alza' | 'baja' | 'estable'; // Tendencia del activo
}