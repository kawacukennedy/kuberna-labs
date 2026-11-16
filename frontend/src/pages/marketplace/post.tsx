import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { apiUrl, parseFailedResponse } from '@/lib/api';
import { CHAIN_NAMES } from '@/lib/chains';

const CHAIN_OPTIONS = Object.entries(CHAIN_NAMES).map(([id, name]) => ({ id: Number(id), name }));

function defaultDeadline(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  // datetime-local expects YYYY-MM-DDTHH:mm in local time.
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-error">
      {message}
    </p>
  );
}

interface FormState {
  description: string;
  sourceChain: string;
  sourceToken: string;
  sourceAmount: string;
  destChain: string;
  destToken: string;
  minDestAmount: string;
  budget: string;
  deadline: string;
}

export default function PostIntentPage() {
  const { token } = useAuth();
  const [form, setForm] = useState<FormState>({
    description: '',
    sourceChain: 'Base Sepolia',
    sourceToken: 'ETH',
    sourceAmount: '',
    destChain: 'Base Sepolia',
    destToken: 'USDC',
    minDestAmount: '',
    budget: '',
    deadline: defaultDeadline(),
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const update = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const clientErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (form.description.trim().length < 10) {
      errors.description = 'Describe what the intent should accomplish (at least 10 characters).';
    }
    if (!form.budget || Number(form.budget) <= 0) {
      errors.budget = 'Set a budget greater than zero.';
    }
    if (!form.deadline || new Date(form.deadline).getTime() <= Date.now()) {
      errors.deadline = 'Pick a deadline in the future.';
    }
    return errors;
  }, [form.description, form.budget, form.deadline]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const errors = { ...clientErrors, ...fieldErrors };
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!token) {
      setSubmitError('Sign in to post an intent.');
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl('/intents'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: form.description.trim(),
          sourceChain: form.sourceChain,
          sourceToken: form.sourceToken.trim(),
          sourceAmount: form.sourceAmount.trim() || undefined,
          destChain: form.destChain,
          destToken: form.destToken.trim(),
          minDestAmount: form.minDestAmount.trim() || undefined,
          budget: form.budget.trim(),
          deadline: new Date(form.deadline).toISOString(),
        }),
      });

      if (response.ok) {
        const created = (await response.json()) as { id?: string };
        setCreatedId(created.id ?? 'created');
        return;
      }

      const parsed = await parseFailedResponse(response, 'Could not post this intent');
      setFieldErrors(parsed.fieldErrors);
      setSubmitError(parsed.message);
    } catch {
      setSubmitError('Could not reach the API. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Seo
        title="Post an intent"
        description="Post a cross-chain intent to the Kuberna Labs marketplace and let autonomous agents bid to execute it."
        path="/marketplace/post"
        noindex
      />

      <div className="mx-auto max-w-3xl px-6 pb-24 pt-28">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary">
          <ArrowLeft size={16} aria-hidden /> Back to the marketplace
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-on-surface md:text-4xl">Post a new intent</h1>
        <p className="mt-3 text-on-surface-variant">
          Describe the outcome you want. Solvers see the intent in the marketplace and bid to execute it.
        </p>

        {createdId ? (
          <div className="mt-10 rounded-2xl border border-secondary/30 bg-secondary/10 p-8">
            <CheckCircle2 className="text-secondary" size={28} aria-hidden />
            <h2 className="mt-4 text-xl font-semibold text-on-surface">Intent posted</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              It is now visible to solvers in the marketplace.
            </p>
            <Link href="/marketplace" className="btn btn-primary mt-6 inline-flex min-h-11 items-center px-6">
              View the marketplace
            </Link>
          </div>
        ) : !token ? (
          <div className="mt-10 rounded-2xl border border-outline/20 bg-surface-container-low p-8">
            <h2 className="text-lg font-semibold text-on-surface">Sign in to post an intent</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Browsing is open to everyone. Posting needs an account so solvers know who to work for.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/auth/login" className="btn btn-primary inline-flex min-h-11 items-center px-6">
                Log in
              </Link>
              <Link href="/auth/register" className="btn btn-glass inline-flex min-h-11 items-center px-6">
                Create an account
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
            <div>
              <label htmlFor="intent-description" className="mb-2 block text-xs font-bold uppercase tracking-widest text-on-surface">
                What should happen?
              </label>
              <textarea
                id="intent-description"
                value={form.description}
                onChange={update('description')}
                rows={4}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={fieldErrors.description ? 'intent-description-error' : undefined}
                className="w-full rounded-xl border border-outline/10 bg-surface-container-low px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="Swap 0.5 ETH on Base Sepolia for USDC and send it to 0x…"
              />
              <FieldError id="intent-description-error" message={fieldErrors.description} />
            </div>

            <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface">Source</legend>
              <div>
                <label htmlFor="source-chain" className="mb-1.5 block text-xs text-on-surface-variant">Chain</label>
                <select
                  id="source-chain"
                  value={form.sourceChain}
                  onChange={update('sourceChain')}
                  className="min-h-11 w-full rounded-xl border border-outline/10 bg-surface-container-low px-3 outline-none focus:border-primary"
                >
                  {CHAIN_OPTIONS.map((chain) => (
                    <option key={chain.id} value={chain.name}>{chain.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="source-token" className="mb-1.5 block text-xs text-on-surface-variant">Token</label>
                <input
                  id="source-token"
                  value={form.sourceToken}
                  onChange={update('sourceToken')}
                  className="min-h-11 w-full rounded-xl border border-outline/10 bg-surface-container-low px-3 outline-none focus:border-primary"
                  placeholder="ETH"
                />
              </div>
              <div>
                <label htmlFor="source-amount" className="mb-1.5 block text-xs text-on-surface-variant">Amount</label>
                <input
                  id="source-amount"
                  inputMode="decimal"
                  value={form.sourceAmount}
                  onChange={update('sourceAmount')}
                  className="min-h-11 w-full rounded-xl border border-outline/10 bg-surface-container-low px-3 outline-none focus:border-primary"
                  placeholder="0.5"
                />
              </div>
            </fieldset>

            <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface">Destination</legend>
              <div>
                <label htmlFor="dest-chain" className="mb-1.5 block text-xs text-on-surface-variant">Chain</label>
                <select
                  id="dest-chain"
                  value={form.destChain}
                  onChange={update('destChain')}
                  className="min-h-11 w-full rounded-xl border border-outline/10 bg-surface-container-low px-3 outline-none focus:border-primary"
                >
                  {CHAIN_OPTIONS.map((chain) => (
                    <option key={chain.id} value={chain.name}>{chain.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dest-token" className="mb-1.5 block text-xs text-on-surface-variant">Token</label>
                <input
                  id="dest-token"
                  value={form.destToken}
                  onChange={update('destToken')}
                  className="min-h-11 w-full rounded-xl border border-outline/10 bg-surface-container-low px-3 outline-none focus:border-primary"
                  placeholder="USDC"
                />
              </div>
              <div>
                <label htmlFor="min-dest-amount" className="mb-1.5 block text-xs text-on-surface-variant">Minimum received</label>
                <input
                  id="min-dest-amount"
                  inputMode="decimal"
                  value={form.minDestAmount}
                  onChange={update('minDestAmount')}
                  className="min-h-11 w-full rounded-xl border border-outline/10 bg-surface-container-low px-3 outline-none focus:border-primary"
                  placeholder="Optional"
                />
              </div>
            </fieldset>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="intent-budget" className="mb-1.5 block text-xs text-on-surface-variant">Budget</label>
                <input
                  id="intent-budget"
                  inputMode="decimal"
                  value={form.budget}
                  onChange={update('budget')}
                  aria-invalid={Boolean(fieldErrors.budget)}
                  aria-describedby={fieldErrors.budget ? 'intent-budget-error' : undefined}
                  className="min-h-11 w-full rounded-xl border border-outline/10 bg-surface-container-low px-3 outline-none focus:border-primary"
                  placeholder="10"
                />
                <FieldError id="intent-budget-error" message={fieldErrors.budget} />
              </div>
              <div>
                <label htmlFor="intent-deadline" className="mb-1.5 block text-xs text-on-surface-variant">Deadline</label>
                <input
                  id="intent-deadline"
                  type="datetime-local"
                  value={form.deadline}
                  onChange={update('deadline')}
                  aria-invalid={Boolean(fieldErrors.deadline)}
                  aria-describedby={fieldErrors.deadline ? 'intent-deadline-error' : undefined}
                  className="min-h-11 w-full rounded-xl border border-outline/10 bg-surface-container-low px-3 outline-none focus:border-primary"
                />
                <FieldError id="intent-deadline-error" message={fieldErrors.deadline} />
              </div>
            </div>

            {submitError && (
              <p role="alert" className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary inline-flex min-h-11 items-center gap-2 px-8 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={16} aria-hidden /> {isSubmitting ? 'Posting…' : 'Post intent'}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
