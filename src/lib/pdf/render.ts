// Thin wrapper over @react-pdf/renderer's `renderToBuffer` so call sites
// don't have to know about the Node-only buffer API. We return a Buffer
// because Resend's attachments API and Next.js Response bodies both accept
// it directly.
//
// React-pdf is server-only — it pulls in node:fs and other Node APIs. Don't
// import this file from any client component.

import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";

export async function renderPdf(
  doc: ReactElement<DocumentProps>,
): Promise<Buffer> {
  return renderToBuffer(doc);
}
