// 1. Giữ nguyên Interface để không báo lỗi ở các file khác
export interface ProductCore {
  id?: string;
  stt?: number;
  sku: string;
  brand: string;
  totalCores: number;
  lifetimes: number[];
}

/**
 * 2. Khởi tạo biến productCoreData.
 * Ban đầu có thể để mảng rỗng [] hoặc giữ dữ liệu mẫu để hiển thị trong lúc chờ API.
 * Ở đây tôi để mảng rỗng để ưu tiên hiển thị dữ liệu thật từ API.
 */
export const productCoreData: ProductCore[] = [];

/**
 * 3. Hàm gọi API tự động chạy ngay khi file này được import.
 * Sử dụng 'fetch' của Javascript thuần vì không thể dùng HttpClient trong file .ts thường.
 */
(async () => {
  const API_URL = "https://692da10fe5f67cd80a4c4f33.mockapi.io/sku";

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch data");

    const data = await response.json();

    // 4. Cập nhật dữ liệu vào biến productCoreData mà KHÔNG làm mất tham chiếu
    // (Các component khác đang trỏ vào biến này sẽ thấy dữ liệu thay đổi)

    // Xóa sạch dữ liệu cũ (nếu có)
    productCoreData.length = 0;

    // Đẩy dữ liệu mới từ API vào
    // MockAPI trả về dữ liệu có cấu trúc khớp với Interface nên ta push vào luôn
    // Lưu ý: Nếu data trả về cần xử lý, bạn có thể map lại tại đây
    data.forEach((item: any) => {
      productCoreData.push({
        id: item.id,
        stt: item.stt || 0,
        sku: item.sku,
        brand: item.brand,
        totalCores: item.totalCores,
        lifetimes: item.lifetimes || [],
      });
    });

    // console.log("✅ Dữ liệu productCoreData đã được cập nhật từ API:", productCoreData);
  } catch (error) {
    console.error("❌ Lỗi khi tải productCoreData:", error);

    // (Tùy chọn) Nếu lỗi API, có thể push dữ liệu mẫu vào đây để app không trắng trang
    // productCoreData.push(...BACKUP_DATA);
  }
})();
