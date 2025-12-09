import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  // Khóa bí mật (Đặt một chuỗi ngẫu nhiên khó đoán)
  private readonly SECRET_KEY = 'My_S3cr3t_K3y_@94745t23!'; 

  constructor() { }

  // Hàm mã hóa và lưu
  setItem(key: string, value: any): void {
    const jsonStr = JSON.stringify(value);
    const encrypted = CryptoJS.AES.encrypt(jsonStr, this.SECRET_KEY).toString();
    localStorage.setItem(key, encrypted);
  }

  // Hàm lấy và giải mã
  getItem(key: string): any {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, this.SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (e) {
      console.error('Lỗi giải mã dữ liệu', e);
      return null;
    }
  }

  // Xóa
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}