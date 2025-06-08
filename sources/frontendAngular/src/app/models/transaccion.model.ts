export interface Transaccion {
  id: number;
  usuarioId: number;
  activoId: number;
  activo_id?: number; // Alias para compatibilidad con backend
  cantidad: number;
  precio: number;
  precio_unitario?: number; // Alias para compatibilidad con backend
  fecha: Date;
  tipo?: 'compra' | 'venta'; // Tipo de transacción
  
  // Propiedades para relaciones (cuando se incluyen en respuestas)
  usuario?: any; // Información del usuario
  activo?: any; // Información del activo
  
  valorTotal?: number; // Precio * cantidad
}