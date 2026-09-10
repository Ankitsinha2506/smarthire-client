import test from 'node:test';
import assert from 'node:assert/strict';
import {validateInterviewStep} from './interviewSteps.js';
const candidate={candidateName:'Test Candidate',candidateEmail:'candidate@example.com',candidateMobile:'9876543210',technology:'Python'};
const schedule={interviewDate:'2030-09-10',interviewTime:'12:30',rounds:['Round 1']};
const company={companyName:'Example Company',hrName:'Test Recruiter',hrEmail:'hr@example.com',hrMobile:'9876543210'};
test('each step validates independently of later unfinished sections',()=>{
  assert.equal(validateInterviewStep(candidate,0,'2030-09-09'),'');
  assert.equal(validateInterviewStep(schedule,1,'2030-09-09'),'');
  assert.equal(validateInterviewStep(company,2,'2030-09-09'),'');
});
test('required fields prevent progressing with incomplete details',()=>{
  assert.ok(validateInterviewStep({...candidate,technology:''},0,'2030-09-09'));
  assert.ok(validateInterviewStep({...schedule,rounds:[]},1,'2030-09-09'));
  assert.ok(validateInterviewStep({...company,hrEmail:'invalid'},2,'2030-09-09'));
});
test('a date that becomes past is rejected on final revalidation',()=>{
  assert.equal(validateInterviewStep(schedule,1,'2030-09-10'),'');
  assert.ok(validateInterviewStep(schedule,1,'2030-09-11'));
});
test('the outcome and documents step can be left entirely empty',()=>{
  assert.equal(validateInterviewStep({},3,'2030-09-09'),'');
});
