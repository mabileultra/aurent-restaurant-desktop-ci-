import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2, SendHorizontal, Sparkles, Trash2 } from 'lucide-react';
import { aiAssistantApi } from '../../../services/api';

const MAX_MESSAGES = 40;
const KEEP_LAST_MESSAGES = 24;
const HISTORY_TURNS = 12;
/** Must stay below backend AiAssistantChatMessage @Size limit */
const HISTORY_CONTENT_MAX = 10000;

function truncateHistoryContent(text) {
  if (!text || text.length <= HISTORY_CONTENT_MAX) return text ?? '';
  return `${text.slice(0, HISTORY_CONTENT_MAX)}…`;
}

function toApiHistory(messages) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-HISTORY_TURNS * 2)
    .map((m) => ({
      role: m.role,
      content: truncateHistoryContent(m.text),
    }));
}

export default function AiAssistantWidget({ onChartDataChange }) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);

  const appendMessages = (nextPair) => {
    setMessages((prev) => {
      const next = [...prev, ...nextPair];
      if (next.length <= MAX_MESSAGES) return next;
      return next.slice(-KEEP_LAST_MESSAGES);
    });
  };

  const askMutation = useMutation({
    mutationFn: ({ text, history }) => aiAssistantApi.chat(text, history).then((r) => r.data),
    onSuccess: (data, { text: question }) => {
      appendMessages([
        { role: 'user', text: question },
        { role: 'assistant', text: data.answer, meta: `${data.tool} · ${data.latencyMs}ms`, data: data.data ?? null },
      ]);
      setInput('');
    },
    onError: (e, { text: question }) => {
      const raw = e?.response?.data?.message ?? '';
      const fallback =
        raw.includes('Validation failed') || e?.response?.status === 400
          ? t('aiAssistant.errors.validation')
          : raw || t('aiAssistant.errors.failed');
      appendMessages([
        { role: 'user', text: question },
        { role: 'assistant', text: fallback, meta: 'error' },
      ]);
    },
  });

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, askMutation.isPending]);

  const latestChartData = useMemo(() => {
    if (messages.length === 0) return null;
    const last = messages[messages.length - 1];
    const payload = last?.role === 'assistant' ? last.data : null;
    if (payload && Array.isArray(payload.chart) && payload.chart.length > 0) {
      return payload.chart;
    }
    return null;
  }, [messages]);

  useEffect(() => {
    if (onChartDataChange) {
      onChartDataChange(latestChartData ?? null);
    }
  }, [latestChartData, onChartDataChange]);

  const submit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || askMutation.isPending) return;
    askMutation.mutate({ text, history: toApiHistory(messages) });
  };

  return (
    <section className="ui-card-padded">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="ui-kpi-icon-primary h-9 w-9">
          <Sparkles size={16} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-ink">{t('aiAssistant.title')}</h2>
          <p className="text-xs text-ink-muted">{t('aiAssistant.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setMessages([])}
          className="ui-btn ui-btn-secondary ui-btn-sm"
        >
          <Trash2 size={14} strokeWidth={1.75} />
          {t('aiAssistant.clearChat')}
        </button>
      </div>

      <div ref={listRef} className="mb-3 h-80 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
        {messages.length === 0 ? (
          <p className="rounded-control border border-line bg-canvas px-3 py-2.5 text-xs text-ink-muted">
            {t('aiAssistant.hint')}
          </p>
        ) : (
          messages.map((m, idx) => (
            <div
              key={`${m.role}-${idx}`}
              className={`rounded-control px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'ml-6 border border-primary-200 bg-primary-50 text-ink'
                  : 'mr-6 border border-line bg-canvas text-ink'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.meta ? <p className="mt-1 text-[11px] text-ink-muted">{m.meta}</p> : null}
            </div>
          ))
        )}
        {askMutation.isPending ? (
          <div className="mr-6 flex items-center gap-2 rounded-control border border-line bg-canvas px-3 py-2 text-xs text-ink-muted">
            <Loader2 className="animate-spin" size={14} />
            {t('aiAssistant.thinking')}
          </div>
        ) : null}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('aiAssistant.inputPlaceholder')}
          className="ui-input flex-1"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={askMutation.isPending || !input.trim()}
          className="ui-btn ui-btn-primary px-3.5"
        >
          {askMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <SendHorizontal size={16} strokeWidth={1.75} />}
        </button>
      </form>
    </section>
  );
}
