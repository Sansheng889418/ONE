import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  CheckSquare,
  Users,
  Settings,
  ListTodo,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { logger } from "@lark-apaas/client-toolkit/logger";
import { axiosForBackend } from "@lark-apaas/client-toolkit/utils/getAxiosForBackend";
import { useAuth } from "@client/src/hooks/useAuth";

const navItems = [
  { path: "/", label: "待办", icon: ListTodo, end: true },
  { path: "/completed", label: "已完成", icon: CheckSquare },
  { path: "/users", label: "人员", icon: Users },
  { path: "/settings", label: "设置", icon: Settings },
];

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [siteTitle, setSiteTitle] = useState("团队协作看板");
  const [siteSubtitle, setSiteSubtitle] = useState("高效管理每一件事");
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const loadSiteConfig = async () => {
      try {
        const res = await axiosForBackend.get("/api/site-config");
        const data = res.data;
        if (data?.siteTitle) setSiteTitle(data.siteTitle);
        if (data?.siteSubtitle) setSiteSubtitle(data.siteSubtitle);
      } catch (err) {
        logger.warn("加载站点配置失败", String(err));
      }
    };
    loadSiteConfig();
  }, []);

  const isLoginPage = location.pathname === "/login";

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate("/login");
  };

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="max-w-[960px] mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">
              {siteTitle}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {siteSubtitle}
            </p>
          </div>
          {isAuthenticated && (
            <div className="relative ml-3">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-accent transition-colors"
                aria-label="用户菜单"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserIcon className="w-4 h-4" />
                </div>
              </button>
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.role === "admin" ? "管理员" : "普通用户"}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-6">
        <div className="max-w-[960px] mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border md:hidden">
        <div className="flex items-center justify-around safe-bottom">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-3 flex-1 min-w-0 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-5 h-5 mb-1" strokeWidth={1.8} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <nav className="hidden md:block fixed top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-[960px] mx-auto px-4 pointer-events-auto">
          <div className="flex justify-end gap-1 pt-3">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`
                }
              >
                <item.icon className="w-4 h-4" strokeWidth={1.8} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
