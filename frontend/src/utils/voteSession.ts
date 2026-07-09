import type { PollResponse, PollStatus } from '../types/poll';

export const DEFAULT_SESSION_LIMIT = 12;

type QueuePoll = Pick<PollResponse, 'id' | 'circle_id'> & {
  status?: PollStatus;
  has_voted?: boolean;
  ends_at?: string;
};

interface BuildVoteSessionQueueOptions {
  circleId?: string;
  limit?: number;
  now?: Date;
}

export function buildVoteSessionQueue<TPoll extends QueuePoll>(
  polls: TPoll[] | undefined,
  options: BuildVoteSessionQueueOptions = {}
): TPoll[] {
  if (!polls?.length) return [];

  const {
    circleId,
    limit = DEFAULT_SESSION_LIMIT,
    now = new Date(),
  } = options;
  const nowTime = now.getTime();

  const eligiblePolls = polls.filter((poll) => {
    if (circleId && poll.circle_id !== circleId) return false;
    if (poll.status && poll.status !== 'ACTIVE') return false;
    if (poll.has_voted) return false;
    if (poll.ends_at && new Date(poll.ends_at).getTime() <= nowTime) return false;
    return true;
  });

  const groups = new Map<string, TPoll[]>();
  eligiblePolls.forEach((poll) => {
    const group = groups.get(poll.circle_id);
    if (group) {
      group.push(poll);
    } else {
      groups.set(poll.circle_id, [poll]);
    }
  });

  const queue: TPoll[] = [];
  const groupedPolls = Array.from(groups.values());

  while (queue.length < limit && groupedPolls.some((group) => group.length > 0)) {
    groupedPolls.forEach((group) => {
      if (queue.length >= limit) return;
      const poll = group.shift();
      if (poll) queue.push(poll);
    });
  }

  return queue;
}
