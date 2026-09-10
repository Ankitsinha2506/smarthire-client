export const interviewSteps = ['Candidate information', 'Schedule & rounds', 'Company & HR', 'Outcome & documents'];
export function validateInterviewStep(data, step, today) {
  const name = value => /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(String(value || '').trim());
  const mobile = value => /^\d{10}$/.test(value || '');
  const email = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
  if (step === 0) {
    if (!name(data.candidateName)) return 'Please enter a valid candidate name.';
    if (!email(data.candidateEmail)) return 'Please enter a valid candidate email.';
    if (!mobile(data.candidateMobile)) return 'Please enter a valid 10-digit candidate mobile number.';
    if (!data.technology) return 'Please select a technology.';
  }
  if (step === 1) {
    if (!data.interviewDate || data.interviewDate < today) return 'Choose an interview date today or later.';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.interviewTime || '')) return 'Please select a valid interview time.';
    if (!data.rounds?.length) return 'Please choose an interview round.';
  }
  if (step === 2) {
    if (!/[A-Za-z]/.test(data.companyName || '')) return 'Please enter a valid company name.';
    if (!name(data.hrName)) return 'Please enter a valid HR name.';
    if (!email(data.hrEmail)) return 'Please enter a valid HR email.';
    if (!mobile(data.hrMobile)) return 'Please enter a valid 10-digit HR mobile number.';
  }
  return '';
}
