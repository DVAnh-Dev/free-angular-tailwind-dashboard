import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { forkJoin } from "rxjs";
import { ButtonComponent } from "../../shared/components/ui/button/button.component";
import { BadgeComponent } from "../../shared/components/ui/badge/badge.component";
import {
  ProductCore,
  productCoreData,
} from "../../shared/components/custom/data-orders/product-core";
import {
  Customer,
  KiotVietService,
} from "../../shared/services/customer.service";

import { ZaloService } from "../../shared/services/zalo.service";
import { NocoService } from "../../shared/services/nocodb.service";

// Components UI

// Services & Data

// Interface mở rộng
export interface MaintenanceTask {
  customerCode: string;
  customerName: string;
  contactNumber: string;
  address: string;
  locationName: string;
  productName: string;
  sku: string;
  purchaseDate: string;

  // Thông tin chi tiết về từng lõi cần thay
  maintenanceDetails: {
    coreName: string; // Ví dụ: Lõi 1
    months: number; // Tuổi thọ (tháng)
    dueDate: Date; // Ngày cần thay (Date object để sort)
    dueDateStr: string; // Ngày cần thay (String để hiển thị)
    status: "Gấp" | "Sắp tới" | "Xa"; // Trạng thái
    daysRemaining: number;
  }[];
}

@Component({
  selector: "app-cham-soc-khach-hang",
  standalone: true,
  imports: [CommonModule, ButtonComponent, FormsModule, BadgeComponent],
  templateUrl: "./cham-soc-khach-hang.component.html",
  styleUrls: ["./cham-soc-khach-hang.component.css"], // Bạn có thể tạo file css rỗng nếu chưa cần style riêng
})
export class ChamSocKhachHangComponent implements OnInit {
  private productCores: ProductCore[] = productCoreData;

  // Dữ liệu hiển thị
  public maintenanceList: MaintenanceTask[] = [];
  public filteredList: MaintenanceTask[] = [];

  // Phân trang & Tìm kiếm
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
    forkJoin({
      customersResponse: this.kiotVietService.getCustomers(),
      ordersResponse: this.kiotVietService.getOrders(),
    }).subscribe({
      next: (result) => {
        const customers = result.customersResponse.data;
        const orders = result.ordersResponse.data;

        // Map: CustomerCode -> Customer Info
        const customerMap = new Map<string, Customer>();
        customers.forEach((c: Customer) => customerMap.set(c.code, c));

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

            // Tìm sản phẩm trong danh sách Core
            const matchedCore = this.productCores.find(
              (core) =>
                productCode === core.sku.toLowerCase().trim() ||
                productCode.includes(core.sku.toLowerCase().trim())
            );

            if (matchedCore && matchedCore.lifetimes) {
              const details: any = [];
              const purchaseDate = new Date(order.modifiedDate);

              // Tính toán cho từng lõi
              matchedCore.lifetimes.forEach((months, index) => {
                if (months > 0) {
                  const dueDate = new Date(purchaseDate);
                  dueDate.setMonth(dueDate.getMonth() + months);

                  // Tính số ngày còn lại
                  const diffTime = dueDate.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  // Xác định trạng thái
                  let status: "Gấp" | "Sắp tới" | "Xa" = "Xa";
                  if (diffDays <= 15) status = "Gấp"; // Còn 1 tuần hoặc quá hạn
                  else if (diffDays <= 45) status = "Sắp tới"; // Còn 1.5 tháng

                  details.push({
                    coreName: `Lõi số ${index + 1} (${months} tháng)`,
                    months: months,
                    dueDate: dueDate,
                    dueDateStr: this.formatDate(dueDate),
                    status: status,
                    daysRemaining: diffDays,
                  });
                }
              });

              // Chỉ thêm vào danh sách nếu sản phẩm có lõi cần thay
              if (details.length > 0) {
                // Sắp xếp các lõi cần thay sớm nhất lên đầu
                details.sort(
                  (a: any, b: any) => a.daysRemaining - b.daysRemaining
                );

                tasks.push({
                  customerCode: customer.code,
                  customerName: customer.name,
                  contactNumber: customer.contactNumber,
                  address: customer.address,
                  locationName: customer.locationName,
                  productName: detail.productName,
                  sku: detail.productCode,
                  purchaseDate: order.modifiedDate,
                  maintenanceDetails: details,
                });
              }
            }
          });
        });

        // Sắp xếp danh sách tổng: Khách nào có lõi cần thay sớm nhất thì lên đầu
        tasks.sort((a, b) => {
          const minDayA = Math.min(
            ...a.maintenanceDetails.map((d) => d.daysRemaining)
          );
          const minDayB = Math.min(
            ...b.maintenanceDetails.map((d) => d.daysRemaining)
          );
          return minDayA - minDayB;
        });

        this.filteredList = tasks;
        this.maintenanceList = [...this.filteredList];
      },
      error: (err) => console.error(err),
    });
  }

  // --- Helpers ---
  formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  // --- Phân trang & Tìm kiếm ---
  get currentItems(): MaintenanceTask[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.maintenanceList.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.maintenanceList.length / this.itemsPerPage);
  }

  get pagesArray(): number[] {
    return Array(this.totalPages)
      .fill(0)
      .map((x, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
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
        item.productName?.toLowerCase().includes(term) ||
        item.sku?.toLowerCase().includes(term)
      );
    });
  }

  sendZalo(task: any) {
    if (!task.contactNumber) {
      alert("Khách hàng này không có số điện thoại!");
      return;
    }

    // Hiển thị hộp thoại xác nhận
    const confirmMsg = `Gửi thông tin bảo trì của khách [${task.customerName}] sang hệ thống xử lý?`;
    if (!confirm(confirmMsg)) return;

    // GỌI SERVICE MỚI
    // task chính là object chứa đầy đủ thông tin như JSON bạn yêu cầu
    this.zaloService.sendMaintenanceData(task).subscribe({
      next: (res) => {
        alert("Đã gửi dữ liệu thành công!");
      },
      error: (err) => {
        // console.error("❌ Lỗi gửi tin nhắn Zalo:", err);

        if (err.status === 200) {
          alert("Đã gửi dữ liệu thành công!");
        } else {
          alert("Gửi thất bại. Kiểm tra Console.");
        }
      },
    });
  }

  // Hàm lưu dữ liệu
  saveToNocoDB(task: any) {
    // Chuẩn bị dữ liệu (Key phải trùng với Tên Cột trong NocoDB)
    const record = {
      "makh": task.customerCode,
      "name": task.customerName,
      "sdt": task.contactNumber,
      "sp": task.productName,
      "sku": task.sku,
      "ngaymua": task.purchaseDate,
      "diachi": task.address,
      "khuvuc": task.locationName,
      // "loicanthay": task.maintenanceDetails[0].coreName,
      // "ngayhethan": task.maintenanceDetails[0].dueDateStr,
      "status": "true",
    };

    this.nocoService.createRecord(record).subscribe({
      next: (res) => {
        console.log("✅ Lưu NocoDB thành công:", res);
        alert("Đã lưu lịch sử vào hệ thống!");
      },
      error: (err) => {
        console.error("❌ Lỗi lưu NocoDB:", err);
        alert("Lỗi khi lưu dữ liệu.");
      },
    });
  }
}
