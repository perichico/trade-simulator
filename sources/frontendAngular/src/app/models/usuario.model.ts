export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  balance: number;
  portafolioSeleccionado: any;
  // No incluimos contraseña por seguridad
}