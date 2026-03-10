'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePlaidLink, PlaidLinkOptions, PlaidLinkOnSuccess } from 'react-plaid-link';

interface PlaidLinkProps {
  onSuccess: () => void;
}

export default function PlaidLink({ onSuccess }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLinkToken() {
      try {
        const res = await fetch('/api/plaid/create-link-token', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to fetch link token');
        const data = (await res.json()) as { link_token: string };
        setLinkToken(data.link_token);
      } catch (err) {
        setError('Failed to initialize bank connection. Please try again.');
        console.error(err);
      }
    }
    void fetchLinkToken();
  }, []);

  const handleSuccess = useCallback<PlaidLinkOnSuccess>(
    async (publicToken, metadata) => {
      setIsLoading(true);
      try {
        const institution = metadata.institution ?? { name: 'Unknown', institution_id: '' };
        const res = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_token: publicToken,
            institution: {
              name: institution.name,
              institution_id: institution.institution_id,
            },
          }),
        });
        if (!res.ok) throw new Error('Failed to connect bank');
        onSuccess();
      } catch (err) {
        setError('Failed to connect bank account. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess]
  );

  const config: PlaidLinkOptions = {
    token: linkToken ?? '',
    onSuccess: handleSuccess,
    onExit: () => {
      // user closed without completing
    },
  };

  const { open, ready } = usePlaidLink(config);

  if (error) {
    return (
      <p className="text-sm text-red-400">{error}</p>
    );
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready || !linkToken || isLoading}
      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Connecting...
        </>
      ) : !linkToken ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
          </svg>
          Connect Bank
        </>
      )}
    </button>
  );
}
