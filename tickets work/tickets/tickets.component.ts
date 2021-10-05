import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { DateAdapter, MatDialogRef, MatPaginator, MatSnackBar, MAT_DATE_FORMATS, MAT_DIALOG_DATA } from '@angular/material';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { SL_FORMATS } from '@app/shared/classes/data-store.class';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { SupporterService } from '../supporter.service';

@Component({
  selector: 'anms-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: SL_FORMATS },
  ]
})
export class TicketsComponent implements OnInit {

  panelOpenState = false;
  editTotalGame = true;
  editGameRemain = true;
  ball = true;
  supporter_id: string;
  club_id: string;
  correctBall: boolean;
  currentPage: number = 0;
  page_no = 1;
  public pageSize = 10;
  public totalSize = 0;
  notFoundMessageStatus : boolean = true;

  @ViewChild(MatPaginator)
  paginator: MatPaginator;

  constructor(
    public dialogRef: MatDialogRef<TicketsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _supporterService: SupporterService,
    private snackBar: MatSnackBar,
    private spinnerService: Ng4LoadingSpinnerService
  ) { }

  ticket_index: number | null = null;
  tickets: any = [];

  ngOnInit() {
    if (this.data) {
      this.supporter_id = this.data.supporter._id;
      this.club_id = this.data.club_id;
    }
    this.getTickets();
  }

  public handlePage(e: any) {
    this.currentPage = e.pageIndex;
    this.pageSize = e.pageSize;
    this.page_no = this.currentPage + 1;
    this.getTickets();
  }

  getTickets() {
    this.spinnerService.show();
    this._supporterService.getTickets(this.supporter_id, this.club_id, this.page_no, this.pageSize)
      .subscribe((result: any) => {
        this.spinnerService.hide();
        if (result.success && result.count > 0) {
          this.totalSize = result.count;
          this.tickets = result.data;
          this.tickets = this.tickets.map(ticket => {
            if (ticket.jackpot_id) {
              ticket.maxBallNumber = ticket.jackpot_id.number_of_ball;
            }
            ticket.auto_play = ticket.purchase_type == 'every_week' ? true : false;

            ticket.lines = ticket.tickets.map(numbers => {
              let nums = numbers.split(',')
              if (ticket.lottery_type == 'lotto') {
                return {
                  selected: false, numbers: [{ val: nums[0] }, { val: nums[1] }, { val: nums[2] }, { val: nums[3] }]
                }
              }
            });
            return ticket;
          });
        } else {
          this.notFoundMessageStatus = false;
        }

      })
  }

  updateTicket(ticket, tcktIndex, updateField, line = null, lineIndx = -1) {
    this.correctBall = true;
    let data: any = {
      ticket_id: ticket._id,
      total_number_of_game: ticket.total_number_of_game,
      number_of_game_remaining: ticket.number_of_game_remaining,
      purchase_type: ticket.auto_play ? 'every_week' : 'custom_week'
    }

    if (line && lineIndx > -1) {
      let updatedline: any = [];
      line.numbers.map(num => {
        if (num.val > 0 && num.val <= ticket.maxBallNumber) {
          updatedline.push(num.val.toString())
        } else {
          this.correctBall = false;
        }
      })
      updatedline = updatedline.join(',');
      ticket.tickets[lineIndx] = updatedline;
      data.tickets = ticket.tickets;
      this.tickets[tcktIndex].lines[lineIndx].selected = false;
    }

    if (updateField != 'ticket') {
      ticket[updateField] = false;
      if (ticket.auto_play) {
        ticket[updateField] = false
        ticket.purchase_type = ticket.auto_play ? 'every_week' : 'custom_week'
      } else {
        ticket.purchase_type = ticket.auto_play ? 'every_week' : 'custom_week'
      }
    }

    if (this.correctBall) {
      this.spinnerService.show();
      this._supporterService.updateTicket(data).subscribe((result: any) => {
        this.spinnerService.hide();
        if (result.success) {
          this.snackBar.open(result.message, 'Success', {
            duration: 4000,
            verticalPosition: 'top'
          });
        } else {
          this.snackBar.open(result.message, 'Failed', {
            duration: 4000,
            verticalPosition: 'top'
          });
        }
      })

    } else {
      this.snackBar.open('Number Should Be Greater Than 1 And Less Equal ' + ticket.maxBallNumber, 'Failed', {
        duration: 4000,
        verticalPosition: 'top'
      });
    }

  }


  onNoClick() {
    this.dialogRef.close();
  }

}
