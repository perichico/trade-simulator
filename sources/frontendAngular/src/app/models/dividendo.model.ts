export interface Dividendo {
  id?: number;
  activoId: number;
  simbolo: string;
  nombreEmpresa: string;
  fechaAnuncio: Date;
  fechaExDividendo: Date;
  fechaPago: Date;
  cantidadPorAccion: number;
  moneda: string;
  estado: 'ANUNCIADO' | 'PAGADO' | 'CANCELADO';
  totalRecibido?: number;
}