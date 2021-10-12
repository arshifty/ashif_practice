import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { ROUTE_ANIMATIONS_ELEMENTS } from '@app/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { MatSnackBar, MatDialog } from '@angular/material';
import { CustomerService } from '../customer.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DataStore } from '@app/shared/classes/data-store.class';
import { UserService } from '../../user/user.service';
import { UploadSalesComponent } from '../upload-sales/upload-sales.component';
import { ExcelService } from '@app/shared/services/excel-export.service';
import ValidateEmail from '@app/shared/validators/email.validator';
import ValidatePhoneNumber from '@app/shared/validators/phone-number.validator';

@Component({
  selector: 'anms-edit-customer',
  templateUrl: './edit-customer.component.html',
  styleUrls: ['./edit-customer.component.scss']
})
export class EditCustomerComponent implements OnInit {
  selecetd: number = 0;
  is_activated: boolean = true;

  routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;

  url = 'assets/avatar.png';
  has_image: boolean;
  submitted: boolean;
  customerUpdateForm: FormGroup;
  store: DataStore = new DataStore();
  countries: Array<string> = [];
  customer_id: any;
  primary_id: any;
  bill_id: any;
  mobnumPattern = '08[3,5,6,7,9]\\d{7}';
  timeoutRef: any;
  roles: any = [];
  fileToUpload: File = null;
  customer: any = {};
  counties: any = [];
  areas: any = [];
  resend_primary_invite: boolean;
  resend_bill_invite: boolean;
  @ViewChild('teamName') teamName: ElementRef;
  team_list = [];

  lotto_template_image_url = 'https://placehold.it/200x250';
  lottoTemplatefileToUpload: File = null;

  prize_template_image_url = 'https://placehold.it/200x250';
  prizeTemplatefileToUpload: File = null;

  fifty_template_image_url = 'https://placehold.it/200x250';
  fiftyTemplatefileToUpload: File = null;

  lotto_widget_image_url = 'https://placehold.it/200x250';
  lottoWidgetfileToUpload: File = null;

  prize_widget_image_url = 'https://placehold.it/200x250';
  prizewidgetfileToUpload: File = null;

  fifty_widget_image_url = 'https://placehold.it/200x250';
  fiftyWidgetfileToUpload: File = null;

  counriesCode: any = [];
  dataStore = new DataStore();

  btn_disable: boolean = false;

  constructor(
    private _customerService: CustomerService,
    private _userService: UserService,
    public snackBar: MatSnackBar,
    private spinnerService: Ng4LoadingSpinnerService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private cDF: ChangeDetectorRef,
    private _excelService: ExcelService
  ) { }

  ngOnInit() {
    this.bill_id = 'edit_customer';
    this.primary_id = 'edit_customer';

    this.counriesCode = this.dataStore.countriesWithDialCodes;

    this.countries = this.store.countries;
    this.getRoleList();
    this.createForm();
    this.customer_id = this.route.snapshot.params['id'];
    this.getCustomer(this.customer_id);
    this.onFormControlChange();
  }

  onFormControlChange() {
    this.customerUpdateForm.get('county_id').valueChanges.subscribe(x => {
      this._customerService.getAreas(x).subscribe((result: any) => {
        if (result.success) {
          this.areas = result.data;
        }
      });
    });

    this.customerUpdateForm
      .get('defer_all_fees_except_sms')
      .valueChanges.subscribe(x => {
        if (x) {
          this.customerUpdateForm.controls['waive_all_fees_incld_sms'].setValue(
            false
          );

          this.customerUpdateForm.controls[
            'waive_others_fees_from'
          ].setValidators([Validators.required]);
          this.customerUpdateForm.controls[
            'waive_others_fees_from'
          ].updateValueAndValidity();
          this.customerUpdateForm.controls[
            'waive_others_fees_to'
          ].setValidators([Validators.required]);
          this.customerUpdateForm.controls[
            'waive_others_fees_to'
          ].updateValueAndValidity();
        } else {
          this.customerUpdateForm.controls[
            'waive_others_fees_from'
          ].clearValidators();
          this.customerUpdateForm.controls[
            'waive_others_fees_to'
          ].clearValidators();
          this.customerUpdateForm.controls[
            'waive_others_fees_to'
          ].updateValueAndValidity();
          this.customerUpdateForm.controls[
            'waive_others_fees_from'
          ].updateValueAndValidity();
        }
      });

    this.customerUpdateForm
      .get('waive_all_fees_incld_sms')
      .valueChanges.subscribe(x => {
        if (x) {
          this.customerUpdateForm.controls[
            'defer_all_fees_except_sms'
          ].setValue(false);
          this.customerUpdateForm.controls['waive_all_fees_from'].setValidators(
            [Validators.required]
          );
          this.customerUpdateForm.controls[
            'waive_all_fees_from'
          ].updateValueAndValidity();
          this.customerUpdateForm.controls['waive_all_fees_to'].setValidators([
            Validators.required
          ]);
          this.customerUpdateForm.controls[
            'waive_all_fees_to'
          ].updateValueAndValidity();
        } else {
          this.customerUpdateForm.controls[
            'waive_all_fees_from'
          ].clearValidators();
          this.customerUpdateForm.controls[
            'waive_all_fees_to'
          ].clearValidators();
          this.customerUpdateForm.controls[
            'waive_all_fees_to'
          ].updateValueAndValidity();
          this.customerUpdateForm.controls[
            'waive_all_fees_from'
          ].updateValueAndValidity();
        }
      });
  }

  goTo(indx) {
    this.selecetd = indx;
  }

  private createForm() {
    this.customerUpdateForm = new FormGroup(
      {
        // tslint:disable-next-line
        org_name: new FormControl('', Validators.required),
        address1: new FormControl('', Validators.required),
        address2: new FormControl(''),
        county_id: new FormControl('', Validators.required),
        area_ids: new FormControl('', Validators.required),
        postcode: new FormControl(''),
        number_of_member: new FormControl(''),
        org_type: new FormControl(''),
        color_1: new FormControl(''),
        color_2: new FormControl(''),
        vendor_name: new FormControl(''),
        integration_key: new FormControl(''),
        integration_password: new FormControl(''),
        first_name_primary: new FormControl(''),
        last_name_primary: new FormControl(''),
        phone_primary: new FormControl('', [Validators.required]),
        phone_code_primary: new FormControl('+353'),
        role_primary: new FormControl(''),
        email_primary: new FormControl('', [
          Validators.required,
          ValidateEmail
        ]),
        first_name_bill: new FormControl(''),
        last_name_bill: new FormControl(''),
        phone_bill: new FormControl('', [Validators.required]),
        phone_code_bill: new FormControl('+353'),

        role_bill: new FormControl(''),
        email_bill: new FormControl('', [Validators.required, ValidateEmail]),
        is_active: new FormControl(''),
        // Financial Info
        defer_all_fees_except_sms: new FormControl(false),
        waive_others_fees_from: new FormControl(''),
        waive_others_fees_to: new FormControl(''),

        waive_all_fees_incld_sms: new FormControl(false),
        waive_all_fees_from: new FormControl(''),
        waive_all_fees_to: new FormControl(''),
        //Marketing Tabs
        established_in: new FormControl(''),
        established_for: new FormControl(''),
        org_contribution_detail: new FormControl(''),
        website: new FormControl(''),
        facebook_page: new FormControl(''),
        twitter_id: new FormControl(''),
        instagram: new FormControl(''),
        number_of_registered_member: new FormControl(''),
        number_of_player: new FormControl(''),
        number_of_trainers: new FormControl(''),
        number_of_teams: new FormControl(''),
        number_of_volunteers: new FormControl(''),
        number_of_winners: new FormControl('')
      },
      {
        validators: ValidatePhoneNumber
      }
    );
  }

  onNoClick() {
    this.timeoutRef = setTimeout(() => {
      this.router.navigateByUrl('/pages/admin/customer');
    }, 1000);
  }

  getCustomer(id) {
    this._customerService.getCustomer(id).subscribe((result: any) => {
      if (result.success) {
        this.customer = result.clubs[0];
        let admins = result.admins;
        this._customerService
          .getCoutiesArea(this.customer.county_id)
          .subscribe((resultArray: any) => {
            this.counties = resultArray[0].data;
            this.areas = resultArray[1].data;

            this.customerUpdateForm.controls['org_name'].setValue(
              this.customer.org_name
            );
            this.customerUpdateForm.controls['address1'].setValue(
              this.customer.address1
            );
            this.customerUpdateForm.controls['address2'].setValue(
              this.customer.address2
            );
            this.customerUpdateForm.controls['county_id'].setValue(
              this.customer.county_id
            );
            this.customerUpdateForm.controls['area_ids'].setValue(
              this.customer.area_ids
            );
            this.customerUpdateForm.controls['postcode'].setValue(
              this.customer.postcode
            );
            this.customerUpdateForm.controls['number_of_member'].setValue(
              this.customer.number_of_member
            );
            this.customerUpdateForm.controls['org_type'].setValue(
              this.customer.org_type
            );

            if (this.customer.color_1)
              this.customerUpdateForm.controls['color_1'].setValue(
                this.customer.color_1
              );
            else this.customer.controls['color_1'].setValue('#ffffff');
            if (this.customer.color_2)
              this.customerUpdateForm.controls['color_2'].setValue(
                this.customer.color_2
              );
            else
              this.customerUpdateForm.controls['color_2'].setValue('#ffffff');

            if (this.customer.lotto_template_image) {
              this.lotto_template_image_url =
                this._customerService.imageUrl +
                this.customer.lotto_template_image +
                `?${new Date().getTime()}`;
            }

            if (this.customer.prize_template_image) {
              this.prize_template_image_url =
                this._customerService.imageUrl +
                this.customer.prize_template_image +
                `?${new Date().getTime()}`;
            }

            if (this.customer.fifty_template_image) {
              this.fifty_template_image_url =
                this._customerService.imageUrl +
                this.customer.fifty_template_image +
                `?${new Date().getTime()}`;
            }
            if (this.customer.lotto_widget_image) {
              this.lotto_widget_image_url =
                this._customerService.imageUrl +
                this.customer.lotto_widget_image +
                `?${new Date().getTime()}`;
            }
            if (this.customer.prize_widget_image) {
              this.prize_widget_image_url =
                this._customerService.imageUrl +
                this.customer.prize_widget_image +
                `?${new Date().getTime()}`;
            }
            if (this.customer.fifty_widget_image) {
              this.fifty_widget_image_url =
                this._customerService.imageUrl +
                this.customer.fifty_widget_image +
                `?${new Date().getTime()}`;
            }

            this.customerUpdateForm.controls['vendor_name'].setValue(
              this.customer.payment.vendor_name
            );
            this.customerUpdateForm.controls['integration_key'].setValue(
              this.customer.payment.integration_key
            );
            this.customerUpdateForm.controls['integration_password'].setValue(
              this.customer.payment.integration_password
            );
            this.customerUpdateForm.controls['is_active'].setValue(
              !this.customer.account_status.is_active
            );

            //Financial
            this.customerUpdateForm.controls[
              'defer_all_fees_except_sms'
            ].setValue(this.customer.defer_all_fees_except_sms);
            this.customerUpdateForm.controls[
              'waive_all_fees_incld_sms'
            ].setValue(this.customer.waive_all_fees_incld_sms);

            this.customerUpdateForm.controls['waive_others_fees_from'].setValue(
              this.customer.waive_others_fees_from
            );
            this.customerUpdateForm.controls['waive_others_fees_to'].setValue(
              this.customer.waive_others_fees_to
            );
            this.customerUpdateForm.controls['waive_all_fees_from'].setValue(
              this.customer.waive_all_fees_from
            );
            this.customerUpdateForm.controls['waive_all_fees_to'].setValue(
              this.customer.waive_all_fees_to
            );

            if (
              this.customer.supporting_teams &&
              this.customer.supporting_teams.length
            ) {
              this.team_list = this.customer.supporting_teams.map(x => {
                return x.team_name;
              });
            }

            //Marketing
            this.customerUpdateForm.controls['established_in'].setValue(
              this.customer.established_in
            );
            this.customerUpdateForm.controls['established_for'].setValue(
              this.customer.established_for
            );
            this.customerUpdateForm.controls[
              'org_contribution_detail'
            ].setValue(this.customer.org_contribution_detail);
            this.customerUpdateForm.controls['website'].setValue(
              this.customer.website
            );
            this.customerUpdateForm.controls['facebook_page'].setValue(
              this.customer.facebook_page
            );
            this.customerUpdateForm.controls['twitter_id'].setValue(
              this.customer.twitter_id
            );
            this.customerUpdateForm.controls['instagram'].setValue(
              this.customer.instagram
            );
            this.customerUpdateForm.controls[
              'number_of_registered_member'
            ].setValue(this.customer.number_of_registered_member);
            this.customerUpdateForm.controls['number_of_player'].setValue(
              this.customer.number_of_player
            );
            this.customerUpdateForm.controls['number_of_trainers'].setValue(
              this.customer.number_of_trainers
            );
            this.customerUpdateForm.controls['number_of_teams'].setValue(
              this.customer.number_of_teams
            );
            this.customerUpdateForm.controls['number_of_volunteers'].setValue(
              this.customer.number_of_volunteers
            );
            this.customerUpdateForm.controls['number_of_winners'].setValue(
              this.customer.number_of_winners
            );

            if (this.customer.logo) {
              this.url = this._customerService.imageUrl + this.customer.logo;
            }

            let primary = admins.find(x => x.admin_type == 'primary');
            let bill = admins.find(x => x.admin_type == 'bill');
            this.primary_id = primary._id;
            this.customerUpdateForm.controls['first_name_primary'].setValue(
              primary.first_name
            );
            this.customerUpdateForm.controls['last_name_primary'].setValue(
              primary.last_name
            );

            let primaryPhoneNumber = primary.phone;
            let primaryCodeNumber = primary.phone_code;

            console.log("primary : ", primaryPhoneNumber);
            console.log("primaryCodeNumber : ", primaryCodeNumber);



            if ((primaryCodeNumber == '+353' || primaryCodeNumber == '353') && primaryPhoneNumber && primaryPhoneNumber.length) {
              let first_two_digit = primaryPhoneNumber.slice(0, 2);
              if (first_two_digit == '08' && primaryPhoneNumber.length == 10) {
                let phone = primaryPhoneNumber.slice(2, primaryPhoneNumber.length);
                this.customerUpdateForm.controls['phone_code_primary'].setValue(primaryCodeNumber);
                this.customerUpdateForm.controls['phone_primary'].setValue(phone);
              }
            } else if (primaryCodeNumber && primaryCodeNumber.length && primaryCodeNumber != '+353' && primaryCodeNumber != '353' && primaryPhoneNumber && primaryPhoneNumber.length > 4) {
              this.customerUpdateForm.controls['phone_code_primary'].setValue(primaryCodeNumber);
              this.customerUpdateForm.controls['phone_primary'].setValue(primaryPhoneNumber);
            }

            this.customerUpdateForm.controls['role_primary'].setValue(
              primary.role_id
            );
            this.customerUpdateForm.controls['email_primary'].setValue(
              primary.email
            );
            if (!primary.password_created) this.resend_primary_invite = true;
            this.bill_id = bill._id;
            this.customerUpdateForm.controls['first_name_bill'].setValue(
              bill.first_name
            );
            this.customerUpdateForm.controls['last_name_bill'].setValue(
              bill.last_name
            );

            let billPhoneNumber = bill.phone;
            let billCodeNumber = bill.phone_code;

            console.log("billPhoneNumber : ", billPhoneNumber);
            console.log("billCodeNumber : ", billCodeNumber);


            if ((billCodeNumber == '+353' || billCodeNumber == '353') && billPhoneNumber && billPhoneNumber.length) {
              let first_two_digit = billPhoneNumber.slice(0, 2);
              if (first_two_digit == '08' && billPhoneNumber.length == 10) {
                let phone = billPhoneNumber.slice(2, billPhoneNumber.length);
                this.customerUpdateForm.controls['phone_code_bill'].setValue(billCodeNumber);
                this.customerUpdateForm.controls['phone_bill'].setValue(phone);
              }
            } else if (billCodeNumber && billCodeNumber.length && billCodeNumber != '+353' && billCodeNumber != '353' && billPhoneNumber && billPhoneNumber.length > 4) {
              this.customerUpdateForm.controls['phone_code_bill'].setValue(billCodeNumber);
              this.customerUpdateForm.controls['phone_bill'].setValue(billPhoneNumber);
            }

            this.customerUpdateForm.controls['role_bill'].setValue(
              bill.role_id
            );
            this.customerUpdateForm.controls['email_bill'].setValue(bill.email);
            if (!bill.password_created) this.resend_bill_invite = true;
          });
      }
    });
  }

  addNewTeam() {
    let val = this.teamName.nativeElement.value;
    if (val && val != '') {
      val = val.trim();
      if (val.length > 1) {
        this.team_list.push(val);
        this.teamName.nativeElement.value = '';
      }
    }
  }

  removeTeam(indx) {
    this.team_list.splice(indx, 1);
  }

  update() {
    this.submitted = true;
    if (this.customerUpdateForm.valid) {
      this.btn_disable = true;
      this.spinnerService.show();

      let data: any = this.customerUpdateForm.value;
      data.id = this.customer_id;
      data.primary_id = this.primary_id;
      data.bill_id = this.bill_id;
      data.logo = this.customer.logo;
      data.lotto_widget_image = this.customer.lotto_widget_image;
      data.prize_widget_image = this.customer.prize_widget_image;
      data.fifty_widget_image = this.customer.fifty_widget_image;
      data.lotto_template_image = this.customer.lotto_template_image;
      data.prize_template_image = this.customer.prize_template_image;
      data.fifty_template_image = this.customer.fifty_template_image;

      if (data.phone_primary && data.phone_primary.toString().length) {
        if (data['phone_code_primary'] == '+353' || data['phone_code_primary'] == '353') {
          data['phone_primary'] = '08' + data['phone_primary']
        }
        data.phone_primary = data.phone_primary.toString()[0] == '0' ? data.phone_primary.toString() : '0' + data.phone_primary.toString();
      }

      if (data.phone_bill && data.phone_bill.toString().length) {
        if (data['phone_code_bill'] == '+353' || data['phone_code_bill'] == '353' ) {
          data['phone_bill'] = '08' + data['phone_bill']
        }
        data.phone_bill = data.phone_bill.toString()[0] == '0' ? data.phone_bill.toString() : '0' + data.phone_bill.toString();
      }

      data.county = this.counties.find(cnty => cnty._id == data.county_id).name;
      data.areas = this.areas
        .filter(ara => data.area_ids.indexOf(ara._id) > -1)
        .map(slar => {
          return slar.name;
        });
      data.supporting_teams = this.team_list.map((x, i) => {
        return { team_name: x, seq: i + 1 };
      });

      this.has_image =
        this.fileToUpload != null || this.fileToUpload != undefined;
      if (this.has_image) {
        let name_exts = this.fileToUpload.name.split('.');
        data.img_ext = name_exts[name_exts.length - 1];
      }

      let change_data = this.checkAllImages(data);
      data = change_data.send_data;
      this._customerService.updateCustomer(data).subscribe((result: any) => {
        this.spinnerService.hide();
        if (result.success) {
          clearTimeout(this.timeoutRef);
          if (this.has_image) {
            this.uploadFileToActivity(this.customer._id);
          }
          this.uploadAllImages(change_data.image_uploads, this.customer._id);

          this.snackBar.open(result.message, '', {
            duration: 4000,
            verticalPosition: 'top'
          });
          this.timeoutRef = setTimeout(() => {
            this.router.navigateByUrl('/pages/admin/customer');
          }, 2000);
        } else {
          this.btn_disable = false;
          if (result.data && result.data.length) {
            let bill_phone = result.data.find(
              item => item.phone == data.phone_bill
            );
            let bill_email = result.data.find(
              item => item.email == data.email_bill
            );
            let primary_phone = result.data.find(
              item => item.phone == data.phone_primary
            );
            let primary_email = result.data.find(
              item => item.email == data.email_primary
            );

            let message = '';
            message +=
              bill_phone && bill_phone.phone ? ' ' + bill_phone.phone : '';
            message +=
              primary_phone && primary_phone.phone
                ? ' ' + primary_phone.phone
                : '';
            message +=
              primary_email && primary_email.email
                ? ' ' + primary_email.email
                : '';
            message +=
              bill_email && bill_email.email ? ' ' + bill_email.email : '';
            message += ' is already exists!';
            this.snackBar.open('Failed', message, {
              duration: 4000,
              verticalPosition: 'top'
            });
          } else {
            this.snackBar.open(result.message, '', {
              duration: 4000,
              verticalPosition: 'top'
            });
          }
        }
      });
    } else {
      const controls = this.customerUpdateForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          console.log(name, 'invalid');
        }
      }
      console.log('check value');
    }
  }

  getRoleList() {
    this._userService.getDefaultClubRole().subscribe((result: any) => {
      if (result.success) {
        this.roles = [result.data];
      } else {
        this.snackBar.open(result.message, '', {
          duration: 4000,
          verticalPosition: 'top'
        });
      }
    });
  }

  active_check(event) {
    this.is_activated = event;
  }

  checkAllImages(data) {
    let image_uploads = [];
    if (
      this.lottoTemplatefileToUpload != null ||
      this.lottoTemplatefileToUpload != undefined
    ) {
      image_uploads.push('lotto_template');
      let name_exts = this.lottoTemplatefileToUpload.name.split('.');
      data.lotto_template_img_ext = name_exts[name_exts.length - 1];
    }
    if (this.lotto_template_image_url == 'https://placehold.it/200x250')
      data.lotto_template_image = '';
    if (
      this.prizeTemplatefileToUpload != null ||
      this.prizeTemplatefileToUpload != undefined
    ) {
      image_uploads.push('prize_template');
      let name_exts = this.prizeTemplatefileToUpload.name.split('.');
      data.prize_template_img_ext = name_exts[name_exts.length - 1];
    }
    if (this.prize_template_image_url == 'https://placehold.it/200x250')
      data.prize_template_image = '';

    if (
      this.fiftyTemplatefileToUpload != null ||
      this.fiftyTemplatefileToUpload != undefined
    ) {
      image_uploads.push('fifty_template');
      let name_exts = this.fiftyTemplatefileToUpload.name.split('.');
      data.fifty_template_img_ext = name_exts[name_exts.length - 1];
    }
    if (this.fifty_template_image_url == 'https://placehold.it/200x250')
      data.fifty_template_image = '';

    if (
      this.lottoWidgetfileToUpload != null ||
      this.lottoWidgetfileToUpload != undefined
    ) {
      image_uploads.push('lotto_widget');
      let name_exts = this.lottoWidgetfileToUpload.name.split('.');
      data.lotto_widget_img_ext = name_exts[name_exts.length - 1];
    }
    if (this.lotto_widget_image_url == 'https://placehold.it/200x250')
      data.lotto_widget_image = '';

    if (
      this.prizewidgetfileToUpload != null ||
      this.prizewidgetfileToUpload != undefined
    ) {
      image_uploads.push('prize_widget');
      let name_exts = this.prizewidgetfileToUpload.name.split('.');
      data.prize_widget_img_ext = name_exts[name_exts.length - 1];
    }
    if (this.prize_widget_image_url == 'https://placehold.it/200x250')
      data.prize_widget_image = '';
    if (
      this.fiftyWidgetfileToUpload != null ||
      this.fiftyWidgetfileToUpload != undefined
    ) {
      image_uploads.push('fifty_widget');
      let name_exts = this.fiftyWidgetfileToUpload.name.split('.');
      data.fifty_widget_img_ext = name_exts[name_exts.length - 1];
    }

    if (this.fifty_widget_image_url == 'https://placehold.it/200x250')
      data.fifty_widget_image = '';

    return { send_data: data, image_uploads: image_uploads };
  }
  uploadAllImages(upload_array, id) {
    console.log(upload_array);
    if (upload_array.indexOf('lotto_template') !== -1) {
      this._customerService
        .postFile(this.lottoTemplatefileToUpload, `club/lotto,templates,${id}`)
        .subscribe(
          data => {
            console.log(data);
          },
          error => {
            console.log(error);
          }
        );
    }
    if (upload_array.indexOf('prize_template') !== -1) {
      this._customerService
        .postFile(this.prizeTemplatefileToUpload, `club/prize,templates,${id}`)
        .subscribe(
          data => {
            console.log(data);
          },
          error => {
            console.log(error);
          }
        );
    }
    if (upload_array.indexOf('fifty_template') !== -1) {
      this._customerService
        .postFile(this.fiftyTemplatefileToUpload, `club/fifty,templates,${id}`)
        .subscribe(
          data => {
            console.log(data);
          },
          error => {
            console.log(error);
          }
        );
    }
    if (upload_array.indexOf('lotto_widget') !== -1) {
      this._customerService
        .postFile(this.lottoWidgetfileToUpload, `club/lotto,widgets,${id}`)
        .subscribe(
          data => {
            console.log(data);
          },
          error => {
            console.log(error);
          }
        );
    }
    if (upload_array.indexOf('prize_widget') !== -1) {
      this._customerService
        .postFile(this.prizewidgetfileToUpload, `club/prize,widgets,${id}`)
        .subscribe(
          data => {
            console.log(data);
          },
          error => {
            console.log(error);
          }
        );
    }
    if (upload_array.indexOf('fifty_widget') !== -1) {
      this._customerService
        .postFile(this.fiftyWidgetfileToUpload, `club/fifty,widgets,${id}`)
        .subscribe(
          data => {
            console.log(data);
          },
          error => {
            console.log(error);
          }
        );
    }
  }

  removeImage(type) {
    if (type == 'lotto_template') {
      this.lotto_template_image_url = 'https://placehold.it/200x250';
      this.lottoTemplatefileToUpload = null;
    } else if (type == 'prize_template') {
      this.prize_template_image_url = 'https://placehold.it/200x250';
      this.prizeTemplatefileToUpload = null;
    } else if (type == 'fifty_template') {
      this.fifty_template_image_url = 'https://placehold.it/200x250';
      this.fiftyTemplatefileToUpload = null;
    } else if (type == 'lotto_widget') {
      this.lotto_widget_image_url = 'https://placehold.it/200x250';
      this.lottoWidgetfileToUpload = null;
    } else if (type == 'prize_widget') {
      this.prize_widget_image_url = 'https://placehold.it/200x250';
      this.prizewidgetfileToUpload = null;
    } else if (type == 'fifty_widget') {
      this.fifty_widget_image_url = 'https://placehold.it/200x250';
      this.fiftyWidgetfileToUpload = null;
    }
  }

  handleFileInput(event: any, type) {
    if (type == 'logo') {
      if (event.target.files && event.target.files[0]) {
        this.fileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.url = event.target.result;
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    } else if (type == 'lotto_template') {
      if (event.target.files && event.target.files[0]) {
        this.lottoTemplatefileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.lotto_template_image_url = event.target.result;
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    } else if (type == 'prize_template') {
      if (event.target.files && event.target.files[0]) {
        this.prizeTemplatefileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.prize_template_image_url = event.target.result;
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    } else if (type == 'fifty_template') {
      if (event.target.files && event.target.files[0]) {
        this.fiftyTemplatefileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.fifty_template_image_url = event.target.result;
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    } else if (type == 'lotto_widget') {
      if (event.target.files && event.target.files[0]) {
        this.lottoWidgetfileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.lotto_widget_image_url = event.target.result;
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    } else if (type == 'prize_widget') {
      if (event.target.files && event.target.files[0]) {
        this.prizewidgetfileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.prize_widget_image_url = event.target.result;
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    } else if (type == 'fifty_widget') {
      if (event.target.files && event.target.files[0]) {
        this.fiftyWidgetfileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.fifty_widget_image_url = event.target.result;
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    }
  }

  uploadFileToActivity(image_name) {
    this._customerService
      .postFile(this.fileToUpload, `club,logo,${image_name}`)
      .subscribe(
        data => {
          console.log(data);
        },
        error => {
          console.log(error);
        }
      );
  }

  downloadTemplate() {
    this._excelService.exportAsExcelFile(
      [
        {
          email: 'example@email.com',
          phone: '',
          number_of_game_remaining: 5,
          ticket_1: '12,23,28,32',
          ticket_2: '7,15,19,29',
          ticket_3: '5,17,23,27',
          ticket_4: '',
          ticket_5: ''
        },
        {
          email: '',
          phone: '0834874157',
          number_of_game_remaining: 4,
          ticket_1: '5,13,16,30',
          ticket_2: '11,15,19,29',
          ticket_3: '22,26,29,30',
          ticket_4: '',
          ticket_5: ''
        },
        {
          email: 'player@email.com',
          phone: '',
          number_of_game_remaining: 9,
          ticket_1: '7,20,22,31',
          ticket_2: '5,9,16,18',
          ticket_3: '1,3,8,17',
          ticket_4: '9,10,17,26',
          ticket_5: '4,14,24,26'
        }
      ],
      `sales`
    );
  }

  openUploadModal() {
    const dialogRef = this.dialog.open(UploadSalesComponent, {
      disableClose: true,
      width: '550px',
      data: { club_id: this.customer_id }
    });

    const sub = dialogRef.componentInstance.onYes.subscribe((result: any) => {
      dialogRef.close();
    });

    dialogRef.afterClosed().subscribe(result => { });
  }

  resendInvite(type) {
    let id = '';
    if (type == 'primary') {
      id = this.primary_id;
    } else id = this.bill_id;
    console.log('click', id);
    this._customerService.resendInvite(id).subscribe((result: any) => {
      this.snackBar.open(result.message, '', {
        duration: 4000,
        verticalPosition: 'top'
      });
    });
  }
}
