import { useQuery } from '@tanstack/react-query';
import { App, Button, Card, Col, DatePicker, Empty, List, Row, Select, Skeleton, Space, Statistic, Table } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { catalogApi } from '@/features/artworks/api';
import { errorMessage } from '@/lib/api';
import { humanize, money } from '@/lib/format';
import { adminApi } from './api';
import { s } from './helpers';

const PALETTE = ['#8b2bd9', '#ff4fa3', '#18c3c9', '#ff8a3d', '#ffd23f', '#2fa35b', '#2f6fe0', '#8a5a3b'];

export default function AdminOverview() {
  const { message } = App.useApp();
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(30, 'day'), dayjs()]);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [artistId, setArtistId] = useState<string | undefined>();
  const params = { from: range[0].format('YYYY-MM-DD'), to: range[1].format('YYYY-MM-DD'), categoryId, artistId };
  const dash = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.dashboard });
  const overview = useQuery({ queryKey: ['admin', 'overview', params], queryFn: () => adminApi.overview(params) });
  const categories = useQuery({ queryKey: ['taxonomy', 'categories'], queryFn: () => catalogApi.taxonomy('categories') });
  const artists = useQuery({ queryKey: ['admin', 'artists', 'approved-list'], queryFn: () => adminApi.artists({ status: 'APPROVED', pageSize: 100 }) });
  const o = overview.data;
  const t = o?.totals ?? {};

  const exportCsv = async (type: string) => {
    try {
      await adminApi.exportCsv(type, params);
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  const tiles: [string, string | number][] = [
    ['Gross sales', money(t.grossSales)],
    ['Platform commission', money(t.platformCommission)],
    ['Artist payouts', money(t.artistPayouts)],
    ['Orders', t.orders ?? 0],
    ['Artists', t.artists ?? 0],
    ['Customers', t.customers ?? 0],
    ['Published artworks', `${t.publishedArtworks ?? 0} / ${t.artworks ?? 0}`],
    ['Pending artworks', t.pendingArtworks ?? 0],
    ['Custom art requests', t.customRequests ?? 0],
    ['Completed custom art', t.completedCustomArt ?? 0],
  ];

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small">
        <Space wrap>
          <DatePicker.RangePicker value={range} onChange={(v) => v?.[0] && v[1] && setRange([v[0], v[1]])} allowClear={false} />
          <Select allowClear placeholder="All categories" style={{ width: 180 }} value={categoryId} onChange={setCategoryId} options={categories.data?.map((c) => ({ value: c.id, label: c.name }))} />
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="All artists"
            style={{ width: 200 }}
            value={artistId}
            onChange={setArtistId}
            options={artists.data?.data.map((a) => ({ value: a.id, label: s(a, 'displayName') }))}
          />
          {['sales', 'orders', 'artists', 'custom-art'].map((type) => (
            <Button key={type} icon={<DownloadOutlined />} onClick={() => exportCsv(type)}>
              {humanize(type.replace('-', '_'))} CSV
            </Button>
          ))}
        </Space>
      </Card>

      {overview.isLoading ? (
        <Skeleton active />
      ) : overview.isError ? (
        <Empty description={errorMessage(overview.error)} />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {tiles.map(([title, value]) => (
              <Col key={title} xs={12} md={8} xl={6}>
                <Card size="small">
                  <Statistic title={title} value={value} />
                </Card>
              </Col>
            ))}
          </Row>
          <Card title="Sales over time">
            <div style={{ height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={o?.salesByDay ?? []}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b2bd9" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8b2bd9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(v, n) => (n === 'orders' ? v : money(Number(v)))} />
                  <Area type="monotone" dataKey="gross" name="Gross" stroke="#8b2bd9" fill="url(#g1)" />
                  <Area type="monotone" dataKey="commission" name="Commission" stroke="#ff4fa3" fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Row gutter={[16, 16]}>
            {(
              [
                ['Popular styles', o?.topStyles],
                ['Popular categories', o?.topCategories],
                ['Most requested custom styles', o?.topCustomStyles],
              ] as const
            ).map(([title, data]) => (
              <Col key={title} xs={24} lg={8}>
                <Card title={title}>
                  {!data?.length ? (
                    <Empty />
                  ) : (
                    <div style={{ height: 240 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={data} dataKey="count" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                            {data.map((_, i) => (
                              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Top artists">
                <div style={{ height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={o?.topArtists ?? []} layout="vertical">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="displayName" width={120} />
                      <Tooltip formatter={(v) => money(Number(v))} />
                      <Bar dataKey="gross" fill="#8b2bd9" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Trending artwork">
                <Table
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={o?.trendingArtworks ?? []}
                  columns={[
                    { title: 'Artwork', render: (_, a) => <Link to={`/artworks/${a.slug}`}>{a.title}</Link> },
                    { title: 'Views', dataIndex: 'views' },
                    { title: 'Sales', dataIndex: 'sales' },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Artists awaiting approval" extra={<Link to="/admin/artists?status=PENDING_APPROVAL">Review</Link>}>
            <List dataSource={dash.data?.pendingArtists ?? []} locale={{ emptyText: 'All caught up' }} renderItem={(a) => <List.Item>{s(a, 'displayName', 'name')}</List.Item>} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Artworks awaiting review" extra={<Link to="/admin/artworks?status=PENDING_REVIEW">Review</Link>}>
            <List dataSource={dash.data?.pendingArtworks ?? []} locale={{ emptyText: 'All caught up' }} renderItem={(a) => <List.Item>{s(a, 'title')}</List.Item>} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
