import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  EventEmitter,
  ChangeDetectorRef
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, DateAdapter } from '@angular/material';
import { MatDialog, MatSnackBar } from '@angular/material';
import { CustomerService } from '../customer.service';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS } from '@angular/material';
import { SL_FORMATS } from '@app/shared/classes/data-store.class';
import { addTimeToDate } from '@app/shared/functions/moment';

@Component({
  selector: 'anms-jackpot-update-customer',
  templateUrl: './jackpot-update-customer.component.html',
  styleUrls: ['./jackpot-update-customer.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: SL_FORMATS }
  ]
})
export class JackpotUpdateCustomerComponent implements OnInit {
  jackpotId: string;
  submitted: boolean;
  wait: boolean;
  onYes = new EventEmitter();
  jackpotUpdateForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<JackpotUpdateCustomerComponent>,
    private snackBar: MatSnackBar,
    private _customerService: CustomerService
  ) {}

  ngOnInit() {
    if (this.data) {
      this.jackpotId = this.data;
    }
    this.getJackpotData();
    this.createForm();
  }

  private createForm() {
    this.jackpotUpdateForm = new FormGroup({
      jackpot_prize: new FormControl('', Validators.required),
      next_draw_date: new FormControl('', Validators.required),
      draw_time: new FormControl('', Validators.required)
    });
  }

  getJackpotData() {
    this._customerService
      .getJackpotData(this.jackpotId)
      .subscribe((result: any) => {
        if (result && result.success) {
          this.jackpotUpdateForm.controls['jackpot_prize'].setValue(
            result.data.jackpot_prize
          );
          this.jackpotUpdateForm.controls['next_draw_date'].setValue(
            result.data.next_draw_date
          );
          this.jackpotUpdateForm.controls['draw_time'].setValue(
            result.data.draw_time
          );
        }
      });
  }

  submit() {
    this.submitted = true;
    if (this.jackpotUpdateForm.valid) {
      let data: any = this.jackpotUpdateForm.value;
      data.id = this.jackpotId;
      data.next_draw_date = addTimeToDate(data.next_draw_date, data.draw_time);
      this.submitted = false;
      this.wait = true;
      this._customerService.updateJackpotData(data).subscribe((result: any) => {
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
