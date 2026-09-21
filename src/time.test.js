import test from 'node:test';
import assert from 'node:assert/strict';
import { interviewTimeSeconds, sortInterviewsByTime } from './time.js';

test('sorts mixed time formats chronologically across midnight and noon', () => {
  const times = ['3:00 PM', '12:00 PM', '09:30', '12:00 AM', '3:00 AM', '13:00:01', '13:00:00'];
  const items = times.map(interviewTime => ({ interviewTime }));
  assert.deepEqual(sortInterviewsByTime(items).map(item => item.interviewTime),
    ['12:00 AM', '3:00 AM', '09:30', '12:00 PM', '13:00:00', '13:00:01', '3:00 PM']);
  assert.deepEqual(items.map(item => item.interviewTime), times);
});

test('keeps equal times stable and puts missing or invalid times last', () => {
  const items = [
    { id: 1, interviewTime: '' }, { id: 2, interviewTime: '9:00 am' },
    { id: 3, interviewTime: '09:00' }, { id: 4, interviewTime: 'pending' },
  ];
  assert.deepEqual(sortInterviewsByTime(items).map(item => item.id), [2, 3, 1, 4]);
  for (const value of [undefined, '24:00', '00:00 AM', '13:00 PM', '12:60', '12:00:60']) {
    assert.equal(interviewTimeSeconds(value), Infinity);
  }
});
