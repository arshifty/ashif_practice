import { Injectable, Injector } from '@angular/core';
import { BaseService } from '@app/shared/services/base.service';
import { HttpParams, HttpHeaders } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerService extends BaseService {
  constructor(injector: Injector) {
    super(injector);
  }

  getPrizeData(id) {
    let params = new HttpParams();
    params = params.set('id', id);
    this.httpOptions.params = params;
    return this.http.get(
      `${this.apiUrl}admin/customers/prize-data`,
      this.httpOptions
    );
  }

  updatePrizeData(data) {
    return this.http.put(
      `${this.apiUrl}admin/customers/prize-data/${data.id}`,
      JSON.stringify(data),
      this.httpOptions
    );
  }

  getJackpotData(id) {
    let params = new HttpParams();
    params = params.set('id', id);
    this.httpOptions.params = params;
    return this.http.get(
      `${this.apiUrl}admin/customers/jackpot-data`,
      this.httpOptions
    );
  }

  updateJackpotData(data) {
    return this.http.put(
      `${this.apiUrl}admin/customers/jackpot-data/${data.id}`,
      JSON.stringify(data),
      this.httpOptions
    );
  }

  get(criterion, page_no, page_size) {
    let params = new HttpParams();
    params = params.set('page_no', page_no);
    params = params.set('page_size', page_size);
    Object.keys(criterion).map(key => {
      params = params.append(key, criterion[key]);
    });
    this.httpOptions.params = params;
    //console.log("getActivityLog", this.httpOptions);
    return this.http.get(`${this.apiUrl}admin/customers`, this.httpOptions);
  }

  getCustomer(id) {
    return this.http.get(
      `${this.apiUrl}admin/customers/${id}`,
      this.httpOptions
    );
  }

  addCustomer(data) {
    return this.http.post(
      `${this.apiUrl}admin/customers`,
      JSON.stringify(data),
      this.httpOptions
    );
  }

  updateCustomer(data) {
    return this.http.put(
      `${this.apiUrl}admin/customers/${data.id}`,
      JSON.stringify(data),
      this.httpOptions
    );
  }

  getCustomerAccessToken(club_id) {
    return this.http.get(
      `${this.apiUrl}admin/customers/access-token/${club_id}`,
      this.httpOptions
    );
  }

  getCoutiesArea(id) {
    let counties = this.http.get(
      `${this.apiUrl}admin/counties`,
      this.httpOptions
    );
    let areas = this.http.get(
      `${this.apiUrl}admin/areas/${id}`,
      this.httpOptions
    );

    return forkJoin([counties, areas]);
  }

  getCouties() {
    return this.http.get(`${this.apiUrl}admin/counties`, this.httpOptions);
  }

  getAreas(id) {
    return this.http.get(`${this.apiUrl}admin/areas/${id}`, this.httpOptions);
  }

  uploadAdvanceSales(data, club_id) {
    return this.http.post(
      `${this.apiUrl}admin/jackpot/advance-sales/${club_id}`,
      JSON.stringify(data),
      this.httpOptions
    );
  }

  postFile(fileToUpload: File, filePath) {
    let headers = new HttpHeaders();
    headers.append(
      'Content-Type',
      'application/x-www-form-urlencoded; charset=UTF-8'
    );
    headers.append('Access-Control-Allow-Headers', 'session-variable');
    headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.append('Access-Control-Allow-Origin', '*');
    headers.append('Access-Control-Allow-Credentials', 'true');

    const endpoint = `${this.apiUrl}upload?path=${filePath}`;
    const formData: FormData = new FormData();
    formData.append('fileKey', fileToUpload, fileToUpload.name);
    return this.http.post(endpoint, formData, { headers: headers });
  }

  resendInvite(id) {
    console.log('id', id);
    return this.http.get(
      `${this.apiUrl}admin/resend-invite-agent/${id}`,
      this.httpOptions
    );
  }
}
