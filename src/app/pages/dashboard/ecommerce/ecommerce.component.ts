import { Component } from '@angular/core';
import { TotalCustomerComponent } from '../../total-customer/total-customer.component';
import { ChartOrdersComponent } from '../../chart-orders/chart-orders.component';
import { ChamSocKhachHangComponent } from '../../cham-soc-khach-hang/cham-soc-khach-hang.component';
@Component({
  selector: 'app-ecommerce',
  imports: [
    TotalCustomerComponent,
    ChamSocKhachHangComponent
  ],
  templateUrl: './ecommerce.component.html',
})
export class EcommerceComponent {}
