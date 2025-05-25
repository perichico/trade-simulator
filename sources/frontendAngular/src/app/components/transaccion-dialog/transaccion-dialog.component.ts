import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Activo } from '../../models/activo.model';

// Interfaz para los datos que recibe el diálogo
interface TransaccionDialogData {
  activo: Activo;
  tipo: 'compra' | 'venta';
  balanceUsuario: number;
  cantidadDisponible?: number; // Para ventas
}

@Component({
  selector: 'app-transaccion-dialog',
  templateUrl: './transaccion-dialog.component.html',
  styleUrls: ['./transaccion-dialog.component.css']
})
export class TransaccionDialogComponent implements OnInit {
  transaccionForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TransaccionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransaccionDialogData
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.configurarValidadores();
  }

  private inicializarFormulario(): void {
    const maxCantidad = this.data.tipo === 'venta' ? (this.data.cantidadDisponible || 0) : null;
    
    this.transaccionForm = this.fb.group({
      cantidad: [1, [
        Validators.required, 
        Validators.min(1),
        ...(maxCantidad ? [Validators.max(maxCantidad)] : [])
      ]]
    });
  }

  private configurarValidadores(): void {
    // Suscribirse a cambios en la cantidad para validaciones dinámicas
    this.transaccionForm.get('cantidad')?.valueChanges.subscribe(cantidad => {
      this.validarTransaccion(cantidad);
    });
  }

  private validarTransaccion(cantidad: number): void {
    const cantidadControl = this.transaccionForm.get('cantidad');
    
    if (!cantidadControl || !cantidad) return;

    // Limpiar errores previos
    const erroresActuales = cantidadControl.errors || {};
    delete erroresActuales['fondosInsuficientes'];

    if (this.data.tipo === 'compra') {
      const valorTotal = cantidad * (this.data.activo.precio || 0);
      if (valorTotal > this.data.balanceUsuario) {
        erroresActuales['fondosInsuficientes'] = true;
      }
    }

    // Establecer errores actualizados
    const tieneErrores = Object.keys(erroresActuales).length > 0;
    cantidadControl.setErrors(tieneErrores ? erroresActuales : null);
  }

  // Métodos para los botones de cantidad
  disminuirCantidad(): void {
    const cantidadActual = this.getCantidadValida();
    if (cantidadActual > 1) {
      this.transaccionForm.patchValue({ cantidad: cantidadActual - 1 });
    }
  }

  aumentarCantidad(): void {
    const cantidadActual = this.getCantidadValida();
    const maxCantidad = this.obtenerCantidadMaxima();
    
    if (cantidadActual < maxCantidad) {
      this.transaccionForm.patchValue({ cantidad: cantidadActual + 1 });
    }
  }

  puedeDisminuir(): boolean {
    return this.getCantidadValida() > 1;
  }

  puedeAumentar(): boolean {
    const cantidadActual = this.getCantidadValida();
    const maxCantidad = this.obtenerCantidadMaxima();
    return cantidadActual < maxCantidad;
  }

  private obtenerCantidadMaxima(): number {
    if (this.data.tipo === 'venta') {
      return this.data.cantidadDisponible || 0;
    }
    
    // Para compras, el máximo está limitado por el balance disponible
    const precioUnitario = this.data.activo.precio || 0;
    if (precioUnitario <= 0) return 0;
    
    return Math.floor(this.data.balanceUsuario / precioUnitario);
  }

  // Método para establecer cantidad por valor (solo para compras)
  establecerPorValor(valor: number): void {
    if (this.data.tipo !== 'compra') return;
    
    const precioUnitario = this.data.activo.precio || 0;
    if (precioUnitario <= 0) return;
    
    const valorLimitado = Math.min(valor, this.data.balanceUsuario);
    const cantidad = Math.floor(valorLimitado / precioUnitario);
    
    if (cantidad > 0) {
      this.transaccionForm.patchValue({ cantidad });
    }
  }

  // Métodos de cálculo
  getCantidadValida(): number {
    const cantidad = this.transaccionForm.get('cantidad')?.value || 0;
    return Math.max(0, Math.floor(cantidad));
  }

  calcularValorTotal(): number {
    const cantidad = this.getCantidadValida();
    return cantidad * (this.data.activo.precio || 0);
  }

  calcularBalanceRestante(): number {
    if (this.data.tipo === 'compra') {
      return this.data.balanceUsuario - this.calcularValorTotal();
    }
    return this.data.balanceUsuario + this.calcularValorTotal();
  }

  // Validaciones finales
  puedeRealizarTransaccion(): boolean {
    if (!this.transaccionForm.valid) return false;
    
    const cantidad = this.getCantidadValida();
    if (cantidad <= 0) return false;
    
    if (this.data.tipo === 'compra') {
      return this.calcularValorTotal() <= this.data.balanceUsuario;
    } else {
      return cantidad <= (this.data.cantidadDisponible || 0);
    }
  }

  // Confirmar la transacción y cerrar el diálogo
  confirmarTransaccion(): void {
    if (this.transaccionForm.valid && this.puedeRealizarTransaccion()) {
      const resultado = {
        cantidad: this.getCantidadValida(),
        valorTotal: this.calcularValorTotal()
      };
      
      this.dialogRef.close(resultado);
    }
  }

  // Método para formatear valores monetarios
  formatearDinero(valor: number | undefined): string {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(valor || 0);
  }
}