/**
 * Marco de video de Ventana, con la firma de `VideoFrame` de `sky/feed.tsx`: el
 * medio de borde a borde en su formato, radio de panel y el rótulo abajo a la
 * izquierda. El marco trae su propio scrim dentro del envoltorio del rótulo (no usa
 * el `Scrim` de glass.tsx): el degradado lo mide el texto, no el marco, así el
 * rótulo (dos líneas como mucho, con puntos suspensivos) siempre tiene contraste.
 * El envoltorio es posicionamiento decorativo de texto real: no se oculta a los
 * lectores de pantalla. El formato es una clase (`vn-frame--9x16`...): el
 * aspect-ratio vive en `styles/ventana/content.css`. El marco es sólido.
 */
import type { CSSProperties, ReactElement, ReactNode } from "react";

export type VideoFormat = "9:16" | "1:1" | "16:9";

const ratioClass = (format: VideoFormat) => `vn-frame--${format.replace(":", "x")}`;

export function VideoFrame({
	format,
	children,
	caption,
	className,
	dim = false,
	style,
	"aria-label": ariaLabel,
}: {
	format: VideoFormat;
	children?: ReactNode;
	caption?: ReactNode;
	className?: string;
	dim?: boolean;
	style?: CSSProperties;
	"aria-label"?: string;
}): ReactElement {
	const cls = ["vn-frame", ratioClass(format), dim && "is-dim", className].filter(Boolean).join(" ");
	return (
		<div className={cls} style={style} role={ariaLabel ? "group" : undefined} aria-label={ariaLabel}>
			{children}
			{caption != null && (
				<div className="vn-frame__caption">
					<p className="vn-frame__text">{caption}</p>
				</div>
			)}
		</div>
	);
}
