import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { CustomerService } from '../customer.service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../user/user.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DataStore } from '@app/shared/classes/data-store.class';
import { AuthGuardService } from '@app/core';

@Component({
  selector: 'anms-view-customer',
  templateUrl: './view-customer.component.html',
  styleUrls: ['./view-customer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewCustomerComponent implements OnInit {
  selecetd: number = 0;
  is_activated: boolean = true;

  url = 'assets/avatar.png';
  has_image: boolean;
  submitted: boolean;
  customer: any = {};
  customerUpdateForm: FormGroup;
  store: DataStore = new DataStore();
  countries: Array<string> = [];
  counties: Array<string> = [];
  customer_id: any;
  primary_id;
  any;
  bill_id: any;
  timeoutRef: any;
  roles: any = [];
  edit_permission: boolean;
  areas: any = [];
  team_list: any = [];

  constructor(
    public _authGuardService: AuthGuardService,
    private _customerService: CustomerService,
    private _userService: UserService,
    public snackBar: MatSnackBar,
    private spinnerService: Ng4LoadingSpinnerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.countries = this.store.countries;
    this.edit_permission = this.checkEditPermission('edit');
    this.getRoleList();
    this.createForm();
    this.customer_id = this.route.snapshot.params['id'];
    this.getCustomer(this.customer_id);
    this.getCountries();
    this.onCountySelect();
  }

  onCountySelect() {
    this.customerUpdateForm.get('county_id').valueChanges.subscribe(x => {
      this._customerService.getAreas(x).subscribe((result: any) => {
        if (result.success) {
          this.areas = result.data;
        }
      });
    });
  }

  getCountries() {
    this._customerService
      .getCoutiesArea(this.customer.county_id)
      .subscribe((resultArray: any) => {
        this.counties = resultArray[0].data;
        this.areas = resultArray[1].data;
      });
  }

  goTo(indx) {
    this.selecetd = indx;
  }

  checkEditPermission(name) {
    let url = '/pages/admin/customer';
    let macthedMenu = this.getAllPermitted().find(mnu => {
      return mnu.name == url;
    });
    if (macthedMenu && macthedMenu.permissions) {
      let permission = macthedMenu.permissions.find(prmss => {
        return prmss.name == name;
      });
      return permission && permission.permitted;
    } else {
      return false;
    }
  }

  getAllPermitted() {
    let menus = localStorage.getItem('permitted_menus');
    let allPermittedMenus: Array<any> = [];
    if (menus) {
      JSON.parse(menus).map(menu => {
        if (!menu.has_children) {
          allPermittedMenus.push({
            name: '/pages/' + menu.link,
            permissions: menu.permission
          });
        } else {
          menu.childs.map(child => {
            allPermittedMenus.push({
              name: '/pages/' + child.link,
              permissions: child.permission
            });
          });
        }
      });
      return allPermittedMenus;
    }
  }

  editCustomer() {
    this.router.navigateByUrl('/pages/admin/customer/edit/' + this.customer_id);
  }

  private createForm() {
    this.customerUpdateForm = new FormGroup({
      // tslint:disable-next-line
      org_name: new FormControl('', Validators.required),
      address1: new FormControl('', Validators.required),
      address2: new FormControl(''),
      // address2: new FormControl('', [Validators.required, Validators.email]),
      area_ids: new FormControl('', Validators.required),
      county_id: new FormControl('', Validators.required),
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
      phone_primary: new FormControl(''),
      role_primary: new FormControl(''),
      email_primary: new FormControl(''),
      first_name_bill: new FormControl(''),
      last_name_bill: new FormControl(''),
      phone_bill: new FormControl(''),
      role_bill: new FormControl(''),
      email_bill: new FormControl(''),

      // Financial Info
      defer_all_fees_except_sms: new FormControl(false),
      waive_all_fees_incld_sms: new FormControl(false),
      date_of_waiving: new FormControl(''),
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
    });
  }

  getCustomer(id) {
    this._customerService.getCustomer(id).subscribe((result: any) => {
      if (result.success) {
        let customer = result.clubs[0];
        this.customer = customer;
        let admins = result.admins;
        this.customerUpdateForm.controls['org_name'].setValue(
          customer.org_name
        );
        this.customerUpdateForm.controls['address1'].setValue(
          customer.address1
        );
        this.customerUpdateForm.controls['address2'].setValue(
          customer.address2
        );
        this.customerUpdateForm.controls['county_id'].setValue(
          customer.county_id
        );
        this.customerUpdateForm.controls['area_ids'].setValue(
          customer.area_ids
        );
        this.customerUpdateForm.controls['postcode'].setValue(
          customer.postcode
        );
        this.customerUpdateForm.controls['number_of_member'].setValue(
          customer.number_of_member
        );
        this.customerUpdateForm.controls['org_type'].setValue(
          customer.org_type
        );

        if (this.customer.color_1)
          this.customerUpdateForm.controls['color_1'].setValue(
            customer.color_1
          );
        else this.customer.controls['color_1'].setValue('#ffffff');
        if (this.customer.color_2)
          this.customerUpdateForm.controls['color_2'].setValue(
            customer.color_2
          );
        else this.customerUpdateForm.controls['color_2'].setValue('#ffffff');

        this.customerUpdateForm.controls['vendor_name'].setValue(
          customer.payment.vendor_name
        );
        this.customerUpdateForm.controls['integration_key'].setValue(
          customer.payment.integration_key
        );
        this.customerUpdateForm.controls['integration_password'].setValue(
          customer.payment.integration_password
        );

        if (customer.logo) {
          this.url = this._customerService.imageUrl + customer.logo;
        }

        //Financial
        this.customerUpdateForm.controls['defer_all_fees_except_sms'].setValue(
          this.customer.defer_all_fees_except_sms
        );
        this.customerUpdateForm.controls['waive_all_fees_incld_sms'].setValue(
          this.customer.waive_all_fees_incld_sms
        );
        this.customerUpdateForm.controls['date_of_waiving'].setValue(
          this.customer.date_of_waiving
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
        this.customerUpdateForm.controls['org_contribution_detail'].setValue(
          this.customer.org_contribution_detail
        );
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

        let primary = admins.find(x => x.admin_type == 'primary');
        let bill = admins.find(x => x.admin_type == 'bill');

        this.primary_id = primary._id;
        this.customerUpdateForm.controls['first_name_primary'].setValue(
          primary.first_name
        );
        this.customerUpdateForm.controls['last_name_primary'].setValue(
          primary.last_name
        );
        this.customerUpdateForm.controls['phone_primary'].setValue(
          primary.phone
        );
        this.customerUpdateForm.controls['role_primary'].setValue(
          primary.role_id
        );
        this.customerUpdateForm.controls['email_primary'].setValue(
          primary.email
        );

        this.bill_id = bill._id;
        this.customerUpdateForm.controls['first_name_bill'].setValue(
          bill.first_name
        );
        this.customerUpdateForm.controls['last_name_bill'].setValue(
          bill.last_name
        );
        this.customerUpdateForm.controls['phone_bill'].setValue(bill.phone);
        this.customerUpdateForm.controls['role_bill'].setValue(bill.role_id);
        this.customerUpdateForm.controls['email_bill'].setValue(bill.email);
        Object.keys(this.customerUpdateForm.controls).map(key => {
          this.customerUpdateForm.controls[key].disable();
        });
      }
    });
  }

  getRoleList() {
    this._userService.getRoles('club').subscribe((result: any) => {
      //    console.log("result role", result)
      this.roles = result.data;
    });
  }
}
