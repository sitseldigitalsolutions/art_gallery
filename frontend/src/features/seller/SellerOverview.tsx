import { useQuery } from '@tanstack/react-query';
import { Card, Col, List, Row, Skeleton, Statistic, Tag, Result, Button } from 'antd';
import { Link, Navigate } from 'react-router-dom';
import { date, humanize, money } from '@/lib/format';
import { errorMessage } from '@/lib/api';
import { sellerApi } from './api';
import { STATUS_COLORS } from './SellerLayout';

export default function SellerOverview() {
  const q = useQuery({ queryKey: ['seller', 'dashboard'], queryFn: sellerApi.dashboard });
  if (q.isLoading) return <Skeleton active />;
  if (q.isError || !q.data) return <Result status="error" title="Could not load your dashboard" subTitle={errorMessage(q.error)} extra={<Button onClick={() => q.refetch()}>Retry</Button>} />;
  const d = q.data;
  return (
    <div className="space-y-5">
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Total sales" value={money(d.totalSales)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Available balance" value={money(d.earnings.available)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Orders" value={d.ordersCount} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Followers" value={d.followers} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Artworks">
            {[
              ['Approved', d.counts.approved, 'APPROVED'],
              ['Pending review', d.counts.pending, 'PENDING_REVIEW'],
              ['Drafts', d.counts.draft, 'DRAFT'],
              ['Rejected', d.counts.rejected, 'REJECTED'],
              ['Sold out', d.counts.soldOut, 'SOLD_OUT'],
              ['Suspended', d.counts.suspended ?? 0, 'SUSPENDED'],
            ].map(([label, n, s]) => (
              <Link key={String(s)} to={`/seller/artworks?status=${s}`} className="flex justify-between py-1.5 text-sm">
                <Tag color={STATUS_COLORS[String(s)]}>{label}</Tag>
                <span className="font-semibold">{n}</span>
              </Link>
            ))}
            <Link to="/seller/artworks/new">
              <Button type="primary" block className="!mt-3">
                Upload new artwork
              </Button>
            </Link>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Recent orders" extra={<Link to="/seller/orders">All</Link>}>
            <List
              dataSource={d.recentOrders}
              locale={{ emptyText: 'No orders yet' }}
              renderItem={(o) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={o.image ? <img src={o.image} alt="" className="h-10 w-10 rounded object-cover" /> : null}
                    title={o.title}
                    description={`${o.orderNumber} · ${date(o.createdAt)}`}
                  />
                  <div className="text-right">
                    <div className="font-semibold">{money(o.artistAmount)}</div>
                    <Tag color={STATUS_COLORS[o.fulfillmentStatus]}>{humanize(o.fulfillmentStatus)}</Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Custom art requests" extra={<Link to="/seller/custom-art">All</Link>}>
            <List
              dataSource={d.recentRequests}
              locale={{ emptyText: 'No requests yet' }}
              renderItem={(r) => (
                <List.Item>
                  <List.Item.Meta title={<Link to={`/seller/custom-art?open=${r.id}`}>{r.requestNumber}</Link>} description={[r.customerName, r.title, date(r.createdAt)].filter(Boolean).join(' · ')} />
                  <Tag color={STATUS_COLORS[r.status]}>{humanize(r.status)}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Gross earnings" value={money(d.earnings.gross)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Net (after commission)" value={money(d.earnings.net)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Pending" value={money(d.earnings.pending)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Open custom requests" value={d.pendingCustomRequests} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export function SellerPublicRedirect() {
  const q = useQuery({ queryKey: ['seller', 'me'], queryFn: sellerApi.me });
  if (q.data) return <Navigate to={`/artists/${q.data.slug}`} replace />;
  return <Skeleton active />;
}
