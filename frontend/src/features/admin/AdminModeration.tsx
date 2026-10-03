import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Descriptions, Drawer, Image, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, Typography } from 'antd';
import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { errorMessage } from '@/lib/api';
import { date, dateTime, humanize, money } from '@/lib/format';
import { ARTWORK_STATUSES } from '@/lib/types';
import { CustomArtTable } from '@/features/seller/SellerPages';
import { adminApi, type Row } from './api';
import { CreateAccountButton, DeleteAccountButton } from './AdminAccounts';
import { useAuth } from '@/features/auth/AuthContext';
import { g, num, s, StatusTag } from './helpers';

/** Small modal that collects a reason before running an action. */
function useReason() {
  const [state, setState] = useState<{ title: string; required: boolean; run: (reason: string) => void } | null>(null);
  const [reason, setReason] = useState('');
  const ask = (title: string, run: (reason: string) => void, required = true) => {
    setReason('');
    setState({ title, run, required });
  };
  const modal: ReactNode = (
    <Modal
      open={!!state}
      title={state?.title}
      okButtonProps={{ disabled: !!state?.required && reason.trim().length < 3 }}
      onCancel={() => setState(null)}
      onOk={() => {
        state?.run(reason.trim());
        setState(null);
      }}
    >
      <Input.TextArea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={state?.required ? 'Reason (shared with the user)' : 'Optional note'} aria-label="Reason" />
    </Modal>
  );
  return { ask, modal };
}

function useAction<T>(fn: (v: T) => Promise<unknown>, invalidate: string[], success = 'Saved') {
  const { message } = App.useApp();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      message.success(success);
      qc.invalidateQueries({ queryKey: invalidate });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (e) => message.error(errorMessage(e)),
  });
}

function usePaged(key: string, fn: (p: Record<string, unknown>) => Promise<{ data: Row[]; meta: { total: number; pageSize: number } }>, filters: Record<string, unknown>) {
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['admin', key, filters, page], queryFn: () => fn({ ...filters, page, pageSize: 20 }) });
  const pagination = { current: page, total: q.data?.meta.total, pageSize: 20, onChange: setPage, showSizeChanger: false };
  return { q, pagination, reset: () => setPage(1) };
}

/* ───────── Artists ───────── */
export function AdminArtists() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? undefined;
  const [q, setQ] = useState('');
  const { q: list, pagination } = usePaged('artists', adminApi.artists, { status, q: q || undefined });
  const [openId, setOpenId] = useState<string | null>(null);
  const detail = useQuery({ queryKey: ['admin', 'artist', openId], queryFn: () => adminApi.artist(openId!), enabled: !!openId });
  const { ask, modal } = useReason();
  const setStatus = useAction(({ id, status, reason }: { id: string; status: string; reason?: string }) => adminApi.artistStatus(id, status, reason), ['admin', 'artists'], 'Artist updated');
  const feature = useAction(({ id, v }: { id: string; v: boolean }) => adminApi.artistFeatured(id, v), ['admin', 'artists']);
  const commission = useAction(({ id, v }: { id: string; v: number | null }) => adminApi.artistCommission(id, v), ['admin', 'artist']);
  const [pct, setPct] = useState<number | null>(null);

  const actions = (r: Row) => {
    const st = s(r, 'status');
    return (
      <Space wrap>
        {st !== 'APPROVED' && (
          <Button size="small" type="primary" onClick={() => setStatus.mutate({ id: r.id, status: 'APPROVED' })}>
            Approve
          </Button>
        )}
        {st === 'PENDING_APPROVAL' && (
          <Button size="small" danger onClick={() => ask('Reject artist', (reason) => setStatus.mutate({ id: r.id, status: 'REJECTED', reason }))}>
            Reject
          </Button>
        )}
        {st === 'APPROVED' && (
          <Button size="small" danger onClick={() => ask('Suspend artist', (reason) => setStatus.mutate({ id: r.id, status: 'SUSPENDED', reason }))}>
            Suspend
          </Button>
        )}
        {s(r, 'user.status') !== 'DELETED' && s(r, 'user.id') && <DeleteAccountButton userId={s(r, 'user.id')} name={s(r, 'displayName')} isArtist />}
      </Space>
    );
  };

  return (
    <Card title="Artists & galleries" extra={<CreateAccountButton defaultRole="ARTIST" label="Add artist" />}>
      <Space wrap className="!mb-4">
        <Select
          allowClear
          placeholder="All statuses"
          style={{ width: 200 }}
          value={status}
          onChange={(v) => setParams(v ? { status: v } : {})}
          options={['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED', 'INACTIVE'].map((x) => ({ value: x, label: humanize(x) }))}
        />
        <Input.Search allowClear placeholder="Search name or email" onSearch={setQ} style={{ width: 260 }} />
      </Space>
      <Table<Row>
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.data}
        pagination={pagination}
        scroll={{ x: 900 }}
        columns={[
          {
            title: 'Artist',
            render: (_, r) => (
              <Button type="link" className="!p-0" onClick={() => setOpenId(r.id)}>
                {s(r, 'displayName')}
              </Button>
            ),
          },
          { title: 'Owner', render: (_, r) => s(r, 'user.email', 'email') },
          { title: 'Type', render: (_, r) => humanize(s(r, 'type')) },
          { title: 'Status', render: (_, r) => <StatusTag value={g(r, 'status')} /> },
          { title: 'Artworks', render: (_, r) => s(r, 'artworkCount', '_count.artworks') },
          { title: 'Featured', render: (_, r) => <Switch size="small" checked={!!g(r, 'isFeatured')} onChange={(v) => feature.mutate({ id: r.id, v })} aria-label="Featured" /> },
          { title: 'Joined', render: (_, r) => date(g(r, 'createdAt') as string) },
          { title: 'Actions', render: (_, r) => actions(r) },
        ]}
      />
      {modal}
      <Drawer open={!!openId} onClose={() => setOpenId(null)} size={640} title={s(detail.data, 'displayName')}>
        {detail.data && (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            {actions(detail.data)}
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Status">
                <StatusTag value={g(detail.data, 'status')} />
              </Descriptions.Item>
              <Descriptions.Item label="Owner">
                {s(detail.data, 'user.fullName')} · {s(detail.data, 'user.email')} · {s(detail.data, 'user.phone')}
              </Descriptions.Item>
              <Descriptions.Item label="Bio">{s(detail.data, 'profile.bio')}</Descriptions.Item>
              <Descriptions.Item label="Experience">{s(detail.data, 'profile.yearsOfExperience')} years</Descriptions.Item>
              <Descriptions.Item label="Location">
                {s(detail.data, 'address.city')}, {s(detail.data, 'address.state')}, {s(detail.data, 'address.country')}
              </Descriptions.Item>
              <Descriptions.Item label="Website">{s(detail.data, 'profile.website')}</Descriptions.Item>
              <Descriptions.Item label="Description">
                <Typography.Paragraph ellipsis={{ rows: 4, expandable: true }}>{s(detail.data, 'profile.description')}</Typography.Paragraph>
              </Descriptions.Item>
            </Descriptions>
            <Card size="small" title="Commission override">
              <Space>
                <InputNumber min={0} max={100} addonAfter="%" placeholder={String(g(detail.data, 'commissionPercentage') ?? 'Default')} value={pct} onChange={(v) => setPct(v)} />
                <Button onClick={() => commission.mutate({ id: openId!, v: pct })}>Save</Button>
                <Button onClick={() => commission.mutate({ id: openId!, v: null })}>Use default</Button>
              </Space>
            </Card>
            <Link to={`/artists/${s(detail.data, 'slug')}`} target="_blank">
              View public profile ↗
            </Link>
          </Space>
        )}
      </Drawer>
    </Card>
  );
}

/* ───────── Artworks ───────── */
export function AdminArtworks() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? undefined;
  const [q, setQ] = useState('');
  const { q: list, pagination } = usePaged('artworks', adminApi.artworks, { status, q: q || undefined });
  const { ask, modal } = useReason();
  const moderate = useAction(({ id, action, reason }: { id: string; action: string; reason?: string }) => adminApi.moderate(id, action, reason), ['admin', 'artworks'], 'Artwork updated');
  const feature = useAction(({ id, v }: { id: string; v: boolean }) => adminApi.artworkFeatured(id, v), ['admin', 'artworks']);

  return (
    <Card title="Artwork moderation">
      <Space wrap className="!mb-4">
        <Select
          allowClear
          placeholder="All statuses"
          style={{ width: 200 }}
          value={status}
          onChange={(v) => setParams(v ? { status: v } : {})}
          options={ARTWORK_STATUSES.map((x) => ({ value: x, label: humanize(x) }))}
        />
        <Input.Search allowClear placeholder="Search title or artist" onSearch={setQ} style={{ width: 260 }} />
      </Space>
      <Table<Row>
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.data}
        pagination={pagination}
        scroll={{ x: 1000 }}
        columns={[
          {
            title: 'Artwork',
            render: (_, r) => (
              <Space>
                <Image width={64} height={64} style={{ objectFit: 'cover', borderRadius: 8 }} src={s(r, 'thumbnailUrl', 'imageUrl', 'images.0.thumbUrl', 'images.0.url')} />
                <div>
                  <div className="font-semibold">{s(r, 'title')}</div>
                  <div className="text-xs text-gray-400">
                    {s(r, 'artist.displayName')} · {humanize(s(r, 'format'))} · {humanize(s(r, 'type'))}
                  </div>
                </div>
              </Space>
            ),
          },
          { title: 'Price', render: (_, r) => money(num(r, 'price')) },
          { title: 'Status', render: (_, r) => <StatusTag value={g(r, 'status')} /> },
          { title: 'Featured', render: (_, r) => <Switch size="small" checked={!!g(r, 'isFeatured')} onChange={(v) => feature.mutate({ id: r.id, v })} aria-label="Featured" /> },
          { title: 'Updated', render: (_, r) => date(g(r, 'updatedAt', 'createdAt') as string) },
          {
            title: 'Actions',
            render: (_, r) => {
              const st = s(r, 'status');
              return (
                <Space wrap>
                  {['PENDING_REVIEW', 'REJECTED', 'SUSPENDED'].includes(st) && (
                    <Button size="small" type="primary" onClick={() => moderate.mutate({ id: r.id, action: st === 'SUSPENDED' ? 'RESTORE' : 'APPROVE' })}>
                      {st === 'SUSPENDED' ? 'Restore' : 'Approve'}
                    </Button>
                  )}
                  {st === 'PENDING_REVIEW' && (
                    <Button size="small" danger onClick={() => ask('Reject artwork', (reason) => moderate.mutate({ id: r.id, action: 'REJECT', reason }))}>
                      Reject
                    </Button>
                  )}
                  {['APPROVED', 'SOLD_OUT'].includes(st) && (
                    <Button size="small" danger onClick={() => ask('Suspend artwork', (reason) => moderate.mutate({ id: r.id, action: 'SUSPEND', reason }))}>
                      Suspend
                    </Button>
                  )}
                  {st !== 'ARCHIVED' && (
                    <Button size="small" onClick={() => ask('Remove (archive) artwork', (reason) => moderate.mutate({ id: r.id, action: 'ARCHIVE', reason }))}>
                      Remove
                    </Button>
                  )}
                  {['APPROVED', 'SOLD_OUT'].includes(st) && (
                    <Link to={`/artworks/${s(r, 'slug')}`} target="_blank">
                      View ↗
                    </Link>
                  )}
                </Space>
              );
            },
          },
        ]}
      />
      {modal}
    </Card>
  );
}

/* ───────── Users ───────── */
export function AdminUsers() {
  const [role, setRole] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [q, setQ] = useState('');
  const { q: list, pagination } = usePaged('users', adminApi.users, { role, status, q: q || undefined });
  const { ask, modal } = useReason();
  const update = useAction(({ id, status, reason }: { id: string; status: string; reason?: string }) => adminApi.userStatus(id, status, reason), ['admin', 'users'], 'User updated');
  const { user: me } = useAuth();
  return (
    <Card title="Users" extra={<CreateAccountButton />}>
      <Space wrap className="!mb-4">
        <Select allowClear placeholder="All roles" style={{ width: 160 }} value={role} onChange={setRole} options={['ADMIN', 'ARTIST', 'CUSTOMER'].map((r) => ({ value: r, label: humanize(r) }))} />
        <Select allowClear placeholder="All statuses" style={{ width: 160 }} value={status} onChange={setStatus} options={['ACTIVE', 'SUSPENDED', 'DELETED'].map((r) => ({ value: r, label: humanize(r) }))} />
        <Input.Search allowClear placeholder="Search name or email" onSearch={setQ} style={{ width: 260 }} />
      </Space>
      <Table<Row>
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.data}
        pagination={pagination}
        scroll={{ x: 800 }}
        columns={[
          { title: 'Name', render: (_, r) => s(r, 'fullName') },
          { title: 'Email', render: (_, r) => s(r, 'email') },
          {
            title: 'Roles',
            render: (_, r) =>
              ((g(r, 'roles') as unknown[]) ?? []).map((x) => {
                const name = typeof x === 'string' ? x : s(x, 'role.name', 'name');
                return <Tag key={name}>{name}</Tag>;
              }),
          },
          { title: 'Status', render: (_, r) => <StatusTag value={g(r, 'status')} /> },
          { title: 'Joined', render: (_, r) => date(g(r, 'createdAt') as string) },
          { title: 'Last login', render: (_, r) => (g(r, 'lastLoginAt') ? dateTime(g(r, 'lastLoginAt') as string) : '—') },
          {
            title: '',
            render: (_, r) => {
              const st = s(r, 'status');
              if (st === 'DELETED') return <Tag>Deleted</Tag>;
              const self = r.id === me?.id;
              return (
                <Space>
                  {st === 'ACTIVE' ? (
                    <Button size="small" disabled={self} onClick={() => ask('Suspend user', (reason) => update.mutate({ id: r.id, status: 'SUSPENDED', reason }))}>
                      Suspend
                    </Button>
                  ) : (
                    <Button size="small" onClick={() => update.mutate({ id: r.id, status: 'ACTIVE' })}>
                      Reactivate
                    </Button>
                  )}
                  <DeleteAccountButton userId={r.id} name={s(r, 'fullName')} isArtist={!!g(r, 'artist')} disabled={self} />
                </Space>
              );
            },
          },
        ]}
      />
      {modal}
    </Card>
  );
}

/* ───────── Custom art ───────── */
export function AdminCustomArt() {
  return <CustomArtTable as="admin" />;
}

/* ───────── Orders ───────── */
const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'COMPLETED', 'CANCELLED'];

export function AdminOrders() {
  const [status, setStatus] = useState<string | undefined>();
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();
  const [q, setQ] = useState('');
  const { q: list, pagination } = usePaged('orders', adminApi.orders, { status, paymentStatus, q: q || undefined });
  const [openId, setOpenId] = useState<string | null>(null);
  const detail = useQuery({ queryKey: ['admin', 'order', openId], queryFn: () => adminApi.order(openId!), enabled: !!openId });
  const update = useAction(({ id, status }: { id: string; status: string }) => adminApi.orderStatus(id, status), ['admin', 'order'], 'Order updated');
  const items = (g(detail.data, 'items') as Row[] | undefined) ?? [];
  return (
    <Card title="Orders">
      <Space wrap className="!mb-4">
        <Select allowClear placeholder="Order status" style={{ width: 180 }} value={status} onChange={setStatus} options={ORDER_STATUSES.map((x) => ({ value: x, label: humanize(x) }))} />
        <Select
          allowClear
          placeholder="Payment status"
          style={{ width: 200 }}
          value={paymentStatus}
          onChange={setPaymentStatus}
          options={['PENDING', 'AWAITING_CONFIRMATION', 'PAID', 'FAILED', 'REFUNDED'].map((x) => ({ value: x, label: humanize(x) }))}
        />
        <Input.Search allowClear placeholder="Order number or email" onSearch={setQ} style={{ width: 240 }} />
      </Space>
      <Table<Row>
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.data}
        pagination={pagination}
        scroll={{ x: 900 }}
        onRow={(r) => ({ onClick: () => setOpenId(r.id), style: { cursor: 'pointer' } })}
        columns={[
          { title: 'Order', render: (_, r) => <b>{s(r, 'orderNumber')}</b> },
          { title: 'Customer', render: (_, r) => s(r, 'customer.fullName', 'customer.email') },
          { title: 'Total', render: (_, r) => money(num(r, 'total')) },
          { title: 'Method', render: (_, r) => humanize(s(r, 'paymentMethod')) },
          { title: 'Payment', render: (_, r) => <StatusTag value={g(r, 'paymentStatus')} /> },
          { title: 'Status', render: (_, r) => <StatusTag value={g(r, 'status')} /> },
          { title: 'Placed', render: (_, r) => dateTime(g(r, 'placedAt') as string) },
        ]}
      />
      <Drawer open={!!openId} onClose={() => setOpenId(null)} size={680} title={`Order ${s(detail.data, 'orderNumber')}`}>
        {detail.data && (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Space>
              Status:
              <Select style={{ width: 220 }} value={s(detail.data, 'status')} onChange={(v) => update.mutate({ id: openId!, status: v })} options={ORDER_STATUSES.map((x) => ({ value: x, label: humanize(x) }))} />
            </Space>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Customer">
                {s(detail.data, 'customer.fullName')} · {s(detail.data, 'customer.email')}
              </Descriptions.Item>
              <Descriptions.Item label="Payment">
                {humanize(s(detail.data, 'paymentMethod'))} · <StatusTag value={g(detail.data, 'paymentStatus')} />
              </Descriptions.Item>
              <Descriptions.Item label="Total">{money(num(detail.data, 'total'))}</Descriptions.Item>
              <Descriptions.Item label="Ship to">{g(detail.data, 'shippingAddress') ? Object.values(g(detail.data, 'shippingAddress') as object).filter(Boolean).join(', ') : 'Digital only'}</Descriptions.Item>
            </Descriptions>
            <Table<Row>
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={items}
              columns={[
                { title: 'Item', render: (_, i) => s(i, 'titleSnapshot') },
                { title: 'Artist', render: (_, i) => s(i, 'artist.displayName') },
                { title: 'Line', render: (_, i) => money(num(i, 'lineTotal')) },
                { title: 'Commission', render: (_, i) => `${money(num(i, 'commissionAmount'))} (${s(i, 'commissionRate')}%)` },
                { title: 'Artist gets', render: (_, i) => money(num(i, 'artistAmount')) },
                { title: 'Fulfilment', render: (_, i) => <StatusTag value={g(i, 'fulfillmentStatus')} /> },
              ]}
            />
          </Space>
        )}
      </Drawer>
    </Card>
  );
}

/* ───────── Payments ───────── */
export function AdminPayments() {
  const [status, setStatus] = useState<string | undefined>();
  const { q: list, pagination } = usePaged('payments', adminApi.payments, { status });
  const { ask, modal } = useReason();
  const confirm = useAction(({ id, reference }: { id: string; reference?: string }) => adminApi.confirmPayment(id, reference), ['admin', 'payments'], 'Payment confirmed');
  const fail = useAction(({ id, reason }: { id: string; reason: string }) => adminApi.failPayment(id, reason), ['admin', 'payments'], 'Payment marked failed');
  return (
    <Card title="Payments" extra={<span className="text-xs text-gray-500">COD & manual transfers are confirmed here once money is received.</span>}>
      <Select
        allowClear
        placeholder="All statuses"
        className="!mb-4"
        style={{ width: 220 }}
        value={status}
        onChange={setStatus}
        options={['PENDING', 'AWAITING_CONFIRMATION', 'PAID', 'FAILED', 'REFUNDED'].map((x) => ({ value: x, label: humanize(x) }))}
      />
      <Table<Row>
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.data}
        pagination={pagination}
        scroll={{ x: 800 }}
        columns={[
          { title: 'Order', render: (_, r) => s(r, 'order.orderNumber', 'orderNumber') },
          { title: 'Customer', render: (_, r) => s(r, 'order.customer.fullName', 'customer.fullName') },
          { title: 'Method', render: (_, r) => humanize(s(r, 'method')) },
          { title: 'Amount', render: (_, r) => money(num(r, 'amount')) },
          { title: 'Status', render: (_, r) => <StatusTag value={g(r, 'status')} /> },
          { title: 'Reference', render: (_, r) => s(r, 'providerRef') },
          { title: 'Created', render: (_, r) => dateTime(g(r, 'createdAt') as string) },
          {
            title: '',
            render: (_, r) =>
              ['PENDING', 'AWAITING_CONFIRMATION'].includes(s(r, 'status')) && (
                <Space>
                  <Button size="small" type="primary" onClick={() => ask('Confirm payment received', (reference) => confirm.mutate({ id: r.id, reference: reference || undefined }), false)}>
                    Confirm
                  </Button>
                  <Button size="small" danger onClick={() => ask('Mark payment failed', (reason) => fail.mutate({ id: r.id, reason }))}>
                    Fail
                  </Button>
                </Space>
              ),
          },
        ]}
      />
      {modal}
    </Card>
  );
}
