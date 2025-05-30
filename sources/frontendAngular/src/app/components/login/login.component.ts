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
  mensajeError = '';

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
          console.log('Login exitoso:', respuesta);
          
          // Verificar si el usuario está suspendido
          if (respuesta.usuario && respuesta.usuario.estado === 'suspendido') {
            this.router.navigate(['/usuario-suspendido']);
            return;
          }
          
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.cargando = false;
          console.error('Error en login:', error);
          
          // Manejar específicamente usuarios suspendidos
          if (error.esSuspendido || (error.error && error.error.tipo === 'USUARIO_SUSPENDIDO')) {
            this.router.navigate(['/usuario-suspendido']);
            return;
          }
          
          // Otros errores de login
          if (error.status === 404) {
            this.mensajeError = 'Usuario no encontrado';
          } else if (error.status === 401) {
            this.mensajeError = 'Contraseña incorrecta';
          } else if (error.status === 403) {
            this.mensajeError = error.error?.mensaje || 'Acceso denegado';
          } else {
            this.mensajeError = 'Error en el servidor. Intenta nuevamente.';
          }
        }
      });
    }
    }
  }