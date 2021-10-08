import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AuthGuardService } from 'src/app/shared/services/auth-guard.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { LottoServiceService } from '../lotto-service.service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ExcelService } from 'src/app/shared/services/excel-export.service';
import { LottoDrawApprovalDialogComponent } from './lotto-draw-approval-dialog/lotto-draw-approval-dialog.component';
import { LottoDrawPerformeDialogComponent } from './lotto-draw-performe-dialog/lotto-draw-performe-dialog.component';
import { ChangeDrawDateModalComponent } from './change-draw-date-modal/change-draw-date-modal.component';
import { HelpNoteDailogComponent } from './help-note-dailog/help-note-dailog.component';
import { getTimeFromPicker, setTimeInTimePicker, setTimePikerTimeToDate } from 'src/app/shared/functions/others';
import { validateEmail, validatePhone, validateTicketLine } from 'src/app/shared/functions/validator';
import { GameStatusUpdateDialogComponent } from './game-status-update-dialog/game-status-update-dialog.component';
import { getformatDate } from 'src/app/shared/functions/moment';
import { getCookie } from 'src/app/shared/functions/coockie';

@Component({
  selector: 'app-lotto-draw',
  templateUrl: './lotto-draw.component.html',
  styleUrls: ['./lotto-draw.component.scss']
})
export class LottoDrawComponent implements OnInit {
  selecetd: number = 0;
  is_activated: boolean = true;
  draw_setting: any = { has_init_draw: false, last_week_jackpot: 0 };
  initial_lotto: boolean = true;
  activation_obj: any = {};
  sms_filter_obj: any = { remove_who_played_for: 2 };
  email_filter_obj: any = { remove_who_played_for: 2 };
  pricing: any = {}
  is_it_cut_of_time: boolean;
  is_club_active: boolean;
  wait: boolean;
  validSales: any = [];
  hide_filter: boolean = true;
  enable_jackpot_amount: boolean;
  error_logs: any = [];
  expanded: boolean;
  isValid: boolean = false;
  verifying_msz: boolean = false;
  // dwn_btn_disable:boolean = false;

  @ViewChild('jackpotAmount', { static: false }) jackpotAmountElem: ElementRef;

  constructor(
    public _authGuardService: AuthGuardService,
    public modalService: BsModalService,
    private _lottoManagementService: LottoServiceService,
    private spinnerService: Ng4LoadingSpinnerService,
    private router: Router,
    private toast: ToastrService,
    private _excelService: ExcelService
  ) { }

  ngOnInit() {
    this.getJackpotInfo();
  }

  getTime(value) {
    return getTimeFromPicker(value);
  }

  getJackpotInfo() {
    this.spinnerService.show();
    this._lottoManagementService.getLottoInfo().subscribe((result: any) => {
      this.spinnerService.hide();
      if (result && result.success && result.jackpots && result.jackpots.length > 0) {
        let jackpots_info = result.jackpots;
        this.draw_setting.has_init_draw = true;
        if (jackpots_info.length > 1) {
          this.draw_setting.last_week_jackpot = jackpots_info[1].jackpot_prize;
        }
        this.draw_setting._id = jackpots_info[0]._id;
        this.draw_setting.current_jackpot = jackpots_info[0].jackpot_prize;
        this.draw_setting.next_jackpot = jackpots_info[0].jackpot_prize;
        this.draw_setting.next_draw_date = new Date(jackpots_info[0].next_draw_date);
        this.draw_setting.wining_number_pick = jackpots_info[0].wining_number_pick;
        this.draw_setting.has_jackpot_rescheduled = jackpots_info[0].has_jackpot_rescheduled;
        this.draw_setting.draw_time = setTimeInTimePicker(jackpots_info[0].draw_time, this.draw_setting.next_draw_date);
        this.draw_setting.draw_number = jackpots_info[0].draw_number;
        this.draw_setting.number_of_ball = jackpots_info[0].number_of_ball;
        this.draw_setting.jackpot_prize = jackpots_info[0].jackpot_prize;
        this.draw_setting.three_prize_amount = jackpots_info[0].three_prize_amount;
        this.draw_setting.two_prize_amount = jackpots_info[0].two_prize_amount;
        this.draw_setting.draw_frequency = jackpots_info[0].draw_frequency;
        this.draw_setting.is_alive = jackpots_info[0].is_alive;
        this.draw_setting.draw_cut_of_period = jackpots_info[0].draw_cut_of_period;
        this.draw_setting.jackpot_increment_percent = jackpots_info[0].jackpot_increment_percent;
        this.draw_setting.jackpot_reserve_percent = jackpots_info[0].jackpot_reserve_percent;
        this.draw_setting.number_of_lucky_dip = jackpots_info[0].number_of_lucky_dip ? jackpots_info[0].number_of_lucky_dip : 0;
        this.is_club_active = jackpots_info[0].is_club_active;
        this.pricing = jackpots_info[0].pricing;

        this.draw_setting.total_sales_line = jackpots_info[0].total_sales_line;
        this.draw_setting.total_sales_amount = jackpots_info[0].total_sales_amount;
        this.draw_setting.total_sales_ticket = jackpots_info[0].total_sales_ticket;
        this.draw_setting.crJcRsrAmnt = result.crJcRsrAmnt;
        this.draw_setting.isTodayDrawDate = isDrawDate(this.draw_setting.next_draw_date);

        this.draw_setting.game_status = jackpots_info[0].game_status;
        if (this.draw_setting.is_alive && this.draw_setting.draw_cut_of_period) {
          let curDate = new Date();
          let draw_date = new Date(this.draw_setting.next_draw_date);
          draw_date.setMinutes(draw_date.getMinutes() - this.draw_setting.draw_cut_of_period);
          let playableTime = new Date(draw_date);
          this.is_it_cut_of_time = curDate >= playableTime;
        }
        if (this.draw_setting.is_alive) {
          setTimeout(() => {
            this.goTo(1);
          }, 1000)
        }
      } else {
        this.draw_setting.is_alive = true;
      }
    })
  }

  goTo(indx) {
    this.selecetd = indx;
  }

  openDrawApprovalDialog() {
    if (this.draw_setting.next_jackpot > 0) {
      this.activation_obj.jackpot_id = this.draw_setting._id;
      this.activation_obj.next_draw_date = setTimePikerTimeToDate(this.draw_setting.next_draw_date, this.draw_setting.draw_time);
      this.activation_obj.draw_time = getTimeFromPicker(this.draw_setting.draw_time);
      this.activation_obj.jackpot_prize = this.draw_setting.next_jackpot;
      const initialState = {}
      let modalConfig = {
        backdrop: true,
        ignoreBackdropClick: true,
      };
      const modalParams = Object.assign({}, modalConfig, { initialState, class: 'modal-md' });
      const bsModalRef = this.modalService.show(LottoDrawApprovalDialogComponent, modalParams);

      const sub = bsModalRef.content['onYes'].subscribe((rslt: any) => {
        if (rslt.success) {
          bsModalRef.hide();
          this.spinnerService.show();
          this._lottoManagementService.activateJackpot(this.activation_obj).subscribe((result: any) => {
            this.spinnerService.hide();
            if (result.success) {
              this.draw_setting.is_alive = true;
              this.getJackpotInfo();
              if (this.selecetd != 1) {
                setTimeout(() => {
                  this.goTo(1);
                }, 1000)
              }
            } else {
              this.getJackpotInfo();
              this.toast.error(result.message, 'Failed!');
            }
          })
        }
      });
    } else
      this.toast.warning('Next Jackpot Amount should be greater than zero', 'Warning');
  }

  openGameStatusDialog() {
    this.activation_obj.jackpot_id = this.draw_setting._id;
    const initialState = {
      data: {
        jackpot_id: this.activation_obj.jackpot_id,
        game_status: this.draw_setting.game_status
      }
    }
    let modalConfig = {
      backdrop: true,
      ignoreBackdropClick: true,
    };
    const modalParams = Object.assign({}, modalConfig, { initialState, class: 'modal-md' });
    const bsModalRef = this.modalService.show(GameStatusUpdateDialogComponent, modalParams);

    const sub = bsModalRef.content['onYes'].subscribe((rslt: any) => {
      if (rslt.success) {
        bsModalRef.hide();
        this.getJackpotInfo();
      }
    });
  }

  openDrawDialog(draw) {
    let data = this.draw_setting
    data.pricing = this.pricing;
    data.crJcRsrAmnt = this.draw_setting.crJcRsrAmnt;
    data.type = draw;
    if (draw == 'auto') {
      this._lottoManagementService.getAutoDrawNumber(this.draw_setting._id).subscribe((result: any) => {
        if (result.success) {
          data.draw_nums = result.draw_nums;
          const initialState = {
            data: data
          }
          let modalConfig = {
            backdrop: true,
            ignoreBackdropClick: true,
          };
          const modalParams = Object.assign({}, modalConfig, { initialState, class: 'modal-lg' });
          const bsModalRef = this.modalService.show(LottoDrawPerformeDialogComponent, modalParams);

          const sub = bsModalRef.content['onYes'].subscribe((rslt: any) => {
            if (rslt.draw_end) {
              this.getJackpotInfo();
              bsModalRef.hide();
            }
          });

          const rstrt = bsModalRef.content['onDrawRestart'].subscribe((rslt: any) => {
            if (rslt.draw_restart) {
              this.selecetd = 0;
              this.getJackpotInfo();
            }
          })
        } else {
          this.toast.error(result.message, 'Failed!');
        }
      })
    } else {
      const initialState = {
        data: data
      }
      let modalConfig = {
        backdrop: true,
        ignoreBackdropClick: true,
      };
      const modalParams = Object.assign({}, modalConfig, { initialState, class: 'modal-lg' });
      const bsModalRef = this.modalService.show(LottoDrawPerformeDialogComponent, modalParams);

      const sub = bsModalRef.content['onYes'].subscribe((rslt: any) => {
        if (rslt.draw_end) {
          bsModalRef.hide();
          this.getJackpotInfo();
        }
      });

      const rstrt = bsModalRef.content['onDrawRestart'].subscribe((rslt: any) => {
        if (rslt.draw_restart) {
          this.selecetd = 0;
          this.getJackpotInfo();
        }
      })
    }

  }

  rescheduleModal() {
    const initialState = {
      data: {
        _id: this.draw_setting._id,
        next_draw_date: this.draw_setting.next_draw_date,
        next_draw_time: this.draw_setting.draw_time
      }
    }
    let modalConfig = {
      backdrop: true,
      ignoreBackdropClick: true,
    };
    const modalParams = Object.assign({}, modalConfig, { initialState, class: 'modal-md' });
    const bsModalRef = this.modalService.show(ChangeDrawDateModalComponent, modalParams);

    const sub = bsModalRef.content['onYes'].subscribe((rslt: any) => {
      if (rslt.success) {
        this.getJackpotInfo();
        bsModalRef.hide();
      }
    });
  }

  helpNote() {
    const initialState = {
      data: {}
    }
    let modalConfig = {
      backdrop: true,
      ignoreBackdropClick: true,
    };
    const modalParams = Object.assign({}, modalConfig, { initialState, class: 'modal-lg' });
    const bsModalRef = this.modalService.show(HelpNoteDailogComponent, modalParams);
  }

  setTimeToDate(date: any, time: any) {
    let timeArray = time.split(':');
    let nDate = new Date(date);
    nDate.setHours(timeArray[0], timeArray[1]);
    return nDate;
  }



  downloadEnteredPlayerList() {
    this.spinnerService.show();
    this._lottoManagementService.getEnteredPlayerList({ jackpot_id: this.draw_setting._id }).subscribe((result: any) => {
      this.spinnerService.hide();
      if (result.success && result.data && result.data.length > 0) {
        let data = result.data.map(dt => {
          let prcDt = new Date(dt.ticket_buy_date)
          let prcHr = (prcDt.getHours()).toString();
          if (prcHr.length < 2)
            prcHr = `0${prcHr}`;
          let prcMin = (prcDt.getMinutes()).toString();
          if (prcMin.length < 2)
            prcMin = `0${prcMin}`;

          return {
            supporter_name: dt.supporter_name,
            supporter_email: dt.supporter_email,
            supporter_phone: dt.supporter_phone,
            purchased_as: purchaseTypeMap[dt.player_type] ? purchaseTypeMap[dt.player_type] : 'Personal Account',
            ticket_cost: dt.ticket_cost.toFixed(2),
            number_of_lines_purchased: dt.tickets,
            no_of_draw_purchased: dt.no_of_draw_purchased,
            date_of_purchase: `${prcDt.getDate()}/${prcDt.getMonth() + 1}/${prcDt.getFullYear()} ${prcHr}:${prcMin}`,
            no_of_remaining_draws: dt.no_of_remaining_draws
          }
        })
        this._excelService.exportAsExcelFile(data, `lotto_draw_result`);
      } else if (result.data && result.data.length == 0) {
        this.toast.error("No data found", 'Empty!');
      } else {
        this.toast.error(result.message, 'Failed!');
      }
    })
  }


  onFileSelect(event) {
    if (event.srcElement.value) {
      this.verifying_msz = true;
      this._excelService.importExcel(event)
        .then((result: any) => {
          this.error_logs = [];
          this.validSales = result.filter((sel, i) => {
            let error_message = '';
            if (sel.first_name && sel.last_name && sel.dial_code && sel.phone_number && sel.number_of_draws && sel.amount_paid && (sel.is_above_18yrs == 'YES') ) {

              sel.first_name = sel.first_name.toString().trim();
              sel.last_name = sel.last_name.toString().trim();

              let inValidTicketExist = false;
              Object.keys(sel).map(key => {
                if (key.match(/ticket_line/) && sel[key].length) {
                  let ticketLineErrorObj: any = validateTicketLine(sel[key], this.draw_setting.number_of_ball);
                  if (!ticketLineErrorObj.isValid) {
                    error_message = error_message.concat(key + ': ' + ticketLineErrorObj.message, ', ');
                    inValidTicketExist = true;
                  }
                }
              })

              if (sel.first_name.length && sel.last_name.length && !isNaN(sel.number_of_draws) && sel.number_of_draws > 0 && !isNaN(sel.amount_paid) && sel.amount_paid > 0) {
                if (sel.email && !sel.phone_number) {

                  sel.email = sel.email.toString().trim();

                  if (!validateEmail(sel.email))
                    error_message = error_message.concat('Email is not valid', ', ');
                  else
                    return !inValidTicketExist
                } else if (!sel.email && sel.phone_number) {

                  sel.phone_number = sel.phone_number.toString().replace(/ /g, '').trim();
                  let phoneErrorObj: any = validatePhone(sel.dial_code, sel.phone_number);

                  if (!phoneErrorObj.isValid)
                    error_message = error_message.concat(phoneErrorObj.message, ', ');
                  else
                    return !inValidTicketExist
                } else {

                  sel.phone_number = sel.phone_number.toString().replace(/ /g, '').trim();
                  sel.email = sel.email.toString().trim();

                  let isValidEmail = validateEmail(sel.email);
                  let phoneErrorObj: any = validatePhone(sel.dial_code, sel.phone_number);

                  if (!isValidEmail)
                    error_message = error_message.concat('Email is not valid', ', ');
                  if (!phoneErrorObj.isValid)
                    error_message = error_message.concat(phoneErrorObj.message, ', ');

                  if (!error_message.length)
                    return true;
                }
              } else {
                if (!sel.first_name)
                  error_message = error_message.concat('First Name is required', ', ')
                if (!sel.last_name)
                  error_message = error_message.concat('Last Name is required', ', ')
                if (isNaN(sel.number_of_draws))
                  error_message = error_message.concat('Number of draws must be numeric', ', ')
                if (isNaN(sel.amount_paid))
                  error_message = error_message.concat('Amount paid must be numeric', ', ')
                if (sel.number_of_draws < 1)
                  error_message = error_message.concat('Number of draws must be positive value', ', ')
                if (sel.amount_paid < 1)
                  error_message = error_message.concat('Amount paid must be positive value', ', ')
              }
            } else {
              if (!sel.first_name)
                error_message = error_message.concat('First Name is required', ', ')
              if (!sel.last_name)
                error_message = error_message.concat('Last Name is required', ', ')
              if (!(sel.phone_number))
                error_message = error_message.concat('Phone is required', ', ')
              if (sel.phone_number && !sel.dial_code)
                error_message = error_message.concat('Dial Code is required', ', ')
              if (!(sel.number_of_draws))
                error_message = error_message.concat('Number Of Draws is required', ', ')
              if (!(sel.amount_paid))
                error_message = error_message.concat('Amount Paid is required', ', ')
              if (!(sel.is_above_18yrs))
                error_message = error_message.concat('Not Above 18 years', ', ')
            }
            this.error_logs.push({ row: (i + 2), message: error_message });
          })
          this.isValid = this.error_logs < 1;
          this.verifying_msz = false;

          if (!this.validSales.length) {
            this.toast.warning('No Valid data found in selected file', 'Invalid');
          }
        })
    }
  }

  uploadTickets() {
    this.wait = true;
    this.spinnerService.show();
    this.validSales = this.buildSalesData(this.validSales);
    this._lottoManagementService.uploadAdvanceSales(this.validSales)
      .subscribe((result: any) => {
        this.wait = false;
        this.spinnerService.hide();
        if (result.success) {
          this.getJackpotInfo();
          this.validSales = [];
          this.toast.success('Data uploaded successfully.', 'Success');
        } else {
          this.toast.error(result.message, 'Error');
        }
      })
  }

  private buildSalesData(sales) {
    return sales.map(sel => {
      let tickets = [];
      Object.keys(sel).map(key => {
        if (key.match(/ticket_line/) && sel[key].length && sel[key].split(',').length == 4) {
          tickets.push(sel[key]);
        }
      })
      sel.tickets = tickets;
      sel.total_price = parseFloat((parseFloat(sel.amount_paid.toFixed(2)) / sel.number_of_draws).toFixed(2));
      if (sel.phone_number)
        sel.phone_number = sel.phone_number.toString()[0] == '0' ? sel.phone_number.toString() : ('0' + sel.phone_number)
      return sel;
    })
  }

  downloadTemplate() {
    let token = getCookie('token');
    this._lottoManagementService.downloadExcelFile(token).subscribe((result: any) => {
      const blob = new Blob([result], { type: 'application/octet-stream' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `lotto_ticket_template.xlsx`
      link.click()
    })
  }


  /*
  downloadTemplate() {
    this.wait = true;
    this._excelService.exportAsExcelFile([{
      first_name: '*',
      last_name: '*',
      email: 'Smartlotto: Email is NOT Mandatory, You will get an error if there is a problem with the email address you enter',
      dial_code: '*',
      phone_number: '*',
      number_of_draws: '*',
      amount_paid: '',
      payment_type: '',
      date_purchased: '*',
      is_above_18yrs: '*',
      address1: '*',
      address2: '',
      town: '*',
      postcode: '',
      ticket_line1: '*',
      ticket_line2: '',
      ticket_line3: '',
      ticket_line4: '',
      ticket_line5: ''
    }, {
      first_name: 'Sakib',
      last_name: 'al hasan',
      email: 'abjohn@gmail.com',
      dial_code: '*',
      phone_number: '868750681',
      number_of_draws: '52',
      amount_paid: '240',
      payment_type: 'cash',
      date_purchased: '15/01/2021',
      is_above_18yrs: 'y',
      address1: '1 Main Street',
      address2: 'Ballina Road',
      town: 'Ballina',
      postcode: ' F55E9A6',
      ticket_line1: '3,7,8,11',
      ticket_line2: '',
      ticket_line3: '',
      ticket_line4: '',
      ticket_line5: ''
    }, {
      first_name: 'Musfiq',
      last_name: 'Rahman',
      email: 'cdjohn@gmail.com',
      dial_code: '353',
      phone_number: '864350681',
      number_of_draws: '52',
      amount_paid: '240',
      payment_type: 'Bank Transfer',
      date_purchased: '16/01/2021',
      is_above_18yrs: 'y',
      address1: '1 Main Street',
      address2: 'Ballina Road',
      town: 'Ballina',
      postcode: ' F55E9A6',
      ticket_line1: '3,7,8,11',
      ticket_line2: '1,2,3,12',
      ticket_line3: '2,18,22,32',
      ticket_line4: '',
      ticket_line5: ''
    }, {
      first_name: 'Musfiq',
      last_name: 'Rahman',
      email: 'cdjohn@gmail.com',
      dial_code: '353',
      phone_number: '864350681',
      number_of_draws: '52',
      amount_paid: '240',
      payment_type: 'Bank Transfer',
      date_purchased: '16/01/2021',
      is_above_18yrs: 'y',
      address1: '1 Main Street',
      address2: 'Ballina Road',
      town: 'Ballina',
      postcode: ' F55E9A6',
      ticket_line1: '3,7,8,11',
      ticket_line2: '1,2,3,12',
      ticket_line3: '2,18,22,32',
      ticket_line4: '1,15,20,30',
      ticket_line5: ''
    }, {
      first_name: 'Aminul',
      last_name: 'Islam',
      email: 'efrjohn@gmail.com',
      dial_code: '353',
      phone_number: '864350681',
      number_of_draws: '52',
      amount_paid: '240',
      payment_type: 'Bank Transfer',
      date_purchased: '16/01/2021',
      is_above_18yrs: 'y',
      address1: '1 Main Street',
      address2: 'Ballina Road',
      town: 'Ballina',
      postcode: ' F55E9A6',
      ticket_line1: '3,7,8,11',
      ticket_line2: '1,2,3,12',
      ticket_line3: '2,18,22,32',
      ticket_line4: '1,15,20,30',
      ticket_line5: '8,7,25,26'
    }], `sales_upload_template`);
  }

  */

  onClickJackpotUpdate() {
    this.enable_jackpot_amount = true;
    setTimeout(() => {
      this.jackpotAmountElem.nativeElement.focus();
    }, 0)
  }

  updateAmount() {
    this.enable_jackpot_amount = false;
    if (this.draw_setting.next_jackpot > 0 && (this.draw_setting.current_jackpot != this.draw_setting.next_jackpot)) {
      this.spinnerService.show();
      let data = {
        _id: this.draw_setting._id,
        jackpot_prize: this.draw_setting.next_jackpot
      }
      this.wait = true;
      this._lottoManagementService.rescheduleLottoDraw(data).subscribe((result: any) => {
        this.spinnerService.hide();
        this.wait = false;
        if (result.success) {
          this.getJackpotInfo();
          this.enable_jackpot_amount = false;
          this.toast.success("Jackpot Prize updated.", "Success");
        } else {
          this.toast.success(result.message, "Error");
        }
      })
    } else {
      this.enable_jackpot_amount = false;
      this.toast.warning("No change found to update.", "Error");
    }
  }

}


function isDrawDate(draw_date) {
  let drdt = new Date(draw_date);
  let crdt = new Date();
  return (drdt.getDate().toString() + drdt.getMonth().toString() + drdt.getFullYear().toString()) == (crdt.getDate().toString() + crdt.getMonth().toString() + crdt.getFullYear().toString());
}

function validEmail(email: string) {
  let pattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return pattern.test(email);
}

const purchaseTypeMap = {
  'Supporter': 'Personal Account',
  'Guest': 'Guest Play',
  'Friend': 'Play for Friend',
  'Uploaded': 'Manual Uploaded'
}

