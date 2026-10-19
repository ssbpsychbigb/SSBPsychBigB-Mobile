/**
 * Unit tests for network card mapping.
 */

import { toNetworkPersonCard } from '@/features/network/lib/to-network-person-card';
import type { NetworkSuggestion } from '@/features/network/types/network.types';

describe('toNetworkPersonCard', () => {
  it('maps an officer suggestion onto the card model', () => {
    const person: NetworkSuggestion = {
      id: 'u1',
      username: 'vikram',
      fullName: 'Capt Vikram Rao',
      role: 'defence_officer',
      verificationLevel: 2,
      followingAuthor: false,
      followsYou: true,
      isMutual: false,
      isSelf: false,
    };
    const card = toNetworkPersonCard(person);
    expect(card.kind).toBe('officer');
    expect(card.verified).toBe(true);
    expect(card.followsYou).toBe(true);
    expect(card.username).toBe('vikram');
    expect(card.initials).toBe('VR');
  });
});
