import { buildVoteSessionQueue } from '../voteSession';
import type { PollResponse } from '../../types/poll';

const futureDate = '2030-01-01T00:00:00.000Z';
const pastDate = '2020-01-01T00:00:00.000Z';

function poll(
  id: string,
  circleId: string,
  overrides: Partial<PollResponse> = {}
): PollResponse {
  return {
    id,
    circle_id: circleId,
    template_id: `template-${id}`,
    creator_id: `creator-${id}`,
    question_text: `Question ${id}`,
    question: `Question ${id}`,
    status: 'ACTIVE',
    ends_at: futureDate,
    vote_count: 0,
    created_at: '2029-01-01T00:00:00.000Z',
    updated_at: '2029-01-01T00:00:00.000Z',
    has_voted: false,
    ...overrides,
  };
}

describe('buildVoteSessionQueue', () => {
  it('filters voted, inactive, expired, and other-circle polls', () => {
    const queue = buildVoteSessionQueue(
      [
        poll('a1', 'circle-a'),
        poll('a2', 'circle-a', { has_voted: true }),
        poll('a3', 'circle-a', { status: 'COMPLETED' }),
        poll('a4', 'circle-a', { ends_at: pastDate }),
        poll('b1', 'circle-b'),
      ],
      { circleId: 'circle-a', now: new Date('2026-01-01T00:00:00.000Z') }
    );

    expect(queue.map((item) => item.id)).toEqual(['a1']);
  });

  it('round-robins polls across circles', () => {
    const queue = buildVoteSessionQueue(
      [
        poll('a1', 'circle-a'),
        poll('a2', 'circle-a'),
        poll('b1', 'circle-b'),
        poll('b2', 'circle-b'),
        poll('c1', 'circle-c'),
      ],
      { now: new Date('2026-01-01T00:00:00.000Z') }
    );

    expect(queue.map((item) => item.id)).toEqual(['a1', 'b1', 'c1', 'a2', 'b2']);
  });

  it('respects the queue limit', () => {
    const queue = buildVoteSessionQueue(
      [
        poll('a1', 'circle-a'),
        poll('a2', 'circle-a'),
        poll('b1', 'circle-b'),
        poll('b2', 'circle-b'),
      ],
      { limit: 3, now: new Date('2026-01-01T00:00:00.000Z') }
    );

    expect(queue).toHaveLength(3);
    expect(queue.map((item) => item.id)).toEqual(['a1', 'b1', 'a2']);
  });
});
