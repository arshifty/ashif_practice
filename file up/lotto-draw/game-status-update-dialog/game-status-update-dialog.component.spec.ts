import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameStatusUpdateDialogComponent } from './game-status-update-dialog.component';

describe('GameStatusUpdateDialogComponent', () => {
  let component: GameStatusUpdateDialogComponent;
  let fixture: ComponentFixture<GameStatusUpdateDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameStatusUpdateDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameStatusUpdateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
