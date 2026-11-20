/**
 * Las piezas sólidas de contenido de Ventana: Section, Row, Skeleton, Alert,
 * Status, Tabs, Progress, Accordion y Monogram. Ninguna es vidrio (el vidrio es
 * sólo para lo que flota): pintan su fondo y su filete sobre el suelo, en tinta.
 * Los estilos están en `styles/ventana/content.css`; el CSS de Ventana es
 * autocontenido, así que no hay clases de Tailwind.
 *
 * Paridad con `sky/console.tsx` (mismas props, mismo sitio para cada una):
 * - `Section` añade `level` (2 por defecto, 3 si la página ya tiene un h2).
 * - `Skeleton` recibe `label` (sky escribía «Loading» a mano) y lleva `role="group"`
 *   (nombrable y sin ser una región viva: un marcador de posición no se anuncia).
 * - `Status` es `StatusBox` de sky; el tono `alert` se dice con borde y título en
 *   danger, y la caja es siempre `--vn-surface` (sky usaba un fondo rojo apagado).
 * - `Monogram` repite las iniciales de sky (`markOf`, que no es público allí).
 */
import { ChevronDown, CircleAlert } from "lucide-react";
import { Accordion as A, Tabs as T } from "radix-ui";
import { createElement, useState, type CSSProperties, type ReactNode } from "react";

/** ¿Hay algo que mostrar? Ni vacío, ni nulo, ni false; el número 0 sí se muestra. */
const present = (node: ReactNode) => node !== undefined && node !== null && node !== false && node !== "";

// ─── Section ─────────────────────────────────────────────────────────────────

/** Una sección de página: filete arriba, título, dato vivo en voz pequeña y su única acción. */
export function Section({
	id,
	title,
	meta,
	action,
	children,
	level = 2,
}: {
	id: string;
	title: ReactNode;
	/** El dato vivo de la sección: «12 atribuidos». */
	meta?: ReactNode;
	/** El único control que cambia lo que enseña la sección. */
	action?: ReactNode;
	children: ReactNode;
	/** Nivel del encabezado: 2 por defecto, 3 si la sección vive bajo otro h2. */
	level?: 2 | 3;
}) {
	return (
		<section id={id} className="vn-section" aria-labelledby={`${id}-title`}>
			<div className="vn-section__head">
				<div className="vn-section__titles">
					{createElement(`h${level}`, { id: `${id}-title`, className: "vn-title-2 vn-section__title" }, title)}
					{present(meta) && <p className="vn-small vn-section__meta">{meta}</p>}
				</div>
				{present(action) && <div className="vn-section__action">{action}</div>}
			</div>
			<div className="vn-section__body">{children}</div>
		</section>
	);
}

// ─── Row ─────────────────────────────────────────────────────────────────────

/**
 * Una fila de lista bajo un filete. Un solo elemento es el objetivo: con `href`
 * toda la fila es un `<a>`, con `onClick` un `<button type="button">` y, sin
 * ninguno, un `<div>`. `end` debe ser NO interactivo cuando la fila es enlace o
 * botón: un botón dentro de otro objetivo es anidación inválida y aquí no se
 * resuelve; para una fila con acciones propias, déjala sin `href` ni `onClick`.
 */
export function Row({
	title,
	meta,
	lead,
	end,
	href,
	onClick,
}: {
	title: ReactNode;
	meta?: ReactNode;
	lead?: ReactNode;
	end?: ReactNode;
	href?: string;
	onClick?: () => void;
}) {
	const inner = (
		<>
			{present(lead) && <span className="vn-row__lead">{lead}</span>}
			<span className="vn-row__body">
				<span className="vn-row__title">{title}</span>
				{present(meta) && <span className="vn-small vn-row__meta">{meta}</span>}
			</span>
			{present(end) && <span className="vn-row__end">{end}</span>}
		</>
	);
	if (href !== undefined) {
		return (
			<a href={href} className="vn-row vn-row--action">
				{inner}
			</a>
		);
	}
	if (onClick) {
		return (
			<button type="button" onClick={onClick} className="vn-row vn-row--action">
				{inner}
			</button>
		);
	}
	return <div className="vn-row">{inner}</div>;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

/** La forma de lo que viene mientras llega: bloques que sólo cambian de opacidad, sin brillo que barra. */
export function Skeleton({ rows = 4, label }: { rows?: number; label: string }) {
	return (
		<div role="group" aria-busy="true" aria-label={label} className="vn-skel">
			<div className="vn-skel__block vn-skel__block--head" />
			{Array.from({ length: rows }, (_, i) => (
				<div key={i} className="vn-skel__block" style={{ inlineSize: `${Math.max(30, 92 - i * 9)}%` }} />
			))}
		</div>
	);
}

// ─── Alert y Status ──────────────────────────────────────────────────────────

/** El error con el que volvió el servidor, con sus palabras. Sin texto no pinta nada. */
export function Alert({ error, children }: { error?: Error | null; children?: ReactNode }) {
	const text = present(children) ? children : error?.message;
	if (!present(text)) return null;
	return (
		<div role="alert" className="vn-alert">
			<CircleAlert className="vn-alert__icon" strokeWidth={2} aria-hidden="true" />
			<p className="vn-alert__text">{text}</p>
		</div>
	);
}

/** Un estado que hay que mirar, en una caja sólida: su sello, su título, su explicación y su pie. */
export function Status({
	tone = "ink",
	stamp,
	title,
	children,
	footer,
}: {
	tone?: "ink" | "alert";
	stamp?: ReactNode;
	title: ReactNode;
	children?: ReactNode;
	footer?: ReactNode;
}) {
	return (
		<div className="vn-status" data-tone={tone}>
			<div className="vn-status__head">
				{stamp}
				<p className="vn-status__title">{title}</p>
			</div>
			{present(children) && <div className="vn-status__text">{children}</div>}
			{present(footer) && <div className="vn-status__footer">{footer}</div>}
		</div>
	);
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

/** Pestañas de Radix con activación automática: la flecha mueve el foco y elige. */
export function Tabs<T extends string>({
	value,
	onChange,
	label,
	tabs,
}: {
	value: T;
	onChange: (v: T) => void;
	label: string;
	tabs: { value: T; label: ReactNode; content: ReactNode }[];
}) {
	return (
		<T.Root value={value} onValueChange={(v) => onChange(v as T)} activationMode="automatic" className="vn-tabs">
			<T.List aria-label={label} className="vn-tabs__list">
				{tabs.map((t) => (
					<T.Trigger key={t.value} value={t.value} className="vn-tabs__tab">
						{t.label}
					</T.Trigger>
				))}
			</T.List>
			{tabs.map((t) => (
				<T.Content key={t.value} value={t.value} className="vn-tabs__panel">
					{t.content}
				</T.Content>
			))}
		</T.Root>
	);
}

// ─── Progress ────────────────────────────────────────────────────────────────

/** Barra de avance: tinta sobre una vía `--vn-raised`. `value` va de 0 a 1 y se recorta. */
export function Progress({ value, label }: { value: number; label: string }) {
	const v = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
	return (
		<div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} aria-label={label} className="vn-progress">
			<div className="vn-progress__bar" style={{ "--vn-progress": v } as CSSProperties} />
		</div>
	);
}

// ─── Accordion ───────────────────────────────────────────────────────────────

/** Acordeón de Radix, varios abiertos a la vez: cada cabecera es un botón de verdad. */
export function Accordion({ items }: { items: { id: string; title: ReactNode; content: ReactNode }[] }) {
	return (
		<A.Root type="multiple" className="vn-acc">
			{items.map((it) => (
				<A.Item key={it.id} value={it.id} className="vn-acc__item">
					<A.Header className="vn-acc__header">
						<A.Trigger className="vn-acc__trigger">
							<span className="vn-acc__title">{it.title}</span>
							<ChevronDown className="vn-acc__chevron" strokeWidth={2} aria-hidden="true" />
						</A.Trigger>
					</A.Header>
					<A.Content className="vn-acc__content">
						<div className="vn-acc__body">{it.content}</div>
					</A.Content>
				</A.Item>
			))}
		</A.Root>
	);
}

// ─── Monogram ────────────────────────────────────────────────────────────────

/** Dos caracteres: las iniciales de dos palabras o el inicio de una. Sólo cuentan palabras con letras o cifras. */
function markOf(name: string): string {
	const words = name
		.trim()
		.split(/\s+/)
		.filter((word) => /[\p{L}\p{N}]/u.test(word));
	if (words.length === 0) return "··";
	if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
	return (words[0][0] + words[1][0]).toUpperCase();
}

/** La cara de un workspace o de una app: su logo o, si falta o no carga, sus iniciales. */
export function Monogram({ name, logoUrl, size = "md" }: { name: string; logoUrl?: string | null; size?: "xs" | "sm" | "md" | "lg" }) {
	const [failed, setFailed] = useState<string | null>(null);
	const cls = `vn-monogram vn-monogram--${size}`;
	if (logoUrl && failed !== logoUrl) {
		return <img src={logoUrl} alt="" onError={() => setFailed(logoUrl)} className={cls} />;
	}
	return (
		<span aria-hidden="true" className={`${cls} vn-monogram--mark`}>
			{markOf(name)}
		</span>
	);
}
