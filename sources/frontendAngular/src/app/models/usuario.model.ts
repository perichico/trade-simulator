export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'usuario' | 'admin';
  balance?: number;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}