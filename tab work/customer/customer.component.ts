import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild
} from '@angular/core';
import { MatDialog, MatSnackBar, MatPaginator } from '@angular/material';
import { Router } from '@angular/router';
import { CustomerService } from './customer.service';
import { AuthGuardService } from '@app/core';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { deleteCookie, setCookie } from '@app/shared/functions/coockie';
import { PubSubService } from '@app/shared/services/pub-sub-service';
import { JackpotUpdateCustomerComponent } from './jackpot-update-customer/jackpot-update-customer.component';
import { PrizeUpdateCustomerComponent } from './prize-update-customer/prize-update-customer.component';

@Component({
  selector: 'anms-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss']
})
export class CustomerComponent implements OnInit {
  club: any = { total: 0, active: 0, pending: 0 };
  all_clubs: Array<any> = [];
  current_clubs: Array<any> = [];
  current_type: string;
  public wait: boolean;
  displayedColumns: Array<string> = [
    'name',
    'url',
    'type',
    'county',
    'status',
    'action'
  ];
  dataSource: Array<any>;
  search_criteria: any = {};
  currentPage: number = 0;
  page_no = 1;
  public pageSize = 10;
  public totalSize = 0;

  @ViewChild(MatPaginator)
  paginator: MatPaginator;

  constructor(
    public _authGuardService: AuthGuardService,
    private _customerService: CustomerService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    private router: Router,
    private spinnerService: Ng4LoadingSpinnerService,
    private _pubSubService: PubSubService
  ) {}

  ngOnInit() {
    this.getClubData();
  }

  updatePrize(element) {
    const dialogRef = this.dialog.open(PrizeUpdateCustomerComponent, {
      width: '630px',
      disableClose: true,
      data: element
    });

    const sub = dialogRef.componentInstance.onYes.subscribe((rslt: any) => {
      if (rslt && rslt.success) {
        this.snackBar.open('Update Successfull', 'Success', {
          duration: 4000,
          verticalPosition: 'top'
        });
        dialogRef.close();
      }
    });
  }

  updateJackpot(element) {
    const dialogRef = this.dialog.open(JackpotUpdateCustomerComponent, {
      width: '630px',
      disableClose: true,
      data: element
    });

    const sub = dialogRef.componentInstance.onYes.subscribe((rslt: any) => {
      if (rslt && rslt.success) {
        this.snackBar.open('Update Successfull', 'Success', {
          duration: 4000,
          verticalPosition: 'top'
        });
        dialogRef.close();
      }
    });
  }

  getSearch() {
    this.wait = true;
    this._customerService
      .get(this.search_criteria, this.page_no, this.pageSize)
      .subscribe((result: any) => {
        this.wait = false;
        if (result.success) {
          this.dataSource = result.clubs.clubs;

          this.totalSize = result.clubs.count;
        } else {
          this.snackBar.open('Failed!', result.message, {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['failed-snackbar']
          });
        }
      });
  }

  public handlePage(e: any) {
    this.currentPage = e.pageIndex;
    this.pageSize = e.pageSize;
    this.page_no = this.currentPage + 1;

    this.getClubData();
  }

  loginToClub(club_id) {
    this._customerService
      .getCustomerAccessToken(club_id)
      .subscribe((result: any) => {
        if (result._id) {
          deleteCookie('token');
          localStorage.removeItem('permitted_menus');
          localStorage.removeItem('current-jackpot');
          location.href = `${this._customerService.clubBaseHost}pages/club/home?auth_key=${result.token}`;
        } else {
          this.snackBar.open('Failed!', result.message, {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['failed-snackbar']
          });
        }
      });
  }

  getClubData() {
    this.wait = true;
    this.spinnerService.show();
    this._customerService
      .get(this.search_criteria, this.page_no, this.pageSize)
      .subscribe((result: any) => {
        this.spinnerService.hide();
        this.wait = false;
        if (result.success) {
          this.dataSource = result.clubs.clubs;
          this.totalSize = result.clubs.count;
        }
      });
  }
}
