import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Upload,
} from 'antd';
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { customArtApi } from '@/features/custom-art/api';
import { catalogApi } from '@/features/artworks/api';
import { errorMessage } from '@/lib/api';
import { date, dateTime, humanize, money, plural } from '@/lib/format';
import type { CustomArtSummary } from '@/lib/types';
import { sellerApi, type SellerCollection, type SellerOrder } from './api';
import { CustomArtDrawer } from './CustomArtDrawer';
import { STATUS_COLORS } from './SellerLayout';

/* ───────── Custom art board ───────── */
const CA_TABS = [
  { key: '', label: 'All' },
  { key: 'REQUESTED', label: 'New' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'PREVIEW_READY', label: 'Preview pending' },
  { key: 'REVISION_REQUESTED', label: 'Revisions' },
  { key: 'CUSTOMER_APPROVED', label: 'Approved' },
  { key: 'COMPLETED', label: 'Completed' },
];

export function CustomArtTable({ as }: { as: 'artist' | 'admin' }) {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['custom-art', as, status, page], queryFn: () => customArtApi.list({ as, status: status || undefined, page }) });
  const open = params.get('open');
  return (
    <Card title="Custom art requests">
      <Tabs
        activeKey={status}
        onChange={(k) => {
          setStatus(k);
          setPage(1);
        }}
        items={CA_TABS.map((t) => ({ key: t.key, label: t.label }))}
      />
      <Table<CustomArtSummary>
        rowKey="id"
        loading={q.isLoading}
        dataSource={q.data?.data}
        scroll={{ x: 900 }}
        pagination={{ current: page, total: q.data?.meta.total, pageSize: q.data?.meta.pageSize ?? 20, onChange: setPage }}
        onRow={(r) => ({ onClick: () => setParams({ open: r.id }), style: { cursor: 'pointer' } })}
        columns={[
          {
            title: 'Request',
            render: (_, r) => (
              <Space>
                {r.sourceThumbUrl && <Image src={r.sourceThumbUrl} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 6 }} preview={false} />}
                <div>
                  <div className="font-semibold">{r.requestNumber}</div>
                  <div className="text-xs text-gray-400">{r.title ?? r.style?.name}</div>
                </div>
              </Space>
            ),
          },
          as === 'admin' ? { title: 'Artist', render: (_, r) => r.artist.displayName } : { title: 'Style', render: (_, r) => r.style?.name ?? '—' },
          { title: 'Customer', render: (_, r) => r.customer.fullName },
          { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{humanize(s)}</Tag> },
          { title: 'Budget / Quote', render: (_, r) => `${r.budget ? money(r.budget) : '—'} / ${r.quotedPrice ? money(r.quotedPrice) : '—'}` },
          { title: 'Payment', dataIndex: 'paymentStatus', render: (s: string | null) => (s ? <Tag color={STATUS_COLORS[s]}>{humanize(s)}</Tag> : '—') },
          { title: 'Updated', dataIndex: 'updatedAt', render: (v: string) => dateTime(v) },
        ]}
      />
      <CustomArtDrawer id={open} onClose={() => setParams({})} />
    </Card>
  );
}

export function SellerCustomArt() {
  return <CustomArtTable as="artist" />;
}

/* ───────── Orders ───────── */
export function SellerOrders() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [editing, setEditing] = useState<SellerOrder | null>(null);
  const [form] = Form.useForm();
  const q = useQuery({ queryKey: ['seller', 'orders', page, status], queryFn: () => sellerApi.orders({ page, status }) });
  const shipment = useMutation({
    mutationFn: (v: Record<string, unknown>) => sellerApi.updateShipment(editing!.orderId, v),
    onSuccess: () => {
      message.success('Shipment updated');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['seller', 'orders'] });
    },
    onError: (e) => message.error(errorMessage(e)),
  });
  const fulfil = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => sellerApi.updateFulfillment(id, s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller', 'orders'] }),
    onError: (e) => message.error(errorMessage(e)),
  });

  return (
    <Card
      title="Orders"
      extra={
        <Select
          allowClear
          placeholder="All statuses"
          style={{ width: 180 }}
          value={status}
          onChange={setStatus}
          options={['PENDING', 'CONFIRMED', 'PROCESSING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'COMPLETED', 'CANCELLED'].map((s) => ({ value: s, label: humanize(s) }))}
        />
      }
    >
      <Table<SellerOrder>
        rowKey="orderId"
        loading={q.isLoading}
        dataSource={q.data?.data}
        scroll={{ x: 900 }}
        pagination={{ current: page, total: q.data?.meta.total, onChange: setPage }}
        expandable={{
          expandedRowRender: (o) => (
            <div className="space-y-3">
              {o.items.map((i) => (
                <div key={i.id} className="flex flex-wrap items-center gap-3">
                  {i.imageSnapshot && <img src={i.imageSnapshot} alt="" className="h-12 w-12 rounded object-cover" />}
                  <span className="flex-1 font-medium">
                    {i.titleSnapshot} × {i.quantity} <span className="text-xs text-gray-400">({humanize(i.format)})</span>
                  </span>
                  <span>You earn {money(i.artistAmount)}</span>
                  <Select
                    size="small"
                    style={{ width: 170 }}
                    value={i.fulfillmentStatus}
                    onChange={(s) => fulfil.mutate({ id: i.id, s })}
                    options={(i.fulfillmentType === 'DIGITAL' ? ['PENDING', 'DIGITAL_AVAILABLE'] : ['PENDING', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED']).map((s) => ({ value: s, label: humanize(s) }))}
                  />
                </div>
              ))}
              {o.shippingAddress && (
                <p className="text-xs text-gray-500">
                  Ship to: {Object.values(o.shippingAddress).filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          ),
        }}
        columns={[
          { title: 'Order', render: (_, o) => <b>{o.orderNumber}</b> },
          { title: 'Placed', dataIndex: 'placedAt', render: (v: string) => date(v) },
          { title: 'Customer', render: (_, o) => o.customer.fullName },
          { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{humanize(s)}</Tag> },
          { title: 'Payment', render: (_, o) => <Tag color={STATUS_COLORS[o.paymentStatus]}>{`${humanize(o.paymentMethod)} · ${humanize(o.paymentStatus)}`}</Tag> },
          { title: 'Your earnings', render: (_, o) => money(o.items.reduce((s, i) => s + i.artistAmount, 0)) },
          { title: 'Shipment', render: (_, o) => (o.shipment ? `${humanize(o.shipment.status)}${o.shipment.trackingNumber ? ` · ${o.shipment.trackingNumber}` : ''}` : '—') },
          {
            title: '',
            render: (_, o) =>
              o.items.some((i) => i.fulfillmentType === 'PHYSICAL') && (
                <Button
                  size="small"
                  onClick={() => {
                    setEditing(o);
                    form.setFieldsValue(o.shipment ?? { status: 'PACKED' });
                  }}
                >
                  Update shipment
                </Button>
              ),
          },
        ]}
      />
      <Modal open={!!editing} title={`Shipment · ${editing?.orderNumber}`} onCancel={() => setEditing(null)} onOk={() => form.submit()} confirmLoading={shipment.isPending}>
        <Form form={form} layout="vertical" onFinish={(v) => shipment.mutate(v)}>
          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select options={['PENDING', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'].map((s) => ({ value: s, label: humanize(s) }))} />
          </Form.Item>
          <Form.Item label="Carrier" name="carrier">
            <Input placeholder="e.g. Blue Dart, India Post" />
          </Form.Item>
          <Form.Item label="Shipping method" name="method">
            <Input placeholder="e.g. Express" />
          </Form.Item>
          <Form.Item label="Tracking number" name="trackingNumber">
            <Input />
          </Form.Item>
          <Form.Item label="Packaging" name="packagingInfo">
            <Input.TextArea rows={2} placeholder="e.g. Rolled in tube, framed in crate" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

/* ───────── Earnings ───────── */
export function SellerEarnings() {
  const q = useQuery({ queryKey: ['seller', 'earnings'], queryFn: sellerApi.earnings });
  if (q.isLoading) return <Skeleton active />;
  if (!q.data) return <Empty description={errorMessage(q.error)} />;
  const { totals, monthly, ledger, settlements } = q.data;
  const stats: [string, number][] = [
    ['Gross sales', totals.grossSales],
    ['Commission', totals.commission],
    ['Net earnings', totals.net],
    ['Custom art (net)', totals.customArtNet],
    ['Pending', totals.pending],
    ['Available', totals.available],
    ['Settled', totals.settled],
  ];
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        {stats.map(([t, v]) => (
          <Col key={t} xs={12} md={6} xl={3}>
            <Card size="small">
              <Statistic title={t} value={money(v)} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="Monthly revenue">
        {monthly.length === 0 ? (
          <Empty description="No sales yet" />
        ) : (
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => money(Number(v))} />
                <Legend />
                <Bar dataKey="gross" name="Gross" fill="#d8b4fe" radius={[6, 6, 0, 0]} />
                <Bar dataKey="net" name="Net" fill="#8b2bd9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Ledger">
            <Table
              rowKey="id"
              size="small"
              dataSource={ledger}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: 'Date', dataIndex: 'createdAt', render: (v: string) => date(v) },
                { title: 'Type', dataIndex: 'type', render: (v: string) => humanize(v) },
                { title: 'Description', dataIndex: 'description' },
                { title: 'Amount', dataIndex: 'amount', render: (v: number) => <span className={v < 0 ? 'text-red-600' : 'text-emerald-600'}>{money(v)}</span> },
                { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag>{humanize(s)}</Tag> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Settlements">
            <List
              dataSource={settlements}
              locale={{ emptyText: 'No settlements yet' }}
              renderItem={(s) => (
                <List.Item>
                  <List.Item.Meta title={money(s.amount)} description={`${date(s.createdAt)}${s.reference ? ` · Ref ${s.reference}` : ''}`} />
                  <Tag color={s.status === 'COMPLETED' ? 'green' : 'gold'}>{humanize(s.status)}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

/* ───────── Collections ───────── */
export function SellerCollections() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['seller', 'collections'], queryFn: sellerApi.collections });
  const artworks = useQuery({ queryKey: ['seller', 'artworks', 'all'], queryFn: () => sellerApi.artworks({ pageSize: 60 }) });
  const [editing, setEditing] = useState<SellerCollection | 'new' | null>(null);
  const [form] = Form.useForm();
  const refresh = () => qc.invalidateQueries({ queryKey: ['seller', 'collections'] });
  const save = useMutation({
    mutationFn: (v: { name: string; description?: string; isPublished: boolean; artworkIds?: string[] }) =>
      editing === 'new' ? sellerApi.createCollection(v) : sellerApi.updateCollection((editing as SellerCollection).id, { name: v.name, description: v.description, isPublished: v.isPublished }),
    onSuccess: () => {
      message.success('Collection saved');
      setEditing(null);
      refresh();
    },
    onError: (e) => message.error(errorMessage(e)),
  });
  const remove = useMutation({ mutationFn: sellerApi.deleteCollection, onSuccess: refresh, onError: (e) => message.error(errorMessage(e)) });
  const addItem = useMutation({ mutationFn: ({ id, artworkId }: { id: string; artworkId: string }) => sellerApi.addToCollection(id, artworkId), onSuccess: refresh, onError: (e) => message.error(errorMessage(e)) });
  const removeItem = useMutation({ mutationFn: ({ id, artworkId }: { id: string; artworkId: string }) => sellerApi.removeFromCollection(id, artworkId), onSuccess: refresh });
  const cover = useMutation({ mutationFn: ({ id, file }: { id: string; file: File }) => sellerApi.collectionCover(id, file), onSuccess: refresh, onError: (e) => message.error(errorMessage(e)) });

  return (
    <Card
      title="Collections"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setEditing('new');
          }}
        >
          New collection
        </Button>
      }
    >
      {q.isLoading && <Skeleton active />}
      {q.data?.length === 0 && <Empty description="Group your artworks into series — e.g. Monsoon Series, Portraits of Banaras." />}
      <Row gutter={[16, 16]}>
        {q.data?.map((c) => (
          <Col key={c.id} xs={24} md={12} xl={8}>
            <Card
              cover={c.coverImageUrl || c.previewImages[0] ? <img src={c.coverImageUrl ?? c.previewImages[0]} alt="" style={{ height: 160, objectFit: 'cover' }} /> : undefined}
              actions={[
                <Upload key="cover" accept="image/*" showUploadList={false} beforeUpload={(file) => (cover.mutate({ id: c.id, file }), false)}>
                  <UploadOutlined /> Cover
                </Upload>,
                <span
                  key="edit"
                  onClick={() => {
                    form.setFieldsValue(c);
                    setEditing(c);
                  }}
                >
                  Edit
                </span>,
                <Popconfirm key="del" title="Delete collection?" onConfirm={() => remove.mutate(c.id)}>
                  <DeleteOutlined />
                </Popconfirm>,
              ]}
            >
              <Card.Meta title={<Space>{c.name}{!c.isPublished && <Tag>Hidden</Tag>}</Space>} description={plural(c.artworkCount, 'artwork')} />
              <div className="mt-3 flex flex-wrap gap-1">
                {c.items.map((i) => (
                  <Tag key={i.artworkId} closable onClose={() => removeItem.mutate({ id: c.id, artworkId: i.artworkId })}>
                    {i.title}
                  </Tag>
                ))}
              </div>
              <Select
                className="!mt-3"
                size="small"
                placeholder="Add artwork…"
                style={{ width: '100%' }}
                value={null}
                showSearch={{ optionFilterProp: 'label' }}
                onChange={(artworkId: string) => addItem.mutate({ id: c.id, artworkId })}
                options={(artworks.data?.data ?? []).filter((a) => !c.items.some((i) => i.artworkId === a.id)).map((a) => ({ value: a.id, label: a.title }))}
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Modal open={!!editing} title={editing === 'new' ? 'New collection' : 'Edit collection'} onCancel={() => setEditing(null)} onOk={() => form.submit()} confirmLoading={save.isPending}>
        <Form form={form} layout="vertical" initialValues={{ isPublished: true }} onFinish={(v) => save.mutate(v)}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name your collection' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          {editing === 'new' && (
            <Form.Item label="Artworks" name="artworkIds">
              <Select mode="multiple" options={(artworks.data?.data ?? []).map((a) => ({ value: a.id, label: a.title }))} />
            </Form.Item>
          )}
          <Form.Item label="Published" name="isPublished" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

/* ───────── Profile & gallery ───────── */
export function SellerProfile() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['seller', 'me'], queryFn: sellerApi.me });
  const styles = useQuery({ queryKey: ['taxonomy', 'styles'], queryFn: () => catalogApi.taxonomy('styles') });
  const mediums = useQuery({ queryKey: ['taxonomy', 'mediums'], queryFn: () => catalogApi.taxonomy('mediums') });
  const refresh = () => qc.invalidateQueries({ queryKey: ['seller', 'me'] });
  const save = useMutation({ mutationFn: sellerApi.updateMe, onSuccess: () => (message.success('Profile saved'), refresh()), onError: (e) => message.error(errorMessage(e)) });
  const saveGallery = useMutation({ mutationFn: sellerApi.updateGallery, onSuccess: () => (message.success('Gallery saved'), refresh()), onError: (e) => message.error(errorMessage(e)) });
  const img = useMutation({
    mutationFn: ({ kind, file }: { kind: 'avatar' | 'cover' | 'gallery'; file: File }) =>
      kind === 'avatar' ? sellerApi.avatar(file) : kind === 'cover' ? sellerApi.cover(file) : sellerApi.galleryCover(file),
    onSuccess: () => (message.success('Image updated'), refresh()),
    onError: (e) => message.error(errorMessage(e)),
  });

  if (me.isLoading || !me.data) return <Skeleton active />;
  const a = me.data;
  const p = a.profile;
  const imageButton = (kind: 'avatar' | 'cover' | 'gallery', label: string) => (
    <Upload accept="image/jpeg,image/png,image/webp" showUploadList={false} beforeUpload={(file) => (img.mutate({ kind, file }), false)}>
      <Button icon={<UploadOutlined />} loading={img.isPending && img.variables?.kind === kind}>
        {label}
      </Button>
    </Upload>
  );

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={16}>
        <Card title="Artist profile" extra={<Tag color={STATUS_COLORS[a.status]}>{humanize(a.status)}</Tag>}>
          <Space className="!mb-6" size={16} wrap>
            <Avatar size={80} src={a.avatarUrl ?? undefined}>
              {a.displayName[0]}
            </Avatar>
            {imageButton('avatar', 'Change avatar')}
            {imageButton('cover', 'Change cover image')}
          </Space>
          {a.coverImageUrl && <img src={a.coverImageUrl} alt="" className="mb-6 h-40 w-full rounded-lg object-cover" />}
          <Form
            layout="vertical"
            initialValues={{
              displayName: a.displayName,
              bio: p?.bio,
              description: p?.description,
              artistStatement: p?.artistStatement,
              yearsOfExperience: p?.yearsOfExperience,
              website: p?.website,
              instagram: p?.socialLinks?.instagram,
              specializations: p?.specializations ?? [],
              awards: p?.awards ?? [],
              styleIds: a.styles.map((s) => s.id),
              mediumIds: a.mediums.map((m) => m.id),
              acceptsCustomArt: a.acceptsCustomArt,
              customArtBasePrice: a.customArtBasePrice,
              city: a.address?.city,
              state: a.address?.state,
            }}
            onFinish={(v) => {
              const { instagram, ...rest } = v;
              save.mutate({ ...rest, socialLinks: instagram ? { ...(p?.socialLinks ?? {}), instagram } : p?.socialLinks ?? undefined });
            }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Display name" name="displayName" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Years of experience" name="yearsOfExperience">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Short bio" name="bio" rules={[{ max: 500 }]}>
              <Input />
            </Form.Item>
            <Form.Item label="About" name="description">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item label="Artist statement" name="artistStatement">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Styles" name="styleIds">
                  <Select mode="multiple" options={(styles.data ?? []).map((s) => ({ value: s.id, label: s.name }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Mediums" name="mediumIds">
                  <Select mode="multiple" options={(mediums.data ?? []).map((s) => ({ value: s.id, label: s.name }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Specializations" name="specializations">
                  <Select mode="tags" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Awards" name="awards">
                  <Select mode="tags" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Website" name="website" rules={[{ type: 'url' }]}>
                  <Input placeholder="https://" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Instagram" name="instagram" rules={[{ type: 'url' }]}>
                  <Input placeholder="https://instagram.com/…" />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item label="City" name="city">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item label="State" name="state">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item label="Accept custom art" name="acceptsCustomArt" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item label="Custom art from (₹)" name="customArtBasePrice">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" htmlType="submit" loading={save.isPending}>
              Save profile
            </Button>
          </Form>
        </Card>
      </Col>
      <Col xs={24} xl={8}>
        <Card title="Gallery page">
          {a.gallery.coverImageUrl && <img src={a.gallery.coverImageUrl} alt="" className="mb-4 h-32 w-full rounded-lg object-cover" />}
          <div className="mb-4">{imageButton('gallery', 'Gallery cover')}</div>
          <Form layout="vertical" initialValues={{ name: a.gallery.name, tagline: a.gallery.tagline, description: a.gallery.description }} onFinish={(v) => saveGallery.mutate(v)}>
            <Form.Item label="Gallery name" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Tagline" name="tagline">
              <Input />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Button htmlType="submit" loading={saveGallery.isPending}>
              Save gallery
            </Button>
          </Form>
        </Card>
        {a.approvals?.length > 0 && (
          <Card title="Approval history" className="!mt-4">
            <List
              size="small"
              dataSource={a.approvals}
              renderItem={(h) => (
                <List.Item>
                  <List.Item.Meta title={humanize(h.toStatus)} description={`${date(h.createdAt)}${h.reason ? ` · ${h.reason}` : ''}`} />
                </List.Item>
              )}
            />
          </Card>
        )}
      </Col>
    </Row>
  );
}
