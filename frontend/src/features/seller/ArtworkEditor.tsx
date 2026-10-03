import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Col, Image, Popconfirm, Row, Skeleton, Space, Tag, Timeline, Upload } from 'antd';
import { CloudUploadOutlined, DeleteOutlined, LockOutlined, SendOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '@/features/artworks/api';
import { errorMessage } from '@/lib/api';
import { date, humanize } from '@/lib/format';
import { ArtworkForm, type ArtworkFormValues } from './ArtworkForm';
import { sellerApi, type SellerArtwork } from './api';
import { STATUS_COLORS } from './SellerLayout';

const n = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : Number(v));

function toInitial(a: SellerArtwork & Record<string, unknown>): Partial<ArtworkFormValues> {
  return {
    title: a.title,
    description: a.description ?? undefined,
    type: a.type,
    format: a.format,
    categoryId: (a.categoryId as string) ?? a.category?.id,
    styleId: (a.styleId as string) ?? a.style?.id,
    mediumId: (a.mediumId as string) ?? a.medium?.id,
    themeId: (a.themeId as string) ?? a.theme?.id,
    tags: (a.tags ?? []).map((t) => (typeof t === 'string' ? t : t.name)),
    yearCreated: n(a.yearCreated),
    widthCm: n(a.widthCm),
    heightCm: n(a.heightCm),
    depthCm: n(a.depthCm),
    orientation: a.orientation ?? undefined,
    dominantColor: a.dominantColor ?? undefined,
    price: n(a.price)!,
    discountPrice: n(a.discountPrice) ?? null,
    quantity: n(a.quantity ?? a.availableQuantity),
    isCustomizable: a.isCustomizable,
    licenseInfo: a.licenseInfo ?? undefined,
    copyrightInfo: a.copyrightInfo ?? undefined,
    collectionIds: a.collectionIds ?? [],
  };
}

export default function ArtworkEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const opts = { staleTime: 600_000 };
  const categories = useQuery({ queryKey: ['taxonomy', 'categories'], queryFn: () => catalogApi.taxonomy('categories'), ...opts });
  const styles = useQuery({ queryKey: ['taxonomy', 'styles'], queryFn: () => catalogApi.taxonomy('styles'), ...opts });
  const mediums = useQuery({ queryKey: ['taxonomy', 'mediums'], queryFn: () => catalogApi.taxonomy('mediums'), ...opts });
  const themes = useQuery({ queryKey: ['taxonomy', 'themes'], queryFn: () => catalogApi.taxonomy('themes'), ...opts });
  const collections = useQuery({ queryKey: ['seller', 'collections'], queryFn: sellerApi.collections });
  const artwork = useQuery({ queryKey: ['seller', 'artwork', id], queryFn: () => sellerApi.artwork(id!), enabled: !isNew });
  const refresh = () => qc.invalidateQueries({ queryKey: ['seller'] });

  const save = useMutation({
    mutationFn: (v: ArtworkFormValues) => (isNew ? sellerApi.createArtwork(v) : sellerApi.updateArtwork(id!, v)),
    onSuccess: (a) => {
      message.success(isNew ? 'Draft created — now add images' : 'Artwork saved');
      refresh();
      if (isNew) navigate(`/seller/artworks/${a.id}`, { replace: true });
    },
    onError: (e) => message.error(errorMessage(e)),
  });
  const upload = useMutation({
    mutationFn: (files: File[]) => sellerApi.uploadImages(id!, files),
    onSuccess: () => {
      message.success('Images uploaded');
      refresh();
    },
    onError: (e) => message.error(errorMessage(e)),
  });
  const removeImage = useMutation({ mutationFn: (imageId: string) => sellerApi.deleteImage(id!, imageId), onSuccess: refresh, onError: (e) => message.error(errorMessage(e)) });
  const primary = useMutation({ mutationFn: (imageId: string) => sellerApi.setPrimary(id!, imageId), onSuccess: refresh, onError: (e) => message.error(errorMessage(e)) });
  const digital = useMutation({
    mutationFn: (file: File) => sellerApi.uploadDigital(id!, file),
    onSuccess: () => {
      message.success('Private digital file uploaded');
      refresh();
    },
    onError: (e) => message.error(errorMessage(e)),
  });
  const submit = useMutation({
    mutationFn: () => sellerApi.submit(id!),
    onSuccess: () => {
      message.success('Submitted for admin review');
      refresh();
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  if (!isNew && artwork.isLoading) return <Skeleton active />;
  if (!isNew && artwork.isError) return <Alert type="error" title={errorMessage(artwork.error)} />;
  const a = artwork.data as (SellerArtwork & Record<string, unknown>) | undefined;
  // Batch files picked together into one request.
  let pending: File[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  const queueUpload = (file: File) => {
    pending.push(file);
    clearTimeout(timer);
    timer = setTimeout(() => {
      upload.mutate(pending);
      pending = [];
    }, 50);
    return false;
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={16}>
        <Card
          title={isNew ? 'New artwork' : a?.title}
          extra={a && <Tag color={STATUS_COLORS[a.status]}>{humanize(a.status)}</Tag>}
        >
          {a?.status === 'APPROVED' && (
            <Alert className="!mb-4" type="info" showIcon title="Changing content or images sends this artwork back for review. Price, discount, quantity and collections update instantly." />
          )}
          <ArtworkForm
            key={a?.id ?? 'new'}
            initial={a ? toInitial(a) : undefined}
            categories={categories.data ?? []}
            styles={styles.data ?? []}
            mediums={mediums.data ?? []}
            themes={themes.data ?? []}
            collections={(collections.data ?? []).map((c) => ({ id: c.id, name: c.name }))}
            searchTags={sellerApi.tags}
            submitting={save.isPending}
            submitLabel={isNew ? 'Create draft' : 'Save changes'}
            onSubmit={(v) => save.mutate(v)}
          />
        </Card>
      </Col>
      <Col xs={24} xl={8}>
        {isNew ? (
          <Card title="Images">
            <p className="text-sm text-gray-500">Save the draft first, then upload images (min 400×400px, JPEG/PNG/WebP, up to 12).</p>
          </Card>
        ) : (
          a && (
            <Space orientation="vertical" size={16} style={{ width: '100%' }}>
              <Card title={`Images (${a.images.length}/12)`}>
                <Upload.Dragger multiple accept="image/jpeg,image/png,image/webp" showUploadList={false} beforeUpload={queueUpload} disabled={upload.isPending || a.images.length >= 12}>
                  <p className="text-3xl text-brand">
                    <CloudUploadOutlined />
                  </p>
                  <p className="text-sm">{upload.isPending ? 'Uploading…' : 'Click or drag images here'}</p>
                  <p className="text-xs text-gray-400">Min 400×400px · stripped of metadata on upload</p>
                </Upload.Dragger>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {a.images.map((img) => (
                    <div key={img.id} className="group relative overflow-hidden rounded-lg">
                      <Image src={img.thumbUrl ?? img.url} alt="" style={{ aspectRatio: '1', objectFit: 'cover' }} />
                      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1">
                        <Button
                          size="small"
                          type="text"
                          aria-label={img.isPrimary ? 'Primary image' : 'Make primary'}
                          icon={img.isPrimary ? <StarFilled style={{ color: '#fadb14' }} /> : <StarOutlined style={{ color: '#fff' }} />}
                          onClick={() => !img.isPrimary && primary.mutate(img.id)}
                        />
                        <Popconfirm title="Delete image?" onConfirm={() => removeImage.mutate(img.id)}>
                          <Button size="small" type="text" aria-label="Delete image" icon={<DeleteOutlined style={{ color: '#fff' }} />} />
                        </Popconfirm>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              {a.format === 'DIGITAL' && (
                <Card title={<span><LockOutlined /> Digital deliverable</span>}>
                  <p className="mb-3 text-xs text-gray-500">
                    The full-resolution file buyers download. It is stored privately and only released via expiring links after a confirmed purchase. Min 600×600px.
                  </p>
                  <Upload accept="image/jpeg,image/png,image/webp" showUploadList={false} beforeUpload={(f) => (digital.mutate(f), false)}>
                    <Button loading={digital.isPending} icon={<CloudUploadOutlined />}>
                      {a.hasDigitalFile ? 'Replace file' : 'Upload file'}
                    </Button>
                  </Upload>
                  {a.hasDigitalFile && <Tag color="green" className="!ml-2">File uploaded</Tag>}
                </Card>
              )}
              {(a.status === 'DRAFT' || a.status === 'REJECTED') && (
                <Card>
                  <Button type="primary" block size="large" icon={<SendOutlined />} loading={submit.isPending} disabled={!a.images.length} onClick={() => submit.mutate()}>
                    Submit for review
                  </Button>
                  {!a.images.length && <p className="mt-2 text-xs text-gray-400">Add at least one image first.</p>}
                </Card>
              )}
              {!!a.approvals?.length && (
                <Card title="Review history">
                  <Timeline
                    items={a.approvals.map((h) => ({
                      color: h.toStatus === 'REJECTED' ? 'red' : h.toStatus === 'APPROVED' ? 'green' : 'blue',
                      content: (
                        <>
                          <b>{humanize(h.toStatus)}</b> <span className="text-xs text-gray-400">{date(h.createdAt)}</span>
                          {h.reason && <div className="text-xs text-gray-500">{h.reason}</div>}
                        </>
                      ),
                    }))}
                  />
                </Card>
              )}
            </Space>
          )
        )}
      </Col>
    </Row>
  );
}
