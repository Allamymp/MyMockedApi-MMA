// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';  

// Angular Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';  
import { MatNativeDateModule } from '@angular/material/core';     

// ngx-mat-select-search
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

// Seus componentes declarados
import { App } from './app';
import { MockFormComponent } from './mock-form/mock-form.component';
import { TemplateFormComponent } from './template-form/template-form.component';
import { ConfigService } from './config.service';

@NgModule({
  declarations: [
    App,
    MockFormComponent,
    TemplateFormComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,

    // Angular Material Modules
    MatToolbarModule,
    MatTabsModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatCardModule,
    MatDatepickerModule,  
    MatNativeDateModule,  

    NgxMatSelectSearchModule
  ],
  providers: [
    ConfigService,
    DatePipe  
  ],
  bootstrap: [App]
})
export class AppModule { }