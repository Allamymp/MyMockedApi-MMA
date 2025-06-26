// src/app/template-form/template-form.component.ts
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Template } from '../api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-template-form',
  templateUrl: './template-form.component.html',
  styleUrls: ['./template-form.component.scss'],
  standalone: false
})
export class TemplateFormComponent implements OnInit, OnDestroy {
  templateForm: FormGroup;
  isEditMode: boolean;

  // Propriedades para Content-Type
  contentTypes: string[] = [
    'application/json',
    'application/xml',
    'text/plain',
    'text/html'
  ];
  protected _onDestroy = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TemplateFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { template?: Template, name?: string }
  ) {
    this.isEditMode = !!data.template;
    this.templateForm = this.fb.group({
      name: [{ value: data.template?.name || '', disabled: this.isEditMode }, Validators.required],
      responseStatus: [data.template?.responseStatus || 200, [Validators.required, Validators.min(100), Validators.max(599)]],
      contentType: [this.getContentTypeFromHeaders(data.template?.responseHeaders) || 'application/json', Validators.required],
      responseHeaders: [this.removeContentTypeFromHeaders(data.template?.responseHeaders) || '', null],
      responseBody: [data.template?.responseBody ? JSON.stringify(data.template.responseBody, null, 2) : '', Validators.required]
    });
  }

  ngOnInit(): void {
    this.templateForm.get('contentType')?.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(value => {
        this.onContentTypeChange(value as string);
      });

    if (this.isEditMode && this.templateForm.get('contentType')?.value === 'application/json' && typeof this.templateForm.get('responseBody')?.value !== 'string') {
        this.templateForm.patchValue({
            responseBody: JSON.stringify(this.templateForm.get('responseBody')?.value, null, 2)
        });
    }
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

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
    const bodyControl = this.templateForm.get('responseBody');
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

  save(): void {
    if (this.templateForm.valid) {
      const formValue = this.templateForm.getRawValue();
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

      const result: Template = {
        name: formValue.name,
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