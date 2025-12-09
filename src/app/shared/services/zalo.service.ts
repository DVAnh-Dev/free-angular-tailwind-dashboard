import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

// Import Service và Data cần thiết
import { KiotVietService } from './customer.service';
import { ProductCore, productCoreData } from '../components/custom/data-orders/product-core';


export interface ZaloConfig {
  apiUrl: string;
  token: string;
  pid: string;      // ID Nhóm Zalo (Gửi báo cáo vào đây)
  pagePid: string;  // ID Admin
}

@Injectable({
  providedIn: 'root'
})
export class ZaloService {
  
  // 1. Cấu hình cơ bản
  private readonly PROXY_HOST = 'https://cskh-phg.daoanh08091999.workers.dev/';
  private readonly STORAGE_KEY = 'zalo_config_settings';
  
  // Dữ liệu cấu hình mặc định (Sẽ bị ghi đè bởi LocalStorage)
  private config: ZaloConfig = {
    apiUrl: 'https://api.smax.ai/public/bizs/vananhdao/triggers/69361b5cf368ebebf4e863f8',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmlnZ2VyX2lkIjoiNjkzNjFiNWNmMzY4ZWJlYmY0ZTg2M2Y4IiwiaWF0IjoxNzY1MTUzNjI4LCJleHAiOjMxNzMwOTU5NjAyOH0.mVY3QfY-kZPNCSLAPAjqLWO46hG_5np8qMKcrRk9mss',
    pid: 'zlw698865934987393419',
    pagePid: 'zlw2126797563748572346'
  };

  private productCores: ProductCore[] = productCoreData;

  constructor(
    private http: HttpClient,
    private kiotVietService: KiotVietService
  ) { 
    const savedConfig = localStorage.getItem(this.STORAGE_KEY);
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    }
  }

  // --- CÁC HÀM CẤU HÌNH ---
  getConfig(): ZaloConfig { return { ...this.config }; }
  
  updateConfig(newConfig: ZaloConfig) {
    this.config = newConfig;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
  }

  // ========================================================================
  // 🟢 HÀM 1 (CŨ): Gửi tin nhắn bảo trì cho KHÁCH HÀNG (từng người)
  // ========================================================================
  sendMaintenanceData(task: any): Observable<any> {
    
    // Header dùng Token động
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.token}`
    });

    // Lấy thông tin lõi (ưu tiên lõi đầu tiên)
    const coreInfo = task.maintenanceDetails?.[0]?.coreName || "Không xác định";

    // Body
    const body = {
      customer: {
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

    // URL
    const fullUrl = `${this.config.apiUrl}?access_token=${this.config.token}`;

    return this.http.post(fullUrl, body, { headers });
  }

  // ========================================================================
  // 🔴 HÀM 2 (MỚI): Quét và gửi cảnh báo cho NHÂN VIÊN (Sắp hạn / Quá hạn)
  // ========================================================================
  scanAndNotifyStaff(warningDays: number = 7): Observable<any> {
    
    return forkJoin({
      users: this.kiotVietService.getUsers(100),
      orders: this.kiotVietService.getOrders(100),
      customers: this.kiotVietService.getCustomers(100)
    }).pipe(
      switchMap((data: any) => {
        const users = data.users.data;
        const orders = data.orders.data;
        const customers = data.customers.data;

        // Map dữ liệu
        const staffMap = new Map<number, string>();
        users.forEach((u: any) => staffMap.set(u.id, u.givenName || u.name));

        const customerMap = new Map<string, string>();
        customers.forEach((c: any) => customerMap.set(c.code, c.name));

        const today = new Date();
        const notificationRequests: Observable<any>[] = [];

        orders.forEach((order: any) => {
          if (order.statusValue === 'Đã hủy') return;

          const staffName = staffMap.get(order.soldById) || "Không xác định";
          const cleanCusCode = order.customerCode?.split("{")[0].trim();
          const customerName = customerMap.get(cleanCusCode) || order.customerName;
          const purchaseDate = new Date(order.modifiedDate);

          order.orderDetails.forEach((detail: any) => {
            const productCode = detail.productCode.toLowerCase().trim();
            const matchedCore = this.productCores.find(core => 
              productCode.includes(core.sku.toLowerCase().trim())
            );

            if (matchedCore && matchedCore.lifetimes) {
              matchedCore.lifetimes.forEach((months, index) => {
                if (!months) return;

                const dueDate = new Date(purchaseDate);
                dueDate.setMonth(dueDate.getMonth() + months);

                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let messageType = '';
                
                // Điều kiện gửi tin
                if (diffDays === warningDays) {
                  messageType = 'SẮP ĐẾN HẠN';
                } else if (diffDays < 0) {
                  messageType = 'QUÁ HẠN';
                }

                if (messageType) {
                  const request = this.sendAlertToSmax({
                    staffName: staffName,
                    customerName: customerName,
                    coreName: `Lõi số ${index + 1} (${months} tháng)`,
                    dueDate: this.formatDate(dueDate),
                    daysOverdue: Math.abs(diffDays).toString(),
                    alertType: messageType
                  });
                  notificationRequests.push(request);
                }
              });
            }
          });
        });

        if (notificationRequests.length > 0) {
          return forkJoin(notificationRequests);
        } else {
          return of({ message: 'Không có trường hợp nào cần thông báo.' });
        }
      }),
      catchError(err => {
        console.error('Lỗi scan:', err);
        return of({ error: true, message: err.message });
      })
    );
  }

  // --- Helpers cho hàm Scan ---
  private sendAlertToSmax(data: {
    staffName: string;
    customerName: string;
    coreName: string;
    dueDate: string;
    daysOverdue: string;
    alertType: string;
  }): Observable<any> {
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.token}`
    });

    const body = {
      customer: {
        pid: this.config.pid,       
        page_pid: this.config.pagePid 
      },
      attrs: [
        { name: "staffName", value: data.staffName },
        { name: "customerName", value: data.customerName },
        { name: "coreName", value: data.coreName },
        { name: "dueDate", value: data.dueDate },
        { name: "daysOverdue", value: data.daysOverdue },
        { name: "alertType", value: data.alertType } 
      ]
    };

    const fullUrl = `${this.config.apiUrl}?access_token=${this.config.token}`;
    return this.http.post(fullUrl, body, { headers });
  }

  private formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
}