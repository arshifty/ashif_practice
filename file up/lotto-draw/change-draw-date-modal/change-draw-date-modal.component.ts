import { Component, OnInit, ChangeDetectionStrategy, Inject, EventEmitter } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { LottoServiceService } from '../../lotto-service.service';
import { ToastrService } from 'ngx-toastr';
import { getTimeFromPicker, setTimePikerTimeToDate } from 'src/app/shared/functions/others';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';


@Component({
  selector: 'anms-change-draw-date-modal',
  templateUrl: './change-draw-date-modal.component.html',
  styleUrls: ['./change-draw-date-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeDrawDateModalComponent implements OnInit {

  reScheduleObj: any = {};
  onYes = new EventEmitter();
  public data: any;
  waiting: boolean;

  constructor(
    public dialogRef: BsModalRef,
    private _lottoManagementService: LottoServiceService,
    private toast: ToastrService,
    private spinnerService: Ng4LoadingSpinnerService
  ) { }

  ngOnInit() {
    this.reScheduleObj = {
      _id: this.data._id,
      new_draw_date: this.data.next_draw_date,
      new_draw_time: this.data.next_draw_time
    }
    console.log('re',this.reScheduleObj)
  }

  reSchedule() {
    let data = {
      _id: this.reScheduleObj._id,
      next_draw_date: setTimePikerTimeToDate(this.reScheduleObj.new_draw_date, this.reScheduleObj.new_draw_time),
      draw_time: getTimeFromPicker(this.reScheduleObj.new_draw_time)
    }
    this.spinnerService.show();
    this.waiting = true;
    this._lottoManagementService.rescheduleLottoDraw(data).subscribe((result: any) => {
      this.spinnerService.hide();
      this.waiting = false;
      if (result.success) {
        this.onYes.emit({success: true});
        this.toast.success("Draw date set successfully.", "Success");
      } else {
        this.toast.success(result.message, "Error");
      }
    })
  }

  onNoClick(): void {
    this.dialogRef.hide();
  }

}
