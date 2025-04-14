import { Injectable } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Portafolio, ActivoEnPortafolio } from '../models/portafolio.model';
import { Transaccion } from '../models/transaccion.model';
import { Activo } from '../models/activo.model';
import { TransaccionService } from './transaccion.service';
import { ActivoService } from './activo.service';

@Injectable({
  providedIn: 'root'
})
export class PortafolioService {

  constructor(
    private transaccionService: TransaccionService,
    private activoService: ActivoService
  ) { }

  // Obtener el portafolio completo del usuario
  obtenerPortafolio(usuarioId: number): Observable<Portafolio> {
    return this.transaccionService.obtenerTransaccionesPorUsuario(usuarioId).pipe(
      switchMap(transacciones => {
        // Si no hay transacciones, devolver un portafolio vacío
        if (transacciones.length === 0) {
          return of({
            usuarioId,
            activos: [],
            valorTotal: 0,
            rendimientoTotal: 0
          });
        }

        // Obtener todos los activos para tener precios actuales
        return this.activoService.obtenerActivos().pipe(
          map(activos => {
            // Calcular posiciones por cada activo
            const posicionesPorActivo = this.calcularPosicionesPorActivo(transacciones, activos);
            
            // Calcular totales
            const valorTotal = posicionesPorActivo.reduce((total, activo) => total + activo.valorTotal, 0);
            const rendimientoTotal = posicionesPorActivo.reduce((total, activo) => total + activo.rendimiento, 0);
            
            return {
              usuarioId,
              activos: posicionesPorActivo,
              valorTotal,
              rendimientoTotal
            };
          })
        );
      }),
      catchError(error => {
        console.error('Error al obtener portafolio', error);
        return of({
          usuarioId,
          activos: [],
          valorTotal: 0,
          rendimientoTotal: 0
        });
      })
    );
  }

  // Calcular las posiciones por cada activo basado en las transacciones
  private calcularPosicionesPorActivo(transacciones: Transaccion[], activos: Activo[]): ActivoEnPortafolio[] {
    // Agrupar transacciones por activo
    const transaccionesPorActivo = this.agruparTransaccionesPorActivo(transacciones);
    
    // Convertir a array de posiciones
    return Object.keys(transaccionesPorActivo).map(activoIdStr => {
      const activoId = parseInt(activoIdStr);
      const transaccionesActivo = transaccionesPorActivo[activoId];
      
      // Encontrar el activo correspondiente para obtener precio actual y nombre
      const activo = activos.find(a => a.id === activoId);
      if (!activo) return null; // Debería existir siempre
      
      // Calcular cantidad total (compras - ventas)
      let cantidadTotal = 0;
      let costoTotal = 0;
      
      transaccionesActivo.forEach(t => {
        if (t.tipo === 'compra') {
          cantidadTotal += t.cantidad;
          costoTotal += t.cantidad * t.precio;
        } else {
          cantidadTotal -= t.cantidad;
          costoTotal -= t.cantidad * t.precio;
        }
      });
      
      // Si no hay posición, no incluir en el portafolio
      if (cantidadTotal <= 0) return null;
      
      // Calcular precio promedio de compra
      const precioCompra = costoTotal / cantidadTotal;
      
      // Calcular valor actual y rendimiento
      const precioActual = activo.precio;
      const valorTotal = cantidadTotal * precioActual;
      const rendimiento = valorTotal - (cantidadTotal * precioCompra);
      const rendimientoPorcentaje = (rendimiento / (cantidadTotal * precioCompra)) * 100;
      
      return {
        activoId,
        nombre: activo.nombre,
        simbolo: activo.simbolo,
        cantidad: cantidadTotal,
        precioCompra,
        precioActual,
        valorTotal,
        rendimiento,
        rendimientoPorcentaje
      };
    }).filter(posicion => posicion !== null) as ActivoEnPortafolio[];
  }

  // Agrupar transacciones por activo
  private agruparTransaccionesPorActivo(transacciones: Transaccion[]): { [activoId: number]: Transaccion[] } {
    return transacciones.reduce((grupos, transaccion) => {
      const { activoId } = transaccion;
      if (!grupos[activoId]) {
        grupos[activoId] = [];
      }
      grupos[activoId].push(transaccion);
      return grupos;
    }, {} as { [activoId: number]: Transaccion[] });
  }

  // Calcular rendimiento total del portafolio
  calcularRendimientoTotal(portafolio: Portafolio): number {
    return portafolio.activos.reduce((total, activo) => total + activo.rendimiento, 0);
  }

  // Calcular rendimiento porcentual del portafolio
  calcularRendimientoPorcentual(portafolio: Portafolio): number {
    const inversionTotal = portafolio.activos.reduce(
      (total, activo) => total + (activo.precioCompra * activo.cantidad), 0
    );
    
    if (inversionTotal === 0) return 0;
    
    return (portafolio.rendimientoTotal / inversionTotal) * 100;
  }
}