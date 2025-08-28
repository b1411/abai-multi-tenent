import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface Props {
  open: boolean;
  onClose: () => void;
  suggestion?: any; // { id, suggestion, diff, metadata, auditLogs, curriculumPlanId, status }
  onApply?: () => Promise<void>;
  applying?: boolean;
}

export default function AISuggestionModal({ open, onClose, suggestion, onApply, applying }: Props) {
  const text = suggestion?.suggestion || '';
  const diff = suggestion?.diff;
  const audit = suggestion?.auditLogs || [];

  const renderedHtml = useMemo(() => {
    try {
      // marked.parse may have a string | Promise<string> type; cast to string to keep sync rendering.
      const raw = marked.parse(text || '') as string;
      return DOMPurify.sanitize(raw);
    } catch (e) {
      return DOMPurify.sanitize(String(text || ''));
    }
  }, [text]);

  const diffHtml = useMemo(() => {
    if (!diff) return null;
    if (typeof diff === 'string') {
      try {
        const raw = marked.parse(diff) as string;
        return DOMPurify.sanitize(raw);
      } catch {
        return DOMPurify.sanitize(String(diff));
      }
    }
    return null;
  }, [diff]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-lg overflow-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-medium">AI предложение</h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Текст предложения</h4>
            <div
              className="prose max-w-none bg-gray-50 p-3 rounded text-sm"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>

          {diff && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Diff / Предлагаемые изменения</h4>
              {diffHtml ? (
                <div className="prose max-w-none bg-gray-50 p-3 rounded text-sm" dangerouslySetInnerHTML={{ __html: diffHtml }} />
              ) : (
                <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded text-sm">{JSON.stringify(diff, null, 2)}</pre>
              )}
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Аудит</h4>
            {audit.length === 0 ? (
              <p className="text-xs text-gray-500">Нет записей аудита</p>
            ) : (
              <ul className="text-xs space-y-2">
                {audit.map((a: any) => (
                  <li key={a.id} className="bg-gray-50 p-2 rounded">
                    <div className="text-gray-700"><strong>{a.action}</strong> — {a.note || ''}</div>
                    <div className="text-gray-500 mt-1 text-[11px]">{new Date(a.createdAt).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200"
            disabled={applying}
          >
            Закрыть
          </button>
          <button
            onClick={onApply}
            className="rounded-md px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={applying || suggestion?.status !== 'PENDING'}
          >
            {applying ? 'Применение...' : 'Принять и применить'}
          </button>
        </div>
      </div>
    </div>
  );
}
