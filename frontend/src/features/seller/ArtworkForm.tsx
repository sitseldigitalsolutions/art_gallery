import { Button, Col, Form, Input, InputNumber, Row, Select, Switch } from 'antd';
import { useState } from 'react';
import { ARTWORK_TYPES, type Ref, type TaxonomyItem } from '@/lib/types';
import { humanize } from '@/lib/format';
import type { ArtworkInput } from './api';

export interface ArtworkFormValues extends ArtworkInput {
  tags: string[];
}

export interface ArtworkFormProps {
  initial?: Partial<ArtworkFormValues>;
  categories: TaxonomyItem[];
  styles: TaxonomyItem[];
  mediums: TaxonomyItem[];
  themes: TaxonomyItem[];
  collections?: { id: string; name: string }[];
  searchTags?: (q: string) => Promise<Ref[]>;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: ArtworkFormValues) => void;
}

const opts = (list: TaxonomyItem[]) => list.map((t) => ({ value: t.id, label: t.name }));

export function ArtworkForm({ initial, categories, styles, mediums, themes, collections = [], searchTags, submitting, submitLabel = 'Save artwork', onSubmit }: ArtworkFormProps) {
  const [form] = Form.useForm<ArtworkFormValues>();
  const format = Form.useWatch('format', form) ?? initial?.format;
  const [tagOptions, setTagOptions] = useState<{ value: string; label: string }[]>([]);

  return (
    <Form<ArtworkFormValues>
      form={form}
      layout="vertical"
      initialValues={{ format: 'ORIGINAL', type: 'ORIGINAL_PAINTING', quantity: 1, isCustomizable: false, tags: [], collectionIds: [], ...initial }}
      onFinish={(v) => onSubmit({ ...v, discountPrice: v.discountPrice ?? null })}
      scrollToFirstError
    >
      <Row gutter={16}>
        <Col xs={24} md={16}>
          <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter a title' }, { max: 150 }]}>
            <Input placeholder="e.g. Monsoon over Kerala" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Year created" name="yearCreated" rules={[{ type: 'number', min: 1000, max: new Date().getFullYear(), message: 'Enter a valid year' }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="Description" name="description" rules={[{ max: 5000 }]}>
        <Input.TextArea rows={4} placeholder="The story behind the piece, technique, materials…" />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item label="Artwork type" name="type" rules={[{ required: true, message: 'Choose a type' }]}>
            <Select options={ARTWORK_TYPES.map((t) => ({ value: t, label: humanize(t) }))} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Format" name="format" rules={[{ required: true, message: 'Choose a format' }]}>
            <Select
              options={[
                { value: 'ORIGINAL', label: 'Original (one of a kind)' },
                { value: 'PRINT', label: 'Print' },
                { value: 'DIGITAL', label: 'Digital download' },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Category" name="categoryId" rules={[{ required: true, message: 'Choose a category' }]}>
            <Select showSearch={{ optionFilterProp: 'label' }} options={opts(categories)} placeholder="Select" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Style" name="styleId">
            <Select allowClear showSearch={{ optionFilterProp: 'label' }} options={opts(styles)} placeholder="Select" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Medium" name="mediumId">
            <Select allowClear showSearch={{ optionFilterProp: 'label' }} options={opts(mediums)} placeholder="Select" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Theme" name="themeId">
            <Select allowClear showSearch={{ optionFilterProp: 'label' }} options={opts(themes)} placeholder="Select" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Form.Item
            label="Price (₹)"
            name="price"
            rules={[
              { required: true, message: 'Enter a price' },
              { type: 'number', min: 1, message: 'Price must be greater than 0' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item
            label="Discount price (₹)"
            name="discountPrice"
            dependencies={['price']}
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, v) => (v == null || v < getFieldValue('price') ? Promise.resolve() : Promise.reject(new Error('Must be lower than the price'))),
              }),
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item label="Quantity" name="quantity" rules={[{ type: 'number', min: 0 }]} extra={format === 'ORIGINAL' ? 'Originals are one of a kind' : undefined}>
            <InputNumber style={{ width: '100%' }} min={0} max={format === 'ORIGINAL' ? 1 : 10000} disabled={format === 'DIGITAL'} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item label="Orientation" name="orientation">
            <Select allowClear options={['PORTRAIT', 'LANDSCAPE', 'SQUARE', 'PANORAMIC'].map((o) => ({ value: o, label: humanize(o) }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={8}>
          <Form.Item label="Width (cm)" name="widthCm">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Col>
        <Col xs={8}>
          <Form.Item label="Height (cm)" name="heightCm">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Col>
        <Col xs={8}>
          <Form.Item label="Depth (cm)" name="depthCm">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Tags" name="tags">
            <Select
              mode="tags"
              tokenSeparators={[',']}
              placeholder="e.g. monsoon, kerala, rain"
              options={tagOptions}
              onSearch={async (q) => {
                if (!searchTags || q.length < 2) return;
                try {
                  setTagOptions((await searchTags(q)).map((t) => ({ value: t.name, label: t.name })));
                } catch {
                  /* suggestions are optional */
                }
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="Dominant colour" name="dominantColor">
            <Select
              allowClear
              options={['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'gold'].map((c) => ({ value: c, label: humanize(c) }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="Customizable" name="isCustomizable" valuePropName="checked" extra="Buyers can request a personalised version">
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      {collections.length > 0 && (
        <Form.Item label="Collections" name="collectionIds">
          <Select mode="multiple" options={collections.map((c) => ({ value: c.id, label: c.name }))} />
        </Form.Item>
      )}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="License information" name="licenseInfo">
            <Input.TextArea rows={2} placeholder="e.g. Personal use only, no commercial reproduction" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Copyright" name="copyrightInfo">
            <Input placeholder="e.g. © 2026 Your Name" />
          </Form.Item>
        </Col>
      </Row>
      <Button type="primary" htmlType="submit" loading={submitting} size="large">
        {submitLabel}
      </Button>
    </Form>
  );
}
