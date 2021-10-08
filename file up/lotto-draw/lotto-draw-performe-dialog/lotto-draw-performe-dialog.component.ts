import { Component, OnInit, ChangeDetectionStrategy, EventEmitter, Inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthGuardService } from 'src/app/shared/services/auth-guard.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { LottoServiceService } from '../../lotto-service.service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';

@Component({
  selector: 'anms-lotto-draw-performe-dialog',
  templateUrl: './lotto-draw-performe-dialog.component.html',
  styleUrls: ['./lotto-draw-performe-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LottoDrawPerformeDialogComponent implements OnInit {

  selected: number = 0;
  auto_selecetd: number = 0;
  onYes = new EventEmitter();
  onDrawRestart = new EventEmitter();
  draw_data: any = {};
  generated_result: any = { jackpot_amount: 5020, draw_date: new Date() };
  waiting: boolean;
  data: any;

  constructor(
    public _authGuardService: AuthGuardService,
    private modalService: BsModalRef,
    public _lottoManagementService: LottoServiceService,
    private toast: ToastrService,
    private router: Router,
    private spinnerService: Ng4LoadingSpinnerService,
    private cDF: ChangeDetectorRef
  ) { }


  ngOnInit() {
    console.log(this.data);
    if (this.data && this.data.type == 'auto') {
      this.draw_data.draw_nums = this.data.draw_nums;
      this.draw_data.first_winning_number = this.data.draw_nums[0];
      this.draw_data.second_winning_number = this.data.draw_nums[1];
      this.draw_data.third_winning_number = this.data.draw_nums[2];
      this.draw_data.forth_winning_number = this.data.draw_nums[3];
    }
  }

  onClickedTab(index) {
    this.selected = index;
  }

  editDraw() {
    this.modalService.hide();
    this.router.navigateByUrl('/pages/club/lotto-management/lotto-settings');
  }

  onConfirmManualNumber() {
    let arrs = [
      this.draw_data.first_winning_number,
      this.draw_data.second_winning_number,
      this.draw_data.third_winning_number,
      this.draw_data.forth_winning_number
    ];
    let valid_nums = arrs.filter(num => {
      return num <= this.data.number_of_ball && num != null && num > 0;
    });
    if (valid_nums.length < 4) {
      this.toast.error('Numbers should not be empty or greater then max number of ball.', 'Invalid');
    } else if (hasDuplicates(valid_nums)) {
      this.toast.error('Numbers shoud be unique!', 'Invalid');
    } else {
      this.draw_data.draw_nums = sortArray(valid_nums);
      this.selected = 1;
    }
  }



  onAutoDrwaConfirm() {
    this.auto_selecetd = 1;
  }

  confirmPasswordAndDraw() {
    if (this.draw_data.password && this.draw_data.password != '') {
      this.performNow();
    } else {
      this.toast.warning('Enter your password.', 'Invalid');
    }
  }

  performNow() {
    let data = {
      _id: this.data._id,
      draw_nums: this.draw_data.draw_nums,
      password: this.draw_data.password,
      number_of_lucky_dip: this.data.number_of_lucky_dip,
      jackpot_prize: this.data.jackpot_prize,
      three_prize_amount: this.data.three_prize_amount,
      two_prize_amount: this.data.two_prize_amount,
      draw_frequency: this.data.draw_frequency,
      jackpot_increment_percent: this.data.jackpot_increment_percent,
      jackpot_reserve_percent: this.data.jackpot_reserve_percent,
      draw_type: this.data.type,
      pricing: this.data.pricing,
      crJcRsrAmnt: this.data.crJcRsrAmnt
    };
    this.waiting = true;
    this.spinnerService.show();
    this._lottoManagementService.performManualDraw(data).subscribe((result: any) => {
      this.waiting = false;
      this.spinnerService.hide();
      if (result.success) {
        this.selected = 2;
        this.auto_selecetd = 2;
        this.generated_result = result.data;
        this.toast.success('Draw performed successfully.', 'Success');
        this.cDF.detectChanges();
      } else {
        this.toast.error(result.message, 'Error');
        this.cDF.detectChanges();
      }
    })
  }

  restartDraw() {
    this.onDrawRestart.emit({ draw_restart: true, jackpot: this.generated_result });
    this.modalService.hide();
  }

  onNoClick(): void {
    this.onYes.emit({ draw_end: true })
    this.modalService.hide();
  }

  onYesClick() {
    this.onYes.emit({ delete: true })
  }

  detailResult() {
    this.modalService.hide();
    this.router.navigateByUrl('pages/club/lotto-management/lotto-results');
  }

  goToSetting() {
    this.router.navigateByUrl('/pages/club/lotto-management/lotto-draw-management');
  }


}

function hasDuplicates(array) {
  return new Set(array).size !== array.length;
}

function sortArray(arr) {
  return arr.sort(function (a, b) { return a - b });
}
