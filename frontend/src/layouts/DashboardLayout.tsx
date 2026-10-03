import { App as AntApp, ConfigProvider, Layout, Menu, Badge, Button, Drawer, Grid, theme as antTheme, type MenuProps } from 'antd';
import { MenuOutlined, LogoutOutlined, HomeOutlined } from '@ant-design/icons';
import { useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Logo } from './Navbar';
import { useSiteConfig } from '@/features/site/SiteConfigContext';
import { RADIUS_SCALE, tint, type SiteConfig } from '@/lib/siteConfig';

/** Ant Design theme derived from the admin-configured site theme. */
export function buildAntdTheme(t: SiteConfig['theme']) {
  return {
    token: {
      colorPrimary: t.primary,
      colorLink: t.primary,
      borderRadius: RADIUS_SCALE[t.radius]?.antd ?? 10,
      fontFamily: "'Montserrat', ui-sans-serif, system-ui, sans-serif",
    },
    components: {
      Layout: { siderBg: t.ink, headerBg: '#ffffff', bodyBg: '#f7f6fb' },
      Menu: { darkItemBg: t.ink, darkSubMenuItemBg: tint(t.ink, 0.04), darkItemSelectedBg: t.primary },
    },
    algorithm: antTheme.defaultAlgorithm,
  };
}

export function AntdProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={buildAntdTheme(useSiteConfig().config.theme)}>
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}

export interface DashItem {
  key: string; // route path
  label: string;
  icon: ReactNode;
  badge?: number;
}

export function DashboardLayout({ title, items, banner }: { title: string; items: DashItem[]; banner?: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const screens = Grid.useBreakpoint();
  const [open, setOpen] = useState(false);
  const selected = [...items].sort((a, b) => b.key.length - a.key.length).find((i) => location.pathname === i.key || location.pathname.startsWith(i.key + '/'))?.key;

  const menuItems: MenuProps['items'] = items.map((i) => ({
    key: i.key,
    icon: i.icon,
    label: i.badge ? (
      <span className="flex items-center justify-between">
        {i.label} <Badge count={i.badge} size="small" />
      </span>
    ) : (
      i.label
    ),
  }));

  const menu = (
    <>
      <div className="px-6 py-6">
        <Logo />
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">{title}</p>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selected ? [selected] : []}
        items={menuItems}
        onClick={({ key }) => {
          navigate(key);
          setOpen(false);
        }}
      />
    </>
  );

  return (
    <AntdProvider>
      <Layout style={{ minHeight: '100vh' }}>
        {screens.lg ? (
          <Layout.Sider width={250} style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}>
            {menu}
          </Layout.Sider>
        ) : (
          <Drawer placement="left" open={open} onClose={() => setOpen(false)} size={260} styles={{ body: { padding: 0, background: '#0b0a12' } }} closable={false}>
            {menu}
          </Drawer>
        )}
        <Layout>
          <Layout.Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 20, borderBottom: '1px solid #eee' }}>
            <div className="flex items-center gap-3">
              {!screens.lg && <Button icon={<MenuOutlined />} onClick={() => setOpen(true)} aria-label="Open navigation" />}
              <span className="font-semibold text-ink">{items.find((i) => i.key === selected)?.label ?? title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button icon={<HomeOutlined />}>View site</Button>
              </Link>
              <span className="hidden text-sm text-gray-500 md:inline">{user?.fullName}</span>
              <Button
                icon={<LogoutOutlined />}
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                aria-label="Sign out"
              />
            </div>
          </Layout.Header>
          <Layout.Content style={{ padding: screens.md ? 24 : 12 }}>
            {banner}
            <Outlet />
          </Layout.Content>
        </Layout>
      </Layout>
    </AntdProvider>
  );
}
