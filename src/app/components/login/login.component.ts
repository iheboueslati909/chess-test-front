import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule],
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent {
	loginForm: FormGroup;
	loading = false;
	error: string | null = null;

	constructor(
		private fb: FormBuilder,
		private auth: AuthService,
		private router: Router
	) {
		this.loginForm = this.fb.group({
			username: ['', [Validators.required, Validators.minLength(3)]],
			password: ['', [Validators.required]]
		});
	}

	submit(): void {
		if (this.loginForm.invalid) {
			this.loginForm.markAllAsTouched();
			return;
		}

		this.loading = true;
		this.error = null;

		const credentials = this.loginForm.value as LoginRequest;

		this.auth.login(credentials).subscribe({
			next: (res) => {
				this.loading = false;
				if (res.success) {
					this.router.navigate(['/lobby']);
				} else {
					this.error = res.message || 'Login failed';
				}
			},
			error: (err) => {
				this.loading = false;
				this.error = err?.error?.message || err?.message || 'An error occurred';
			}
		});
	}
}

// Provide default export so `loadComponent(() => import('./...'))` works as a shorthand
export default LoginComponent;
