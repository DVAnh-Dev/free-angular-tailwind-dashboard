import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NocoService {

  // 🔥 1. Proxy Cloudflare của bạn (Giữ nguyên để vượt lỗi CORS)
  private readonly PROXY_HOST = 'https://cskh-phg.daoanh08091999.workers.dev/';

  // 🔥 2. Cấu hình NocoDB
  // URL gốc của NocoDB (Thay bằng URL của bạn nếu tự host)
  private readonly NOCO_BASE_URL = 'https://app.nocodb.com/api/v2/tables'; 
  
  // ID của Bảng dữ liệu (Table ID) bạn muốn lưu vào
  private readonly TABLE_ID = 'vwsfqanwl4blu79s'; 

  // Token API (Lấy trong Account Settings -> Tokens)
  private readonly API_TOKEN = '1nDc7D4OJyf19UOmm2--v6x5dWaCRHOa7xWcg3Ww';

  constructor(private http: HttpClient) { }

  /**
   * Thêm mới một dòng dữ liệu vào NocoDB
   * @param data Object chứa dữ liệu cần lưu (Key phải trùng với tên cột trong NocoDB)
   */
  createRecord(data: any): Observable<any> {
    
    // Cấu hình Header theo chuẩn NocoDB
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'xc-token': this.API_TOKEN // NocoDB dùng header này để xác thực
    });

    // Tạo URL: Proxy + NocoDB URL + Table ID + /records
    // Cấu trúc API v2: POST /api/v2/tables/{tableId}/records
    const targetUrl = `${this.NOCO_BASE_URL}/${this.TABLE_ID}/records`;
    const fullUrl = targetUrl;

    // Body gửi đi (NocoDB yêu cầu body là 1 object hoặc mảng object)
    const body = data; 

    return this.http.post(fullUrl, body, { headers });
  }
}