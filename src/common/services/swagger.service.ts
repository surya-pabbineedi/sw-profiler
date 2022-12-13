import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
// @ts-ignore
import SwaggerClient from 'swagger-client';

@Injectable()
export class SwaggerService {
  static client: SwaggerClient;
  static http: HttpClient;
  constructor(protected readonly http: HttpClient) {
  }

  initialize() {
    SwaggerService.client = new SwaggerClient.SwaggerClient('https://localhost/api/swagger');
  }
}
