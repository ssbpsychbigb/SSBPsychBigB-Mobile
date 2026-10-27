/**
 * Uploads picked images to `/posts/media` and returns the post media rows.
 */

import { toMultipartFilePart } from '@/features/auth/lib/upload-asset';
import type { PickedAsset } from '@/features/auth/types/register-form';
import { feedApi } from '@/features/feed/api/feed.api';
import type { CreatePostInput } from '@/features/feed/types/feed.types';

export type PostMediaInput = NonNullable<CreatePostInput['media']>;

/** One photo in the composer — freshly picked (`asset`) or from a draft (`remote`). */
export type ComposeMediaItem = {
  key: string;
  uri: string;
  asset?: PickedAsset;
  remote?: PostMediaInput[number];
};

export async function uploadPostImages(
  assets: PickedAsset[],
  token: string,
): Promise<PostMediaInput> {
  if (!assets.length) {
    return [];
  }
  const formData = new FormData();
  assets.forEach((asset) => {
    formData.append('media', toMultipartFilePart(asset, 'media') as unknown as Blob);
  });
  const uploaded = await feedApi.uploadMedia(formData, token);
  return uploaded.media;
}

export async function uploadPostImage(
  asset: PickedAsset,
  token: string,
): Promise<PostMediaInput> {
  return uploadPostImages([asset], token);
}

/**
 * Uploads the new photos in one request and keeps the composer order.
 */
export async function resolveComposeMedia(
  items: ComposeMediaItem[],
  token: string,
): Promise<PostMediaInput> {
  const fresh = items.filter((item) => item.asset).map((item) => item.asset as PickedAsset);
  const uploaded = await uploadPostImages(fresh, token);
  let next = 0;
  return items
    .map((item) => (item.asset ? uploaded[next++] : item.remote))
    .filter((item): item is PostMediaInput[number] => Boolean(item));
}
