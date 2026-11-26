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

  function isConnectionFailure(error) {
    return error?.status === 0 || /failed to fetch|fetch failed|failed to load resource|load failed|networkerror|network request failed|aborted|timed out/i.test(error?.message || '');
  }

  function connectionMessage(error, action) {
    if (!isConnectionFailure(error)) return error;
    const details = navigator.onLine === false
      ? 'This device is offline. Reconnect and try again.'
      : 'This device could not reach the sync server. Try again or switch between Wi-Fi and mobile data.';
    return new Error(action + ' ' + details);
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
    let clientPromise;
    let session = null;
    let linkedAccount = null;
    let activeAccount = null;
    let displayed = new Map();
    let generatedCode = '';
    let busy = false;
    let running = false;
    let rerun = false;
    let lastOrder = 0;
    const volatileChanges = new Map();

    const linkKey = device => storagePrefix + device + ':linked';
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
      show('pair', configured && !linkedAccount);
      show('join', Boolean(linkedAccount && !activeAccount));
      show('account', Boolean(linkedAccount));
      show('now', Boolean(activeAccount));
      show('generated', Boolean(generatedCode));
      find('generated-value').value = generatedCode;
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
          const timeout = setTimeout(() => {
            script.remove();
            reject(new Error('Could not load sync. Check your connection and try again.'));
          }, 12000);
          script.onload = () => {
            clearTimeout(timeout);
            try {
              const client = window.supabase.createClient(config.url, config.publishableKey);
              client.auth.onAuthStateChange((event, nextSession) => {
                setTimeout(() => setSession(nextSession, !busy), 0);
              });
              resolve(client);
            } catch (error) {
              reject(error);
            }
          };
          script.onerror = () => {
            clearTimeout(timeout);
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

    function setSession(nextSession, restore = true) {
      const oldDevice = session?.user.id;
      session = nextSession;
      const device = session?.user.id;
      if (oldDevice === device) return;
      linkedAccount = null;
      if (activeAccount) {
        activeAccount = null;
        displayed = new Map();
        applyState(getLocalState());
      }
      if (device && restore) {
        const cachedLink = readStorage(linkKey(device), null);
        if (cachedLink) {
          openLink(cachedLink);
        } else {
          void restoreLink(device);
        }
      } else if (!device) {
        generatedCode = '';
        status.textContent = 'Entries are saved on this device. Link devices to sync.';
      }
      renderControls();
    }

    async function restoreLink(device) {
      try {
        const client = await getClient();
        const { data, error } = await client.rpc('athone_linked_ledger');
        if (error) throw error;
        if (session?.user.id === device && data && !linkedAccount) openLink(data);
      } catch {
        if (session?.user.id === device && !busy && !linkedAccount) {
          status.textContent = 'Could not check for a linked ledger. You can try linking with your code.';
        }
      }
    }

    function openLink(account) {
      linkedAccount = account;
      const cached = readStorage(cacheKey(account), null);
      if (cached) {
        activeAccount = account;
        showRows(account, cached);
        void sync();
      } else {
        refreshImportPreview();
        status.textContent = 'Device linked. Review what to import from this device.';
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
      const device = session?.user.id;
      if (!user || !device || linkedAccount !== user) return;
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
          if (activeAccount !== user || session?.user.id !== device) return;

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
          if (isConnectionFailure(error) && !volatileChanges.size && navigator.onLine !== false) {
            status.textContent = 'This device could not reach the sync server. Changes are saved on this device. Try another connection or tap Sync now to retry.';
          }
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

    function hex(bytes) {
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    async function linkDevice(code, createLedger) {
      const normalized = code.replace(/[\s-]/g, '').toLowerCase();
      if (!/^[a-f0-9]{32}$/.test(normalized)) {
        throw new Error('Enter all 32 characters of the sync code.');
      }
      status.textContent = createLedger ? 'Creating your sync code…' : 'Linking this device…';
      const client = await getClient();
      let nextSession;
      try {
        const existing = await client.auth.getSession();
        if (existing.error) throw existing.error;
        nextSession = existing.data.session;
        if (!nextSession) {
          const { data, error } = await client.auth.signInAnonymously();
          if (error) throw error;
          nextSession = data.session;
        }
      } catch (error) {
        throw connectionMessage(error, 'Could not start a device session.');
      }
      if (!nextSession) throw new Error('Could not start a device session.');
      setSession(nextSession, false);
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
      const params = {
        sync_hash: hex(new Uint8Array(digest)),
        create_ledger: createLedger
      };
      const sendLink = async () => {
        const result = await client.rpc('athone_link_device', params);
        if (result.error) throw result.error;
        return result.data;
      };
      let data;
      try {
        data = await sendLink();
      } catch (error) {
        if (!isConnectionFailure(error) || navigator.onLine === false) {
          throw connectionMessage(error, 'Could not pair this device.');
        }
        // Repeating the same pairing request is safe even if the first response was lost.
        status.textContent = 'The connection dropped. Retrying with the same sync code…';
        await new Promise(resolve => setTimeout(resolve, 600));
        try {
          data = await sendLink();
        } catch (retryError) {
          throw connectionMessage(retryError, 'Could not pair this device.');
        }
      }
      if (!data) throw new Error('This device could not be linked.');
      try {
        localStorage.setItem(linkKey(nextSession.user.id), JSON.stringify(data));
      } catch {
        // The server can recover the link when this device session is restored.
      }
      if (createLedger) generatedCode = code;
      find('code').value = '';
      openLink(data);
    }

    let pendingCode = '';
    find('create').addEventListener('click', () => void run(async () => {
      if (!pendingCode) {
        const random = crypto.getRandomValues(new Uint8Array(16));
        pendingCode = hex(random).toUpperCase().match(/.{8}/g).join('-');
      }
      await linkDevice(pendingCode, true);
      pendingCode = '';
    }));
    find('pair').addEventListener('submit', event => {
      event.preventDefault();
      void run(() => linkDevice(find('code').value, false));
    });
    find('copy').addEventListener('click', () => void run(async () => {
      await navigator.clipboard.writeText(generatedCode);
      status.textContent = 'Sync code copied.';
    }));

    function join(importLocal) {
      const user = linkedAccount;
      if (!user || !session || activeAccount) return;
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
      pendingCode = '';
      setSession(null);
    }));

    if (configured) {
      status.textContent = 'Entries are saved on this device. Link devices to sync.';
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
          if (linkedAccount) refreshImportPreview(state);
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
