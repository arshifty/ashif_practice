import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'anms-help-note-dailog',
  templateUrl: './help-note-dailog.component.html',
  styleUrls: ['./help-note-dailog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpNoteDailogComponent implements OnInit {

  data:any;
  constructor(
    public bsModalRef: BsModalRef
    ) { }
  ngOnInit() {
  }
  onNoClick(): void {
    this.bsModalRef.hide();
  }
}
