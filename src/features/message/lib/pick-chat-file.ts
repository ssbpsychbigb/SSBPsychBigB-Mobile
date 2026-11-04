/**
 * Helpers for chat file attachments (no extra native module).
 */

export type PickedChatFile = {
  uri: string;
  name: string;
  type?: string;
  size?: number;
};

/**
 * Builds a FormData file part from a data URL picked in the in-app file sheet.
 */
export async function dataUrlToChatFilePart(
  dataUrl: string,
  name: string,
  mime?: string,
): Promise<{ uri: string; type: string; name: string }> {
  const type = mime || 'application/octet-stream';
  // RN FormData accepts the data URL as uri on both platforms for multipart.
  return {
    uri: dataUrl,
    type,
    name: name || 'attachment.bin',
  };
}
