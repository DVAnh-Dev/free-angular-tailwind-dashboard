import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class KiotVietService {
  // 🔥 Proxy Cloudflare của bạn
  private readonly PROXY_HOST = "https://cskh-phg.daoanh08091999.workers.dev/";

  // Ghép Proxy vào trước URL gốc KiotViet
  private tokenUrl = this.PROXY_HOST + "https://id.kiotviet.vn/connect/token";
  private apiUrl = this.PROXY_HOST + "https://public.kiotapi.com";

  // Thông tin cấu hình
  private clientId = "2e99e1b4-5604-40ae-a254-cb2640e81135";
  private clientSecret = "04C9131537234B6B37E6B36AE2DCB8DA5D0082CB";
  private retailer = "phanhoanggia";

  private STORAGE_KEY = "kiotviet_session";

  constructor(private http: HttpClient) {}

  // --- Logic lấy Token ---
  public getValidToken(): Observable<string> {
    const session = this.getSession();
    const now = Date.now();

    // Kiểm tra token còn hạn không (trừ hao 10s)
    if (session && session.accessToken && session.expiresAt > now + 10000) {
      return of(session.accessToken);
    }
    return this.requestNewToken();
  }

  private requestNewToken(): Observable<string> {
    const headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    const body = new HttpParams()
      .set("scopes", "PublicApi.Access")
      .set("grant_type", "client_credentials")
      .set("client_id", this.clientId)
      .set("client_secret", this.clientSecret);

    // Gọi API lấy token qua Proxy
    return this.http
      .post<any>(this.tokenUrl, body.toString(), { headers })
      .pipe(
        tap((res) => this.saveSession(res)),
        map((res) => res.access_token)
      );
  }

  private saveSession(apiResponse: any) {
    const expiresAt = Date.now() + apiResponse.expires_in * 1000;
    const data = {
      accessToken: apiResponse.access_token,
      expiresAt: expiresAt,
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private getSession(): any {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  private getHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      Retailer: this.retailer,
      Authorization: `Bearer ${token}`,
    });
  }

  // --- Các hàm lấy dữ liệu ---

  getOrders(limit: number = 20): Observable<any> {
    return this.getValidToken().pipe(
      switchMap((token) => {
        const headers = this.getHeaders(token);
        const params = new HttpParams().set("pageSize", limit);
        // URL thực tế: https://cskh-phg.../https://public.kiotapi.com/orders
        return this.http.get(`${this.apiUrl}/orders`, { headers, params });
      })
    );
  }

  getCustomers(limit: number = 20): Observable<any> {
    return this.getValidToken().pipe(
      switchMap((token) => {
        const headers = this.getHeaders(token);
        const params = new HttpParams().set("pageSize", limit);
        return this.http.get(`${this.apiUrl}/customers`, { headers, params });
      })
    );
  }

  getUsers(limit: number = 20): Observable<any> {
    return this.getValidToken().pipe(
      switchMap((token) => {
        const headers = this.getHeaders(token);
        const params = new HttpParams().set("pageSize", limit);
        return this.http.get(`${this.apiUrl}/users`, { headers, params });
      })
    );
  }
}

// Interface Customer giữ nguyên
export interface Customer {
  id: number;
  code: string;
  name: string;
  contactNumber: string;
  address: string;
  locationName: string;
  wardName: string;
  email: string;
  organization: string;
  branchId: number;
  retailerId: number;
  debt: number;
  type: number;
  createdDate: string;
  modifiedDate: string;
}
