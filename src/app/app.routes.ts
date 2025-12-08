import { Routes } from "@angular/router";
import { EcommerceComponent } from "./pages/dashboard/ecommerce/ecommerce.component";
import { ProfileComponent } from "./pages/profile/profile.component";
import { FormElementsComponent } from "./pages/forms/form-elements/form-elements.component";
import { BasicTablesComponent } from "./pages/tables/basic-tables/basic-tables.component";
import { BlankComponent } from "./pages/blank/blank.component";
import { NotFoundComponent } from "./pages/other-page/not-found/not-found.component";
import { AppLayoutComponent } from "./shared/layout/app-layout/app-layout.component";
import { InvoicesComponent } from "./pages/invoices/invoices.component";
import { LineChartComponent } from "./pages/charts/line-chart/line-chart.component";
import { BarChartComponent } from "./pages/charts/bar-chart/bar-chart.component";
import { AlertsComponent } from "./pages/ui-elements/alerts/alerts.component";
import { AvatarElementComponent } from "./pages/ui-elements/avatar-element/avatar-element.component";
import { BadgesComponent } from "./pages/ui-elements/badges/badges.component";
import { ButtonsComponent } from "./pages/ui-elements/buttons/buttons.component";
import { ImagesComponent } from "./pages/ui-elements/images/images.component";
import { VideosComponent } from "./pages/ui-elements/videos/videos.component";
import { SignInComponent } from "./pages/auth-pages/sign-in/sign-in.component";
import { SignUpComponent } from "./pages/auth-pages/sign-up/sign-up.component";
import { CalenderComponent } from "./pages/calender/calender.component";
import { CustomersComponent } from "./shared/components/custom/customers/customers.component";
import { DataOrdersComponent } from "./shared/components/custom/data-orders/data-orders.component";
import { CustomZaloComponent } from "./pages/custom-zalo/custom-zalo.component";

export const routes: Routes = [
  {
    path: "",
    component: AppLayoutComponent,
    children: [
      {
        path: "",
        component: EcommerceComponent,
        pathMatch: "full",
        title: "Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "calendar",
        component: CalenderComponent,
        title: "Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "customers",
        component: CustomersComponent,
        title: "Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "cau-hinh",
        component: DataOrdersComponent,
        title: "Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "cau-hinh-zalo",
        component: CustomZaloComponent,
        title: "Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "profile",
        component: ProfileComponent,
        title:
          "Angular Profile Dashboard | Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "form-elements",
        component: FormElementsComponent,
        title:
          "Angular Form Elements Dashboard | Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "basic-tables",
        component: BasicTablesComponent,
        title:
          "Angular Basic Tables Dashboard | Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "blank",
        component: BlankComponent,
        title:
          "Angular Blank Dashboard | Hệ thống CSKH máy lọc nước thông minh",
      },
      // support tickets
      {
        path: "invoice",
        component: InvoicesComponent,
        title:
          "Angular Invoice Details Dashboard | Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "line-chart",
        component: LineChartComponent,
        title:
          "Angular Line Chart Dashboard | Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "bar-chart",
        component: BarChartComponent,
        title:
          "Angular Bar Chart Dashboard | Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "alerts",
        component: AlertsComponent,
        title:
          "Angular Alerts Dashboard | Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "avatars",
        component: AvatarElementComponent,
        title:
          "Angular Avatars Dashboard | Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "badge",
        component: BadgesComponent,
        title:
          "Angular Badges Dashboard | Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "buttons",
        component: ButtonsComponent,
        title:
          "Angular Buttons Dashboard | Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "images",
        component: ImagesComponent,
        title:
          "Angular Images Dashboard | Hệ thống CSKH máy lọc nước thông minh",
      },
      {
        path: "videos",
        component: VideosComponent,
        title:
          "Angular Videos Dashboard | Hệ thống CSKH máy lọc nước thông minh",
      },
    ],
  },
  // auth pages
  {
    path: "signin",
    component: SignInComponent,
    title: "Angular Sign In Dashboard | Hệ thống CSKH máy lọc nước thông minh",
  },
  {
    path: "signup",
    component: SignUpComponent,
    title: "Angular Sign Up Dashboard | Hệ thống CSKH máy lọc nước thông minh",
  },
  // error pages
  {
    path: "**",
    component: NotFoundComponent,
    title: "Angular NotFound Dashboard | Hệ thống CSKH máy lọc nước thông minh",
  },
];
