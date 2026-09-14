/** Strips credentials from a connection string so they never reach the logs. */
export function redactUri(uri) {
  try {
    const parsed = new URL(uri);
    if (parsed.username) parsed.username = "***";
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return "<unparseable uri>";
  }
}
