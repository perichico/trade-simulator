import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Portafolio, ActivoEnPortafolio } from '../models/portafolio.model';
import { Transaccion } from '../models/transaccion.model';
import { Activo } from '../models/activo.model';
import { TransaccionService } from './transaccion.service';
import { ActivoService } from './activo.service';

@Injectable({
  providedIn: 'root'
})
export class PortafolioService {

  private apiUrl = 'http://localhost:3000/portafolio';
  
  // BehaviorSubject para mantener el portafolio actualmente seleccionado
  private portafolioActualSubject = new BehaviorSubject<Portafolio | null>(null);
  portafolioActual$ = this.portafolioActualSubject.asObservable();
  
  // Almacena el ID del portafolio actualmente seleccionado
  private portafolioSeleccionadoId: number | null = null;

  constructor(
    private http: HttpClient,
    private transaccionService: TransaccionService,
    private activoService: ActivoService
  ) { }

  // Obtener todos los portafolios del usuario
  obtenerPortafolios(usuarioId: number): Observable<Portafolio[]> {
    return this.http.get<Portafolio[]>(`${this.apiUrl}/usuario/${usuarioId}`).pipe(
      map(portafolios => {
        // Asegurarse de que cada portafolio tenga los campos necesarios
        return portafolios.map(portafolio => ({
          ...portafolio,
          activos: portafolio.activos || [],
          valorTotal: portafolio.valorTotal || 0,
          rendimientoTotal: portafolio.rendimientoTotal || 0
        }));
      }),
      catchError(error => {
        console.error('Error al obtener portafolios del usuario', error);
        return of([]);
      })
    );
  }

  // Crear un nuevo portafolio para el usuario
  crearPortafolio(usuarioId: number, nombre: string): Observable<Portafolio> {
    return this.http.post<Portafolio>(`${this.apiUrl}/crear`, {
      usuarioId,
      nombre,
      fechaCreacion: new Date()
      // No enviamos activos ni valorTotal, estos se establecerán en el backend
    }).pipe(
      map(portafolio => ({
        ...portafolio,
        activos: [], // Aseguramos que no haya activos iniciales
        valorTotal: portafolio.valorTotal || 10000, // Usamos el valor del backend o 10000 por defecto
        rendimientoTotal: 0
      })),
      catchError(error => {
        console.error('Error al crear nuevo portafolio', error);
        throw error;
      })
    );
  }

  // Seleccionar un portafolio como activo
  seleccionarPortafolio(portafolioId: number): Observable<Portafolio> {
    this.portafolioSeleccionadoId = portafolioId;
    
    // Llamar al endpoint del backend para seleccionar el portafolio
    return this.http.post<any>(`${this.apiUrl}/seleccionar/${portafolioId}`, {}).pipe(
      switchMap(() => this.obtenerPortafolioPorId(portafolioId)),
      tap(portafolio => {
        this.portafolioActualSubject.next(portafolio);
      }),
      catchError(error => {
        console.error('Error al seleccionar portafolio', error);
        // Si hay un error, intentar obtener el portafolio de todos modos
        return this.obtenerPortafolioPorId(portafolioId);
      })
    );
  }

  // Obtener el portafolio actualmente seleccionado
  obtenerPortafolioActual(): Observable<Portafolio | null> {
    if (this.portafolioSeleccionadoId) {
      return this.obtenerPortafolioPorId(this.portafolioSeleccionadoId);
    }
    return of(null);
  }

  // Obtener un portafolio específico por su ID
  obtenerPortafolioPorId(portafolioId: number): Observable<Portafolio> {
    return this.http.get<any>(`${this.apiUrl}/${portafolioId}`).pipe(
      map(response => {
        // Transformar la respuesta del backend al formato que espera el frontend
        const activos: ActivoEnPortafolio[] = response.activos
          .filter((activo: any) => {
            // Filtrar activos sin ID o símbolo
            if (!activo || !activo.id) {
              console.warn('Activo sin ID detectado en el portafolio');
              return false;
            }
            if (!activo.simbolo) {
              console.warn(`Activo con ID ${activo.id} no tiene símbolo`);
              // Permitimos activos sin símbolo pero con advertencia
            }
            return true;
          })
          .map((activo: any) => {
            // Calcular el rendimiento para cada activo
            const rendimiento = (activo.precioActual - activo.precioCompra) * activo.cantidad;
            const rendimientoPorcentaje = activo.precioCompra > 0 ? 
              ((activo.precioActual - activo.precioCompra) / activo.precioCompra) * 100 : 0;
              
            return {
              activoId: activo.id,
              nombre: activo.nombre || 'Activo sin nombre',
              simbolo: activo.simbolo || 'N/A',
              cantidad: activo.cantidad,
              precioCompra: activo.precioCompra,
              precioActual: activo.precioActual,
              valorTotal: activo.valorTotal,
              rendimiento: rendimiento,
              rendimientoPorcentaje: rendimientoPorcentaje
            };
          });

        // Calcular rendimiento total sumando los rendimientos individuales
        const rendimientoTotal = activos.reduce((total, activo) => total + activo.rendimiento, 0);
        
        return {
          id: response.id,
          nombre: response.nombre || 'Portafolio sin nombre',
          usuarioId: response.usuarioId,
          activos,
          valorTotal: response.valorTotal || 0,
          rendimientoTotal,
          fechaCreacion: response.fechaCreacion ? new Date(response.fechaCreacion) : new Date(),
          saldo: response.saldo || 0,

        };
      }),
      catchError(error => {
        console.error('Error al obtener portafolio', error);
        return of({
          id: portafolioId,
          nombre: 'Portafolio sin nombre',
          usuarioId: 0,
          activos: [],
          valorTotal: 0,
          rendimientoTotal: 0,
          fechaCreacion: new Date(),
          saldo: 0,

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
      // Validar que el ID sea un número válido
      if (!activoIdStr || isNaN(parseInt(activoIdStr))) {
        console.warn('ID de activo inválido detectado:', activoIdStr);
        return null;
      }
      
      const activoId = parseInt(activoIdStr);
      const transaccionesActivo = transaccionesPorActivo[activoId];
      
      // Validar que existan transacciones para este activo
      if (!transaccionesActivo || transaccionesActivo.length === 0) {
        console.warn(`No hay transacciones para el activo ID ${activoId}`);
        return null;
      }
      
      // Encontrar el activo correspondiente para obtener precio actual y nombre
      const activo = activos.find(a => a.id === activoId);
      if (!activo) {
        console.warn(`Activo con ID ${activoId} no encontrado en la lista de activos`);
        return null; // No podemos procesar sin información del activo
      }
      
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
      const precioActual = activo.precio || activo.ultimo_precio || 0;
      const valorTotal = cantidadTotal * precioActual;
      const rendimiento = valorTotal - (cantidadTotal * precioCompra);
      const rendimientoPorcentaje = precioCompra > 0 ? (rendimiento / (cantidadTotal * precioCompra)) * 100 : 0;
      
      return {
        activoId,
        nombre: activo.nombre || 'Activo sin nombre',
        simbolo: activo.simbolo || 'N/A',
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
    return transacciones
      .filter(transaccion => {
        // Validar que la transacción tenga un activoId válido
        if (!transaccion || !transaccion.activoId) {
          console.warn('Transacción sin ID de activo detectada:', transaccion);
          return false;
        }
        return true;
      })
      .reduce((grupos, transaccion) => {
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
    if (!portafolio || !portafolio.activos || !Array.isArray(portafolio.activos)) {
      console.warn('Portafolio inválido o sin activos al calcular rendimiento total');
      return 0;
    }
    return portafolio.activos.reduce((total, activo) => {
      // Validar que el activo tenga un rendimiento válido
      if (!activo || typeof activo.rendimiento !== 'number') {
        console.warn('Activo con rendimiento inválido detectado:', activo);
        return total;
      }
      return total + activo.rendimiento;
    }, 0);
  }

  // Calcular rendimiento porcentual del portafolio
  calcularRendimientoPorcentual(portafolio: Portafolio): number {
    if (!portafolio || !portafolio.activos || !Array.isArray(portafolio.activos)) {
      console.warn('Portafolio inválido o sin activos al calcular rendimiento porcentual');
      return 0;
    }
    
    const inversionTotal = portafolio.activos.reduce(
      (total, activo) => {
        // Validar que el activo tenga precio de compra y cantidad válidos
        if (!activo || typeof activo.precioCompra !== 'number' || typeof activo.cantidad !== 'number') {
          console.warn('Activo con precio de compra o cantidad inválidos:', activo);
          return total;
        }
        return total + (activo.precioCompra * activo.cantidad);
      }, 0
    );
    
    if (inversionTotal === 0) return 0;
    
    return (portafolio.rendimientoTotal / inversionTotal) * 100;
  }
}