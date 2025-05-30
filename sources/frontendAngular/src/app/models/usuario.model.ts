export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'usuario' | 'admin';
  estado: 'activo' | 'suspendido';
  fechaRegistro: string | Date;
  activo?: boolean; // Campo opcional para compatibilidad
}