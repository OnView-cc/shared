/**
 * Marco de video de Ventana, con la firma de `VideoFrame` de `sky/feed.tsx`: el
 * medio de borde a borde en su formato, radio de panel y el rótulo abajo a la
 * izquierda sobre un `Scrim`. El rótulo se queda en el 20% inferior del marco y
 * en dos líneas como mucho; ahí es donde el scrim del marco garantiza el
 * contraste. El formato es una clase (`vn-frame--9x16`...): el aspect-ratio vive
 * en `styles/ventana/content.css`. El marco es sólido (el video es su fondo).
 */
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { Scrim } from "./glass";

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
				<>
					<Scrim edge="bottom" className="vn-frame__scrim" />
					<p className="vn-frame__caption">{caption}</p>
				</>
			)}
		</div>
	);
}
