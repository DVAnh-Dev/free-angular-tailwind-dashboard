import { CommonModule } from "@angular/common";
import { Component, ChangeDetectorRef, OnInit, OnDestroy } from "@angular/core";
import { SidebarService } from "../../services/sidebar.service";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { SafeHtmlPipe } from "../../pipe/safe-html.pipe";
import { SidebarWidgetComponent } from "./app-sidebar-widget.component";
import { combineLatest, Subscription, Observable } from "rxjs"; // Import thêm Observable
import { filter } from "rxjs/operators";

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule, SafeHtmlPipe, SidebarWidgetComponent],
  templateUrl: "./app-sidebar.component.html",
})
export class AppSidebarComponent implements OnInit, OnDestroy {
  
  // --- CONFIGURATION ---
  navItems: NavItem[] = [
    {
      name: "Tổng Quan",
      path: "/",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    },
    {
      name: "Khách hàng",
      path: "/customers",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    },
    {
      name: "Cấu hình lõi lọc",
      path: "/cau-hinh",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>`,
    },
    {
      name: "Cấu hình Zalo",
      path: "/cau-hinh-zalo",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>`,
    }
  ];

  othersItems: NavItem[] = [];

  // --- STATE ---
  openSubmenu: string | null = null;
  subMenuHeights: { [key: string]: number } = {};
  
  // 🔥 FIX LỖI: Chỉ khai báo kiểu dữ liệu ở đây
  isExpanded$: Observable<boolean>;
  isMobileOpen$: Observable<boolean>;
  isHovered$: Observable<boolean>;

  private subscription: Subscription = new Subscription();

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // 🔥 FIX LỖI: Gán giá trị bên trong constructor
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    this.subscription.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.setActiveMenuFromRoute(this.router.url);
      })
    );

    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$])
      .subscribe(([isExpanded, isMobileOpen, isHovered]) => {
        if (!isExpanded && !isMobileOpen && !isHovered) {
          this.openSubmenu = null;
          this.cdr.markForCheck();
        }
      })
    );

    this.setActiveMenuFromRoute(this.router.url);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // --- ACTIONS ---

  toggleSubmenu(section: string, index: number) {
    const key = `${section}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
    } else {
      this.openSubmenu = key;
      this.calculateSubMenuHeight(key);
      
      this.isExpanded$.subscribe(expanded => {
        if(!expanded) this.sidebarService.setExpanded(true);
      }).unsubscribe();
    }
  }

  onSubmenuClick() {
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) this.sidebarService.setMobileOpen(false);
    }).unsubscribe();
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe((expanded) => {
      if (!expanded) this.sidebarService.setHovered(true);
    }).unsubscribe();
  }

  // --- HELPERS ---

  private calculateSubMenuHeight(key: string) {
    setTimeout(() => {
      const el = document.getElementById(key);
      if (el) {
        this.subMenuHeights[key] = el.scrollHeight;
        this.cdr.detectChanges();
      }
    }, 0);
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    this.navItems.forEach((nav, i) => {
      if (nav.subItems) {
        const hasActiveChild = nav.subItems.some(sub => currentUrl.includes(sub.path));
        if (hasActiveChild) {
          const key = `main-${i}`;
          this.openSubmenu = key;
          this.calculateSubMenuHeight(key);
        }
      }
    });
  }
}