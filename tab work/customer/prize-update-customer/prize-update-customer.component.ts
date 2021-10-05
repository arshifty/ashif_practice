import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject,
  EventEmitter
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  DateAdapter,
  MAT_DATE_FORMATS
} from '@angular/material';
import { MatDialog, MatSnackBar } from '@angular/material';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { SL_FORMATS } from '@app/shared/classes/data-store.class';
import { addTimeToDate } from '@app/shared/functions/moment';
import { CustomerService } from '../customer.service';

@Component({
  selector: 'anms-prize-update-customer',
  templateUrl: './prize-update-customer.component.html',
  styleUrls: ['./prize-update-customer.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: SL_FORMATS }
  ]
})
export class PrizeUpdateCustomerComponent implements OnInit {
  prizeId: string;
  submitted: boolean;
  wait: boolean;
  onYes = new EventEmitter();
  prizeUpdateForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<PrizeUpdateCustomerComponent>,
    private snackBar: MatSnackBar,
    private _customerService: CustomerService
  ) {}

  ngOnInit() {
    if (this.data) {
      this.prizeId = this.data;
    }
    this.getPrizeData();
    this.createForm();
  }
  private createForm() {
    this.prizeUpdateForm = new FormGroup({
      draw_date: new FormControl('', Validators.required),
      draw_time: new FormControl('', Validators.required)
    });
  }

  getPrizeData() {
    this._customerService
      .getPrizeData(this.prizeId)
      .subscribe((result: any) => {
        if (result && result.success) {
          this.prizeUpdateForm.controls['draw_date'].setValue(
            result.data.draw_date
          );
          this.prizeUpdateForm.controls['draw_time'].setValue(
            result.data.draw_time
          );
        }
      });
  }

  submit() {
    this.submitted = true;
    if (this.prizeUpdateForm.valid) {
      let data: any = this.prizeUpdateForm.value;
      data.id = this.prizeId;
      data.draw_date = addTimeToDate(data.draw_date, data.draw_time);
      this.submitted = false;
      this.wait = true;
      this._customerService.updatePrizeData(data).subscribe((result: any) => {
        this.wait = false;
        if (result.success) {
          this.onYes.emit({ success: true });
        } else {
          this.snackBar.open(result.message, 'Update Failed', {
            duration: 4000,
            verticalPosition: 'top'
          });
        }
      });
    } else {
      this.snackBar.open('Please Fill The Form', 'Failed', {
        duration: 4000,
        verticalPosition: 'top'
      });
    }
  }

  onNoClick() {
    this.dialogRef.close();
  }
}
