import test from 'node:test';
import assert from 'node:assert/strict';
import {interviewChanges} from './interviewEdits.js';

test('HR-only corrections omit an old date and unrelated missing required fields', () => {
  const initial = {interviewDate:'2020-01-01',hrName:'',hrMobile:'',hrEmail:'',interviewRound:'Round 1',assignedStaff:['staff']};
  assert.deepEqual(interviewChanges({...initial,hrName:'Test Recruiter',hrMobile:'9876543210'},initial),
    {hrName:'Test Recruiter',hrMobile:'9876543210'});
  assert.deepEqual(interviewChanges({...initial},initial),{});
});
test('round edits use the API field and Google assignments remain a separate save', () => {
  const initial = {interviewRound:'Round 1',assignedStaff:['a']};
  const changed = {interviewRound:'',assignedStaff:['b']};
  assert.deepEqual(interviewChanges(changed,initial),{assignedStaff:['b'],rounds:[]});
  assert.deepEqual(interviewChanges(changed,initial,true),{rounds:[]});
});
