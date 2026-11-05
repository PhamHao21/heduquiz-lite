import { describe, expect, it } from 'vitest';
import { dayKey, summariseActivity } from './activity';

// "Bây giờ" = 2026-11-05 10:00 giờ Việt Nam (03:00 UTC)
const NOW = new Date('2026-11-05T03:00:00Z');
const at = (vnDate: string, hour = 9) => new Date(`${vnDate}T${String(hour).padStart(2, '0')}:00:00+07:00`).toISOString();

describe('dayKey', () => {
  it('tính ngày theo giờ Việt Nam', () => {
    // 23:30 UTC ngày 4 = 06:30 sáng ngày 5 ở Việt Nam
    expect(dayKey(new Date('2026-11-04T23:30:00Z'))).toBe('2026-11-05');
    expect(dayKey(new Date('2026-11-04T16:59:00Z'))).toBe('2026-11-04');
  });
});

describe('summariseActivity', () => {
  it('đếm số lượt theo ngày, ngày cuối là hôm nay', () => {
    const s = summariseActivity([at('2026-11-05'), at('2026-11-05', 20), at('2026-11-03')], NOW, 7);
    expect(s.days).toHaveLength(7);
    expect(s.days.at(-1)).toEqual({ date: '2026-11-05', count: 2 });
    expect(s.days.find(d => d.date === '2026-11-03')?.count).toBe(1);
    expect(s.today).toBe(2);
    expect(s.activeDays).toBe(2);
  });

  it('chuỗi ngày liên tiếp tính đến hôm nay', () => {
    const s = summariseActivity([at('2026-11-05'), at('2026-11-04'), at('2026-11-03'), at('2026-11-01')], NOW, 30);
    expect(s.streak).toBe(3);
    expect(s.bestStreak).toBe(3);
  });

  it('hôm nay chưa ôn nhưng hôm qua có thì chuỗi vẫn còn', () => {
    const s = summariseActivity([at('2026-11-04'), at('2026-11-03')], NOW, 30);
    expect(s.streak).toBe(2);
  });

  it('nghỉ quá một ngày thì chuỗi về 0, chuỗi dài nhất vẫn được giữ', () => {
    const s = summariseActivity(
      [at('2026-11-02'), at('2026-10-20'), at('2026-10-21'), at('2026-10-22'), at('2026-10-23')],
      NOW, 30
    );
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(4);
  });

  it('bỏ qua mốc thời gian hỏng, không có dữ liệu thì toàn số 0', () => {
    const s = summariseActivity(['not-a-date'], NOW, 5);
    expect(s).toMatchObject({ streak: 0, bestStreak: 0, activeDays: 0, today: 0 });
    expect(s.days.every(d => d.count === 0)).toBe(true);
  });
});
