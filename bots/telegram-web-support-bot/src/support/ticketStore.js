import fs from 'fs';
import path from 'path';

/** Тикеты веб-поддержки (отдельный файл от аптечного бота). */
export function createTicketStore(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const filePath = path.join(dataDir, 'web-support-tickets.json');

  function load() {
    if (!fs.existsSync(filePath)) {
      return { users: {}, ticketSeq: 1000, groupMessages: {} };
    }
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return { users: {}, ticketSeq: 1000, groupMessages: {} };
    }
  }

  function save(db) {
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
  }

  function userBucket(db, userId) {
    const key = String(userId);
    if (!db.users[key]) {
      db.users[key] = { tickets: [] };
    }
    return db.users[key];
  }

  return {
    createTicket(userId, { category, categoryLabel, preview }) {
      const db = load();
      const user = userBucket(db, userId);
      db.ticketSeq = (db.ticketSeq || 1000) + 1;
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

    getTicket(userId, ticketId) {
      return userBucket(load(), userId).tickets.find((t) => t.id === Number(ticketId)) || null;
    },

    setTicketStatus(userId, ticketId, status) {
      const db = load();
      const ticket = userBucket(db, userId).tickets.find((t) => t.id === Number(ticketId));
      if (!ticket) return null;
      ticket.status = status;
      save(db);
      return ticket;
    },

    closeTicket(userId, ticketId) {
      const db = load();
      const ticket = userBucket(db, userId).tickets.find((t) => t.id === Number(ticketId));
      if (!ticket) return null;
      ticket.closed = true;
      ticket.status = 'Закрыто';
      save(db);
      return ticket;
    },

    appendTicketNote(userId, ticketId, note) {
      const db = load();
      const ticket = userBucket(db, userId).tickets.find((t) => t.id === Number(ticketId));
      if (!ticket) return null;
      if (!ticket.notes) ticket.notes = [];
      ticket.notes.push({ text: String(note).slice(0, 500), at: new Date().toISOString() });
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
      save(db);
    },

    resolveGroupMessage(groupMessageId) {
      const db = load();
      return db.groupMessages?.[String(groupMessageId)] || null;
    },
  };
}
