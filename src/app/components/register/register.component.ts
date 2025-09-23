import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './register.component.html',
	styleUrls: ['./register.component.css']
})
export class RegisterComponent {
	registerForm: FormGroup;
	loading = false;
	error: string | null = null;

	constructor(
		private fb: FormBuilder,
		private auth: AuthService,
		private router: Router
	) {
		this.registerForm = this.fb.group({
			username: ['', [Validators.required, Validators.minLength(3)]],
			password: ['', [Validators.required, Validators.minLength(6)]],
			confirm: ['', [Validators.required]]
		}, { validators: this.passwordsMatch });
	}

	private passwordsMatch(group: FormGroup) {
		const p = group.get('password')?.value;
		const c = group.get('confirm')?.value;
		return p === c ? null : { mismatch: true };
	}

	submit(): void {
		if (this.registerForm.invalid) {
			this.registerForm.markAllAsTouched();
			return;
		}

		this.loading = true;
		this.error = null;

		const { username, password } = this.registerForm.value;

		this.auth.register({ username, password }).subscribe({
			next: (res) => {
				this.loading = false;
				if (res.success) {
					this.router.navigate(['/lobby']);
				} else {
					this.error = res.message || 'Registration failed';
				}
			},
			error: (err) => {
				this.loading = false;
				this.error = err?.error?.message || err?.message || 'An error occurred';
			}
		});
	}
}

export default RegisterComponent;
