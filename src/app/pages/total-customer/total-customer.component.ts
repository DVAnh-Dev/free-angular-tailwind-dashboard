import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { forkJoin } from "rxjs";
import { finalize } from "rxjs/operators"; // Import finalize

// Services & Data
import { KiotVietService } from "../../shared/services/customer.service";
import { ProductCore, productCoreData } from "../../shared/components/custom/data-orders/product-core";

@Component({
  selector: "app-total-customer",
  standalone: true,
  imports: [CommonModule], // Không cần SafeHtmlPipe nữa
  templateUrl: "./total-customer.component.html",
  styleUrl: "./total-customer.component.css",
})
export class TotalCustomerComponent implements OnInit {
  // --- Biến hiển thị ---
  public totalCustomers: number = 0;
  public totalOrders: number = 0;
  public totalRevenue: number = 0;
  public maintenanceCurrentMonth: number = 0;
  public maintenanceNextMonth: number = 0;

  // --- Biến thời gian & Trạng thái ---
  public currentMonthStr: string = "";
  public nextMonthStr: string = "";
  public isLoading: boolean = true; // Trạng thái loading

  private productCores: ProductCore[] = productCoreData;

  constructor(private kiotVietService: KiotVietService) {}

  ngOnInit(): void {
    const now = new Date();
    this.currentMonthStr = `${now.getMonth() + 1}/${now.getFullYear()}`;
    
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    this.nextMonthStr = `${nextMonth.getMonth() + 1}/${nextMonth.getFullYear()}`;

    this.calculateMetrics();
  }

  calculateMetrics() {
    this.isLoading = true;

    forkJoin({
      customersResponse: this.kiotVietService.getCustomers(),
      ordersResponse: this.kiotVietService.getOrders(),
    }).pipe(
      finalize(() => this.isLoading = false) // Tắt loading khi xong
    ).subscribe({
      next: (result) => {
        const allOrders = result.ordersResponse.data;

        // Thời gian hệ thống
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const nextMonth = new Date(currentYear, currentMonth + 1, 1).getMonth();
        const nextMonthYear = new Date(currentYear, currentMonth + 1, 1).getFullYear();

        // 1. Lọc đơn hàng hợp lệ (Chưa hủy)
        const validOrders = allOrders.filter((order: any) => order.statusValue !== 'Đã hủy');

        // 2. Tính KPI Doanh số & Đơn hàng (Tháng hiện tại)
        const ordersInMonth = validOrders.filter((order: any) => {
          const d = new Date(order.modifiedDate);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        let revenue = 0;
        let ordersCount = 0;
        const customersSet = new Set<string>();

        ordersInMonth.forEach((order: any) => {
          let hasCore = false;
          order.orderDetails.forEach((detail: any) => {
            const pCode = detail.productCode.toLowerCase().trim();
            const isCore = this.productCores.some(c => pCode.includes(c.sku.toLowerCase().trim()));
            
            if (isCore) {
              revenue += (detail.price * detail.quantity) - (detail.discount || 0);
              hasCore = true;
            }
          });

          if (hasCore) {
            ordersCount++;
            const code = order.customerCode?.split("{")[0].trim();
            if (code) customersSet.add(code);
          }
        });

        this.totalRevenue = revenue;
        this.totalOrders = ordersCount;
        this.totalCustomers = customersSet.size;

        // 3. Tính Bảo trì (Dựa trên lịch sử)
        let countCurrent = 0;
        let countNext = 0;

        validOrders.forEach((order: any) => {
          const buyDate = new Date(order.modifiedDate);
          const buyMonth = buyDate.getMonth();
          const buyYear = buyDate.getFullYear();

          order.orderDetails.forEach((detail: any) => {
            const pCode = detail.productCode.toLowerCase().trim();
            const qty = detail.quantity || 1;
            const core = this.productCores.find(c => pCode.includes(c.sku.toLowerCase().trim()));

            if (core?.lifetimes) {
              core.lifetimes.forEach(life => {
                if (!life) return;
                
                const diffCurr = (currentYear - buyYear) * 12 + (currentMonth - buyMonth);
                if (diffCurr > 0 && diffCurr % life === 0) countCurrent += qty;

                const diffNext = (nextMonthYear - buyYear) * 12 + (nextMonth - buyMonth);
                if (diffNext > 0 && diffNext % life === 0) countNext += qty;
              });
            }
          });
        });

        this.maintenanceCurrentMonth = countCurrent;
        this.maintenanceNextMonth = countNext;
      },
      error: (err) => console.error(err),
    });
  }
}