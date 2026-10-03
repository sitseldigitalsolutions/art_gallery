import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Form, Image, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tabs, Tag, Typography, Upload } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { TaxonomyKind } from '@/features/artworks/api';
import { errorMessage } from '@/lib/api';
import { dateTime, humanize, money } from '@/lib/format';
import type { TaxonomyItem } from '@/lib/types';
import { adminApi, type Row } from './api';
import { g, num, s, StatusTag } from './helpers';

function useAct<T>(fn: (v: T) => Promise<unknown>, key: string[], msg = 'Saved') {
  const { message } = App.useApp();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      message.success(msg);
      qc.invalidateQueries({ queryKey: key });
      // Banners feed the homepage hero carousel.
      if (key[1] === 'banners') qc.invalidateQueries({ queryKey: ['home'] });
    },
    onError: (e) => message.error(errorMessage(e)),
  });
}

/* ───────── Commissions ───────── */
export function AdminCommissions() {
  const q = useQuery({ queryKey: ['admin', 'commissions'], queryFn: adminApi.commissions });
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const scope = Form.useWatch('scope', form);
  const create = useAct((v: { scope: string; targetId?: string; percentage: number }) => adminApi.createCommission(v), ['admin', 'commissions'], 'Rule created');
  const update = useAct(({ id, body }: { id: string; body: { percentage?: number; isActive?: boolean } }) => adminApi.updateCommission(id, body), ['admin', 'commissions']);
  const remove = useAct((id: string) => adminApi.deleteCommission(id), ['admin', 'commissions'], 'Rule deleted');
  return (
    <Card
      title="Commission rules"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Add rule
        </Button>
      }
    >
      <Typography.Paragraph type="secondary">
        The most specific active rule wins: artwork → artist → category → global (custom art: artist → custom-art → global). Commission snapshots on past orders never change.
      </Typography.Paragraph>
      <Table<Row>
        rowKey="id"
        loading={q.isLoading}
        dataSource={q.data}
        pagination={false}
        columns={[
          { title: 'Scope', render: (_, r) => <Tag color="purple">{humanize(s(r, 'scope'))}</Tag> },
          { title: 'Target', render: (_, r) => s(r, 'targetLabel', 'targetName', 'target.name', 'target.displayName', 'target.title', 'targetId') },
          {
            title: 'Percentage',
            render: (_, r) => (
              <InputNumber size="small" min={0} max={100} defaultValue={num(r, 'percentage')} suffix="%" onBlur={(e) => update.mutate({ id: r.id, body: { percentage: Number(e.target.value) } })} />
            ),
          },
          { title: 'Active', render: (_, r) => <Switch size="small" checked={!!g(r, 'isActive')} onChange={(v) => update.mutate({ id: r.id, body: { isActive: v } })} /> },
          {
            title: '',
            render: (_, r) => (
              <Popconfirm title="Delete rule?" onConfirm={() => remove.mutate(r.id)}>
                <Button size="small" danger icon={<DeleteOutlined />} aria-label="Delete rule" />
              </Popconfirm>
            ),
          },
        ]}
      />
      <Modal open={open} title="New commission rule" onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={create.isPending} destroyOnHidden>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ scope: 'GLOBAL' }}
          onFinish={(v) => {
            create.mutate(v, { onSuccess: () => setOpen(false) });
          }}
        >
          <Form.Item label="Scope" name="scope" rules={[{ required: true }]}>
            <Select options={['GLOBAL', 'ARTIST', 'CATEGORY', 'ARTWORK', 'CUSTOM_ART'].map((x) => ({ value: x, label: humanize(x) }))} />
          </Form.Item>
          {['ARTIST', 'CATEGORY', 'ARTWORK'].includes(scope) && (
            <Form.Item label={`${humanize(scope)} ID`} name="targetId" rules={[{ required: true }]}>
              <Input placeholder="Paste the ID" />
            </Form.Item>
          )}
          <Form.Item label="Percentage" name="percentage" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} suffix="%" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

/* ───────── Settlements ───────── */
export function AdminSettlements() {
  const balances = useQuery({ queryKey: ['admin', 'settlements', 'balances'], queryFn: adminApi.balances });
  const list = useQuery({ queryKey: ['admin', 'settlements', 'list'], queryFn: () => adminApi.settlements({ pageSize: 50 }) });
  const [target, setTarget] = useState<{ id: string; name: string; available: number } | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [ref, setRef] = useState('');
  const create = useAct((v: { artistId: string; method: string; reference?: string; note?: string }) => adminApi.createSettlement(v), ['admin', 'settlements'], 'Settlement created');
  const complete = useAct(({ id, reference }: { id: string; reference: string }) => adminApi.completeSettlement(id, reference), ['admin', 'settlements'], 'Settlement completed');
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card title="Artist balances">
        <Table
          rowKey={(r) => r.artist.id}
          loading={balances.isLoading}
          dataSource={balances.data}
          pagination={false}
          columns={[
            { title: 'Artist', render: (_, r) => r.artist.displayName },
            { title: 'Available', render: (_, r) => <b>{money(r.available)}</b> },
            { title: 'Pending', render: (_, r) => money(r.pending) },
            {
              title: '',
              render: (_, r) => (
                <Button size="small" type="primary" disabled={r.available <= 0} onClick={() => setTarget({ id: r.artist.id, name: r.artist.displayName, available: r.available })}>
                  Settle
                </Button>
              ),
            },
          ]}
        />
      </Card>
      <Card title="Settlements">
        <Table<Row>
          rowKey="id"
          loading={list.isLoading}
          dataSource={list.data?.data}
          columns={[
            { title: 'Artist', render: (_, r) => s(r, 'artist.displayName') },
            { title: 'Amount', render: (_, r) => money(num(r, 'amount')) },
            { title: 'Status', render: (_, r) => <StatusTag value={g(r, 'status')} /> },
            { title: 'Reference', render: (_, r) => s(r, 'reference') },
            { title: 'Created', render: (_, r) => dateTime(g(r, 'createdAt') as string) },
            {
              title: '',
              render: (_, r) =>
                s(r, 'status') !== 'COMPLETED' && (
                  <Button size="small" onClick={() => setCompleteId(r.id)}>
                    Mark completed
                  </Button>
                ),
            },
          ]}
        />
      </Card>
      <Modal open={!!target} title={`Settle ${target?.name} · ${money(target?.available)}`} onCancel={() => setTarget(null)} onOk={() => form.submit()} confirmLoading={create.isPending} destroyOnHidden>
        <Form form={form} layout="vertical" initialValues={{ method: 'BANK_TRANSFER' }} onFinish={(v) => create.mutate({ ...v, artistId: target!.id }, { onSuccess: () => setTarget(null) })}>
          <Form.Item label="Method" name="method">
            <Select options={['BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'].map((x) => ({ value: x, label: humanize(x) }))} />
          </Form.Item>
          <Form.Item label="Reference" name="reference">
            <Input />
          </Form.Item>
          <Form.Item label="Note" name="note">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        open={!!completeId}
        title="Complete settlement"
        okButtonProps={{ disabled: !ref.trim() }}
        onCancel={() => setCompleteId(null)}
        onOk={() => complete.mutate({ id: completeId!, reference: ref.trim() }, { onSuccess: () => (setCompleteId(null), setRef('')) })}
      >
        <Input placeholder="Transaction reference (UTR / cheque no.)" value={ref} onChange={(e) => setRef(e.target.value)} aria-label="Reference" />
      </Modal>
    </Space>
  );
}

/* ───────── Reviews ───────── */
export function AdminReviews() {
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['admin', 'reviews', status, page], queryFn: () => adminApi.reviews({ status, page }) });
  const mod = useAct(({ kind, id, status }: { kind: 'artwork' | 'artist'; id: string; status: string }) => adminApi.moderateReview(kind, id, status), ['admin', 'reviews'], 'Review updated');
  return (
    <Card title="Reviews">
      <Select allowClear placeholder="All statuses" className="!mb-4" style={{ width: 180 }} value={status} onChange={setStatus} options={['PENDING', 'APPROVED', 'REJECTED'].map((x) => ({ value: x, label: humanize(x) }))} />
      <Table<Row>
        rowKey="id"
        loading={q.isLoading}
        dataSource={q.data?.data}
        pagination={{ current: page, total: q.data?.meta.total, onChange: setPage }}
        scroll={{ x: 800 }}
        columns={[
          { title: 'Type', render: (_, r) => <Tag>{s(r, 'kind', 'type')}</Tag> },
          { title: 'On', render: (_, r) => s(r, 'target.title', 'target.displayName', 'artwork.title', 'artist.displayName', 'targetName') },
          { title: 'By', render: (_, r) => s(r, 'user.fullName') },
          { title: 'Rating', render: (_, r) => '★'.repeat(num(r, 'rating')) },
          { title: 'Review', render: (_, r) => <Typography.Paragraph ellipsis={{ rows: 2, expandable: true }} className="!mb-0">{s(r, 'body')}</Typography.Paragraph> },
          { title: 'Status', render: (_, r) => <StatusTag value={g(r, 'status')} /> },
          {
            title: '',
            render: (_, r) => {
              const kind = (s(r, 'kind', 'type').toLowerCase().includes('artist') ? 'artist' : 'artwork') as 'artist' | 'artwork';
              return (
                <Space>
                  {s(r, 'status') !== 'APPROVED' && (
                    <Button size="small" onClick={() => mod.mutate({ kind, id: r.id, status: 'APPROVED' })}>
                      Approve
                    </Button>
                  )}
                  {s(r, 'status') !== 'REJECTED' && (
                    <Button size="small" danger onClick={() => mod.mutate({ kind, id: r.id, status: 'REJECTED' })}>
                      Hide
                    </Button>
                  )}
                </Space>
              );
            },
          },
        ]}
      />
    </Card>
  );
}

/* ───────── Reports ───────── */
export function AdminReports() {
  const [status, setStatus] = useState<string | undefined>('OPEN');
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['admin', 'reports', status, page], queryFn: () => adminApi.reports({ status, page }) });
  const [resolving, setResolving] = useState<{ id: string; status: string } | null>(null);
  const [note, setNote] = useState('');
  const act = useAct(({ id, status, resolution }: { id: string; status: string; resolution?: string }) => adminApi.resolveReport(id, status, resolution), ['admin', 'reports'], 'Report updated');
  return (
    <Card title="Reported content">
      <Select allowClear placeholder="All" className="!mb-4" style={{ width: 180 }} value={status} onChange={setStatus} options={['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'].map((x) => ({ value: x, label: humanize(x) }))} />
      <Table<Row>
        rowKey="id"
        loading={q.isLoading}
        dataSource={q.data?.data}
        pagination={{ current: page, total: q.data?.meta.total, onChange: setPage }}
        scroll={{ x: 800 }}
        columns={[
          { title: 'Target', render: (_, r) => `${humanize(s(r, 'targetType'))} · ${s(r, 'targetName', 'target.title', 'target.displayName', 'targetId')}` },
          { title: 'Reason', render: (_, r) => <Tag color="red">{humanize(s(r, 'reason'))}</Tag> },
          { title: 'Details', render: (_, r) => s(r, 'details') },
          { title: 'Reporter', render: (_, r) => s(r, 'reporter.fullName', 'reporter.email') },
          { title: 'Status', render: (_, r) => <StatusTag value={g(r, 'status')} /> },
          { title: 'Filed', render: (_, r) => dateTime(g(r, 'createdAt') as string) },
          {
            title: '',
            render: (_, r) =>
              ['OPEN', 'REVIEWING'].includes(s(r, 'status')) && (
                <Space>
                  <Button size="small" type="primary" onClick={() => setResolving({ id: r.id, status: 'RESOLVED' })}>
                    Resolve
                  </Button>
                  <Button size="small" onClick={() => setResolving({ id: r.id, status: 'DISMISSED' })}>
                    Dismiss
                  </Button>
                </Space>
              ),
          },
        ]}
      />
      <Modal open={!!resolving} title={humanize(resolving?.status)} onCancel={() => setResolving(null)} onOk={() => (act.mutate({ ...resolving!, resolution: note || undefined }), setResolving(null), setNote(''))}>
        <Typography.Paragraph type="secondary">Take action on the content itself (suspend artwork/user) from the Artworks or Users pages.</Typography.Paragraph>
        <Input.TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Resolution note" aria-label="Resolution note" />
      </Modal>
    </Card>
  );
}

/* ───────── Taxonomy ───────── */
function TaxonomyTable({ kind }: { kind: TaxonomyKind }) {
  const q = useQuery({ queryKey: ['admin', 'taxonomy', kind], queryFn: () => adminApi.taxonomy(kind) });
  const [editing, setEditing] = useState<TaxonomyItem | 'new' | null>(null);
  const [form] = Form.useForm();
  const key = ['admin', 'taxonomy', kind];
  const save = useAct(
    (v: Record<string, unknown>) => (editing === 'new' ? adminApi.createTaxonomy(kind, v) : adminApi.updateTaxonomy(kind, (editing as TaxonomyItem).id, v)),
    key,
  );
  const remove = useAct((id: string) => adminApi.deleteTaxonomy(kind, id), key, 'Removed');
  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        className="!mb-4"
        onClick={() => {
          form.resetFields();
          setEditing('new');
        }}
      >
        Add {kind.replace(/s$/, '').replace(/ie$/, 'y')}
      </Button>
      <Table<TaxonomyItem>
        rowKey="id"
        size="small"
        loading={q.isLoading}
        dataSource={q.data}
        pagination={{ pageSize: 50 }}
        columns={[
          { title: 'Image', render: (_, t) => (t.imageUrl ? <Image src={t.imageUrl} width={40} height={40} style={{ objectFit: 'cover', borderRadius: 6 }} /> : '—') },
          { title: 'Name', dataIndex: 'name' },
          { title: 'Slug', dataIndex: 'slug' },
          { title: 'Artworks', dataIndex: 'artworkCount' },
          { title: 'Active', render: (_, t) => (t.isActive === false ? <Tag>Inactive</Tag> : <Tag color="green">Active</Tag>) },
          ...(kind === 'styles' ? [{ title: 'Custom art', render: (_: unknown, t: TaxonomyItem) => (t.availableForCustomArt ? <Tag color="purple">Yes</Tag> : '—') }] : []),
          {
            title: '',
            render: (_, t) => (
              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  aria-label="Edit"
                  onClick={() => {
                    form.setFieldsValue({ ...t, isActive: t.isActive !== false });
                    setEditing(t);
                  }}
                />
                <Popconfirm title="Remove? Items in use are deactivated instead." onConfirm={() => remove.mutate(t.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} aria-label="Delete" />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal open={!!editing} title={editing === 'new' ? 'Add' : 'Edit'} onCancel={() => setEditing(null)} onOk={() => form.submit()} confirmLoading={save.isPending} destroyOnHidden>
        <Form form={form} layout="vertical" initialValues={{ isActive: true, availableForCustomArt: true }} onFinish={(v) => save.mutate(v, { onSuccess: () => setEditing(null) })}>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {(kind === 'categories' || kind === 'styles') && (
            <>
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item label="Image URL" name="imageUrl" rules={[{ type: 'url' }]}>
                <Input placeholder="https://…" />
              </Form.Item>
            </>
          )}
          <Form.Item label="Sort order" name="sortOrder">
            <InputNumber />
          </Form.Item>
          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
          {kind === 'styles' && (
            <Form.Item label="Available for custom art" name="availableForCustomArt" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}

export function AdminTaxonomy() {
  return (
    <Card title="Taxonomy">
      <Tabs
        items={(['categories', 'styles', 'mediums', 'themes'] as TaxonomyKind[]).map((k) => ({ key: k, label: humanize(k), children: <TaxonomyTable kind={k} /> }))}
      />
    </Card>
  );
}

/* ───────── Banners ───────── */
export function AdminBanners() {
  const q = useQuery({ queryKey: ['admin', 'banners'], queryFn: adminApi.banners });
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [form] = Form.useForm();
  const key = ['admin', 'banners'];
  const save = useAct((v: Record<string, unknown>) => (editing === 'new' ? adminApi.createBanner(v) : adminApi.updateBanner((editing as Row).id, v)), key);
  const remove = useAct((id: string) => adminApi.deleteBanner(id), key, 'Banner removed');
  const image = useAct(({ id, file }: { id: string; file: File }) => adminApi.bannerImage(id, file), key, 'Image uploaded');
  return (
    <Card
      title="Homepage banners"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setEditing('new');
          }}
        >
          Add banner
        </Button>
      }
    >
      <Typography.Paragraph type="secondary">Active HOME_HERO banners rotate in the homepage hero carousel, in sort order (lowest first). Use wide images (about 1920×1080). Carousel speed, effect and text are set under Appearance → Hero & banners.</Typography.Paragraph>
      <Table<Row>
        rowKey="id"
        loading={q.isLoading}
        dataSource={q.data as unknown as Row[]}
        pagination={false}
        columns={[
          { title: 'Image', render: (_, b) => <Image src={s(b, 'imageUrl')} width={120} height={60} style={{ objectFit: 'cover', borderRadius: 6 }} /> },
          { title: 'Title', render: (_, b) => s(b, 'title') },
          { title: 'Placement', render: (_, b) => s(b, 'placement') },
          { title: 'Order', render: (_, b) => s(b, 'sortOrder') },
          { title: 'Active', render: (_, b) => (g(b, 'isActive') ? <Tag color="green">Active</Tag> : <Tag>Off</Tag>) },
          {
            title: '',
            render: (_, b) => (
              <Space>
                <Upload accept="image/jpeg,image/png,image/webp" showUploadList={false} beforeUpload={(file) => (image.mutate({ id: b.id, file }), false)}>
                  <Button size="small" icon={<UploadOutlined />}>
                    Image
                  </Button>
                </Upload>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  aria-label="Edit"
                  onClick={() => {
                    form.setFieldsValue(b);
                    setEditing(b);
                  }}
                />
                <Popconfirm title="Delete banner?" onConfirm={() => remove.mutate(b.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} aria-label="Delete" />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal open={!!editing} title={editing === 'new' ? 'New banner' : 'Edit banner'} onCancel={() => setEditing(null)} onOk={() => form.submit()} confirmLoading={save.isPending} destroyOnHidden>
        <Form form={form} layout="vertical" initialValues={{ placement: 'HOME_HERO', isActive: true, sortOrder: 0 }} onFinish={(v) => save.mutate(v, { onSuccess: () => setEditing(null) })}>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Subtitle" name="subtitle">
            <Input />
          </Form.Item>
          <Form.Item label="Image URL" name="imageUrl" extra="Or upload an image from the table after saving.">
            <Input placeholder="https://…" />
          </Form.Item>
          <Form.Item label="Link" name="linkUrl">
            <Input placeholder="/gallery?featured=true" />
          </Form.Item>
          <Form.Item label="Placement" name="placement">
            <Select options={['HOME_HERO', 'HOME_PROMO', 'GALLERY_TOP'].map((x) => ({ value: x, label: humanize(x) }))} />
          </Form.Item>
          <Form.Item label="Sort order" name="sortOrder">
            <InputNumber />
          </Form.Item>
          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

/* ───────── Settings ───────── */
export function AdminSettings() {
  const q = useQuery({ queryKey: ['admin', 'settings'], queryFn: adminApi.settings });
  const save = useAct(({ key, value }: { key: string; value: unknown }) => adminApi.saveSetting(key, value), ['admin', 'settings'], 'Setting saved');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState('');
  const { message } = App.useApp();
  const entries: [string, unknown][] = Array.isArray(q.data) ? q.data.map((x) => [x.key, x.value]) : Object.entries(q.data ?? {});
  const submit = (key: string, raw: string) => {
    try {
      save.mutate({ key, value: JSON.parse(raw) });
    } catch {
      message.error('Value must be valid JSON (e.g. 10, true, "text", {"a":1})');
    }
  };
  return (
    <Card title="Platform settings">
      <Typography.Paragraph type="secondary">Values are JSON. Examples: customArt.maxRevisions = 2, shipping.flatFee = 150, digital.downloadLimit = 5.</Typography.Paragraph>
      <Table
        rowKey={(r) => r[0]}
        loading={q.isLoading}
        dataSource={entries}
        pagination={false}
        columns={[
          { title: 'Key', render: (_, r) => <code>{r[0]}</code> },
          {
            title: 'Value',
            render: (_, r) => (
              <Input.TextArea autoSize value={drafts[r[0]] ?? JSON.stringify(r[1])} onChange={(e) => setDrafts({ ...drafts, [r[0]]: e.target.value })} aria-label={`Value for ${r[0]}`} />
            ),
          },
          {
            title: '',
            render: (_, r) => (
              <Button size="small" disabled={drafts[r[0]] === undefined} onClick={() => submit(r[0], drafts[r[0]])}>
                Save
              </Button>
            ),
          },
        ]}
      />
      <Space className="!mt-4">
        <Input placeholder="new.setting.key" value={newKey} onChange={(e) => setNewKey(e.target.value)} aria-label="New setting key" />
        <Button disabled={!/^[a-zA-Z0-9._-]{2,}$/.test(newKey)} onClick={() => (submit(newKey, 'null'), setNewKey(''))}>
          Add setting
        </Button>
      </Space>
    </Card>
  );
}

/* ───────── Audit logs ───────── */
export function AdminAuditLogs() {
  const [entityType, setEntityType] = useState<string | undefined>();
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['admin', 'audit', entityType, action, page], queryFn: () => adminApi.auditLogs({ entityType, action: action || undefined, page, pageSize: 30 }) });
  return (
    <Card title="Audit logs">
      <Space wrap className="!mb-4">
        <Select
          allowClear
          placeholder="Entity type"
          style={{ width: 200 }}
          value={entityType}
          onChange={setEntityType}
          options={['User', 'Artist', 'Artwork', 'CustomArtRequest', 'Order', 'Payment', 'Settlement', 'CommissionRule', 'Review', 'Report', 'SystemSetting'].map((x) => ({ value: x, label: x }))}
        />
        <Input.Search allowClear placeholder="Action e.g. ARTWORK_APPROVED" onSearch={setAction} style={{ width: 260 }} />
      </Space>
      <Table<Row>
        rowKey="id"
        size="small"
        loading={q.isLoading}
        dataSource={q.data?.data}
        pagination={{ current: page, total: q.data?.meta.total, pageSize: 30, onChange: setPage }}
        scroll={{ x: 900 }}
        expandable={{ expandedRowRender: (r) => <pre className="max-w-full overflow-auto text-xs">{JSON.stringify(g(r, 'metadata') ?? {}, null, 2)}</pre> }}
        columns={[
          { title: 'When', render: (_, r) => dateTime(g(r, 'createdAt') as string) },
          { title: 'Action', render: (_, r) => <code>{s(r, 'action')}</code> },
          { title: 'Entity', render: (_, r) => `${s(r, 'entityType')} ${s(r, 'entityId')}` },
          { title: 'Actor', render: (_, r) => `${s(r, 'actor.email', 'actorId')} (${s(r, 'actorRole')})` },
          { title: 'IP', render: (_, r) => s(r, 'ipAddress') },
        ]}
      />
    </Card>
  );
}
