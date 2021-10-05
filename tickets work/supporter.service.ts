import { HttpParams } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { BaseService } from '@app/shared/services/base.service';

@Injectable({
  providedIn: 'root'
})
export class SupporterService extends BaseService {

  constructor(injector: Injector) {
    super(injector);
  }

  getActiveSupporter(criterion, id, page_no, page_size) {
    let params = new HttpParams();
    params = params.set('club_id', id);
    params = params.set('page_no', page_no);
    params = params.set('page_size', page_size);
    Object.keys(criterion).map(key => {
      params = params.append(key, criterion[key]);
    })
    this.httpOptions.params = params;
    return this.http.get(`${this.apiUrl}admin/supporter/list`, this.httpOptions);
  }

  getTransaction(criterion, supporter_id, club_id, page_no, page_size) {
    let params = new HttpParams();
    params = params.set('club_id', club_id);
    params = params.set('supporter_id', supporter_id);
    params = params.set('page_no', page_no);
    params = params.set('page_size', page_size);
    Object.keys(criterion).map(key => {
      params = params.append(key, criterion[key]);
    })
    this.httpOptions.params = params;
    return this.http.get(`${this.apiUrl}admin/supporter/transaction`, this.httpOptions);
  }

  addFundsData(data) {
    return this.http.post(`${this.apiUrl}admin/supporter/transaction`, JSON.stringify(data), this.httpOptions);
  }

  getTickets(supporter_id, club_id, page_no, page_size) {
    let params = new HttpParams();
    params = params.set('club_id', club_id);
    params = params.set('supporter_id', supporter_id);
    params = params.set('page_no', page_no);
    params = params.set('page_size', page_size);
    this.httpOptions.params = params;
    return this.http.get(`${this.apiUrl}admin/supporter/tickets`, this.httpOptions);
  }

  updateTicket(data: any) {
    return this.http.put(`${this.apiUrl}admin/supporter/tickets?ticket_id=${data.ticket_id}`, JSON.stringify(data), this.httpOptions);
  }

  getActiveClubs() {
    return this.http.get(`${this.apiUrl}admin/club/active-club-list`, this.httpOptions);
  }

}
