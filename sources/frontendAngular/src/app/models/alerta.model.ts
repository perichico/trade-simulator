export interface Alerta {
    id?: number;
    usuarioId: number;
    activoId: number;
    precioObjetivo: number;
    cantidadVenta?: number;
    condicion?: 'mayor' | 'menor';
    estado?: 'activa' | 'disparada' | 'cancelada';
    activa: boolean;
    fechaCreacion?: Date;
    fechaDisparo?: Date;
}