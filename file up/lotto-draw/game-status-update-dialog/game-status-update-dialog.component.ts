import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { LottoServiceService } from '../../lotto-service.service';

@Component({
  selector: 'app-game-status-update-dialog',
  templateUrl: './game-status-update-dialog.component.html',
  styleUrls: ['./game-status-update-dialog.component.scss']
})
export class GameStatusUpdateDialogComponent implements OnInit {

  gameStatusForm: FormGroup;
  onYes = new EventEmitter();
  isSubmit: boolean = false;
  waiting: boolean;
  data: any;

  constructor(
    private modalService: BsModalRef,
    private _lottoManagementService: LottoServiceService,
    public toast: ToastrService,
    private spinnerService: Ng4LoadingSpinnerService
  ) { }

  ngOnInit() {
    this.createForm();
    this.validator();
  }

  messageChange() {
    this.gameStatusForm.controls['message'].setValue(this.gameStatusForm.controls['message'].value.trim());
  };

  private createForm() {
    this.gameStatusForm = new FormGroup({
      schedule_date: new FormControl(''),
      schedule_time: new FormControl(new Date()),
      message: new FormControl(''),
    })
  }

  validator() {
    if (this.data.game_status) {
      this.gameStatusForm.controls['message'].setValidators([Validators.required]);
    } else {
      this.gameStatusForm.controls['message'].clearValidators();
    }
    this.gameStatusForm.controls['message'].updateValueAndValidity();
  }

  onNoClick(): void {
    this.modalService.hide();
  }

  update() {
    this.isSubmit = true;

    if (this.gameStatusForm.valid ) {

      let schedule_date = this.gameStatusForm.controls['schedule_date'].value;
      let schedule_time = this.gameStatusForm.controls['schedule_time'].value;
      let message = this.gameStatusForm.controls['message'].value.trim();

      if (schedule_date) {
        schedule_date.setHours(schedule_time.getHours());
        schedule_date.setMinutes(schedule_time.getMinutes());
      }

      const data = {
        game_status: !this.data.game_status,
        jackpot_id: this.data.jackpot_id,
        schedule_date: schedule_date ? schedule_date : null,
        message: message ? message : null
      }

      this.spinnerService.show();
      this.waiting = true;

      this._lottoManagementService.updateGameStatus(data).subscribe((result: any) => {
        this.spinnerService.hide();
        this.waiting = false;
        this.isSubmit = false;

        if (result.success) {
          this.modalService.hide();
          this.onYes.emit({ success: true });
        } else {
          this.toast.error(result.message, 'Failed');
        }
      })
    }
  }
}
