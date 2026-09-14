export function formatTime(time: Date, use24HourTime: boolean): string {
  if (use24HourTime) {
    return `${time.getHours()}:${time.getMinutes().toString().padStart(2, "0")}`;
  } else {
    const hours = time.getHours();
    const pm = hours > 12;

    return `${hours - (pm ? 12 : 0)}:${time.getMinutes().toString().padStart(2, "0")} ${pm ? "PM" : "AM"}`;
  }
}
