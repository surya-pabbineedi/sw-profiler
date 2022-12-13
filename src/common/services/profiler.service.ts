import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { App } from '../models/application.model';
import { Dashboard } from '../models/dashboard.model';
import { Report } from '../models/report.model';
import { Workspace } from '../models/workspace.model';

@Injectable({
  providedIn: 'root'
})
export class ProfilerService {
  readonly apiUrl: string = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private getTokenHeader() {
    return { 'Private-Token': environment.apiKey };
  }

  getWorkspaces(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${this.apiUrl}workspaces`, { headers: this.getTokenHeader() });
  }

  getApplications() {
    return this.http.get<App[]>(`${this.apiUrl}app`, { headers: this.getTokenHeader() });
  }

  getDashboards() {
    return this.http.get<Dashboard[]>(`${this.apiUrl}dashboard`, { headers: this.getTokenHeader() });
  }

  getReports() {
    return this.http.get<Report[]>(`${this.apiUrl}reports`, { headers: this.getTokenHeader() });
  }

  getTasks() {
    return this.http
      .get<any>(`${this.apiUrl}task/list`, { headers: this.getTokenHeader() })
      .pipe(map(response => response?.tasks));
  }

  getTask(id: string) {
    return this.http.get(`${this.apiUrl}task/${id}`, { headers: this.getTokenHeader() });
  }

  getWorkflows() {
    return this.http.get<any[]>(`${this.apiUrl}workflow`, { headers: this.getTokenHeader() });
  }

  getPackages() {
    return this.http.get<any[]>(`${this.apiUrl}task/packages`, { headers: this.getTokenHeader() });
  }
}
