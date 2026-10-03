import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Affix,
  Alert,
  App,
  Button,
  Card,
  Col,
  ColorPicker,
  Input,
  Popconfirm,
  Radio,
  Row,
  Segmented,
  Select,
  Slider,
  Space,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BgColorsOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FontSizeOutlined,
  HolderOutlined,
  LayoutOutlined,
  PictureOutlined,
  ThunderboltOutlined,
  UndoOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { siteConfigApi } from '@/features/site/api';
import { useSiteConfig } from '@/features/site/SiteConfigContext';
import { errorMessage } from '@/lib/api';
import {
  HOME_SECTION_IDS,
  SECTION_META,
  THEME_PRESETS,
  type HomeSectionConfig,
  type SiteConfig,
  type ThemePreset,
} from '@/lib/siteConfig';
import { AdminBanners } from './AdminContent';

/** Move one section to a new index (pure, used by drag-and-drop and the arrow buttons). */
export function moveSection(list: HomeSectionConfig[], from: number, to: number): HomeSectionConfig[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  return arrayMove(list, from, to);
}

const COLOR_FIELDS: Array<{ key: keyof typeof THEME_PRESETS['royal-purple']; label: string; hint: string }> = [
  { key: 'primary', label: 'Brand', hint: 'Buttons, links, highlights' },
  { key: 'primaryDark', label: 'Brand (hover)', hint: 'Button hover / pressed' },
  { key: 'accent', label: 'Accent 1', hint: 'Badges, gradients' },
  { key: 'accent2', label: 'Accent 2', hint: 'Warm highlights' },
  { key: 'accent3', label: 'Accent 3', hint: 'Cool highlights' },
  { key: 'ink', label: 'Dark background', hint: 'Navbar, footer, dark bands' },
];

const PRESET_LABELS: Record<ThemePreset, string> = {
  'royal-purple': 'Royal Purple',
  'midnight-teal': 'Midnight Teal',
  'sunset-coral': 'Sunset Coral',
  'emerald-gold': 'Emerald & Gold',
  'royal-blue': 'Royal Blue',
  monochrome: 'Monochrome',
};

/* ───────────── Small building blocks ───────────── */

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <Typography.Text strong className="mb-1 block">
        {label}
      </Typography.Text>
      {children}
      {hint && (
        <Typography.Text type="secondary" className="mt-1 block text-xs">
          {hint}
        </Typography.Text>
      )}
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      <div>
        <Typography.Text strong>{label}</Typography.Text>
        {hint && <div className="text-xs text-gray-500">{hint}</div>}
      </div>
      <Switch checked={checked} onChange={onChange} aria-label={label} />
    </div>
  );
}

function ThemePreview({ theme, siteName }: { theme: SiteConfig['theme']; siteName: string }) {
  const radius = theme.radius === 'sharp' ? 6 : theme.radius === 'soft' ? 12 : 20;
  const button = theme.radius === 'round' ? 999 : radius;
  return (
    <div className="overflow-hidden border border-gray-200 bg-white shadow-sm" style={{ borderRadius: radius }}>
      <div className="relative px-6 py-8 text-white" style={{ background: `linear-gradient(135deg, ${theme.ink}, ${theme.primary})` }}>
        <div className="absolute right-6 top-6 h-14 w-14 rounded-full opacity-70 blur-xl" style={{ background: theme.accent }} />
        <div className="absolute bottom-4 left-1/2 h-10 w-10 rounded-full opacity-70 blur-lg" style={{ background: theme.accent3 }} />
        <div className="relative text-3xl" style={{ fontFamily: `'${theme.scriptFont}', cursive` }}>
          {siteName}
        </div>
        <div className="relative mt-1 text-xs opacity-80" style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}>
          Art That Tells Your Story
        </div>
        <div className="relative mt-4 flex gap-2">
          <span className="px-4 py-1.5 text-xs font-semibold" style={{ background: theme.primary, borderRadius: button }}>
            Create Your Art
          </span>
          <span className="border border-white/50 px-4 py-1.5 text-xs font-semibold" style={{ borderRadius: button }}>
            Explore
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 p-4">
        {[theme.accent, theme.accent2, theme.accent3].map((c, i) => (
          <div key={i} className="overflow-hidden border border-gray-100" style={{ borderRadius: radius }}>
            <div className="h-14" style={{ background: `linear-gradient(135deg, ${c}, ${theme.primary})` }} />
            <div className="p-2 text-[11px]">
              <div className="font-semibold text-gray-800">Artwork {i + 1}</div>
              <div style={{ color: theme.primary }} className="font-semibold">
                ₹{(i + 1) * 4500}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SortableSection({
  section,
  index,
  total,
  onChange,
  onMove,
}: {
  section: HomeSectionConfig;
  index: number;
  total: number;
  onChange: (s: HomeSectionConfig) => void;
  onMove: (to: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const [open, setOpen] = useState(false);
  const meta = SECTION_META[section.id];
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`mb-2 rounded-xl border bg-white transition ${isDragging ? 'z-10 border-brand shadow-xl' : 'border-gray-200'} ${section.enabled ? '' : 'opacity-60'}`}
      data-testid={`section-${section.id}`}
    >
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing"
          aria-label={`Drag ${meta.label}`}
          {...attributes}
          {...listeners}
        >
          <HolderOutlined />
        </button>
        <Tag className="!m-0 w-7 text-center">{index + 1}</Tag>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-800">
            {meta.label} {section.title && <Typography.Text type="secondary">· “{section.title}”</Typography.Text>}
          </div>
          <div className="truncate text-xs text-gray-500">{meta.description}</div>
        </div>
        <Space size={2}>
          <Tooltip title="Move to top">
            <Button size="small" type="text" icon={<VerticalAlignTopOutlined />} disabled={index === 0} onClick={() => onMove(0)} aria-label={`Move ${meta.label} to top`} />
          </Tooltip>
          <Tooltip title="Move up">
            <Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Move ${meta.label} up`} />
          </Tooltip>
          <Tooltip title="Move down">
            <Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={index === total - 1} onClick={() => onMove(index + 1)} aria-label={`Move ${meta.label} down`} />
          </Tooltip>
          <Tooltip title="Move to bottom">
            <Button size="small" type="text" icon={<VerticalAlignBottomOutlined />} disabled={index === total - 1} onClick={() => onMove(total - 1)} aria-label={`Move ${meta.label} to bottom`} />
          </Tooltip>
          <Button size="small" type="link" onClick={() => setOpen((o) => !o)}>
            {open ? 'Close' : 'Edit text'}
          </Button>
          <Switch
            checkedChildren={<EyeOutlined />}
            unCheckedChildren={<EyeInvisibleOutlined />}
            checked={section.enabled}
            onChange={(enabled) => onChange({ ...section, enabled })}
            aria-label={`Show ${meta.label}`}
          />
        </Space>
      </div>
      {open && (
        <div className="grid gap-3 border-t border-gray-100 p-3 sm:grid-cols-2">
          <Input
            placeholder="Heading (leave empty for default)"
            maxLength={80}
            value={section.title}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
            aria-label={`${meta.label} heading`}
          />
          <Input
            placeholder="Sub-heading (leave empty for default)"
            maxLength={200}
            value={section.subtitle}
            onChange={(e) => onChange({ ...section, subtitle: e.target.value })}
            aria-label={`${meta.label} sub-heading`}
          />
        </div>
      )}
    </div>
  );
}

export function SectionManager({ sections, onChange }: { sections: HomeSectionConfig[]; onChange: (s: HomeSectionConfig[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = sections.findIndex((s) => s.id === e.active.id);
    const to = sections.findIndex((s) => s.id === e.over!.id);
    onChange(moveSection(sections, from, to));
  };
  const visible = sections.filter((s) => s.enabled).length;
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Typography.Text type="secondary">
          Drag <HolderOutlined /> or use the arrows to reorder. {visible} of {sections.length} sections visible.
        </Typography.Text>
        <Space>
          <Button size="small" onClick={() => onChange(sections.map((s) => ({ ...s, enabled: true })))}>
            Show all
          </Button>
          <Button
            size="small"
            icon={<UndoOutlined />}
            onClick={() => onChange(HOME_SECTION_IDS.map((id) => sections.find((s) => s.id === id)!))}
          >
            Default order
          </Button>
        </Space>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((s, i) => (
            <SortableSection
              key={s.id}
              section={s}
              index={i}
              total={sections.length}
              onChange={(next) => onChange(sections.map((x) => (x.id === next.id ? next : x)))}
              onMove={(to) => onChange(moveSection(sections, i, to))}
            />
          ))}
        </SortableContext>
      </DndContext>
    </>
  );
}

const EFFECTS: Array<{ value: SiteConfig['hero']['effect']; label: string; hint: string }> = [
  { value: 'kenburns', label: 'Ken Burns', hint: 'Crossfade + slow cinematic zoom' },
  { value: 'fade', label: 'Fade', hint: 'Soft crossfade' },
  { value: 'slide', label: 'Slide', hint: 'Slides sideways' },
  { value: 'zoom', label: 'Zoom', hint: 'Zooms in on change' },
];

/* ───────────── Page ───────────── */

export default function AdminAppearance() {
  const { saved, setPreview } = useSiteConfig();
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<SiteConfig>(saved);
  const [tab, setTab] = useState('theme');
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  // When the saved config loads/changes and nothing is being edited, adopt it.
  useEffect(() => {
    if (!dirty) setDraft(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  // Live preview of unsaved edits across the whole site; reverted when leaving the page.
  useEffect(() => {
    setPreview(dirty ? draft : null);
  }, [draft, dirty, setPreview]);
  useEffect(() => () => setPreview(null), [setPreview]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const onSaved = (config: SiteConfig, text: string) => {
    qc.setQueryData(['site-config'], config);
    qc.invalidateQueries({ queryKey: ['home'] });
    setDraft(config);
    setPreview(null);
    message.success(text);
  };
  const save = useMutation({ mutationFn: siteConfigApi.save, onSuccess: (c) => onSaved(c, 'Website settings saved'), onError: (e) => message.error(errorMessage(e)) });
  const reset = useMutation({ mutationFn: siteConfigApi.reset, onSuccess: (c) => onSaved(c, 'Restored default settings'), onError: (e) => message.error(errorMessage(e)) });

  const set = <K extends keyof SiteConfig>(key: K, patch: Partial<SiteConfig[K]>) =>
    setDraft((d) => ({ ...d, [key]: Array.isArray(d[key]) ? patch : { ...(d[key] as object), ...patch } }) as SiteConfig);
  const t = draft.theme;
  const h = draft.hero;

  const themeTab = (
    <Row gutter={[24, 24]}>
      <Col xs={24} xl={14}>
        <Card title="Preset themes" size="small" className="mb-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((p) => {
              const c = THEME_PRESETS[p];
              const active = t.preset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('theme', { preset: p, ...c })}
                  className={`rounded-xl border-2 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-brand shadow-md' : 'border-gray-200'}`}
                  aria-pressed={active}
                >
                  <div className="flex h-8 overflow-hidden rounded-lg">
                    {[c.ink, c.primary, c.accent, c.accent2, c.accent3].map((x) => (
                      <span key={x} className="flex-1" style={{ background: x }} />
                    ))}
                  </div>
                  <div className="mt-2 text-sm font-semibold">{PRESET_LABELS[p]}</div>
                </button>
              );
            })}
          </div>
          {t.preset === 'custom' && <Tag color="purple" className="mt-3">Custom colours</Tag>}
        </Card>
        <Card title="Colours" size="small" className="mb-4">
          <div className="grid gap-x-6 sm:grid-cols-2">
            {COLOR_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                <ColorPicker
                  value={t[f.key]}
                  showText
                  disabledAlpha
                  onChange={(c) => set('theme', { preset: 'custom', [f.key]: c.toHexString().slice(0, 7) })}
                />
              </Field>
            ))}
          </div>
        </Card>
        <Card title="Shape & typography" size="small">
          <Field label="Corner style">
            <Segmented
              value={t.radius}
              onChange={(v) => set('theme', { radius: v as SiteConfig['theme']['radius'] })}
              options={[
                { label: 'Sharp', value: 'sharp' },
                { label: 'Soft', value: 'soft' },
                { label: 'Round', value: 'round' },
              ]}
            />
          </Field>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Field label="Heading font">
                <Select className="w-full" value={t.headingFont} onChange={(v) => set('theme', { headingFont: v })} options={[{ value: 'Montserrat' }, { value: 'Playfair Display' }]} />
              </Field>
            </Col>
            <Col xs={24} sm={12}>
              <Field label="Script / logo font">
                <Select className="w-full" value={t.scriptFont} onChange={(v) => set('theme', { scriptFont: v })} options={[{ value: 'Great Vibes' }, { value: 'Pinyon Script' }, { value: 'Playfair Display' }]} />
              </Field>
            </Col>
          </Row>
        </Card>
      </Col>
      <Col xs={24} xl={10}>
        <Affix offsetTop={88}>
          <div>
            <Typography.Text type="secondary" className="mb-2 block">
              Live preview — your edits also preview across the whole site until you save or leave.
            </Typography.Text>
            <ThemePreview theme={t} siteName={draft.branding.siteName} />
          </div>
        </Affix>
      </Col>
    </Row>
  );

  const heroTab = (
    <Row gutter={[24, 24]}>
      <Col xs={24} xl={12}>
        <Card title="Hero carousel" size="small" className="mb-4">
          <ToggleRow label="Show hero" hint="Turn off for a compact homepage header." checked={h.enabled} onChange={(v) => set('hero', { enabled: v })} />
          <ToggleRow label="Autoplay" hint="Pauses on hover and when the tab is hidden." checked={h.autoplay} onChange={(v) => set('hero', { autoplay: v })} />
          <Field label={`Slide duration: ${h.intervalSeconds}s`}>
            <Slider min={3} max={30} value={h.intervalSeconds} onChange={(v) => set('hero', { intervalSeconds: v })} disabled={!h.autoplay} />
          </Field>
          <Field label="Transition effect">
            <Radio.Group value={h.effect} onChange={(e) => set('hero', { effect: e.target.value })} className="grid w-full grid-cols-2 gap-2">
              {EFFECTS.map((e) => (
                <Radio.Button key={e.value} value={e.value} className="!h-auto !rounded-lg !py-2 !leading-tight">
                  <div className="font-semibold">{e.label}</div>
                  <div className="text-[11px] opacity-70">{e.hint}</div>
                </Radio.Button>
              ))}
            </Radio.Group>
          </Field>
          <Field label={`Image darkness: ${h.overlayOpacity}%`} hint="Higher values make text easier to read on bright images.">
            <Slider min={0} max={90} value={h.overlayOpacity} onChange={(v) => set('hero', { overlayOpacity: v })} />
          </Field>
          <Field label="Height">
            <Segmented
              value={h.height}
              onChange={(v) => set('hero', { height: v as SiteConfig['hero']['height'] })}
              options={[
                { label: 'Full screen', value: 'full' },
                { label: 'Large', value: 'large' },
                { label: 'Medium', value: 'medium' },
              ]}
            />
          </Field>
          <ToggleRow label="Search bar" checked={h.showSearch} onChange={(v) => set('hero', { showSearch: v })} />
          <ToggleRow label="Floating paint particles" checked={h.showParticles} onChange={(v) => set('hero', { showParticles: v })} />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card title="Hero text & buttons" size="small" className="mb-4">
          <ToggleRow
            label="Use each banner's own title, subtitle and link"
            hint="Off: the texts below are shown on every slide."
            checked={h.useBannerText}
            onChange={(v) => set('hero', { useBannerText: v })}
          />
          <Field label="Small label above headline">
            <Input maxLength={60} value={h.eyebrow} onChange={(e) => set('hero', { eyebrow: e.target.value })} />
          </Field>
          <Field label="Headline">
            <Input maxLength={80} value={h.headline} onChange={(e) => set('hero', { headline: e.target.value })} status={h.headline.trim() ? undefined : 'error'} />
          </Field>
          <Field label="Sub-headline">
            <Input.TextArea maxLength={220} autoSize={{ minRows: 2, maxRows: 4 }} value={h.subheadline} onChange={(e) => set('hero', { subheadline: e.target.value })} />
          </Field>
          <Row gutter={12}>
            <Col span={12}>
              <Field label="Main button">
                <Input maxLength={40} value={h.primaryCtaLabel} onChange={(e) => set('hero', { primaryCtaLabel: e.target.value })} />
              </Field>
            </Col>
            <Col span={12}>
              <Field label="Main button link" hint="/gallery or https://…">
                <Input maxLength={300} value={h.primaryCtaHref} onChange={(e) => set('hero', { primaryCtaHref: e.target.value })} />
              </Field>
            </Col>
            <Col span={12}>
              <Field label="Second button">
                <Input maxLength={40} value={h.secondaryCtaLabel} onChange={(e) => set('hero', { secondaryCtaLabel: e.target.value })} />
              </Field>
            </Col>
            <Col span={12}>
              <Field label="Second button link">
                <Input maxLength={300} value={h.secondaryCtaHref} onChange={(e) => set('hero', { secondaryCtaHref: e.target.value })} />
              </Field>
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={24}>
        <AdminBanners />
      </Col>
    </Row>
  );

  const contentTab = (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Card title="Branding" size="small" className="mb-4">
          <Field label="Site name" hint="Shown in the logo, page titles and footer.">
            <Input maxLength={60} value={draft.branding.siteName} onChange={(e) => set('branding', { siteName: e.target.value })} status={draft.branding.siteName.trim() ? undefined : 'error'} />
          </Field>
          <Field label="Tagline">
            <Input maxLength={120} value={draft.branding.tagline} onChange={(e) => set('branding', { tagline: e.target.value })} />
          </Field>
          <ToggleRow label="Script-style logo" checked={draft.branding.scriptLogo} onChange={(v) => set('branding', { scriptLogo: v })} />
        </Card>
        <Card title="Announcement bar" size="small" className="mb-4">
          <ToggleRow label="Show announcement bar" hint="A strip above the navigation on every page." checked={draft.announcement.enabled} onChange={(v) => set('announcement', { enabled: v })} />
          <Field label="Message">
            <Input maxLength={160} value={draft.announcement.text} onChange={(e) => set('announcement', { text: e.target.value })} />
          </Field>
          <Field label="Link (optional)" hint="/gallery or https://…">
            <Input maxLength={300} value={draft.announcement.href} onChange={(e) => set('announcement', { href: e.target.value })} />
          </Field>
          <Field label="Style">
            <Segmented
              value={draft.announcement.tone}
              onChange={(v) => set('announcement', { tone: v as SiteConfig['announcement']['tone'] })}
              options={[
                { label: 'Brand gradient', value: 'brand' },
                { label: 'Dark', value: 'dark' },
                { label: 'Warm', value: 'accent' },
              ]}
            />
          </Field>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="Contact details" size="small" className="mb-4">
          {(['email', 'phone', 'address', 'hours'] as const).map((k) => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
              <Input maxLength={k === 'address' ? 200 : 120} value={draft.contact[k]} onChange={(e) => set('contact', { [k]: e.target.value })} />
            </Field>
          ))}
        </Card>
        <Card title="Social links" size="small" className="mb-4">
          <Typography.Text type="secondary" className="mb-3 block text-xs">
            Leave empty to hide an icon. Use full https:// links.
          </Typography.Text>
          {(['instagram', 'facebook', 'twitter', 'youtube', 'pinterest', 'whatsapp'] as const).map((k) => (
            <Field key={k} label={k === 'twitter' ? 'X (Twitter)' : k[0].toUpperCase() + k.slice(1)}>
              <Input maxLength={300} placeholder="https://" value={draft.social[k]} onChange={(e) => set('social', { [k]: e.target.value })} />
            </Field>
          ))}
        </Card>
        <Card title="Footer" size="small">
          <Field label="About text">
            <Input.TextArea maxLength={600} showCount autoSize={{ minRows: 3, maxRows: 6 }} value={draft.footer.about} onChange={(e) => set('footer', { about: e.target.value })} />
          </Field>
          <Field label="Copyright line">
            <Input maxLength={160} value={draft.footer.copyright} onChange={(e) => set('footer', { copyright: e.target.value })} />
          </Field>
          <ToggleRow label="Newsletter sign-up" checked={draft.footer.newsletterEnabled} onChange={(v) => set('footer', { newsletterEnabled: v })} />
          <ToggleRow label="“Chat with us” button" checked={draft.footer.showChatWidget} onChange={(v) => set('footer', { showChatWidget: v })} />
        </Card>
      </Col>
    </Row>
  );

  const animationsTab = (
    <Card size="small" className="max-w-2xl">
      <ToggleRow label="Enable animations" hint="Off = a calm, static site (also respected automatically for visitors who prefer reduced motion)." checked={draft.animations.enabled} onChange={(v) => set('animations', { enabled: v })} />
      <Field label="Intensity">
        <Segmented
          disabled={!draft.animations.enabled}
          value={draft.animations.intensity}
          onChange={(v) => set('animations', { intensity: v as SiteConfig['animations']['intensity'] })}
          options={[
            { label: 'Subtle', value: 'subtle' },
            { label: 'Normal', value: 'normal' },
            { label: 'Lively', value: 'lively' },
          ]}
        />
      </Field>
      <ToggleRow label="Page transitions" checked={draft.animations.pageTransitions} onChange={(v) => set('animations', { pageTransitions: v })} />
    </Card>
  );

  return (
    <div className="pb-24">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography.Title level={3} className="!mb-1">
            Appearance & website settings
          </Typography.Title>
          <Typography.Text type="secondary">Theme, homepage layout, hero carousel and site-wide content. Only administrators can change these.</Typography.Text>
        </div>
      </div>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'theme', label: <span><BgColorsOutlined /> Theme</span>, children: themeTab },
          {
            key: 'layout',
            label: <span><LayoutOutlined /> Homepage layout</span>,
            children: (
              <Card size="small" className="max-w-4xl">
                <SectionManager sections={draft.homeSections} onChange={(homeSections) => setDraft((d) => ({ ...d, homeSections }))} />
              </Card>
            ),
          },
          { key: 'hero', label: <span><PictureOutlined /> Hero & banners</span>, children: heroTab },
          { key: 'content', label: <span><FontSizeOutlined /> Branding & content</span>, children: contentTab },
          { key: 'animations', label: <span><ThunderboltOutlined /> Animations</span>, children: animationsTab },
        ]}
      />

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-6 py-3 shadow-[0_-8px_30px_-12px_rgba(0,0,0,.25)] backdrop-blur md:left-[250px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {dirty ? <Alert type="warning" showIcon message="Unsaved changes — previewing live" className="!py-1" /> : <Typography.Text type="secondary">All changes saved</Typography.Text>}
          <Space wrap>
            <Popconfirm
              title="Reset every website setting to the defaults?"
              description="Theme, layout, hero and content will all be restored."
              okText="Reset"
              okButtonProps={{ danger: true }}
              onConfirm={() => reset.mutate()}
            >
              <Button danger loading={reset.isPending}>
                Reset to defaults
              </Button>
            </Popconfirm>
            <Button
              disabled={!dirty}
              onClick={() =>
                modal.confirm({
                  title: 'Discard unsaved changes?',
                  okText: 'Discard',
                  okButtonProps: { danger: true },
                  onOk: () => setDraft(saved),
                })
              }
            >
              Discard
            </Button>
            <Button
              type="primary"
              disabled={!dirty || !draft.branding.siteName.trim() || !draft.hero.headline.trim()}
              loading={save.isPending}
              onClick={() => save.mutate(draft)}
            >
              Save changes
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
