/**
 * Las filas de formulario de Ventana (las gemelas de las de la consola de Feed
 * vertical, ya borrada), sin texto escrito: todo lo visible llega por props (`words`, `label`,
 * `cancelLabel`, `copiedLabel`), así que valen en los tres idiomas.
 *
 * - `SaveRow`: el pie de un formulario. El aviso a la izquierda, con su sitio
 *   reservado y siempre una frase; el botón de guardar, cerrado hasta que hay
 *   algo que guardar (y primario sólo entonces).
 * - `ConfirmRow`: cancelar y confirmar un acto, con su error; confirmar se
 *   cierra mientras falte algo o mientras corre.
 * - `CopyButton`: copiar un valor. Con `text` es una cápsula de filete con
 *   palabra; sin él, un botón redondo con su nombre. Un portapapeles rechazado
 *   cuesta la comodidad, no el valor, que sigue impreso donde esté.
 *
 * Ninguna lleva vidrio: viven dentro de láminas sólidas.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Button, IconButton } from "./button";
import { Alert } from "./content";

export interface SaveWords {
	saving: string;
	saved: string;
	blocked: string;
	unsaved: string;
	clean: string;
}

export function SaveRow({
	dirty,
	pending,
	saved = false,
	blocked = false,
	label,
	extra,
	words,
}: {
	dirty: boolean;
	pending: boolean;
	saved?: boolean;
	/** Hay cambios pero un campo no pasaría: el botón sigue cerrado y el aviso lo dice. */
	blocked?: boolean;
	label: string;
	/** Otro botón a la izquierda del de guardar («Deshacer»). */
	extra?: ReactNode;
	words: SaveWords;
}) {
	const status = pending ? words.saving : saved && !dirty ? words.saved : dirty && blocked ? words.blocked : dirty ? words.unsaved : words.clean;
	const ready = dirty && !blocked;
	return (
		<div className="vn-saverow">
			<p className="vn-small vn-saverow__status" aria-live="polite">
				{status}
			</p>
			{extra}
			<Button type="submit" size="sm" variant={ready ? "primary" : "line"} disabled={!ready || pending} aria-busy={pending || undefined}>
				{pending ? words.saving : label}
			</Button>
		</div>
	);
}

export function ConfirmRow({
	danger = false,
	error,
	pending,
	label,
	pendingLabel,
	cancelLabel,
	onCancel,
	onConfirm,
	canConfirm = true,
}: {
	danger?: boolean;
	error: Error | null;
	pending: boolean;
	label: string;
	pendingLabel: string;
	cancelLabel: string;
	onCancel: () => void;
	onConfirm: () => void;
	/** Falso mientras falte algo para poder confirmar (el código tecleado, una casilla). */
	canConfirm?: boolean;
}) {
	return (
		<div className="vn-confirmrow">
			<Alert error={error} />
			<div className="vn-confirmrow__actions">
				<Button type="button" size="sm" variant="plain" onClick={onCancel} disabled={pending}>
					{cancelLabel}
				</Button>
				<Button type="button" size="sm" variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={!canConfirm || pending} aria-busy={pending || undefined}>
					{pending ? pendingLabel : label}
				</Button>
			</div>
		</div>
	);
}

/** Copiado durante 1.6 s; se limpia al desmontar. */
function useCopied(): [boolean, (value: string) => void] {
	const [copied, setCopied] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	useEffect(() => () => clearTimeout(timer.current), []);
	const copy = (value: string) => {
		void navigator.clipboard
			?.writeText(value)
			.then(() => {
				setCopied(true);
				clearTimeout(timer.current);
				timer.current = setTimeout(() => setCopied(false), 1600);
			})
			.catch(() => {});
	};
	return [copied, copy];
}

export function CopyButton({ value, label, text, copiedLabel }: { value: string; label: string; text?: string; copiedLabel: string }) {
	const [copied, copy] = useCopied();
	const icon = copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />;
	return (
		<>
			{text ? (
				<Button type="button" size="sm" variant="line" onClick={() => copy(value)}>
					{icon}
					{copied ? copiedLabel : text}
				</Button>
			) : (
				<IconButton label={label} variant="line" size="sm" onClick={() => copy(value)}>
					{icon}
				</IconButton>
			)}
			<span className="vn-sr-only" aria-live="polite">
				{copied ? copiedLabel : ""}
			</span>
		</>
	);
}
