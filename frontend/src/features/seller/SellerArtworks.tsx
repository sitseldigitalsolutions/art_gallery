import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Image, Input, Popconfirm, Select, Space, Table, Tag, Tooltip } from 'antd';
import { EditOutlined, InboxOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { errorMessage } from '@/lib/api';
import { date, humanize, money } from '@/lib/format';
import { ARTWORK_STATUSES } from '@/lib/types';
import { sellerApi, type SellerArtwork } from './api';
import { STATUS_COLORS } from './SellerLayout';

export default function SellerArtworks() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const status = params.get('status') ?? undefined;
  const list = useQuery({ queryKey: ['seller', 'artworks', status, page, q], queryFn: () => sellerApi.artworks({ status, page, pageSize: 20, q: q || undefined }) });

  const submit = useMutation({
    mutationFn: sellerApi.submit,
    onSuccess: () => {
      message.success('Submitted for review');
      qc.invalidateQueries({ queryKey: ['seller'] });
    },
    onError: (e) => message.error(errorMessage(e)),
  });
  const archive = useMutation({
    mutationFn: sellerApi.archiveArtwork,
    onSuccess: () => {
      message.success('Artwork archived');
      qc.invalidateQueries({ queryKey: ['seller'] });
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  return (
    <Card
      title="My artworks"
      extra={
        <Link to="/seller/artworks/new">
          <Button type="primary" icon={<PlusOutlined />}>
            New artwork
          </Button>
        </Link>
      }
    >
      <Space wrap className="!mb-4">
        <Select
          allowClear
          placeholder="All statuses"
          style={{ width: 200 }}
          value={status}
          onChange={(v) => {
            setPage(1);
            setParams(v ? { status: v } : {});
          }}
          options={ARTWORK_STATUSES.map((s) => ({ value: s, label: humanize(s) }))}
        />
        <Input.Search placeholder="Search title" allowClear onSearch={(v) => setQ(v)} style={{ width: 240 }} />
      </Space>
      <Table<SellerArtwork>
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.data}
        scroll={{ x: 900 }}
        pagination={{ current: page, pageSize: 20, total: list.data?.meta.total, onChange: setPage }}
        columns={[
          {
            title: 'Artwork',
            render: (_, a) => (
              <Space>
                <Image width={56} height={56} style={{ objectFit: 'cover', borderRadius: 8 }} src={a.thumbnailUrl ?? a.imageUrl ?? undefined} fallback="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
                <div>
                  <Link to={`/seller/artworks/${a.id}`} className="font-semibold">
                    {a.title}
                  </Link>
                  <div className="text-xs text-gray-400">
                    {a.sku} · {humanize(a.format)}
                  </div>
                </div>
              </Space>
            ),
          },
          { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{humanize(s)}</Tag> },
          { title: 'Price', render: (_, a) => (a.discountPrice ? <span>{money(a.discountPrice)} <s className="text-xs text-gray-400">{money(a.price)}</s></span> : money(a.price)) },
          { title: 'Qty', dataIndex: 'quantity', render: (v, a) => (a.format === 'DIGITAL' ? '∞' : v ?? '—') },
          { title: 'Views', dataIndex: 'viewCount' },
          { title: 'Sales', dataIndex: 'salesCount' },
          { title: 'Updated', dataIndex: 'updatedAt', render: (v: string) => date(v) },
          {
            title: '',
            fixed: 'right',
            render: (_, a) => (
              <Space>
                <Link to={`/seller/artworks/${a.id}`}>
                  <Button size="small" icon={<EditOutlined />} aria-label="Edit" />
                </Link>
                {(a.status === 'DRAFT' || a.status === 'REJECTED') && (
                  <Tooltip title="Submit for review">
                    <Button size="small" type="primary" icon={<SendOutlined />} loading={submit.isPending && submit.variables === a.id} onClick={() => submit.mutate(a.id)} aria-label="Submit for review" />
                  </Tooltip>
                )}
                {a.status !== 'ARCHIVED' && (
                  <Popconfirm title="Archive this artwork?" description="It will be hidden from the gallery." onConfirm={() => archive.mutate(a.id)}>
                    <Button size="small" danger icon={<InboxOutlined />} aria-label="Archive" />
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
