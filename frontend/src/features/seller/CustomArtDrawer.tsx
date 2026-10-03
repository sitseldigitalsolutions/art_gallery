import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, DatePicker, Descriptions, Drawer, Form, Image, Input, InputNumber, Modal, Skeleton, Space, Tag, Timeline, Upload, type UploadFile } from 'antd';
import { CheckOutlined, CloseOutlined, PlayCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { customArtApi } from '@/features/custom-art/api';
import { errorMessage } from '@/lib/api';
import { dateTime, humanize, money } from '@/lib/format';
import { STATUS_COLORS } from './SellerLayout';

type Modal = 'accept' | 'reject' | 'preview' | 'final' | 'cancel' | null;

/** Request detail + actions. Shown actions come from the server's allowedActions for the current user. */
export function CustomArtDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['custom-art', id], queryFn: () => customArtApi.detail(id!), enabled: !!id });
  const [modal, setModal] = useState<Modal>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  const done = (msg: string) => {
    message.success(msg);
    setModal(null);
    setFiles([]);
    form.resetFields();
    qc.invalidateQueries({ queryKey: ['custom-art'] });
    qc.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
  };
  const fail = (e: unknown) => message.error(errorMessage(e));

  const simple = useMutation({
    mutationFn: (action: 'review' | 'start') => (action === 'review' ? customArtApi.review(id!) : customArtApi.start(id!)),
    onSuccess: (_d, a) => done(a === 'review' ? 'Marked as reviewing' : 'Work started'),
    onError: fail,
  });
  const withForm = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const imgs = files.map((f) => f.originFileObj as File).filter(Boolean);
      switch (modal) {
        case 'accept':
          return customArtApi.accept(id!, {
            quotedPrice: Number(values.quotedPrice),
            artistMessage: (values.artistMessage as string) || undefined,
            maxRevisions: values.maxRevisions as number | undefined,
            dueDate: values.dueDate ? (values.dueDate as { toISOString: () => string }).toISOString() : undefined,
          });
        case 'reject':
          return customArtApi.reject(id!, values.reason as string);
        case 'cancel':
          return customArtApi.cancel(id!, values.reason as string);
        case 'preview':
          return customArtApi.uploadPreview(id!, imgs, values.message as string);
        case 'final':
          return customArtApi.uploadFinal(id!, imgs, values.message as string);
      }
    },
    onSuccess: () => done('Request updated'),
    onError: fail,
  });

  const r = q.data;
  const can = (a: string) => !!r?.allowedActions.includes(a as never);

  return (
    <Drawer open={!!id} onClose={onClose} size={720} title={r ? `${r.requestNumber} · ${r.title ?? r.style?.name ?? 'Custom art'}` : 'Request'}>
      {q.isLoading && <Skeleton active />}
      {r && (
        <Space orientation="vertical" size={20} style={{ width: '100%' }}>
          <Space wrap>
            <Tag color={STATUS_COLORS[r.status]}>{humanize(r.status)}</Tag>
            {can('review') && (
              <Button onClick={() => simple.mutate('review')} loading={simple.isPending}>
                Mark reviewing
              </Button>
            )}
            {can('accept') && (
              <Button type="primary" icon={<CheckOutlined />} onClick={() => setModal('accept')}>
                Accept & quote
              </Button>
            )}
            {can('reject') && (
              <Button danger icon={<CloseOutlined />} onClick={() => setModal('reject')}>
                Reject
              </Button>
            )}
            {can('start') && (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => simple.mutate('start')} loading={simple.isPending}>
                Start work
              </Button>
            )}
            {can('preview') && (
              <Button type="primary" icon={<UploadOutlined />} onClick={() => setModal('preview')}>
                Upload preview
              </Button>
            )}
            {can('final') && (
              <Button type="primary" icon={<UploadOutlined />} onClick={() => setModal('final')}>
                Upload final artwork
              </Button>
            )}
            {can('cancel') && (
              <Button danger onClick={() => setModal('cancel')}>
                Cancel
              </Button>
            )}
          </Space>

          <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
            <Descriptions.Item label="Customer">{r.customer.fullName}</Descriptions.Item>
            <Descriptions.Item label="Artist">{r.artist.displayName}</Descriptions.Item>
            <Descriptions.Item label="Style">{r.style?.name ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Format">{humanize(r.requestedFormat)}</Descriptions.Item>
            <Descriptions.Item label="Dimensions">{r.requestedDimensions ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Budget">{r.budget ? money(r.budget) : '—'}</Descriptions.Item>
            <Descriptions.Item label="Quote">{r.quotedPrice ? money(r.quotedPrice) : '—'}</Descriptions.Item>
            <Descriptions.Item label="Revisions">
              {r.revisionCount} / {r.maxRevisions}
            </Descriptions.Item>
            <Descriptions.Item label="Order / payment">{r.order ? `${r.order.orderNumber} · ${humanize(r.order.paymentStatus)}` : 'Not ordered yet'}</Descriptions.Item>
            <Descriptions.Item label="Created">{dateTime(r.createdAt)}</Descriptions.Item>
          </Descriptions>

          <div>
            <h4 className="mb-2 font-semibold">Instructions</h4>
            <p className="whitespace-pre-line rounded-lg bg-gray-50 p-3 text-sm">{r.instructions}</p>
            {r.options && (
              <Descriptions size="small" column={1} className="!mt-2">
                {Object.entries(r.options).map(([k, v]) => (
                  <Descriptions.Item key={k} label={humanize(k)}>
                    {v}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}
            {r.customerMessage && <p className="mt-2 text-sm text-gray-600">Customer: {r.customerMessage}</p>}
          </div>

          {(['SOURCE', 'REFERENCE', 'PREVIEW', 'FINAL'] as const).map((kind) => {
            const imgs = r.images.filter((i) => i.kind === kind);
            if (!imgs.length) return null;
            return (
              <div key={kind}>
                <h4 className="mb-2 font-semibold">
                  {humanize(kind)} images {kind === 'SOURCE' && <Tag>Private — customer photo</Tag>}
                </h4>
                <Image.PreviewGroup>
                  <Space wrap>
                    {imgs.map((i) => (
                      <div key={i.id} className="text-center"><Image src={i.url} width={120} height={120} style={{ objectFit: 'cover', borderRadius: 8 }} alt={`${kind} image`} />{(i.label || i.isAiGenerated) && <div className="text-[10px] text-gray-500">{i.label ?? 'AI-generated preview'}</div>}</div>
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </div>
            );
          })}
          {r.selectedArtwork && (
            <div>
              <h4 className="mb-2 font-semibold">Inspiration artwork</h4>
              <Space>
                <Image width={80} src={r.selectedArtwork.thumbnailUrl ?? undefined} />
                <span>{r.selectedArtwork.title}</span>
              </Space>
            </div>
          )}

          {r.revisions.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold">Revision requests</h4>
              {r.revisions.map((v) => (
                <p key={v.revisionNumber} className="mb-1 rounded bg-orange-50 p-2 text-sm">
                  #{v.revisionNumber}: {v.feedback}
                </p>
              ))}
            </div>
          )}

          <div>
            <h4 className="mb-2 font-semibold">Timeline</h4>
            <Timeline
              items={r.statusHistory.map((h) => ({
                content: (
                  <>
                    <b>{humanize(h.toStatus)}</b> <span className="text-xs text-gray-400">· {humanize(h.actorRole)} · {dateTime(h.createdAt)}</span>
                    {h.note && <div className="text-xs text-gray-500">{h.note}</div>}
                  </>
                ),
              }))}
            />
          </div>
        </Space>
      )}

      <Modal
        open={!!modal}
        title={modal === 'accept' ? 'Accept & send quote' : modal === 'reject' ? 'Reject request' : modal === 'cancel' ? 'Cancel request' : modal === 'preview' ? 'Upload preview' : 'Upload final artwork'}
        onCancel={() => setModal(null)}
        onOk={() => form.submit()}
        confirmLoading={withForm.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(v) => withForm.mutate(v)} preserve={false}>
          {modal === 'accept' && (
            <>
              <Form.Item label="Your price (₹)" name="quotedPrice" rules={[{ required: true, message: 'Enter your price' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Revisions included" name="maxRevisions" initialValue={2}>
                <InputNumber min={0} max={10} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Expected delivery" name="dueDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Message to customer" name="artistMessage">
                <Input.TextArea rows={3} />
              </Form.Item>
            </>
          )}
          {(modal === 'reject' || modal === 'cancel') && (
            <Form.Item label="Reason" name="reason" rules={[{ required: true, min: 3, message: 'Please give a reason' }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
          )}
          {(modal === 'preview' || modal === 'final') && (
            <>
              <Form.Item label="Images" required extra={modal === 'final' ? 'Full-resolution final artwork, stored privately for the customer.' : 'Show your progress; the customer can approve or request a revision.'}>
                <Upload listType="picture-card" multiple accept="image/jpeg,image/png,image/webp" fileList={files} beforeUpload={() => false} onChange={({ fileList }) => setFiles(fileList.slice(0, 4))}>
                  {files.length < 4 && '+ Add'}
                </Upload>
              </Form.Item>
              <Form.Item label="Message" name="message">
                <Input.TextArea rows={3} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Drawer>
  );
}
