import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Col, Form, Input, Modal, Radio, Row, Select, Switch, Typography } from 'antd';
import { DeleteOutlined, ReloadOutlined, UserAddOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { errorMessage } from '@/lib/api';
import { adminApi } from './api';

type Role = 'CUSTOMER' | 'ARTIST' | 'ADMIN';

const ROLE_HELP: Record<Role, string> = {
  CUSTOMER: 'Can browse, buy artwork and request custom art.',
  ARTIST: 'Gets an artist profile and gallery, and can also buy art. Approve now to let them publish immediately.',
  ADMIN: 'Full control of the platform. Only create admin accounts for people you trust.',
};

/** Strong random password that satisfies the API rules (upper, lower, digit, symbol, 14 chars). */
export function generatePassword() {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%&*?'];
  const all = sets.join('');
  const rand = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const chars = sets.map((s) => s[rand(s.length)]);
  while (chars.length < 14) chars.push(all[rand(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/** Admin-only: create a customer, artist or admin account. */
export function CreateAccountButton({ defaultRole = 'CUSTOMER', label = 'Create account' }: { defaultRole?: Role; label?: string }) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const role: Role = Form.useWatch('role', form) ?? defaultRole;
  const { message, modal } = App.useApp();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (v: Record<string, unknown>) => adminApi.createUser(v),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'artists'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setOpen(false);
      modal.success({
        title: 'Account created',
        content: (
          <div>
            <p>
              Share these sign-in details with <b>{String(v.fullName)}</b> privately, and ask them to change the password after first login (Account →
              Security).
            </p>
            <Typography.Paragraph copyable={{ text: `Email: ${v.email}\nPassword: ${v.password}` }} className="!mb-0 rounded-lg bg-gray-50 p-3 font-mono text-sm">
              Email: {String(v.email)}
              <br />
              Password: {String(v.password)}
            </Typography.Paragraph>
          </div>
        ),
      });
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  const openModal = () => {
    form.resetFields();
    form.setFieldsValue({ role: defaultRole, password: generatePassword(), approveNow: true, acceptsCustomArt: true, artistType: 'INDIVIDUAL', country: 'IN' });
    setOpen(true);
  };

  return (
    <>
      <Button type="primary" icon={<UserAddOutlined />} onClick={openModal}>
        {label}
      </Button>
      <Modal open={open} title="Create account" okText="Create account" onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={create.isPending} width={640} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={(v) => create.mutate(v)} requiredMark="optional">
          <Form.Item name="role" label="Account type" rules={[{ required: true }]} extra={ROLE_HELP[role]}>
            <Radio.Group optionType="button" buttonStyle="solid" options={[{ label: 'Customer', value: 'CUSTOMER' }, { label: 'Artist / Gallery', value: 'ARTIST' }, { label: 'Admin', value: 'ADMIN' }]} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="fullName" label="Full name" rules={[{ required: true, min: 2, max: 120 }]}>
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="Phone" rules={[{ max: 20 }]}>
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="password"
                label="Starting password"
                rules={[
                  { required: true, min: 8, max: 128 },
                  { pattern: /[a-z]/, message: 'Needs a lowercase letter' },
                  { pattern: /[A-Z]/, message: 'Needs an uppercase letter' },
                  { pattern: /[0-9]/, message: 'Needs a number' },
                ]}
              >
                <Input
                  autoComplete="new-password"
                  className="font-mono"
                  addonAfter={<ReloadOutlined onClick={() => form.setFieldValue('password', generatePassword())} aria-label="Generate password" title="Generate a strong password" />}
                />
              </Form.Item>
            </Col>
          </Row>

          {role === 'ARTIST' && (
            <div className="rounded-xl border border-gray-200 p-4">
              <Typography.Text strong className="mb-3 block">
                Artist / gallery details
              </Typography.Text>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="displayName" label="Artist or gallery name" rules={[{ required: true, min: 2, max: 120 }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="artistType" label="Type">
                    <Select
                      options={[
                        { value: 'INDIVIDUAL', label: 'Individual artist' },
                        { value: 'STUDIO', label: 'Art studio' },
                        { value: 'GALLERY', label: 'Art gallery' },
                        { value: 'CREATIVE_BUSINESS', label: 'Creative business' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="bio" label="Short bio" rules={[{ max: 500 }]}>
                    <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="city" label="City">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="state" label="State">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="country" label="Country">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="approveNow" label="Approve now" valuePropName="checked" extra="Off = stays Pending approval.">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="acceptsCustomArt" label="Accepts photo-to-art requests" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}
          {role === 'ADMIN' && <Alert type="warning" showIcon message="Admins can change anything on the platform, including other accounts." />}
        </Form>
      </Modal>
    </>
  );
}

/** Admin-only: permanently close an account (anonymised soft delete; financial records are kept). */
export function DeleteAccountButton({ userId, name, isArtist, disabled }: { userId: string; name: string; isArtist?: boolean; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const { message } = App.useApp();
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => adminApi.deleteUser(userId, reason.trim()),
    onSuccess: (r) => {
      message.success(r.cancelledRequests ? `Account deleted · ${r.cancelledRequests} open custom-art request(s) cancelled` : 'Account deleted');
      ['users', 'artists', 'artworks', 'dashboard'].forEach((k) => qc.invalidateQueries({ queryKey: ['admin', k] }));
      qc.invalidateQueries({ queryKey: ['home'] });
      setOpen(false);
    },
    onError: (e) => message.error(errorMessage(e)),
  });
  return (
    <>
      <Button
        size="small"
        danger
        icon={<DeleteOutlined />}
        disabled={disabled}
        onClick={() => {
          setReason('');
          setConfirmText('');
          setOpen(true);
        }}
        aria-label={`Delete ${name}`}
      >
        Delete
      </Button>
      <Modal
        open={open}
        title={`Delete ${name}?`}
        okText="Delete account"
        okButtonProps={{ danger: true, disabled: reason.trim().length < 3 || confirmText !== 'DELETE' }}
        confirmLoading={remove.isPending}
        onCancel={() => setOpen(false)}
        onOk={() => remove.mutate()}
      >
        <Alert
          type="error"
          showIcon
          className="!mb-4"
          message="This cannot be undone"
          description={
            <ul className="mb-0 list-disc pl-4 text-sm">
              <li>The person is signed out everywhere and can no longer log in.</li>
              <li>Name, email, phone, photo and saved addresses are removed (the email can be used to register again).</li>
              {isArtist && <li>Their artist profile and gallery go offline and all their artworks are archived.</li>}
              <li>Open custom-art requests involving them are cancelled and the other party is notified.</li>
              <li>Orders, payments and earnings records are kept for accounting.</li>
            </ul>
          }
        />
        <Typography.Text strong>Reason (kept in the audit log)</Typography.Text>
        <Input.TextArea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className="!mb-3 !mt-1" aria-label="Reason for deletion" />
        <Typography.Text strong>
          Type <Typography.Text code>DELETE</Typography.Text> to confirm
        </Typography.Text>
        <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="!mt-1" aria-label="Type DELETE to confirm" />
      </Modal>
    </>
  );
}
