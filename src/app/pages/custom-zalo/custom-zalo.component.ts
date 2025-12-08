import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Cần Import để dùng ngModel
import { ZaloService, ZaloConfig } from '../../shared/services/zalo.service';

@Component({
  selector: 'app-custom-zalo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-zalo.component.html',
  styleUrl: './custom-zalo.component.css'
})
export class CustomZaloComponent implements OnInit {
  
  // Biến chứa dữ liệu form
  configData: ZaloConfig = {
    apiUrl: '',
    token: '',
    pid: '',
    pagePid: ''
  };

  isSaved: boolean = false;

  constructor(private zaloService: ZaloService) {}

  ngOnInit(): void {
    // Lấy cấu hình hiện tại khi vừa vào trang
    this.configData = this.zaloService.getConfig();
  }

  // Hàm xử lý khi bấm nút Lưu
  saveConfiguration() {
    this.zaloService.updateConfig(this.configData);
    
    // Hiển thị thông báo thành công
    this.isSaved = true;
    setTimeout(() => this.isSaved = false, 3000); // Tắt sau 3s
  }
}