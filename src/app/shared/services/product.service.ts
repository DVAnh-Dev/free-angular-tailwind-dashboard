import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export interface ProductCores {
  id?: string; // MockAPI luôn trả về ID dạng chuỗi
  stt?: number;
  sku: string;
  brand: string;
  totalCores: number;
  lifetimes: number[]; // Mảng số nguyên [12, 6, 24...]
}

@Injectable({
  providedIn: "root",
})
export class ProductService {
  private readonly API_URL = "https://692da10fe5f67cd80a4c4f33.mockapi.io/sku";

  constructor(private http: HttpClient) {}

  // 1. Lấy danh sách
  getProducts(): Observable<ProductCores[]> {
    return this.http.get<ProductCores[]>(this.API_URL);
  }

  // 2. Thêm mới
  addProduct(product: ProductCores): Observable<ProductCores> {
    return this.http.post<ProductCores>(this.API_URL, product);
  }

  // 3. Cập nhật
  updateProduct(product: ProductCores): Observable<ProductCores> {
    return this.http.put<ProductCores>(
      `${this.API_URL}/${product.id}`,
      product
    );
  }

  // 4. Xóa
  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
