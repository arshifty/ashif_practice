import { Component, OnInit, EventEmitter } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AuthGuardService } from 'src/app/shared/services/auth-guard.service';
import { ExcelService } from 'src/app/shared/services/excel-export.service';
import { SupportersService } from '../supporters.service';
import { ToastrService } from 'ngx-toastr';
import { validateEmail, validatePhone } from 'src/app/shared/functions/validator';
import * as moment from 'moment';
import { calculateAge, excelDateToJSDate } from 'src/app/shared/functions/others';

@Component({
  selector: 'anms-upload-player-modal',
  templateUrl: './upload-player-modal.component.html',
  styleUrls: ['./upload-player-modal.component.scss']
})
export class UploadPlayerModalComponent implements OnInit {

  selecetd: number = 0;
  onYes = new EventEmitter();
  send_data: any = [];
  notification: any = {};
  total_sms_cost: number = 0;
  file_name: string;
  submitted: boolean;
  upload_done: boolean = false;
  player_uploaded = 0;
  templateObj: any = { email_head: '', email_text: '', sms_content: '' }
  waiting: boolean = false;
  public sms_cost: any;
  error_logs: any = [];
  verifying_msz: boolean = false;
  isValid: boolean = false;
  expanded: boolean;

  constructor(
    public modalRef: BsModalRef,
    public _authGuardService: AuthGuardService,
    private _excelService: ExcelService,
    private _playerService: SupportersService,
    public toast: ToastrService
  ) { }

  ngOnInit() {
    this.templateObj.email_head = "${organisation_name} Invites you to play their club lotto";
    this.templateObj.email_text = "Hi ${name},\nyou have been registered to Play ${organisation_name} Lotto with a chance to WIN ${jackpot}!\nPlay the game here\n${link_to_gameplay}\n\nSign in or Register to complete your purchase\n\nRegards\nSmart Lotto Team";
    this.templateObj.sms_content = "${name}, you have been invited to Play ${organisation_name} Lotto, WIN ${jackpot}!\nPlay\n${link_to_gameplay}";
  }

  goTo(indx) {
    this.selecetd = indx;
  }
  onNoClick() {
    this.modalRef.hide();
    this.onYes.emit({ close: true })
  }

  onFileSelect(event) {
    if (event.srcElement.value) {
      this.verifying_msz = true;
      var a = event.srcElement.value.toString().split('\\');
      this.file_name = a[a.length - 1]
      this._excelService.importExcel(event)
        .then((result: any) => {
          this.error_logs = [];

          this.send_data = result.filter((plyr, i) => {
            let error_message = '';
            if (plyr.first_name && plyr.last_name && (plyr.phone || plyr.email)) {

              plyr.first_name = plyr.first_name.toString().trim();
              plyr.last_name = plyr.last_name.toString().trim();

              if (plyr.first_name.length && plyr.last_name.length) {
                if (plyr.email && !plyr.phone) {
                  plyr.email = plyr.email.toString().trim();

                  if (!validateEmail(plyr.email))
                    error_message = error_message.concat('Email is not valid', ', ');
                  else
                    return true
                } else if (!plyr.email && plyr.phone) {
                  plyr.phone = plyr.phone.toString().replace(/ /g, '').trim();
                  let phoneErrorObj: any = validatePhone(plyr.dial_code, plyr.phone);

                  if (!phoneErrorObj.isValid)
                    error_message = error_message.concat(phoneErrorObj.message, ', ');
                  else
                    return true
                } else {
                  plyr.phone = plyr.phone.toString().replace(/ /g, '').trim();
                  plyr.email = plyr.email.toString().trim();

                  let isValidEmail = validateEmail(plyr.email);
                  let phoneErrorObj: any = validatePhone(plyr.dial_code, plyr.phone);

                  if (!isValidEmail && phoneErrorObj.isValid)
                    error_message = error_message.concat('Email is not valid', ', ');
                  else if (isValidEmail && !phoneErrorObj.isValid)
                    error_message = error_message.concat(phoneErrorObj.message, ', ');
                  else if (!isValidEmail && !phoneErrorObj.isValid) {
                    error_message = error_message.concat('Email is not valid', ', ');
                    error_message = error_message.concat(phoneErrorObj.message, ', ');
                  }
                  else
                    return true
                }
              } else {
                if (!plyr.first_name)
                  error_message = error_message.concat('First Name is required', ', ')
                if (!plyr.last_name)
                  error_message = error_message.concat('Last Name is required', ', ')
              }

            } else {
              if (!plyr.first_name)
                error_message = error_message.concat('First Name is required', ', ')
              if (!plyr.last_name)
                error_message = error_message.concat('Last Name is required', ', ')
              if (!(plyr.phone || plyr.email))
                error_message = error_message.concat('Phone or Email is required', ', ')
              if (plyr.phone && !plyr.dial_code)
                error_message = error_message.concat('Dial Code is required', ', ')
            }
            this.error_logs.push({ row: (i + 2), message: error_message });
          });

          this.verifying_msz = false;
          this.isValid = this.error_logs < 1;

          if (this.sms_cost)
            this.total_sms_cost = (this.send_data.length * this.sms_cost);
        })
      event.target.value = null;
    }
  }

  upload() {
    if (this.send_data.length) {
      this.submitted = true;
      if ((this.notification.sms_required && !this.templateObj.sms_content) || (this.notification.email_required && !(this.templateObj.email_text && this.templateObj.email_head))) {
        this.toast.warning('Notification content missing.', 'Invalid');
      } else {
        this.submitted = false;

        let data = {
          send_data: this.send_data,
          template: this.templateObj,
          send_sms: this.notification.sms_required,
          send_email: this.notification.email_required
        };
        this.waiting = true;

        this._playerService.uploadSupporters(data).subscribe((result: any) => {
          this.waiting = false;
          this.upload_done = true;
          this.player_uploaded = result;
        })
      }
    } else {
      this.toast.warning("No valid data found to upload.", 'Invalid');
    }
  }

}