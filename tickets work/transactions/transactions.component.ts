import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DateAdapter, MatDialogRef, MatPaginator, MatSnackBar, MAT_DATE_FORMATS, MAT_DIALOG_DATA } from '@angular/material';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { SL_FORMATS } from '@app/shared/classes/data-store.class';
import { addTimeToDate } from '@app/shared/functions/moment';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { SupporterService } from '../supporter.service';

@Component({
  selector: 'anms-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: SL_FORMATS },
  ]
})
export class TransactionsComponent implements OnInit {
  transactionsTable = true;
  supporter_id: string;
  club_id: string;
  currentPage: number = 0;
  page_no = 1;
  public pageSize = 10;
  public totalSize = 0;
  fundTypes: any = ['Reward'];
  submitted: boolean;
  wait: boolean;
  filterObj: any = {};
  addFundForm: FormGroup;
  noTransactionTable: boolean = false;
  dateRangeShow: boolean = true;

  @ViewChild(MatPaginator)
  paginator: MatPaginator;

  constructor(
    public dialogRef: MatDialogRef<TransactionsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _supporterService: SupporterService,
    private snackBar: MatSnackBar,
    private spinnerService: Ng4LoadingSpinnerService
  ) { }

  displayedColumns: Array<string> = [
    'date',
    'detail',
    'amount',
    'balance',
  ];
  dataSource: Array<any> = [];

  ngOnInit() {
    if (this.data) {
      this.supporter_id = this.data.supporter._id;
      this.club_id = this.data.club_id;
    }
    this.getTransaction();
    this.createForm();
  }

  showFund() {
    this.transactionsTable = false;
    this.noTransactionTable = false;
    this.dateRangeShow = false;
  }

  searchDateRange() {
    let dateFrom = new Date(this.filterObj.date_from);
    let dateTo = new Date(this.filterObj.date_to);
    dateFrom = addTimeToDate(dateFrom , "00:00");
    dateTo = addTimeToDate(dateTo , "23:59");
    this.filterObj.date_from = dateFrom;
    this.filterObj.date_to = dateTo;

    if (Number(dateFrom.getFullYear()) && Number(dateTo.getFullYear())) {
      this.page_no = 1;
      this.pageSize = 10;
      this.getTransaction();
    }
  }

  private createForm() {
    this.addFundForm = new FormGroup({
      transactionType: new FormControl('Reward', Validators.required),
      fundAmount: new FormControl('', [Validators.required, Validators.min(1)])
    });
  }

  addFunds() {
    this.submitted = true;
    if (this.addFundForm.valid) {
      this.submitted = false;
      let data: any = {};
      data.supporter_id = this.supporter_id;
      data.club_id = this.club_id;
      data.trasaction_type = this.addFundForm.controls['transactionType'].value;
      data.amount = this.addFundForm.controls['fundAmount'].value;
      this.wait = true;
      this.spinnerService.show();
      this._supporterService.addFundsData(data).subscribe((result: any) => {
        this.spinnerService.hide();
        this.wait = false;
        if (result.success) {
          this.filterObj.date_from = '';
          this.filterObj.date_to = ''; 
          this.page_no = 1;
          this.pageSize = 10;
          this.getTransaction();
          this.transactionsTable = true;
          this.dateRangeShow = true;
          this.snackBar.open(result.message, 'success', {
            duration: 4000,
            verticalPosition: 'top'
          });
          this.addFundForm.reset();
        } else {
          this.snackBar.open(result.message, 'Failed', {
            duration: 4000,
            verticalPosition: 'top'
          });
        }
      })

    } else {
      this.snackBar.open('Please Fill The Form', 'Failed', {
        duration: 4000,
        verticalPosition: 'top'
      });
    }

  }

  public handlePage(e: any) {
    this.currentPage = e.pageIndex;
    this.pageSize = e.pageSize;
    this.page_no = this.currentPage + 1;
    this.getTransaction();
  }

  getTransaction() {
    this.spinnerService.show();
    this._supporterService.getTransaction(this.filterObj, this.supporter_id, this.club_id, this.page_no, this.pageSize)
      .subscribe((result: any) => {
        this.spinnerService.hide();
        if (result.success) {
          if (result.count > 0) {
            this.dataSource = result.data;
            this.totalSize = result.count;
            this.noTransactionTable = true;
            this.transactionsTable = true;
          } else {
            this.dataSource = [];
            this.noTransactionTable = true;
            this.transactionsTable = false;            
          }
        } else {
          this.snackBar.open(result.message, 'Failed', {
            duration: 4000,
            verticalPosition: 'top'
          });
        }
      })
  }

  onNoClick() {
    this.dialogRef.close();
  }
}
