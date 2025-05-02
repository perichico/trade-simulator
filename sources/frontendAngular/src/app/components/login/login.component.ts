import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  cargando = false;
  ocultarPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Verificar sesión y redirigir si ya está autenticado
    this.authService.verificarSesion().subscribe(estaAutenticado => {
      if (estaAutenticado) {
        this.router.navigate(['/dashboard']);
      }
    });

    // Inicializar formulario
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.cargando = true;
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (respuesta) => {
          this.cargando = false;
          this.snackBar.open('Inicio de sesión exitoso', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.cargando = false;
          this.snackBar.open(
            `Error al iniciar sesión: ${error.error?.error || 'Credenciales incorrectas'}`,
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
    }
    }
  }