export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'usuario' | 'admin';
  activo: boolean;
  fechaRegistro: string | Date;
}