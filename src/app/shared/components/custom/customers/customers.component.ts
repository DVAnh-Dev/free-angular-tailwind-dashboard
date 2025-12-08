import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { forkJoin } from "rxjs";
import { finalize } from "rxjs/operators";

// Components & Services
import { KiotVietService, Customer } from "../../../services/customer.service";
import { ProductCore, productCoreData } from "../data-orders/product-core";

// Interfaces
export interface OrderDetail {
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  code: string;
  purchaseDate: string;
  customerName: string;
  customerCode: string;
  statusValue: string;
  orderDetails: OrderDetail[];
}

export interface CustomerWithProducts extends Customer {
  purchasedProducts: {
    sku: string;
    productName: string;
    purchaseDate: string;
    quantity: number;
    coreRules: ProductCore;
  }[];
}

@Component({
  selector: "app-customers",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./customers.component.html",
  styleUrls: ["./customers.component.css"],
})
export class CustomersComponent implements OnInit {
  
  // Data
  public dataCustomers: CustomerWithProducts[] = [];
  public filteredCustomers: CustomerWithProducts[] = [];
  public productCores: ProductCore[] = productCoreData;
  
  // State
  public isLoading: boolean = false;

  // Pagination & Search
  public currentPage = 1;
  public itemsPerPage = 10;
  public searchTerm: string = "";

  constructor(private kiotVietService: KiotVietService) {}

  ngOnInit(): void {
    this.loadAndFilterData();
  }

  loadAndFilterData() {
    this.isLoading = true; // Bắt đầu loading

    forkJoin({
      customersResponse: this.kiotVietService.getCustomers(),
      ordersResponse: this.kiotVietService.getOrders(),
    }).pipe(
      finalize(() => this.isLoading = false) // Kết thúc loading dù thành công hay lỗi
    ).subscribe({
      next: (result) => {
        const allCustomers = result.customersResponse.data;
        const allOrders = result.ordersResponse.data;

        // Map: CustomerCode -> List Products
        const customerPurchasesMap = new Map<string, any[]>();

        allOrders.forEach((order: Order) => {
          const rawCode = order.customerCode || "";
          const cleanCustomerCode = rawCode.split("{")[0].trim();

          if (!cleanCustomerCode) return;

          order.orderDetails.forEach((detail) => {
            const productCode = detail.productCode.toLowerCase().trim();
            const matchedCore = this.productCores.find(
              (core) =>
                productCode === core.sku.toLowerCase().trim() ||
                productCode.includes(core.sku.toLowerCase().trim())
            );

            if (matchedCore) {
              const productInfo = {
                sku: detail.productCode,
                productName: detail.productName,
                quantity: detail.quantity,
                purchaseDate: order.purchaseDate,
                coreRules: matchedCore,
              };

              if (customerPurchasesMap.has(cleanCustomerCode)) {
                customerPurchasesMap.get(cleanCustomerCode)?.push(productInfo);
              } else {
                customerPurchasesMap.set(cleanCustomerCode, [productInfo]);
              }
            }
          });
        });

        // Merge Data
        const processedList: CustomerWithProducts[] = [];
        allCustomers.forEach((cus: Customer) => {
          if (customerPurchasesMap.has(cus.code)) {
            processedList.push({
              ...cus,
              purchasedProducts: customerPurchasesMap.get(cus.code) || [],
            });
          }
        });

        this.filteredCustomers = processedList;
        this.dataCustomers = [...this.filteredCustomers];
      },
      error: (err) => console.error("Lỗi tải dữ liệu:", err),
    });
  }

  // --- Helpers ---
  
  // Tính ngày bảo trì tiếp theo
  calculateNextMaintenance(purchaseDateIso: string, monthsToAdd: number): string {
    if (!purchaseDateIso) return 'N/A';
    const date = new Date(purchaseDateIso);
    date.setMonth(date.getMonth() + monthsToAdd);
    
    // Format DD/MM/YYYY
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  // --- Search & Pagination ---

  get currentItems(): CustomerWithProducts[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.dataCustomers.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.dataCustomers.length / this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  findItems() {
    const term = this.searchTerm.trim().toLowerCase();
    this.currentPage = 1;

    if (!term) {
      this.dataCustomers = [...this.filteredCustomers];
      return;
    }

    this.dataCustomers = this.filteredCustomers.filter((item) => {
      const sdt = item.contactNumber?.toLowerCase().includes(term);
      const name = item.name?.toLowerCase().includes(term);
      const code = item.code?.toLowerCase().includes(term);
      const hasProduct = item.purchasedProducts.some((p) =>
        p.productName.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
      );

      return sdt || name || code || hasProduct;
    });
  }
}