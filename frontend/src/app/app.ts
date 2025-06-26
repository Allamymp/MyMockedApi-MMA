// src/app/app.ts
import { Component, OnInit } from '@angular/core';
import { ApiService, Mock, Template, LogEntry } from './api.service';  
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MockFormComponent } from './mock-form/mock-form.component';
import { TemplateFormComponent } from './template-form/template-form.component';
import { ConfigService } from './config.service';
import { filter, switchMap } from 'rxjs/operators';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: false,
  providers: [DatePipe]
})
export class App implements OnInit {
  activeTab: 'mocks' | 'templates' | 'logs' = 'mocks';
  mocks: string[] = [];
  templates: string[] = [];
  selectedMockDetail: Mock | null = null;
  selectedTemplateDetail: Template | null = null;

  searchTermMocks: string = '';
  searchTermTemplates: string = '';
  filteredMocks: string[] = [];
  filteredTemplates: string[] = [];

  logDates: Date[] = [];
  selectedLogDate: Date | null = null;
  currentDayLogs: LogEntry[] = []; 
  selectedLogEntry: LogEntry | null = null;
  searchTermLogs: string = '';
  filteredLogs: LogEntry[] = [];  

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private configService: ConfigService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.configService.loadConfig().pipe(
      filter(config => config !== null),
      switchMap(() => {
        this.loadMocks();
        this.loadTemplates();
        this.loadLogDates();
        return this.configService.config$;
      })
    ).subscribe({
      error: (err) => this.showError('Erro crítico ao carregar configuração inicial: ' + err.message)
    });
  }

  // --- Funções de Carregamento ---
  loadMocks(): void {
    this.apiService.getMocks().subscribe({
      next: (data) => {
        this.mocks = data;
        this.applyMockFilter();
      },
      error: (err) => this.showError('Erro ao carregar mocks: ' + err.message)
    });
  }

  loadTemplates(): void {
    this.apiService.getTemplates().subscribe({
      next: (data) => {
        this.templates = data;
        this.applyTemplateFilter();
      },
      error: (err) => this.showError('Erro ao carregar templates: ' + err.message)
    });
  }

  // --- Funções de Filtragem (Mocks e Templates) ---
  applyMockFilter(): void {
    if (!this.searchTermMocks) {
      this.filteredMocks = [...this.mocks];
    } else {
      this.filteredMocks = this.mocks.filter(mockKey =>
        mockKey.toLowerCase().includes(this.searchTermMocks.toLowerCase())
      );
    }
  }

  applyTemplateFilter(): void {
    if (!this.searchTermTemplates) {
      this.filteredTemplates = [...this.templates];
    } else {
      this.filteredTemplates = this.templates.filter(templateName =>
        templateName.toLowerCase().includes(this.searchTermTemplates.toLowerCase())
      );
    }
  }

  onSearchMocksChange(event: Event): void {
    this.searchTermMocks = (event.target as HTMLInputElement).value;
    this.applyMockFilter();
  }

  onSearchTemplatesChange(event: Event): void {
    this.searchTermTemplates = (event.target as HTMLInputElement).value;
    this.applyTemplateFilter();
  }

  // --- Funções de Ação para Mocks ---
  openAddMockDialog(): void {
    const dialogRef = this.dialog.open(MockFormComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.apiService.createMock(result).subscribe({
          next: () => {
            this.showSuccess('Mock criado com sucesso!');
            this.loadMocks();
          },
          error: (err) => this.showError('Erro ao criar mock: ' + (err.error?.error || err.message))
        });
      }
    });
  }

  deleteMock(mockKey: string): void {
    if (confirm(`Tem certeza que deseja deletar o mock "${mockKey}"?`)) {
      this.apiService.deleteMock(mockKey).subscribe({
        next: () => {
          this.showSuccess('Mock deletado com sucesso!');
          this.loadMocks();
          if (this.selectedMockDetail && this.getMockKey(this.selectedMockDetail) === mockKey) {
            this.selectedMockDetail = null;
          }
        },
        error: (err) => this.showError('Erro ao deletar mock: ' + (err.error?.error || err.message))
      });
    }
  }

  // --- Funções de Visualização e Edição de Mocks ---
  viewMockDetail(mockKey: string): void {
    this.apiService.getMockByKey(mockKey).subscribe({
      next: (data) => this.selectedMockDetail = data,
      error: (err) => this.showError('Erro ao carregar detalhes do mock: ' + err.message)
    });
  }

  editMock(mockKey: string): void {
    this.apiService.getMockByKey(mockKey).subscribe({
      next: (mockData) => {
        const dialogRef = this.dialog.open(MockFormComponent, {
          width: '600px',
          data: { mock: mockData, indexKey: mockKey }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.apiService.deleteMock(mockKey).subscribe(() => {
              this.apiService.createMock(result).subscribe({
                next: () => {
                  this.showSuccess('Mock atualizado com sucesso!');
                  this.loadMocks();
                  if (this.selectedMockDetail && this.getMockKey(this.selectedMockDetail) === mockKey) {
                    this.selectedMockDetail = result;
                  }
                },
                error: (err) => this.showError('Erro ao atualizar mock: ' + (err.error?.error || err.message))
              });
            }, (err) => this.showError('Erro ao deletar mock para atualização: ' + (err.error?.error || err.message)));
          }
        });
      },
      error: (err) => this.showError('Erro ao carregar mock para edição: ' + err.message)
    });
  }


  // --- Funções de Ação para Templates ---
  getTemplateDetails(name: string): void {
    this.apiService.getTemplateByName(name).subscribe({
      next: (data) => this.selectedTemplateDetail = data,
      error: (err) => this.showError('Erro ao carregar detalhes do template: ' + err.message)
    });
  }

  viewTemplateDetail(name: string): void {
    this.getTemplateDetails(name);
  }

  editTemplate(templateName: string): void {
    this.apiService.getTemplateByName(templateName).subscribe({
      next: (templateData) => {
        const dialogRef = this.dialog.open(TemplateFormComponent, {
          width: '600px',
          data: { template: templateData, name: templateName }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.apiService.deleteTemplate(templateName).subscribe(() => {
              this.apiService.createTemplate(result).subscribe({
                next: () => {
                  this.showSuccess('Template atualizado com sucesso!');
                  this.loadTemplates();
                  if (this.selectedTemplateDetail?.name === templateName) {
                    this.selectedTemplateDetail = result;
                  }
                },
                error: (err) => this.showError('Erro ao atualizar template: ' + (err.error?.error || err.message))
              });
            }, (err) => this.showError('Erro ao deletar template para atualização: ' + (err.error?.error || err.message)));
          }
        });
      },
      error: (err) => this.showError('Erro ao carregar template para edição: ' + err.message)
    });
  }

  openAddTemplateDialog(): void {
    const dialogRef = this.dialog.open(TemplateFormComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.apiService.createTemplate(result).subscribe({
          next: () => {
            this.showSuccess('Template criado com sucesso!');
            this.loadTemplates();
          },
          error: (err) => this.showError('Erro ao criar template: ' + (err.error?.error || err.message))
        });
      }
    });
  }

  deleteTemplate(templateName: string): void {
    if (confirm(`Tem certeza que deseja deletar o template "${templateName}"?`)) {
      this.apiService.deleteTemplate(templateName).subscribe({
        next: () => {
          this.showSuccess('Template deletado com sucesso!');
          this.loadTemplates();
          if (this.selectedTemplateDetail?.name === templateName) {
            this.selectedTemplateDetail = null;
          }
        },
        error: (err) => this.showError('Erro ao deletar template: ' + (err.error?.error || err.message))
      });
    }
  }

  // --- Funções para a Aba de Logs ---
  loadLogDates(): void {
    this.apiService.getLogDates().subscribe({
      next: (dates) => {
        this.logDates = dates.map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
        this.selectedLogDate = this.logDates.length > 0 ? this.logDates[0] : new Date();
        this.onLogDateChange(this.selectedLogDate);
      },
      error: (err) => this.showError('Erro ao carregar datas de logs: ' + err.message)
    });
  }

  onLogDateChange(newDate: Date | null): void {
    this.selectedLogDate = newDate;
    this.selectedLogEntry = null;
    if (this.selectedLogDate) {
      const formattedDate = this.datePipe.transform(this.selectedLogDate, 'yyyy-MM-dd');
      if (formattedDate) {
        this.apiService.getLogsByDate(formattedDate).subscribe({
          next: (logs) => {
            // Ordena os logs do mais recente para o mais antigo (descendente)
            this.currentDayLogs = logs.sort((a, b) => {
              const dateA = new Date(a.timestamp);
              const dateB = new Date(b.timestamp);
              return dateB.getTime() - dateA.getTime();  
            });
            this.applyLogFilter();
          },
          error: (err) => {
            this.currentDayLogs = [];
            this.applyLogFilter();
            if (err.status !== 404) {
              this.showError(`Erro ao carregar logs para ${formattedDate}: ` + (err.error?.error || err.message));
            } else {
              this.showSuccess(`Nenhum log encontrado para a data ${formattedDate}.`);
            }
          }
        });
      }
    } else {
      this.currentDayLogs = [];
      this.applyLogFilter();
    }
  }

 

  applyLogFilter(): void {
    if (!this.searchTermLogs) {
      this.filteredLogs = [...this.currentDayLogs];
    } else {
      const filterValue = this.searchTermLogs.toLowerCase();
      this.filteredLogs = this.currentDayLogs.filter(log =>  
        (log.type && log.type.toLowerCase().includes(filterValue)) ||
        (log.method && log.method.toLowerCase().includes(filterValue)) ||
        (log.path && log.path.toLowerCase().includes(filterValue)) ||
        (log.status !== undefined && log.status.toString().includes(filterValue)) ||
        (log.sourceIp && log.sourceIp.includes(filterValue)) ||
        (log.destinationIp && log.destinationIp.includes(filterValue)) ||
        (log.query && JSON.stringify(log.query).toLowerCase().includes(filterValue)) ||
        (log.headers && JSON.stringify(log.headers).toLowerCase().includes(filterValue)) ||
        (log.body && typeof log.body === 'string' && log.body.toLowerCase().includes(filterValue)) ||
        (log.body && typeof log.body === 'object' && JSON.stringify(log.body).toLowerCase().includes(filterValue)) ||
        (log.truncated && log.truncated.toLowerCase().includes(filterValue)) // Adicionado filtro para truncado
      );
    }
  }

  onSearchLogsChange(event: Event): void {
    this.searchTermLogs = (event.target as HTMLInputElement).value;
    this.applyLogFilter();
  }

  // viewLogEntryDetail agora recebe LogEntry
  viewLogEntryDetail(logEntry: LogEntry): void {  
    this.selectedLogEntry = (this.selectedLogEntry === logEntry) ? null : logEntry;
  }

  // --- Utilidades ---
  showSuccess(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 3000, panelClass: ['success-snackbar'] });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 5000, panelClass: ['error-snackbar'] });
  }

  getMockKey(mock: Mock): string {
    return mock.method + '_' + mock.path;
  }
  public getCleanPath(path: string | undefined): string {
    return this.apiService.removeApiControlPrefix(path);
  }
}