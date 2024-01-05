import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient, private router: Router) {}

  register(username: string, password: string): Observable<any> {
    const body = { username, password };
    return this.http.post(`${this.apiUrl}/register`, body);
  }

  login(username: string, password: string): Observable<string> {
    const body = { username, password };
    return this.http.post<string>(`${this.apiUrl}/login`, body);
  }

  saveData(data: any): Observable<any> {
    const token = localStorage.getItem('token');  // Assuming you store the token in localStorage after login

    // Set headers with Authorization token
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token || ''
    });

    return this.http.post<any>(`${this.apiUrl}/save-data`, { data }, { headers });
  }


  getData(username: string): Observable<any> {
    const token = localStorage.getItem('token');  // Assuming you store the token in localStorage after login

    // Set headers with Authorization token
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token || ''
    });

    // Include the username as a query parameter
    const params = { username };

    return this.http.get<any>(`${this.apiUrl}/get-data`, { headers, params });
  }

  isAuthenticated(){
    if(localStorage.getItem("token") && localStorage.getItem("email")){
        return true;
    }
    return false;
  }

  logout(){
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
