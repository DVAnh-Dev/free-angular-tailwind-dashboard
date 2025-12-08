import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ProductCore, productCoreData } from "./product-core";

@Component({
  selector: "app-data-orders",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./data-orders.component.html",
  styleUrls: ["./data-orders.component.css"],
})
export class DataOrdersComponent implements OnInit {
  
  // Dữ liệu gốc (Source of Truth)
  private readonly allProducts: ProductCore[] = productCoreData;
  
  // Dữ liệu hiển thị (Đã lọc)
  public displayedProducts: ProductCore[] = [];

  // Phân trang & Tìm kiếm
  public currentPage = 1;
  public itemsPerPage = 7;
  public searchTerm: string = "";

  ngOnInit(): void {
    // Khởi tạo dữ liệu ban đầu
    this.displayedProducts = [...this.allProducts];
  }

  // --- Logic Tìm kiếm ---
  onSearch() {
    const term = this.searchTerm.trim().toLowerCase();
    this.currentPage = 1; // Reset về trang đầu khi tìm kiếm

    if (!term) {
      this.displayedProducts = [...this.allProducts];
      return;
    }

    this.displayedProducts = this.allProducts.filter((item) => {
      return (
        item.sku.toLowerCase().includes(term) ||
        item.brand.toLowerCase().includes(term)
      );
    });
  }

  // --- Logic Phân trang ---
  
  get currentItems(): ProductCore[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.displayedProducts.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.displayedProducts.length / this.itemsPerPage);
  }

  get pagesArray(): number[] {
    // Chỉ hiển thị tối đa 5 trang để UI không bị vỡ nếu quá nhiều trang
    const maxVisiblePages = 5;
    const total = this.totalPages;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(total, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}