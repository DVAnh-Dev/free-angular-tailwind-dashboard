import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { finalize } from "rxjs/operators";
import { ProductCores, ProductService } from "../../../services/product.service";

@Component({
  selector: "app-data-orders",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./data-orders.component.html",
  styleUrls: ["./data-orders.component.css"],
})
export class DataOrdersComponent implements OnInit {
  
  // Dữ liệu
  public products: ProductCores[] = [];
  public displayedProducts: ProductCores[] = [];
  public isLoading = false;

  // Phân trang & Tìm kiếm
  public currentPage = 1;
  public itemsPerPage = 7;
  public searchTerm: string = "";

  // Modal State
  public isModalOpen = false;
  public isEditMode = false;
  
  // Form Model (Dữ liệu đang nhập)
  public currentProduct: ProductCores = this.resetForm();

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadData();
  }

  // --- API ACTIONS ---

  loadData() {
    this.isLoading = true;
    this.productService.getProducts()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          // MockAPI trả về lifetimes đôi khi là string, cần parse nếu cần
          this.products = data.sort((a, b) => (Number(b.id) - Number(a.id))); // Mới nhất lên đầu
          this.onSearch(); // Refresh list
        },
        error: (err) => console.error("Lỗi tải dữ liệu:", err)
      });
  }

  saveProduct() {
    // Validate cơ bản
    if (!this.currentProduct.sku || !this.currentProduct.brand) {
      alert("Vui lòng nhập SKU và Thương hiệu!");
      return;
    }

    this.isLoading = true;
    
    // Tính tổng số lõi dựa trên mảng lifetimes
    this.currentProduct.totalCores = this.currentProduct.lifetimes.filter(x => x > 0).length;

    if (this.isEditMode && this.currentProduct.id) {
      // Cập nhật
      this.productService.updateProduct(this.currentProduct).subscribe({
        next: () => {
          alert("✅ Cập nhật thành công!");
          this.closeModal();
          this.loadData();
        },
        error: () => alert("❌ Lỗi khi cập nhật!")
      });
    } else {
      // Thêm mới
      this.productService.addProduct(this.currentProduct).subscribe({
        next: () => {
          alert("✅ Thêm mới thành công!");
          this.closeModal();
          this.loadData();
        },
        error: () => alert("❌ Lỗi khi thêm mới!")
      });
    }
  }

  deleteProduct(item: ProductCores) {
    if (confirm(`Bạn có chắc chắn muốn xóa mã máy [${item.sku}] không?`)) {
      this.isLoading = true;
      this.productService.deleteProduct(item.id!).subscribe({
        next: () => {
          alert("✅ Đã xóa thành công!");
          this.loadData();
        },
        error: () => {
          this.isLoading = false;
          alert("❌ Lỗi khi xóa!");
        }
      });
    }
  }

  // --- MODAL ACTIONS ---

  openAddModal() {
    this.isEditMode = false;
    this.currentProduct = this.resetForm();
    this.isModalOpen = true;
  }

  openEditModal(item: ProductCores) {
    this.isEditMode = true;
    // Clone object để không sửa trực tiếp vào bảng khi chưa lưu
    // Cần đảm bảo lifetimes luôn đủ 5 phần tử để map vào input
    const lifetimes = [...item.lifetimes];
    while (lifetimes.length < 5) lifetimes.push(0);

    this.currentProduct = { ...item, lifetimes };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  resetForm(): ProductCores {
    return {
      sku: "",
      brand: "",
      totalCores: 0,
      lifetimes: [0, 0, 0, 0, 0] // Mặc định 5 lõi trống
    };
  }

  // --- SEARCH & PAGINATION (Giữ nguyên logic cũ) ---
  
  onSearch() {
    const term = this.searchTerm.trim().toLowerCase();
    this.currentPage = 1;

    if (!term) {
      this.displayedProducts = [...this.products];
      return;
    }

    this.displayedProducts = this.products.filter((item) => {
      return (
        item.sku.toLowerCase().includes(term) ||
        item.brand.toLowerCase().includes(term)
      );
    });
  }

  get currentItems(): ProductCores[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.displayedProducts.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.displayedProducts.length / this.itemsPerPage);
  }

  get pagesArray(): number[] {
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
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }
}