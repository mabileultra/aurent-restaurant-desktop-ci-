import fs from 'fs';
import path from 'path';

/**
 * Persistent user data: favorites, history, support tickets.
 */
export function createUserDataStore(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const filePath = path.join(dataDir, 'user-data.json');

  function load() {
    if (!fs.existsSync(filePath)) {
      return { users: {}, ticketSeq: 1800 };
    }
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return { users: {}, ticketSeq: 1800 };
    }
  }

  function save(db) {
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
  }

  function userBucket(db, userId) {
    const key = String(userId);
    if (!db.users[key]) {
      db.users[key] = {
        favorites: [],
        history: [],
        tickets: [],
      };
    }
    return db.users[key];
  }

  return {
    addHistory(userId, query) {
      const db = load();
      const user = userBucket(db, userId);
      const q = String(query || '').trim();
      if (!q) return;
      user.history = [
        { query: q, at: new Date().toISOString() },
        ...user.history.filter((h) => h.query.toLowerCase() !== q.toLowerCase()),
      ].slice(0, 30);
      save(db);
    },

    getHistory(userId) {
      return userBucket(load(), userId).history;
    },

    clearHistory(userId) {
      const db = load();
      userBucket(db, userId).history = [];
      save(db);
    },

    addFavorite(userId, item) {
      const db = load();
      const user = userBucket(db, userId);
      user.favorites = [
        {
          productId: item.productId,
          productName: item.productName,
          minPrice: item.minPrice ?? null,
          watchPrice: false,
          at: new Date().toISOString(),
        },
        ...user.favorites.filter((f) => f.productId !== item.productId),
      ].slice(0, 50);
      save(db);
    },

    removeFavorite(userId, productId) {
      const db = load();
      const user = userBucket(db, userId);
      user.favorites = user.favorites.filter((f) => f.productId !== productId);
      save(db);
    },

    toggleWatch(userId, productId) {
      const db = load();
      const user = userBucket(db, userId);
      const fav = user.favorites.find((f) => f.productId === productId);
      if (!fav) return null;
      fav.watchPrice = !fav.watchPrice;
      save(db);
      return fav;
    },

    getFavorites(userId) {
      return userBucket(load(), userId).favorites;
    },

    createTicket(userId, { category, categoryLabel, preview }) {
      const db = load();
      const user = userBucket(db, userId);
      db.ticketSeq = (db.ticketSeq || 1800) + 1;
      const ticket = {
        id: db.ticketSeq,
        category,
        categoryLabel,
        preview: String(preview || '').slice(0, 200),
        status: 'Новое',
        createdAt: new Date().toISOString(),
        closed: false,
      };
      user.tickets = [ticket, ...user.tickets].slice(0, 20);
      save(db);
      return ticket;
    },

    linkGroupMessage(userId, ticketId, groupMessageId) {
      if (groupMessageId == null) return;
      const db = load();
      if (!db.groupMessages) db.groupMessages = {};
      db.groupMessages[String(groupMessageId)] = {
        userId: Number(userId),
        ticketId: Number(ticketId),
      };
      // keep last 500 mappings
      const keys = Object.keys(db.groupMessages);
      if (keys.length > 500) {
        for (const key of keys.slice(0, keys.length - 500)) {
          delete db.groupMessages[key];
        }
      }
      save(db);
    },

    resolveGroupMessage(groupMessageId) {
      const db = load();
      return db.groupMessages?.[String(groupMessageId)] || null;
    },

    setTicketStatus(userId, ticketId, status) {
      const db = load();
      const user = userBucket(db, userId);
      const ticket = user.tickets.find((t) => t.id === Number(ticketId));
      if (!ticket || ticket.closed) return null;
      ticket.status = status;
      save(db);
      return ticket;
    },

    getActiveTicket(userId) {
      return userBucket(load(), userId).tickets.find((t) => !t.closed) || null;
    },

    getTicket(userId, ticketId) {
      return userBucket(load(), userId).tickets.find((t) => t.id === Number(ticketId)) || null;
    },

    closeTicket(userId, ticketId) {
      const db = load();
      const user = userBucket(db, userId);
      const ticket = user.tickets.find((t) => t.id === Number(ticketId));
      if (!ticket) return null;
      ticket.closed = true;
      ticket.status = 'Закрыто';
      save(db);
      return ticket;
    },

    appendTicketNote(userId, ticketId, note) {
      const db = load();
      const user = userBucket(db, userId);
      const ticket = user.tickets.find((t) => t.id === Number(ticketId));
      if (!ticket || ticket.closed) return null;
      ticket.preview = `${ticket.preview}\n[+]: ${String(note).slice(0, 120)}`.slice(0, 400);
      ticket.status = 'Дополнено';
      save(db);
      return ticket;
    },
  };
}
