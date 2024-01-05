import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}
  login() {
    this.authService.login(this.username, this.password)
      .subscribe({
        next: (response:any) => {
          if (response && response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('username', this.username)
            this.router.navigate(['/dashboard']);
          } else {
            alert('Invalid credentials. Please try again.');
          }
        },
        error: (error) => {
          console.error(error);
          alert('Login failed. Please try again.');
        }
      });
  }
}
