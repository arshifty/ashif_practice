import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatPaginator, MatSnackBar } from '@angular/material';
import { TransactionsComponent } from './transactions/transactions.component';
import { TicketsComponent } from './tickets/tickets.component';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { SupporterService } from './supporter.service';

@Component({
  selector: 'anms-supporter',
  templateUrl: './supporter.component.html',
  styleUrls: ['./supporter.component.scss'],
})
export class SupporterComponent implements OnInit {

  supporterSubject: Subject<any> = new Subject();
  public search_criteria: any = {};
  wait: boolean;
  selected: any = {};
  clubs: any = [];
  currentPage: number = 0;
  page_no = 1;
  public pageSize = 10;
  public totalSize = 0;
  @ViewChild(MatPaginator)
  paginator: MatPaginator;

  constructor(
    private _supporterService: SupporterService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private spinnerService: Ng4LoadingSpinnerService

  ) { }
  displayedColumns: Array<string> = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'action'
  ];
  dataSource: Array<any> = [];

  ngOnInit() {
    this.getClubs();
    this.supporterSubject.pipe(debounceTime(500))
      .subscribe(() => {
        this.page_no = 1;
        this.paginator.firstPage();
        this.getActiveSupporter();
      });
  }

  searchSupporter() {
    this.supporterSubject.next();
  }

  getClubs() {
    this.spinnerService.show();
    this._supporterService.getActiveClubs().subscribe((result: any) => {
      this.spinnerService.hide();
      if (result.success) {
        this.clubs = result.data;
      }
    })
  }

  public handlePage(e: any) {
    this.currentPage = e.pageIndex;
    this.pageSize = e.pageSize;
    this.page_no = this.currentPage + 1;
    this.getActiveSupporter();
  }

  getSupporterData() {
    this.page_no = 1;
    this.paginator.firstPage();
    this.getActiveSupporter();
  }


  getActiveSupporter() {
    this.spinnerService.show();
    this.dataSource = [];
    this._supporterService.getActiveSupporter(this.search_criteria, this.selected._id, this.page_no, this.pageSize).subscribe((result: any) => {
      this.spinnerService.hide();
      if (result.success) {
        if (result.count > 0) {
          this.dataSource = result.data;
          this.totalSize = result.count;
        } else {
          this.snackBar.open('No Active Supporter Data Found', 'Success', {
            duration: 4000,
            verticalPosition: 'top'
          });
        }

      }
    })
  }

  transactionsModal(supporter) {
    this.dialog.open(TransactionsComponent, {
      width: '800px',
      disableClose: true,
      data: {
        supporter: supporter,
        club_name: this.selected.org_name,
        club_id: this.selected._id
      }
    });
  }


  ticketsModal(supporter) {
    this.dialog.open(TicketsComponent, {
      width: '800px',
      disableClose: true,
      data: {
        supporter: supporter,
        club_name: this.selected.org_name,
        club_id: this.selected._id
      }
    });
  }

}
