export function scheduleReminder({ notify, setTimer = setTimeout }, message) {
  return setTimer(() => notify(message), 1000);
}
