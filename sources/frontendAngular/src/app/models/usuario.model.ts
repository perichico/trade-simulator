export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  balance: number;
  // No incluimos contraseña por seguridad
}