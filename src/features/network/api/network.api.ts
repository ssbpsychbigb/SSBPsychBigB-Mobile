/**
 * Network REST — same contracts as the web profile API.
 */

import { apiRequest } from '@/shared/api';
import type {
  NetworkGraphKind,
  NetworkOverview,
  NetworkPage,
  NetworkSuggestionsPage,
} from '@/features/network/types/network.types';

function withCursor(path: string, cursor?: string | null, limit = 24): string {
  const search = new URLSearchParams();
  if (cursor) {
    search.set('cursor', cursor);
  }
  search.set('limit', String(limit));
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export const networkApi = {
  getOverview(token: string) {
    return apiRequest<NetworkOverview>('/profile/me/network-overview', { token });
  },

  getSuggestions(
    token?: string | null,
    cursor?: string | null,
  ): Promise<NetworkSuggestionsPage> {
    return apiRequest<NetworkSuggestionsPage>(
      withCursor('/profile/me/suggestions', cursor),
      { token },
    );
  },

  getProfileNetwork(params: {
    username: string;
    kind: NetworkGraphKind;
    token?: string | null;
    cursor?: string | null;
  }): Promise<NetworkPage> {
    const search = new URLSearchParams();
    search.set('kind', params.kind);
    search.set('limit', '24');
    if (params.cursor) {
      search.set('cursor', params.cursor);
    }
    return apiRequest<NetworkPage>(
      `/profile/${encodeURIComponent(params.username)}/network?${search.toString()}`,
      { token: params.token },
    );
  },
};
