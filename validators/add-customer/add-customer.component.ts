import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { ROUTE_ANIMATIONS_ELEMENTS } from '@app/core';
import { DataStore } from '@app/shared/classes/data-store.class';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UserService } from '../../user/user.service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CustomerService } from '../customer.service';
import { MatSnackBar } from '@angular/material';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import ValidatePhoneNumber from '@app/shared/validators/phone-number.validator';
import ValidateEmail from '@app/shared/validators/email.validator';

@Component({
  selector: 'anms-add-customer',
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddCustomerComponent implements OnInit {

  selecetd: number = 0;
  is_activated: boolean = true;

  routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;
  url = 'assets/avatar.png';
  has_image: boolean;
  submitted: boolean;
  customerDetailsForm: FormGroup;
  store: DataStore = new DataStore();
  countries: Array<string> = [];
  roles: any = [];
  timeoutRef: any;
  fileToUpload: File = null;
  counties: any = [];
  areas: any = [];

  @ViewChild('teamName') teamName: ElementRef;
  team_list = [];
  mobnumPattern = '08[3,5,6,7,9]\\d{7}';
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

  constructor(
    private _userService: UserService,

    private spinnerService: Ng4LoadingSpinnerService,
    private _customerService: CustomerService,

    public snackBar: MatSnackBar,
    private router: Router,
    private cDF: ChangeDetectorRef

  ) { }

  ngOnInit() {
    this.counriesCode = this.dataStore.countriesWithDialCodes;

    this.countries = this.store.countries;
    this.createForm();
    this.getRoleList();
    this._customerService.getCouties().subscribe((result: any) => {
      if (result.success) {
        this.counties = result.data;
      }
    })
    this.onFormControlChange();
  }

  onFormControlChange() {
    this.customerDetailsForm.get("county_id").valueChanges.subscribe(x => {
      this._customerService.getAreas(x).subscribe((result: any) => {
        if (result.success) {
          this.areas = result.data;
        }
      })
    })

    this.customerDetailsForm.get("defer_all_fees_except_sms").valueChanges.subscribe(x => {
      if (x) {
        this.customerDetailsForm.controls['waive_all_fees_incld_sms'].setValue(false);

        this.customerDetailsForm.controls['waive_others_fees_from'].setValidators([Validators.required]);
        this.customerDetailsForm.controls['waive_others_fees_from'].updateValueAndValidity();
        this.customerDetailsForm.controls['waive_others_fees_to'].setValidators([Validators.required]);
        this.customerDetailsForm.controls['waive_others_fees_to'].updateValueAndValidity();
      } else {
        this.customerDetailsForm.controls['waive_others_fees_from'].clearValidators();
        this.customerDetailsForm.controls['waive_others_fees_to'].clearValidators();
        this.customerDetailsForm.controls['waive_others_fees_to'].updateValueAndValidity();
        this.customerDetailsForm.controls['waive_others_fees_from'].updateValueAndValidity();
      }
    })

    this.customerDetailsForm.get("waive_all_fees_incld_sms").valueChanges.subscribe(x => {
      if (x) {
        this.customerDetailsForm.controls['defer_all_fees_except_sms'].setValue(false);
        this.customerDetailsForm.controls['waive_all_fees_from'].setValidators([Validators.required]);
        this.customerDetailsForm.controls['waive_all_fees_from'].updateValueAndValidity();
        this.customerDetailsForm.controls['waive_all_fees_to'].setValidators([Validators.required]);
        this.customerDetailsForm.controls['waive_all_fees_to'].updateValueAndValidity();
      } else {
        this.customerDetailsForm.controls['waive_all_fees_from'].clearValidators();
        this.customerDetailsForm.controls['waive_all_fees_to'].clearValidators();
        this.customerDetailsForm.controls['waive_all_fees_to'].updateValueAndValidity();
        this.customerDetailsForm.controls['waive_all_fees_from'].updateValueAndValidity();
      }
    })

  }

  goTo(indx) {
    this.selecetd = indx;
    console.log("goTo", indx);
    this.cDF.detectChanges();
  }

  private createForm() {
    this.customerDetailsForm = new FormGroup({
      // tslint:disable-next-line
      org_name: new FormControl('', Validators.required),
      address1: new FormControl('', Validators.required),
      address2: new FormControl(''),
      // address2: new FormControl('', [Validators.required, Validators.email]),
      // town: new FormControl('', Validators.required),
      county_id: new FormControl('', Validators.required),
      area_ids: new FormControl('', Validators.required),
      postcode: new FormControl(''),
      number_of_member: new FormControl(''),
      vendor_name: new FormControl(''),
      integration_key: new FormControl(''),
      integration_password: new FormControl(''),
      org_type: new FormControl('', Validators.required),
      color_1: new FormControl(''),
      color_2: new FormControl(''),
      first_name_primary: new FormControl(''),
      last_name_primary: new FormControl(''),
      phone_primary: new FormControl('', [Validators.required]),
      phone_code_primary: new FormControl('+353'),
      role_primary: new FormControl(''),
      email_primary: new FormControl('', [Validators.required, ValidateEmail]),
      first_name_bill: new FormControl(''),
      last_name_bill: new FormControl(''),
      phone_bill: new FormControl('', [Validators.required]),
      phone_code_bill: new FormControl('+353'),
      role_bill: new FormControl(''),
      email_bill: new FormControl('', [Validators.required, ValidateEmail]),
      // FinancialTab
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
    });

    this.customerDetailsForm.controls['color_1'].setValue("#ffffff");
    this.customerDetailsForm.controls['color_2'].setValue("#ffffff");
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
    this.team_list.splice(indx, 1)
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.team_list, event.previousIndex, event.currentIndex);
  }

  onNoClick() {
    this.timeoutRef = setTimeout(() => {
      this.router.navigateByUrl('/pages/admin/customer');
    }, 1000);
  }

  save() {
    if (this.customerDetailsForm.valid) {
      this.spinnerService.show();
      let data = this.customerDetailsForm.value;
      
      if (data.phone_primary && data.phone_primary.toString().length) {
        if (data['phone_code_primary'] == '+353' || data['phone_code_primary'] == '353') {
          data["phone_primary"] = '08' + data["phone_primary"];
        }
        data.phone_primary = data.phone_primary.toString()[0] == "0" ? data.phone_primary.toString() : "0" + data.phone_primary.toString();
      }

      if (data.phone_bill && data.phone_bill.toString().length) {
        if (data['phone_code_bill'] == '+353' || data['phone_code_bill'] == '353') {
          data["phone_bill"] = '08' + data["phone_bill"];
        }
        data.phone_bill = data.phone_bill.toString()[0] == "0" ? data.phone_bill.toString() : "0" + data.phone_bill.toString();
      }

      data.county = this.counties.find(cnty => cnty._id == data.county_id).name;
      data.areas = this.areas.filter(ara => data.area_ids.indexOf(ara._id) > -1).map(slar => { return slar.name });
      this.has_image = this.fileToUpload != null || this.fileToUpload != undefined;
      data.supporting_teams = this.team_list.map((x, i) => { return { team_name: x, seq: (i + 1) } });

      if (this.has_image) {
        let name_exts = this.fileToUpload.name.split('.');
        data.img_ext = name_exts[name_exts.length - 1];
      }
      let change_data = this.checkAllImages(data);
      data = change_data.send_data;
      this._customerService.addCustomer(data).subscribe((result: any) => {
        this.spinnerService.hide();
        if (result.success) {
          clearTimeout(this.timeoutRef);
          if (this.has_image) {
            this.uploadFileToActivity(result._id);
          }
          this.uploadAllImages(change_data.image_uploads, result._id);
          this.snackBar.open(result.message, '', {
            duration: 4000,
            verticalPosition: 'top'
          });
          this.timeoutRef = setTimeout(() => {
            this.router.navigateByUrl('/pages/admin/customer');
          }, 2000);
        } else {
          this.snackBar.open('Failed!', result.message, {
            duration: 4000,
            verticalPosition: 'top'
          });
        }
      });
    }
    else {
      this.snackBar.open("Invalid Form, Please Check All the Input Fields", '', {
        duration: 4000,
        verticalPosition: 'top'
      });
    }
  }
  getRoleList() {
    this._userService.getDefaultClubRole().subscribe((result: any) => {
      if (result.success) {
        this.roles = [result.data];
      }
      else {
        this.snackBar.open(result.message, '', {
          duration: 4000,
          verticalPosition: 'top'
        });
      }
    })
  }

  checkAllImages(data) {
    let image_uploads = [];
    if (this.lottoTemplatefileToUpload != null || this.lottoTemplatefileToUpload != undefined) {
      image_uploads.push("lotto_template");
      let name_exts = this.lottoTemplatefileToUpload.name.split('.');
      data.lotto_template_img_ext = name_exts[name_exts.length - 1];
    }
    if (this.lotto_template_image_url == 'https://placehold.it/200x250')
      data.lotto_template_image = "";
    if (this.prizeTemplatefileToUpload != null || this.prizeTemplatefileToUpload != undefined) {
      image_uploads.push("prize_template");
      let name_exts = this.prizeTemplatefileToUpload.name.split('.');
      data.prize_template_img_ext = name_exts[name_exts.length - 1];
    }
    if (this.prize_template_image_url == 'https://placehold.it/200x250')
      data.prize_template_image = "";

    if (this.fiftyTemplatefileToUpload != null || this.fiftyTemplatefileToUpload != undefined) {
      image_uploads.push("fifty_template");
      let name_exts = this.fiftyTemplatefileToUpload.name.split('.');
      data.fifty_template_img_ext = name_exts[name_exts.length - 1];
    }
    if (this.fifty_template_image_url == 'https://placehold.it/200x250')
      data.fifty_template_image = "";

    if (this.lottoWidgetfileToUpload != null || this.lottoWidgetfileToUpload != undefined) {
      image_uploads.push("lotto_widget");
      let name_exts = this.lottoWidgetfileToUpload.name.split('.');
      data.lotto_widget_img_ext = name_exts[name_exts.length - 1];
    }
    if (this.lotto_widget_image_url == 'https://placehold.it/200x250')
      data.lotto_widget_image = "";

    if (this.prizewidgetfileToUpload != null || this.prizewidgetfileToUpload != undefined) {
      image_uploads.push("prize_widget");
      let name_exts = this.prizewidgetfileToUpload.name.split('.');
      data.prize_widget_img_ext = name_exts[name_exts.length - 1];
    }
    if (this.prize_widget_image_url == 'https://placehold.it/200x250')
      data.prize_widget_image = "";
    if (this.fiftyWidgetfileToUpload != null || this.fiftyWidgetfileToUpload != undefined) {
      image_uploads.push("fifty_widget");
      let name_exts = this.fiftyWidgetfileToUpload.name.split('.');
      data.fifty_widget_img_ext = name_exts[name_exts.length - 1];
    }

    if (this.fifty_widget_image_url == 'https://placehold.it/200x250')
      data.fifty_widget_image = "";

    return { send_data: data, image_uploads: image_uploads }

  }
  uploadAllImages(upload_array, id) {
    //  console.log(upload_array)
    if (upload_array.indexOf("lotto_template") !== -1) {
      this._customerService.postFile(this.lottoTemplatefileToUpload, `club/lotto,templates,${id}`)
        .subscribe(
          data => {
            console.log(data);
          },
          error => {
            console.log(error);
          }
        );
    }
    if (upload_array.indexOf("prize_template") !== -1) {
      this._customerService.postFile(this.prizeTemplatefileToUpload, `club/prize,templates,${id}`)
        .subscribe(
          data => {
            console.log(data);
          },
          error => {
            console.log(error);
          }
        );
    }
    if (upload_array.indexOf("fifty_template") !== -1) {
      this._customerService.postFile(this.fiftyTemplatefileToUpload, `club/fifty,templates,${id}`)
        .subscribe(
          data => {
            console.log(data);
          },
          error => {
            console.log(error);
          }
        );
    }
    if (upload_array.indexOf("lotto_widget") !== -1) {
      this._customerService.postFile(this.lottoWidgetfileToUpload, `club/lotto,widgets,${id}`)
        .subscribe(
          data => {
            console.log(data);
          },
          error => {
            console.log(error);
          }
        );
    }
    if (upload_array.indexOf("prize_widget") !== -1) {
      this._customerService.postFile(this.prizewidgetfileToUpload, `club/prize,widgets,${id}`)
        .subscribe(
          data => {
            console.log(data);
          },
          error => {
            console.log(error);
          }
        );
    }
    if (upload_array.indexOf("fifty_widget") !== -1) {
      this._customerService.postFile(this.fiftyWidgetfileToUpload, `club/fifty,widgets,${id}`)
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
      this.cDF.detectChanges();
    }
    else if (type == 'prize_template') {
      this.prize_template_image_url = 'https://placehold.it/200x250';
      this.prizeTemplatefileToUpload = null;
      this.cDF.detectChanges();
    }
    else if (type == 'fifty_template') {
      this.fifty_template_image_url = 'https://placehold.it/200x250';
      this.fiftyTemplatefileToUpload = null;
      this.cDF.detectChanges();
    }
    else if (type == 'lotto_widget') {
      this.lotto_widget_image_url = 'https://placehold.it/200x250';
      this.lottoWidgetfileToUpload = null;
      this.cDF.detectChanges();
    }
    else if (type == 'prize_widget') {
      this.prize_widget_image_url = 'https://placehold.it/200x250';
      this.prizewidgetfileToUpload = null;
      this.cDF.detectChanges();
    }
    else if (type == 'fifty_widget') {
      this.fifty_widget_image_url = 'https://placehold.it/200x250';
      this.fiftyWidgetfileToUpload = null;
      this.cDF.detectChanges();
    }
  }

  // handleFileInput(event: any) {
  //   if (event.target.files && event.target.files[0]) {
  //     this.fileToUpload = event.target.files[0];
  //     var reader = new FileReader();
  //     reader.onload = (event: any) => {
  //       this.url = event.target.result;
  //       this.cDF.detectChanges();
  //     };
  //     reader.readAsDataURL(event.target.files[0]);
  //   }
  // }

  handleFileInput(event: any, type) {
    if (type == 'logo') {
      if (event.target.files && event.target.files[0]) {
        this.fileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.url = event.target.result;
          this.cDF.detectChanges();
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    }
    else if (type == 'lotto_template') {
      if (event.target.files && event.target.files[0]) {
        this.lottoTemplatefileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.lotto_template_image_url = event.target.result;
          this.cDF.detectChanges();
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    }
    else if (type == 'prize_template') {
      if (event.target.files && event.target.files[0]) {
        this.prizeTemplatefileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.prize_template_image_url = event.target.result;
          this.cDF.detectChanges();
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    }

    else if (type == 'fifty_template') {
      if (event.target.files && event.target.files[0]) {
        this.fiftyTemplatefileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.fifty_template_image_url = event.target.result;
          this.cDF.detectChanges();
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    }

    else if (type == 'lotto_widget') {
      if (event.target.files && event.target.files[0]) {
        this.lottoWidgetfileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.lotto_widget_image_url = event.target.result;
          this.cDF.detectChanges();
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    }

    else if (type == 'prize_widget') {
      if (event.target.files && event.target.files[0]) {
        this.prizewidgetfileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.prize_widget_image_url = event.target.result;
          this.cDF.detectChanges();
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    }

    else if (type == 'fifty_widget') {
      if (event.target.files && event.target.files[0]) {
        this.fiftyWidgetfileToUpload = event.target.files[0];
        var reader = new FileReader();
        reader.onload = (event: any) => {
          this.fifty_widget_image_url = event.target.result;
          this.cDF.detectChanges();
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    }
  }

  uploadFileToActivity(image_name) {
    this._customerService.postFile(this.fileToUpload, `club,logo,${image_name}`)
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
