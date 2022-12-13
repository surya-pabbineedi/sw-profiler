import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxUIModule, IconModule } from '@swimlane/ngx-ui';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { NavigationComponent } from '../common/components/navigation/navigation.component';
import { ProfilerStore } from 'src/common/store/profiler.store';
import { NavigationStore } from 'src/common/store/navigation.store';

@NgModule({
  declarations: [AppComponent, LoginComponent, NavigationComponent],
  imports: [BrowserModule, BrowserAnimationsModule, AppRoutingModule, NgxUIModule, HttpClientModule, IconModule],
  providers: [ProfilerStore, NavigationStore],
  bootstrap: [AppComponent]
})
export class AppModule {}
