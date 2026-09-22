export function interviewChanges(form, initialForm, isGoogle = false) {
  const changes = Object.fromEntries(Object.entries(form).filter(([key, value]) =>
    JSON.stringify(value) !== JSON.stringify(initialForm[key]) && (!isGoogle || key !== 'assignedStaff')
  ));
  if (Object.hasOwn(changes, 'interviewRound')) {
    changes.rounds = changes.interviewRound ? [changes.interviewRound] : [];
    delete changes.interviewRound;
  }
  return changes;
}
