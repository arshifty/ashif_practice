import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject,
  EventEmitter
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { ExcelService } from '@app/shared/services/excel-export.service';
import { CustomerService } from '../customer.service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';

@Component({
  selector: 'anms-upload-sales',
  templateUrl: './upload-sales.component.html',
  styleUrls: ['./upload-sales.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadSalesComponent implements OnInit {
  onYes = new EventEmitter();
  validSales: any = [];
  file_name: string;
  inExistEmails: any = [];
  waiting: boolean;

  constructor(
    private cDF: ChangeDetectorRef,
    public dialogRef: MatDialogRef<UploadSalesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _excelService: ExcelService,
    public snackBar: MatSnackBar,
    private _customerService: CustomerService,
    private spinnerService: Ng4LoadingSpinnerService
  ) {}

  ngOnInit() {}
  onNoClick() {
    this.dialogRef.close();
  }

  onFileSelect(event) {
    this.inExistEmails = [];
    if (event.srcElement.value) {
      var a = event.srcElement.value.toString().split('\\');
      this.file_name = a[a.length - 1];
      this._excelService.importExcel(event).then((result: any) => {
        this.validSales = result.filter(sel => {
          return (
            ((sel.email && sel.email != '' && validEmail(sel.email)) ||
              (sel.phone && sel.phone.length)) &&
            sel.number_of_game_remaining &&
            sel.number_of_game_remaining != '' &&
            !isNaN(sel.number_of_game_remaining) &&
            sel.ticket_1 &&
            sel.ticket_1 != ''
          );
        });
      });
    }
  }

  upload() {
    this.inExistEmails = [];
    if (this.validSales.length > 0) {
      this.waiting = true;
      this.cDF.detectChanges();
      this.spinnerService.show();
      this._customerService
        .uploadAdvanceSales(this.validSales, this.data.club_id)
        .subscribe((result: any) => {
          this.waiting = false;
          this.spinnerService.hide();
          if (result.success) {
            this.snackBar.open('Data uploaded successfully.', 'Success', {
              duration: 4000,
              verticalPosition: 'top'
            });
            this.dialogRef.close();
          } else if (!result.success && result.noJackpot) {
            this.snackBar.open(
              'Selected customer does not have any Jackpot.',
              'Invalid',
              {
                duration: 4000,
                verticalPosition: 'top'
              }
            );
          } else if (!result.success && result.inexist_email) {
            this.inExistEmails = result.emails;
            this.snackBar.open('Invalid data found.', 'Invalid', {
              duration: 4000,
              verticalPosition: 'top'
            });
            this.cDF.detectChanges();
          } else {
            this.snackBar.open(result.message, 'Error', {
              duration: 4000,
              verticalPosition: 'top'
            });
          }
          this.cDF.detectChanges();
        });
    } else {
      this.snackBar.open('No valid data found to upload.', 'Invalid', {
        duration: 4000,
        verticalPosition: 'top'
      });
    }
  }
}

function validEmail(email: string) {
  let pattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return pattern.test(email);
}
