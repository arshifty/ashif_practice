import { Component, OnInit } from '@angular/core';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { FormGroup, FormControl, Validators, FormArray, FormBuilder } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { resizeImage, base64ToFile, getRandomImageParam } from 'src/app/shared/functions/others';
import { PubSubService } from 'src/app/shared/services/pub-sub-service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { SuccessfullyComponent } from 'src/app/shared/component/successfully/successfully.component';
import { Location } from '@angular/common';
import ValidatePhoneNumber from 'src/app/shared/validators/phone-number.validator';
import { DataStore } from 'src/app/shared/classes/data-store.class';
import ValidateEmail from 'src/app/shared/validators/email.validator';


@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})

export class EditProfileComponent implements OnInit {

  profileResult: any = {};
  selecetd_teams_lebel: any = [];

  profileForm: FormGroup;
  formSubmitted: boolean;
  mobnumPattern = '08[3,5,6,7,9]\\d{7}';
  counties: any = [];
  activeClubList: any = [];
  supporter_id: string;
  counriesCode: any = [];
  dataStore = new DataStore();
  club_supporting_teams: any = [];
  all_team: boolean = true;
  selecetd_teams = new FormArray([]);
  fileToUpload: any;
  url: string = 'https://smartlottoassets.s3-eu-west-1.amazonaws.com/default-profile.png';

  errorHandler(event) {
    event.target.src = "https://smartlottoassets.s3-eu-west-1.amazonaws.com/default-profile.png";
  }

  constructor(
    private spinnerService: Ng4LoadingSpinnerService,
    private _profileService: ProfileService,
    private router: Router,
    private toastr: ToastrService,
    private modalService: BsModalService,
    private _pubSubService: PubSubService,
    private fb: FormBuilder,
    public location: Location
  ) { }

  ngOnInit() {
    this.createForm();
    this.getProfile();
    this._profileService.getCountyList().subscribe((result: any) => {
      this.counties = result.data;
    })
    this.counriesCode = this.dataStore.countriesWithDialCodes;
  }

  handleFileInput(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.fileToUpload = event.target.files[0];
      var reader = new FileReader();
      reader.onload = (event: any) => {
        resizeImage(event.target.result, 450, 450)
          .then((imageString: string) => {
            this.url = imageString;
          })
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  uploadFileToActivity(image_name) {
    this._profileService.postFile(base64ToFile(this.url, `${this.supporter_id}.jpeg`), `supporter,profile,${image_name}`)
      .subscribe(
        data => {
          console.log(data);
        },
        error => {
          console.log(error);
        }
      );
  }


  private createForm() {

    this.profileForm = new FormGroup({
      // tslint:disable-next-line
      first_name: new FormControl('', [Validators.required]),
      last_name: new FormControl('', [Validators.required]),
      dd_of_birth: new FormControl(''),
      mm_of_birth: new FormControl(''),
      yy_of_birth: new FormControl(''),
      phone: new FormControl('', Validators.required),
      // phone_code: new FormControl('', Validators.required),
      phone_code: new FormControl('+353'),
      email: new FormControl('', [Validators.required, ValidateEmail]),
      address1: new FormControl('', [Validators.required]),
      address2: new FormControl(''),
      town: new FormControl('', [Validators.required]),
      postcode: new FormControl('', [Validators.required]),
      county: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.minLength(6)]),
      verify_password: new FormControl(''),
      favourite_club: new FormControl('', Validators.required),
      hide_name_from_list: new FormControl(false),
      supporting_team_name: new FormControl(''),
    }, {
      validators: ValidatePhoneNumber
    });
  }

  getProfile() {
    this.spinnerService.show();
    this._profileService.getCountyList().subscribe((result: any) => {
      this.counties = result.data;
      this._profileService.getActiveClubs().subscribe((clubs: any) => {
        this.activeClubList = clubs;
        this._profileService.get().subscribe((result: any) => {
          this.spinnerService.hide();
          if (result.success && result.data) {
            this.profileResult = result.data;
            let dob: any
            if (result.data.date_of_birth) {
              dob = new Date(result.data.date_of_birth);
              this.profileForm.controls['dd_of_birth'].setValue(dob.getDate());
              this.profileForm.controls['mm_of_birth'].setValue(dob.getMonth());
              this.profileForm.controls['yy_of_birth'].setValue(dob.getFullYear());

              this.profileForm.controls['dd_of_birth'].disable();
              this.profileForm.controls['mm_of_birth'].disable();
              this.profileForm.controls['yy_of_birth'].disable();
            }
            if (result.data.club && result.data.club.club_supporting_teams) {
              let selectedItem = result.data.supporting_team_name;
              let actice_supporting_team = result.data.club.club_supporting_teams.filter(team => { return team.active })
              this.club_supporting_teams = actice_supporting_team.map(team => {
                let obj = {};
                let selectedTm = (selectedItem == team.team_name) ? true : false;
                obj['is_selected'] = selectedTm;
                obj['team_name'] = team.team_name;
                return obj;
              });
            }
            this.supporter_id = result.data._id;
            if (result.data.image) {
              this.url = this._profileService.imageUrl + result.data.image + `?img_prm=${getRandomImageParam()}`;
            }
            this.profileForm.controls['first_name'].setValue(result.data.first_name);
            this.profileForm.controls['last_name'].setValue(result.data.last_name);

            let phoneNumber = result.data.phone;
            let codeNumber = result.data.phone_code;

            if ((codeNumber == '+353' || codeNumber == '353') && phoneNumber && phoneNumber.length) {
              let first_two_digit = phoneNumber.slice(0, 2);
              if (first_two_digit == '08' && phoneNumber.length == 10) {
                let phone = phoneNumber.slice(2, phoneNumber.length);
                this.profileForm.controls['phone_code'].setValue(result.data.phone_code);
                this.profileForm.controls['phone'].setValue(phone);

                this.profileForm.controls['phone'].disable();
                this.profileForm.controls['phone_code'].disable();
              }
            } else if (codeNumber && codeNumber.length && codeNumber != '+353' && codeNumber != '353' && phoneNumber.length > 4) {
              this.profileForm.controls['phone_code'].setValue(result.data.phone_code);
              this.profileForm.controls['phone'].setValue(phoneNumber);

              this.profileForm.controls['phone'].disable();
              this.profileForm.controls['phone_code'].disable();
            }


            if (result.data.email && result.data.email.length) {
              this.profileForm.controls['email'].setValue(result.data.email);
              this.profileForm.controls['email'].disable();
            }

            this.profileForm.controls['address1'].setValue(result.data.address1);
            this.profileForm.controls['address2'].setValue(result.data.address2);
            this.profileForm.controls['town'].setValue(result.data.town);
            this.profileForm.controls['postcode'].setValue(result.data.postcode);
            this.profileForm.controls['county'].setValue(result.data.county);
            this.profileForm.controls['favourite_club'].setValue(result.data.favourite_club);
            this.profileForm.controls['hide_name_from_list'].setValue(result.data.hide_name_from_list);
          }
          this.profileForm.controls['first_name'].disable();
          this.profileForm.controls['last_name'].disable();
        })
      })
    })
  }

  save() {

    this.formSubmitted = true;
    if (this.profileForm.value.password) {
      if (this.profileForm.value.password == this.profileForm.value.verify_password) {
        this.formSubmitted = false;
        this.update(this.profileForm.getRawValue())
      }
    } else {
      if (this.profileForm.valid) {
        this.formSubmitted = false;
        this.update(this.profileForm.getRawValue())
      }
    }
  }

  update(data) {
    let has_image = this.fileToUpload != null || this.fileToUpload != undefined;
    this.spinnerService.show();

    data.date_of_birth = new Date(data.yy_of_birth, (data.mm_of_birth - 1), data.dd_of_birth)
    data.date_of_birth.setHours(15);

    if (has_image) {
      this.uploadFileToActivity(this.supporter_id);
      data.image = `/image/supporter/profile/${this.supporter_id}.jpeg`
    }


    if (data.phone && data.phone.toString().length) {
      if (data['phone_code'] == '+353' || data['phone_code'] == '353') {
        data['phone'] = data.phone.toString().slice(0, 2) != '08' ? '08' + data['phone'] : data.phone;
      }
      data.phone = data.phone.toString()[0] == '0' ? data.phone.toString() : '0' + data.phone.toString();
    }

    this._profileService.save(data).subscribe((result: any) => {
      this.spinnerService.hide();
      if (result.success) {
        if (has_image)
          this._pubSubService.UpdateStream.emit({ profile_img: true });
        this.showLogoutScreen()
      } else {
        this.toastr.error(result.message, "Failed!");
      }
    })
  }

  showLogoutScreen() {
    const initialState = {
      data: {
        message: "Profile Updated Successfully"
      }
    }
    let modalConfig = {
      backdrop: false,
      ignoreBackdropClick: false,
    };
    const modalParams = Object.assign({}, modalConfig, { initialState, class: 'modal-center modal-dialog-centered d-flex' });
    const bsModalRef = this.modalService.show(SuccessfullyComponent, modalParams);
    setTimeout(() => {
      bsModalRef.hide();
      this.router.navigateByUrl('/pages/profile/view');
    }, 3000);
  }

}
