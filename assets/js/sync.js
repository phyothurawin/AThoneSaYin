(function () {
  const config = window.ATHONE_SYNC_CONFIG;
  const storagePrefix = 'athone_sayin_sync_v1:';
  const rowKey = row => row.kind + ':' + row.id;

  function rowsFromState(state) {
    const rows = [
      ...state.expenses.map(value => ({ kind: 'expense', id: value.id, value })),
      ...state.incomes.map(value => ({ kind: 'income', id: value.id, value })),
      { kind: 'setting', id: 'currency', value: state.currency },
      { kind: 'setting', id: 'monthlyBudget', value: state.monthlyBudget },
      ...Object.entries(state.categoryBudgets).map(([id, value]) => ({ kind: 'setting', id: 'cap:' + id, value }))
    ];
    return new Map(rows.map(row => [rowKey(row), row]));
  }

  function stateFromRows(defaults, rows) {
    for (const { kind, id, value } of rows) {
      if (value === null) continue;
      if (kind === 'expense') defaults.expenses.push(value);
      if (kind === 'income') defaults.incomes.push(value);
      if (kind !== 'setting') continue;
      if (id === 'currency' && ['Ks', 'S$', '฿', '$'].includes(value)) defaults.currency = value;
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      if (id === 'monthlyBudget') defaults.monthlyBudget = value;
      const category = id.slice(4);
      if (id.startsWith('cap:') && Object.hasOwn(defaults.categoryBudgets, category)) {
        defaults.categoryBudgets[category] = value;
      }
    }
    return defaults;
  }

  function changesBetween(before, after) {
    const changes = [];
    for (const [key, row] of after) {
      if (JSON.stringify(before.get(key)?.value) !== JSON.stringify(row.value)) changes.push(row);
    }
    for (const [key, row] of before) {
      if (!after.has(key)) changes.push({ ...row, value: null });
    }
    return changes;
  }

  function readStorage(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  window.createLedgerSync = function ({ getLocalState, getDefaults, sampleIds, applyState }) {
    const find = id => document.getElementById('sync-' + id);
    const status = find('status');
    const show = (id, visible) => find(id).classList.toggle('hidden', !visible);
    const configured = Boolean(config?.url && config?.publishableKey);
    const linkMode = config?.emailMode === 'link';
    if (linkMode) find('send').textContent = 'Email me a sign-in link';

    let clientPromise;
    let session = null;
    let activeAccount = null;
    let displayed = new Map();
    let sentEmail = '';
    let busy = false;
    let running = false;
    let rerun = false;
    let lastOrder = 0;
    const volatileChanges = new Map();

    const cacheKey = user => storagePrefix + user + ':cache';
    const outboxPrefix = user => storagePrefix + user + ':outbox:';

    function getQueue(user) {
      const prefix = outboxPrefix(user);
      const queue = new Map();
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(prefix)) queue.set(key, readStorage(key, null));
      }
      for (const [key, batch] of volatileChanges) {
        if (key.startsWith(prefix)) queue.set(key, batch);
      }
      return [...queue].filter(([, batch]) => batch).sort(([a], [b]) => a.localeCompare(b));
    }

    function enqueue(user, changes, importOnly = false) {
      if (!changes.length) return true;
      const id = crypto.randomUUID();
      lastOrder = Math.max(Date.now(), lastOrder + 1);
      const key = outboxPrefix(user) + lastOrder + ':' + id;
      const batch = { id, changes, importOnly };
      try {
        localStorage.setItem(key, JSON.stringify(batch));
        return true;
      } catch {
        volatileChanges.set(key, batch);
        return false;
      }
    }

    function renderControls() {
      show('login', configured && !session);
      show('join', Boolean(session && !activeAccount));
      show('account', Boolean(session));
      show('now', Boolean(activeAccount));
      show('verify', Boolean(sentEmail));
      show('send', !sentEmail);
      find('email').readOnly = Boolean(sentEmail);
      find('code').required = Boolean(sentEmail);
      find('email-label').textContent = session?.user.email ?? '';
      for (const button of document.querySelectorAll('#ledger-sync button')) button.disabled = busy;
    }

    function localImport(state = getLocalState()) {
      return [...rowsFromState(state).values()].filter(row => !sampleIds.has(rowKey(row)));
    }

    function refreshImportPreview(state) {
      const count = localImport(state).filter(row => row.kind !== 'setting').length;
      find('preview').textContent = count + ' local transactions and your budget settings can be copied to this account. Sample entries are excluded. Existing cloud records are kept.';
    }

    async function getClient() {
      if (!clientPromise) {
        clientPromise = new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.86.0/dist/umd/supabase.js';
          script.onload = () => {
            try {
              const client = window.supabase.createClient(config.url, config.publishableKey, {
                auth: { flowType: 'pkce' }
              });
              client.auth.onAuthStateChange((event, nextSession) => {
                setTimeout(() => setSession(nextSession), 0);
              });
              resolve(client);
            } catch (error) {
              reject(error);
            }
          };
          script.onerror = () => {
            script.remove();
            reject(new Error('Could not connect to the sign-in service.'));
          };
          document.head.append(script);
        }).catch(error => {
          clientPromise = null;
          throw error;
        });
      }
      return clientPromise;
    }

    function setSession(nextSession) {
      const oldUser = session?.user.id;
      session = nextSession;
      if (oldUser === session?.user.id) return;
      if (activeAccount) {
        activeAccount = null;
        displayed = new Map();
        applyState(getLocalState());
      }
      if (session) {
        sentEmail = '';
        find('code').value = '';
        const user = session.user.id;
        const cached = readStorage(cacheKey(user), null);
        if (cached) {
          activeAccount = user;
          showRows(user, cached);
          void sync();
        } else {
          refreshImportPreview();
          status.textContent = 'Signed in. Choose how to start syncing.';
        }
      } else {
        status.textContent = 'Entries are saved on this device. Sign in to sync.';
      }
      renderControls();
    }

    function showRows(user, rows) {
      const merged = new Map(rows.map(row => [rowKey(row), row]));
      for (const [, batch] of getQueue(user)) {
        for (const row of batch.changes) {
          const key = rowKey(row);
          if (batch.importOnly && merged.has(key)) continue;
          if (row.value === null) merged.delete(key);
          else merged.set(key, row);
        }
      }
      const next = stateFromRows(getDefaults(), merged.values());
      const nextRows = rowsFromState(next);
      if (activeAccount !== user) return;
      if (displayed.size === 0 || changesBetween(displayed, nextRows).length) applyState(next);
      displayed = nextRows;
    }

    async function sync() {
      const user = activeAccount;
      if (!user || session?.user.id !== user) return;
      if (running) {
        rerun = true;
        return;
      }
      running = true;
      status.textContent = 'Syncing…';
      try {
        const client = await getClient();
        let queue = getQueue(user);
        do {
          const [key, batch] = queue.shift() ?? [];
          const { data, error } = await client.rpc('athone_sync_ledger', {
            target_account: user,
            change_id: batch?.id ?? null,
            changes: batch?.changes ?? [],
            import_only: batch?.importOnly ?? false
          });
          if (error) throw error;
          if (activeAccount !== user || session?.user.id !== user) return;

          // Save the server snapshot before clearing the retryable change.
          localStorage.setItem(cacheKey(user), JSON.stringify(data));
          if (key) {
            localStorage.removeItem(key);
            volatileChanges.delete(key);
          }
          showRows(user, data);
        } while (queue.length);
        status.textContent = 'Synced.';
      } catch (error) {
        if (activeAccount === user) {
          status.textContent = volatileChanges.size
            ? 'Changes are waiting to sync. Keep this tab open because this browser could not save the queue.'
            : 'Sync unavailable. Changes saved on this device will retry when you reconnect.';
          console.warn('Ledger sync failed', error.message);
        }
      } finally {
        running = false;
        if (rerun) {
          rerun = false;
          void sync();
        }
      }
    }

    async function run(action) {
      if (busy) return;
      busy = true;
      renderControls();
      try {
        await action();
      } catch (error) {
        status.textContent = error.message || 'Could not complete the request.';
      } finally {
        busy = false;
        renderControls();
      }
    }

    find('login').addEventListener('submit', event => {
      event.preventDefault();
      void run(async () => {
        const client = await getClient();
        if (!sentEmail) {
          const email = find('email').value.trim();
          const { error } = await client.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: config.siteUrl || undefined }
          });
          if (error) throw error;
          if (linkMode) {
            status.textContent = 'Open the sign-in link from your email on this device, in this same browser.';
          } else {
            sentEmail = email;
            status.textContent = 'Code sent. Check your email.';
          }
        } else {
          const { data, error } = await client.auth.verifyOtp({
            email: sentEmail, token: find('code').value.trim(), type: 'email'
          });
          if (error) throw error;
          setSession(data.session);
        }
      });
    });

    find('different-email').addEventListener('click', () => {
      sentEmail = '';
      find('code').value = '';
      status.textContent = 'Enter your email to request a code.';
      renderControls();
    });

    function join(importLocal) {
      const user = session?.user.id;
      if (!user || activeAccount) return;
      localStorage.setItem(cacheKey(user), '[]');
      if (importLocal) enqueue(user, localImport(), true);
      activeAccount = user;
      displayed = new Map();
      showRows(user, []);
      renderControls();
      void sync();
    }

    find('import').addEventListener('click', () => void run(() => join(true)));
    find('cloud-only').addEventListener('click', () => void run(() => join(false)));
    find('now').addEventListener('click', () => void sync());
    find('out').addEventListener('click', () => void run(async () => {
      if (activeAccount && (running || getQueue(activeAccount).length)) {
        throw new Error('Wait for pending changes to finish syncing before signing out.');
      }
      const client = await getClient();
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
      setSession(null);
    }));

    if (configured) {
      status.textContent = 'Entries are saved on this device. Sign in to sync.';
      void getClient().catch(error => { status.textContent = error.message; });
      window.addEventListener('online', () => void sync());
      window.addEventListener('focus', () => void sync());
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) void sync();
      });
      setInterval(() => {
        if (!document.hidden) void sync();
      }, 30000);
    }
    renderControls();

    return {
      isActive: () => Boolean(activeAccount),
      save(state) {
        if (!activeAccount) {
          if (session) refreshImportPreview(state);
          return false;
        }
        const next = rowsFromState(state);
        const changes = changesBetween(displayed, next);
        if (changes.length) {
          displayed = next;
          if (!enqueue(activeAccount, changes)) {
            status.textContent = 'Keep this tab open until your changes sync.';
          }
          void sync();
        }
        return true;
      }
    };
  };
})();
