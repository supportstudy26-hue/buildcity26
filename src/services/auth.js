export function publicKey(k) {
  if (!k || k.startsWith('sb_secret_') || k.includes('YOUR_')) return false;
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(k)) return true;
  try { return JSON.parse(atob(k.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon'; } catch { return false; }
}
export function projectURL(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.hostname.includes('YOUR_') ? url.origin : ''; } catch { return ''; }
}
export async function authenticate(client, mode, { email, password, confirmPassword, displayName }, redirectTo) {
  if (['signup', 'recovery'].includes(mode)) {
    if (password.length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
    if (password !== confirmPassword) throw new Error('Hai mật khẩu chưa khớp nhau.');
  }
  let result;
  switch (mode) {
    case 'signup': result = await client.auth.signUp({ email, password, options: { data: { display_name: displayName }, emailRedirectTo: redirectTo } }); break;
    case 'reset': result = await client.auth.resetPasswordForEmail(email, { redirectTo }); break;
    case 'resend': result = await client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } }); break;
    case 'recovery': result = await client.auth.updateUser({ password }); break;
    default: result = await client.auth.signInWithPassword({ email, password });
  }
  if (result.error) throw result.error;
  return result.data;
}

// Recovery can be closed and reopened without losing its mode. Ignore stale
// INITIAL_SESSION resolution when a later auth event has already arrived.
export function observeSession(client, handle, onError, defer = fn => setTimeout(fn, 0)) {
  let events = 0, disposed = false;
  const { data } = client.auth.onAuthStateChange((event, session) => {
    events++;
    defer(() => { if (!disposed) { try { void Promise.resolve(handle(session, event)).catch(onError); } catch (error) { onError(error); } } });
  });
  const initial = events;
  void client.auth.getSession().then(({ data: sessionData, error }) => {
    if (disposed || events !== initial) return;
    if (error) onError(error); else return handle(sessionData.session, 'INITIAL_SESSION');
  }).catch(onError);
  return () => { disposed = true; data.subscription.unsubscribe(); };
}
