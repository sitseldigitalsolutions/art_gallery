import { useQuery } from '@tanstack/react-query';
import { Alert } from 'antd';
import {
  AppstoreOutlined,
  DashboardOutlined,
  DollarOutlined,
  FolderOpenOutlined,
  HighlightOutlined,
  PictureOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuth } from '@/features/auth/AuthContext';
import { sellerApi } from './api';

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  PENDING_REVIEW: 'gold',
  PENDING_APPROVAL: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  SUSPENDED: 'volcano',
  SOLD_OUT: 'purple',
  ARCHIVED: 'default',
  INACTIVE: 'default',
  REQUESTED: 'blue',
  ARTIST_REVIEWING: 'geekblue',
  ACCEPTED: 'cyan',
  IN_PROGRESS: 'processing',
  PREVIEW_READY: 'purple',
  REVISION_REQUESTED: 'orange',
  CUSTOMER_APPROVED: 'lime',
  FINALIZING: 'cyan',
  COMPLETED: 'green',
  CANCELLED: 'default',
  PENDING: 'gold',
  PAID: 'green',
  FAILED: 'red',
  AWAITING_CONFIRMATION: 'gold',
};

export default function SellerLayout() {
  const { user } = useAuth();
  const dash = useQuery({ queryKey: ['seller', 'dashboard'], queryFn: sellerApi.dashboard });
  const status = user?.artistStatus;
  const banner =
    status === 'PENDING_APPROVAL' ? (
      <Alert
        className="!mb-5"
        type="warning"
        showIcon
        title="Your artist account is awaiting approval"
        description="You can complete your profile and prepare artwork drafts now. Submitting artwork for review unlocks once an admin approves your account."
      />
    ) : status === 'REJECTED' ? (
      <Alert className="!mb-5" type="error" showIcon title="Your artist application was not approved" description="Please update your profile and contact support for details." />
    ) : status === 'SUSPENDED' ? (
      <Alert className="!mb-5" type="error" showIcon title="Your artist account is suspended" description="Your artworks are hidden from the gallery. Contact support to resolve this." />
    ) : null;

  return (
    <DashboardLayout
      title="Artist studio"
      banner={banner}
      items={[
        { key: '/seller', label: 'Overview', icon: <DashboardOutlined /> },
        { key: '/seller/artworks', label: 'Artworks', icon: <PictureOutlined /> },
        { key: '/seller/collections', label: 'Collections', icon: <FolderOpenOutlined /> },
        { key: '/seller/custom-art', label: 'Custom art', icon: <HighlightOutlined />, badge: dash.data?.pendingCustomRequests },
        { key: '/seller/orders', label: 'Orders', icon: <ShoppingOutlined /> },
        { key: '/seller/earnings', label: 'Earnings', icon: <DollarOutlined /> },
        { key: '/seller/profile', label: 'Profile & gallery', icon: <UserOutlined /> },
        { key: '/seller/preview', label: 'View public page', icon: <AppstoreOutlined /> },
      ]}
    />
  );
}
