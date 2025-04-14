export interface Transaccion {
  id: number;
  usuarioId: number;
  activoId: number;
  cantidad: number;
  precio: number;
  fecha: Date;
  tipo?: 'compra' | 'venta'; // Tipo de transacción
  
  // Propiedades para relaciones (cuando se incluyen en respuestas)
  usuario?: any; // Información del usuario
  activo?: any; // Información del activo
  
  // Propiedades calculadas para la UI
  valorTotal?: number; // Precio * cantidad
}