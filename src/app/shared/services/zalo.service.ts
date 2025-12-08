import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ZaloService {
  // 1. Proxy Cloudflare của bạn
  private readonly PROXY_HOST = "https://cskh-phg.daoanh08091999.workers.dev/";

  // 2. URL API Smax
  private readonly SMAX_API_URL =
    "https://api.smax.ai/public/bizs/vananhdao/triggers/69361b5cf368ebebf4e863f8";

  // 3. Token xác thực
  private readonly BEARER_TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmlnZ2VyX2lkIjoiNjkzNjFiNWNmMzY4ZWJlYmY0ZTg2M2Y4IiwiaWF0IjoxNzY1MTUzNjI4LCJleHAiOjMxNzMwOTU5NjAyOH0.mVY3QfY-kZPNCSLAPAjqLWO46hG_5np8qMKcrRk9mss";

  // 4. Page ID (Zalo OA ID)
  // private readonly PAGE_ID = "zlw2126797563748572346";

  constructor(private http: HttpClient) {}

  /**
   * Gửi thông tin sang Smax với các trường dữ liệu cụ thể
   */
  sendMaintenanceData(task: any): Observable<any> {
    const headers = new HttpHeaders({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.BEARER_TOKEN}`,
    });

    // Lấy thông tin lõi cần thay (ưu tiên lõi đầu tiên trong danh sách nhắc nhở)
    const coreInfo = task.maintenanceDetails?.[0]?.coreName || "Không xác định";

    // Chuẩn bị Body gửi đi
    const body = {
      customer: {
        pid: "zlw698865934987393419",
        page_pid: "zlw2126797563748572346"
      },
      // 🔥 PHẦN QUAN TRỌNG: Map dữ liệu vào các biến Smax
      attrs: [
        {
          name: "customerName",
          value: task.customerName || "",
        },
        {
          name: "customerCode",
          value: task.customerCode || "",
        },
        {
          name: "contactNumber",
          value: task.contactNumber || "",
        },
        {
          name: "productName",
          value: task.productName || "",
        },
        {
          name: "sku",
          value: task.sku || "",
        },
        {
          name: "coreName",
          value: coreInfo,
        },
      ],
    };

    // Ghép URL: Proxy + Smax URL
    const fullUrl = this.PROXY_HOST + this.SMAX_API_URL;

    return this.http.post(this.SMAX_API_URL, body, { headers });
  }
}
