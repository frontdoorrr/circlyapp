import {
  calculateEndDate,
  formatTimeRemaining,
  formatTimeRemainingShort,
  getDurationLabel,
  getTimeUrgency,
  isExpired,
} from '../timeUtils';

describe('timeUtils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('formatTimeRemaining', () => {
    it('마감된 투표는 "마감됨"을 반환한다', () => {
      expect(formatTimeRemaining('2026-01-01T11:00:00Z')).toBe('마감됨');
    });

    it('1시간 미만은 분 단위로 표시한다', () => {
      expect(formatTimeRemaining('2026-01-01T12:30:00Z')).toBe('30분 남음');
    });

    it('정각 단위 시간은 "NH 남음"으로 표시한다', () => {
      expect(formatTimeRemaining('2026-01-01T15:00:00Z')).toBe('3H 남음');
    });

    it('24시간 이상은 일 단위로 표시한다', () => {
      expect(formatTimeRemaining('2026-01-03T12:00:00Z')).toBe('2일 남음');
    });
  });

  describe('formatTimeRemainingShort', () => {
    it('마감된 투표는 "마감"을 반환한다', () => {
      expect(formatTimeRemainingShort('2026-01-01T11:00:00Z')).toBe('마감');
    });

    it('시간 단위로 짧게 표시한다', () => {
      expect(formatTimeRemainingShort('2026-01-01T15:00:00Z')).toBe('3H');
    });
  });

  describe('getTimeUrgency', () => {
    it('30분 미만은 urgent', () => {
      expect(getTimeUrgency('2026-01-01T12:20:00Z')).toBe('urgent');
    });

    it('1시간 미만은 warning', () => {
      expect(getTimeUrgency('2026-01-01T12:45:00Z')).toBe('warning');
    });

    it('1시간 이상은 normal', () => {
      expect(getTimeUrgency('2026-01-01T15:00:00Z')).toBe('normal');
    });
  });

  describe('isExpired', () => {
    it('과거 시간은 true', () => {
      expect(isExpired('2026-01-01T11:59:59Z')).toBe(true);
    });

    it('미래 시간은 false', () => {
      expect(isExpired('2026-01-01T12:00:01Z')).toBe(false);
    });
  });

  describe('calculateEndDate', () => {
    it('duration 옵션만큼 시간을 더한다', () => {
      const start = new Date('2026-01-01T12:00:00Z');
      expect(calculateEndDate('3H', start).toISOString()).toBe('2026-01-01T15:00:00.000Z');
      expect(calculateEndDate('24H', start).toISOString()).toBe('2026-01-02T12:00:00.000Z');
    });
  });

  describe('getDurationLabel', () => {
    it('한국어 레이블을 반환한다', () => {
      expect(getDurationLabel('1H')).toBe('1시간');
      expect(getDurationLabel('24H')).toBe('24시간');
    });
  });
});
