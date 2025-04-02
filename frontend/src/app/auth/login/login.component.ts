import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Iniciar Sesión</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" required>
            <mat-error *ngIf="loginForm.get('email')?.hasError('required')">El email es requerido</mat-error>
            <mat-error *ngIf="loginForm.get('email')?.hasError('email')">Email inválido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Contraseña</mat-label>
            <input matInput type="password" formControlName="password" required>
            <mat-error *ngIf="loginForm.get('password')?.hasError('required')">La contraseña es requerida</mat-error>
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit" [disabled]="loginForm.invalid">Iniciar Sesión</button>
        </form>
      </mat-card-content>
      <mat-card-actions>
        <a mat-button routerLink="/registro">¿No tienes cuenta? Regístrate</a>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      margin: 100px 0;
    }
    mat-card {
      max-width: 400px;
      width: 100%;
      margin: 0 20px;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    mat-card-actions {
      display: flex;
      justify-content: center;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.http.post('http://localhost:3000/login', this.loginForm.value)
        .subscribe({
          next: (response: any) => {
            this.snackBar.open('Inicio de sesión exitoso', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            this.snackBar.open('Error al iniciar sesión', 'Cerrar', { duration: 3000 });
          }
        });
    }
  }
}