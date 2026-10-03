import { useQuery } from '@tanstack/react-query';
import {
  AuditOutlined,
  BankOutlined,
  CommentOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  FlagOutlined,
  HighlightOutlined,
  PercentageOutlined,
  PictureOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
  FileImageOutlined,
  SkinOutlined,
} from '@ant-design/icons';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminApi } from './api';

export default function AdminLayout() {
  const dash = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.dashboard, refetchInterval: 120_000 });
  const c = dash.data?.counts;
  return (
    <DashboardLayout
      title="Admin console"
      items={[
        { key: '/admin', label: 'Overview', icon: <DashboardOutlined /> },
        { key: '/admin/artists', label: 'Artists', icon: <TeamOutlined />, badge: c?.pendingArtists },
        { key: '/admin/artworks', label: 'Artworks', icon: <PictureOutlined />, badge: c?.pendingArtworks },
        { key: '/admin/custom-art', label: 'Custom art', icon: <HighlightOutlined /> },
        { key: '/admin/orders', label: 'Orders', icon: <ShoppingOutlined /> },
        { key: '/admin/payments', label: 'Payments', icon: <CreditCardOutlined /> },
        { key: '/admin/commissions', label: 'Commissions', icon: <PercentageOutlined /> },
        { key: '/admin/settlements', label: 'Settlements', icon: <BankOutlined /> },
        { key: '/admin/users', label: 'Users', icon: <UserOutlined /> },
        { key: '/admin/reviews', label: 'Reviews', icon: <CommentOutlined /> },
        { key: '/admin/reports', label: 'Reports', icon: <FlagOutlined />, badge: c?.openReports },
        { key: '/admin/taxonomy', label: 'Taxonomy', icon: <TagsOutlined /> },
        { key: '/admin/appearance', label: 'Appearance', icon: <SkinOutlined /> },
        { key: '/admin/banners', label: 'Banners', icon: <FileImageOutlined /> },
        { key: '/admin/settings', label: 'Settings', icon: <SettingOutlined /> },
        { key: '/admin/audit-logs', label: 'Audit logs', icon: <AuditOutlined /> },
      ]}
    />
  );
}
