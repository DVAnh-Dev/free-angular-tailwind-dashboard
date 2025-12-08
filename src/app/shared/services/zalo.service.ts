import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Định nghĩa kiểu dữ liệu cấu hình
export interface ZaloConfig {
  apiUrl: string;
  token: string;
  pid: string;      // ID Nhóm Zalo
  pagePid: string;  // ID Người dùng Zalo cá nhân
}

@Injectable({
  providedIn: 'root'
})
export class ZaloService {
  
  // Proxy (Giữ nguyên)
  private readonly PROXY_HOST = 'https://cskh-phg.daoanh08091999.workers.dev/';
  
  // Các giá trị mặc định (Sẽ bị ghi đè nếu có cấu hình mới)
  private config: ZaloConfig = {
    apiUrl: 'https://api.smax.ai/public/bizs/vananhdao/triggers/69361b5cf368ebebf4e863f8',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmlnZ2VyX2lkIjoiNjkzNjFiNWNmMzY4ZWJlYmY0ZTg2M2Y4IiwiaWF0IjoxNzY1MTUzNjI4LCJleHAiOjMxNzMwOTU5NjAyOH0.mVY3QfY-kZPNCSLAPAjqLWO46hG_5np8qMKcrRk9mss',
    pid: 'zlw698865934987393419',       // Mặc định ID Nhóm
    pagePid: 'zlw2126797563748572346'    // Mặc định ID Cá nhân
  };

  private readonly STORAGE_KEY = 'zalo_config_settings';

  constructor(private http: HttpClient) { 
    // Khi khởi động, thử lấy cấu hình từ LocalStorage nếu có
    const savedConfig = localStorage.getItem(this.STORAGE_KEY);
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    }
  }

  // --- 1. Hàm lấy cấu hình hiện tại (để hiển thị lên form) ---
  getConfig(): ZaloConfig {
    return { ...this.config }; // Trả về bản copy để an toàn
  }

  // --- 2. Hàm cập nhật cấu hình mới (từ component gửi sang) ---
  updateConfig(newConfig: ZaloConfig) {
    this.config = newConfig;
    // Lưu vào bộ nhớ trình duyệt để F5 không mất
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    // console.log('✅ Đã cập nhật cấu hình Zalo:', this.config);
  }

  // --- 3. Hàm gửi tin (Đã cập nhật để dùng biến động) ---
  sendMaintenanceData(task: any): Observable<any> {
    
    // Header dùng Token động
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.token}` // Dùng token từ config
    });

    // Lấy thông tin lõi
    const coreInfo = task.maintenanceDetails?.[0]?.coreName || "Không xác định";

    // Body dùng PID/PagePID động
    const body = {
      customer: {
        // Theo yêu cầu của bạn: pid là nhóm, page_pid là cá nhân
        pid: this.config.pid,       
        page_pid: this.config.pagePid 
      },
      attrs: [
        { name: "customerName", value: task.customerName || "" },
        { name: "customerCode", value: task.customerCode || "" },
        { name: "contactNumber", value: task.contactNumber || "" },
        { name: "productName", value: task.productName || "" },
        { name: "sku", value: task.sku || "" },
        { name: "coreName", value: coreInfo }
      ]
    };

    // URL dùng API URL động
    // Ghép URL: Proxy + API URL + Token (nếu API yêu cầu token trên URL, còn ko thì chỉ header)
    // Lưu ý: Nếu API của bạn bắt buộc token trên URL thì dùng dòng dưới, nếu chỉ cần Header thì bỏ phần ?access_token
    const fullUrl = `${this.config.apiUrl}?access_token=${this.config.token}`;

    return this.http.post(fullUrl, body, { headers });
  }
}