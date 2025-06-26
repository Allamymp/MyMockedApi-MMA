// src/app/mock-form/mock-form.component.ts
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService, Mock, Template } from '../api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface StatusCode {
  code: number;
  description: string;
}

@Component({
  selector: 'app-mock-form',
  templateUrl: './mock-form.component.html',
  styleUrls: ['./mock-form.component.scss'],
  standalone: false
})
export class MockFormComponent implements OnInit, OnDestroy {
  mockForm: FormGroup;
  isEditMode: boolean;
  httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  allTemplates: string[] = [];
  filteredTemplates: string[] = [];
  selectedTemplateName: string = '';
  private loadedTemplatesData: { [key: string]: Template } = {};
  templateSearchCtrl: FormControl = new FormControl();

  protected _onDestroy = new Subject<void>();

  allStatusCodes: StatusCode[] = [
    { code: 100, description: 'Continue' },
    { code: 101, description: 'Switching Protocols' },
    { code: 200, description: 'OK' },
    { code: 201, description: 'Created' },
    { code: 202, description: 'Accepted' },
    { code: 203, description: 'Non-Authoritative Information' },
    { code: 204, description: 'No Content' },
    { code: 205, description: 'Reset Content' },
    { code: 206, description: 'Partial Content' },
    { code: 300, description: 'Multiple Choices' },
    { code: 301, description: 'Moved Permanently' },
    { code: 302, description: 'Found' },
    { code: 303, description: 'See Other' },
    { code: 304, description: 'Not Modified' },
    { code: 307, description: 'Temporary Redirect' },
    { code: 308, description: 'Permanent Redirect' },
    { code: 400, description: 'Bad Request' },
    { code: 401, description: 'Unauthorized' },
    { code: 403, description: 'Forbidden' },
    { code: 404, description: 'Not Found' },
    { code: 405, description: 'Method Not Allowed' },
    { code: 406, description: 'Not Acceptable' },
    { code: 408, description: 'Request Timeout' },
    { code: 409, description: 'Conflict' },
    { code: 410, description: 'Gone' },
    { code: 413, description: 'Payload Too Large' },
    { code: 414, description: 'URI Too Long' },
    { code: 415, description: 'Unsupported Media Type' },
    { code: 429, description: 'Too Many Requests' },
    { code: 500, description: 'Internal Server Error' },
    { code: 501, description: 'Not Implemented' },
    { code: 502, description: 'Bad Gateway' },
    { code: 503, description: 'Service Unavailable' },
    { code: 504, description: 'Gateway Timeout' },
  ];
  filteredStatusCodes: StatusCode[] = [];
  statusCodeSearchCtrl: FormControl = new FormControl();

  contentTypes: string[] = [
    'application/json',
    'application/xml',
    'text/plain',
    'text/html'
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MockFormComponent>,
    private apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: { mock?: Mock, indexKey?: string, isViewMode?: boolean }
  ) {
    this.isEditMode = !!data.mock; // True se um mock foi passado para edição
    const initialMock = data.mock;
    this.mockForm = this.fb.group({
      method: [{ value: initialMock?.method || 'GET', disabled: data.isViewMode }, Validators.required],
      path: [{ value: initialMock?.path || '', disabled: data.isViewMode }, Validators.required],
      responseStatus: [{ value: initialMock?.responseStatus || 200, disabled: data.isViewMode }, [Validators.required, Validators.min(100), Validators.max(599)]],
      contentType: [{ value: this.getContentTypeFromHeaders(initialMock?.responseHeaders) || 'application/json', disabled: data.isViewMode }, Validators.required],
      responseHeaders: [{ value: this.removeContentTypeFromHeaders(initialMock?.responseHeaders) || '', disabled: data.isViewMode }, null],
      responseBody: [{ value: initialMock?.responseBody ? JSON.stringify(initialMock.responseBody, null, 2) : '', disabled: data.isViewMode }, Validators.required]
    });
  }

  ngOnInit(): void {
    // Apenas carrega templates se não for modo de visualização
    if (!this.data.isViewMode) {
      this.loadAllTemplates();
      this.templateSearchCtrl.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.filterTemplates(this.templateSearchCtrl.value);
        });
    }

    this.filteredStatusCodes = [...this.allStatusCodes];
    this.statusCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterStatusCodes(this.statusCodeSearchCtrl.value);
      });

    this.mockForm.get('contentType')?.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(value => {
        this.onContentTypeChange(value as string);
      });

    // Se estiver em modo de edição/visualização e o corpo já for JSON, tenta pré-formatar
    if (this.isEditMode && typeof this.mockForm.get('responseBody')?.value !== 'string' && this.mockForm.get('contentType')?.value === 'application/json') {
        this.mockForm.patchValue({
            responseBody: JSON.stringify(this.mockForm.get('responseBody')?.value, null, 2)
        });
    }
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  // Funções para Seleção de Template
  loadAllTemplates(): void {
    this.apiService.getTemplates().subscribe({
      next: (names) => {
        this.allTemplates = ['Nenhum', ...names];
        this.filteredTemplates = [...this.allTemplates];
      },
      error: (err) => console.error('Erro ao carregar lista de templates:', err)
    });
  }

  filterTemplates(value: string): void {
    const filterValue = value.toLowerCase();
    this.filteredTemplates = this.allTemplates.filter(template =>
      template.toLowerCase().includes(filterValue)
    );
  }

  onTemplateSelected(templateName: string): void {
    this.selectedTemplateName = templateName;
    if (templateName === 'Nenhum') {
      this.clearResponseFields();
    } else {
      this.loadTemplateData(templateName);
    }
  }

  loadTemplateData(templateName: string): void {
    if (this.loadedTemplatesData[templateName]) {
      this.fillFormWithTemplate(this.loadedTemplatesData[templateName]);
      return;
    }

    this.apiService.getTemplateByName(templateName).subscribe({
      next: (templateData) => {
        this.loadedTemplatesData[templateName] = templateData;
        this.fillFormWithTemplate(templateData);
      },
      error: (err) => {
        console.error('Erro ao carregar dados do template:', err);
        alert('Erro ao carregar dados do template. Por favor, tente novamente.');
        this.clearResponseFields();
      }
    });
  }

  private fillFormWithTemplate(templateData: Template): void {
    this.mockForm.patchValue({
      responseStatus: templateData.responseStatus,
      responseHeaders: templateData.responseHeaders ? JSON.stringify(templateData.responseHeaders, null, 2) : '',
      responseBody: JSON.stringify(templateData.responseBody, null, 2)
    });
  }

  private clearResponseFields(): void {
    this.mockForm.patchValue({
      responseStatus: 200,
      responseHeaders: '',
      responseBody: ''
    });
  }

  // Funções para Seleção de Status Code
  filterStatusCodes(value: string): void {
    const filterValue = value.toLowerCase();
    this.filteredStatusCodes = this.allStatusCodes.filter(statusCode =>
      statusCode.description.toLowerCase().includes(filterValue) ||
      statusCode.code.toString().includes(filterValue)
    );
  }

  // Funções para Content-Type
  private getContentTypeFromHeaders(headers: { [key: string]: string } | undefined): string | null {
    if (headers) {
      for (const key in headers) {
        if (headers.hasOwnProperty(key) && key.toLowerCase() === 'content-type') {
          return headers[key];
        }
      }
    }
    return null;
  }

  private removeContentTypeFromHeaders(headers: { [key: string]: string } | undefined): string {
    if (!headers) return '';
    const newHeaders = { ...headers };
    for (const key in newHeaders) {
      if (newHeaders.hasOwnProperty(key) && key.toLowerCase() === 'content-type') {
        delete newHeaders[key];
        break;
      }
    }
    return Object.keys(newHeaders).length > 0 ? JSON.stringify(newHeaders, null, 2) : '';
  }

  onContentTypeChange(selectedType: string): void {
    const bodyControl = this.mockForm.get('responseBody');
    if (!bodyControl) return;

    if (selectedType === 'application/json') {
      bodyControl.setValidators(Validators.required);
      try {
        const currentValue = bodyControl.value;
        if (typeof currentValue === 'object' || (typeof currentValue === 'string' && currentValue.trim().startsWith('{') && currentValue.trim().endsWith('}'))) {
          bodyControl.patchValue(JSON.stringify(JSON.parse(currentValue), null, 2));
        }
      } catch (e) {
        bodyControl.patchValue('');
      }
    } else {
      bodyControl.setValidators(Validators.required);
    }
    bodyControl.updateValueAndValidity();
  }

  // Funções de Ação do Formulário (save, cancel e etc)
  save(): void {
    if (this.mockForm.valid) {
      const formValue = this.mockForm.getRawValue();
      let parsedHeaders: { [key: string]: string };
      let parsedBody: any;

      try {
        parsedHeaders = formValue.responseHeaders ? JSON.parse(formValue.responseHeaders) : {};
        parsedHeaders['Content-Type'] = formValue.contentType;
      } catch (e) {
        alert('Headers adicionais JSON inválido!');
        return;
      }

      if (formValue.contentType === 'application/json') {
        try {
          parsedBody = JSON.parse(formValue.responseBody);
        } catch (e) {
          alert('Corpo da Resposta deve ser JSON válido para application/json!');
          return;
        }
      } else {
        parsedBody = formValue.responseBody;
      }

      const result: Mock = {
        method: formValue.method,
        path: formValue.path,
        responseStatus: formValue.responseStatus,
        responseHeaders: parsedHeaders,
        responseBody: parsedBody
      };
      this.dialogRef.close(result);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}