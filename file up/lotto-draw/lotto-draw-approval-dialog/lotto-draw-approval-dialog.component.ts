import { Component, OnInit, ChangeDetectionStrategy, EventEmitter, Inject, ChangeDetectorRef } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { LottoServiceService } from '../../lotto-service.service';
import { ToastrService } from 'ngx-toastr';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';

@Component({
  selector: 'anms-lotto-draw-approval-dialog',
  templateUrl: './lotto-draw-approval-dialog.component.html',
  styleUrls: ['./lotto-draw-approval-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LottoDrawApprovalDialogComponent implements OnInit {

  onYes = new EventEmitter();
  password: string;
  wait: boolean;
  data: any;

  constructor(
    private modalService: BsModalRef,
    private _lottoManagementService: LottoServiceService,
    public toast: ToastrService,
    private cDF: ChangeDetectorRef,
    private spinnerService: Ng4LoadingSpinnerService
  ) { }


  ngOnInit() { }

  onNoClick(): void {
    this.modalService.hide();
  }

  onYesClick() {
    if (this.password && this.password.length) {
      this.wait = true;
      this.spinnerService.show();
      this._lottoManagementService.validatedUser(this.password).subscribe((result: any) => {
        this.spinnerService.hide();
        this.wait = false;
        this.cDF.detectChanges();
        if (result && result.success) {
          this.modalService.hide();
          this.onYes.emit({ success: true });
        } else {
          this.toast.error(result.message, 'Failed');
        }
      })
    } else {
      this.toast.warning("Password can't be empty", 'Invalid');
    }
  }

}
