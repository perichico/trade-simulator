export interface Alerta {
    id?: number;
    usuarioId: number;
    activoId: number;
    precioObjetivo: number;
    cantidadVenta: number;
    activa: boolean;
    fechaCreacion?: Date;
    fechaActivacion?: Date;
}