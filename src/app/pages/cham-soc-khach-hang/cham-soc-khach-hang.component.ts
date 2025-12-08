import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { forkJoin } from "rxjs";
import { finalize } from "rxjs/operators"; // Import thêm finalize để tắt loading

// Import Services
import { KiotVietService, Customer } from "../../shared/services/customer.service";
import { ZaloService } from "../../shared/services/zalo.service";
import { NocoService } from "../../shared/services/nocodb.service";

// Import Data
import { ProductCore, productCoreData } from "../../shared/components/custom/data-orders/product-core";

// Interface
export interface MaintenanceTask {
  customerCode: string;
  customerName: string;
  contactNumber: string;
  address: string;
  locationName: string;
  productName: string;
  sku: string;
  purchaseDate: string;
  maintenanceDetails: {
    coreName: string;
    months: number;
    dueDate: Date;
    dueDateStr: string;
    status: "Gấp" | "Sắp tới" | "Xa";
    daysRemaining: number;
  }[];
}

@Component({
  selector: "app-cham-soc-khach-hang",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./cham-soc-khach-hang.component.html",
  styleUrls: ["./cham-soc-khach-hang.component.css"],
})
export class ChamSocKhachHangComponent implements OnInit {
  
  private productCores: ProductCore[] = productCoreData;

  // Dữ liệu
  public maintenanceList: MaintenanceTask[] = [];
  public filteredList: MaintenanceTask[] = [];
  public isLoading: boolean = false; // Biến trạng thái loading

  // Pagination & Search
  public currentPage = 1;
  public itemsPerPage = 10;
  public searchTerm: string = "";

  constructor(
    private kiotVietService: KiotVietService,
    private zaloService: ZaloService,
    private nocoService: NocoService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading = true; // Bật loading

    forkJoin({
      customersResponse: this.kiotVietService.getCustomers(),
      ordersResponse: this.kiotVietService.getOrders(),
    }).pipe(
      finalize(() => this.isLoading = false) // Tắt loading khi xong (dù thành công hay lỗi)
    ).subscribe({
      next: (result) => {
        const customers = result.customersResponse.data;
        const orders = result.ordersResponse.data;

        // Map Customer rõ ràng kiểu dữ liệu
        const customerMap = new Map<string, any>(); 
        customers.forEach((c: any) => customerMap.set(c.code, c));

        const tasks: MaintenanceTask[] = [];
        const now = new Date();

        orders.forEach((order: any) => {
          if (order.statusValue === "Đã hủy") return;

          const rawCode = order.customerCode || "";
          const cleanCode = rawCode.split("{")[0].trim();
          const customer = customerMap.get(cleanCode);

          if (!customer) return;

          order.orderDetails.forEach((detail: any) => {
            const productCode = detail.productCode.toLowerCase().trim();
            
            // Tìm sản phẩm Core
            const matchedCore = this.productCores.find(
              (core) =>
                productCode === core.sku.toLowerCase().trim() ||
                productCode.includes(core.sku.toLowerCase().trim())
            );

            if (matchedCore && matchedCore.lifetimes) {
              const details: any[] = [];
              const purchaseDate = new Date(order.modifiedDate);

              matchedCore.lifetimes.forEach((months, index) => {
                if (months > 0) {
                  const dueDate = new Date(purchaseDate);
                  dueDate.setMonth(dueDate.getMonth() + months);

                  const diffTime = dueDate.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  let status: "Gấp" | "Sắp tới" | "Xa" = "Xa";
                  if (diffDays <= 15) status = "Gấp";
                  else if (diffDays <= 60) status = "Sắp tới"; // Tăng lên 60 ngày để hiện nhiều hơn

                  // Chỉ hiện những cái sắp đến hạn hoặc quá hạn
                  // Bỏ comment dòng dưới nếu muốn lọc bớt "Xa"
                  // if (status !== "Xa") {
                    details.push({
                      coreName: `Lõi số ${index + 1} (${months} tháng)`,
                      months: months,
                      dueDate: dueDate,
                      dueDateStr: this.formatDate(dueDate),
                      status: status,
                      daysRemaining: diffDays,
                    });
                  // }
                }
              });

              if (details.length > 0) {
                details.sort((a, b) => a.daysRemaining - b.daysRemaining);
                
                tasks.push({
                  customerCode: customer.code,
                  customerName: customer.name,
                  contactNumber: customer.contactNumber,
                  address: customer.address || 'Chưa cập nhật',
                  locationName: customer.locationName || '',
                  productName: detail.productName,
                  sku: detail.productCode,
                  purchaseDate: order.modifiedDate,
                  maintenanceDetails: details,
                });
              }
            }
          });
        });

        // Sort tổng: Ai cần thay gấp nhất lên đầu
        tasks.sort((a, b) => {
          const minDayA = a.maintenanceDetails[0]?.daysRemaining ?? 9999;
          const minDayB = b.maintenanceDetails[0]?.daysRemaining ?? 9999;
          return minDayA - minDayB;
        });

        this.filteredList = tasks;
        this.maintenanceList = [...this.filteredList];
      },
      error: (err) => console.error(err),
    });
  }

  // --- Actions ---

  sendZalo(task: MaintenanceTask) {
    if (!task.contactNumber) {
      alert("Khách hàng này không có số điện thoại!");
      return;
    }
    const confirmMsg = `Gửi tin nhắn Zalo nhắc thay [${task.maintenanceDetails[0].coreName}] cho khách [${task.customerName}]?`;
    if (!confirm(confirmMsg)) return;

    this.zaloService.sendMaintenanceData(task).subscribe({
      next: (res) => alert("✅ Đã gửi lệnh Zalo thành công!"),
      error: (err) => alert("❌ Gửi thất bại. Hãy kiểm tra kết nối."),
    });
  }

  saveToNocoDB(task: MaintenanceTask) {
    const record = {
      "makh": task.customerCode,
      "name": task.customerName,
      "sdt": task.contactNumber,
      "sp": task.productName,
      "sku": task.sku,
      "ngaymua": task.purchaseDate,
      "trangthai": "Đã lưu",
    };

    this.nocoService.createRecord(record).subscribe({
      next: (res) => alert("✅ Đã lưu lịch sử vào hệ thống!"),
      error: (err) => alert("❌ Lỗi khi lưu dữ liệu."),
    });
  }

  // --- Helpers ---
  
  formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  findItems() {
    const term = this.searchTerm.trim().toLowerCase();
    this.currentPage = 1;
    if (!term) {
      this.maintenanceList = [...this.filteredList];
      return;
    }
    this.maintenanceList = this.filteredList.filter((item) => {
      return (
        item.contactNumber?.toLowerCase().includes(term) ||
        item.customerName?.toLowerCase().includes(term) ||
        item.customerCode?.toLowerCase().includes(term) ||
        item.sku?.toLowerCase().includes(term)
      );
    });
  }

  // Pagination Getters
  get currentItems(): MaintenanceTask[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.maintenanceList.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.maintenanceList.length / this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }
}