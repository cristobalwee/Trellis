import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Input } from './ui/Input';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const popupVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 28,
      stiffness: 400,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1] as [number, number, number, number],
    },
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = 'idle' | 'submitting' | 'success' | 'error';

const STORAGE_KEY = 'trellis:waitlist:email';

export const WaitlistModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpen = () => {
      setStatus('idle');
      setErrorMessage('');
      setOpen(true);
      document.body.classList.add('modal-open');
      (window as { lenis?: { stop?: () => void } }).lenis?.stop?.();
    };
    window.addEventListener('openWaitlist', handleOpen);
    return () => window.removeEventListener('openWaitlist', handleOpen);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    document.body.classList.remove('modal-open');
    (window as { lenis?: { start?: () => void } }).lenis?.start?.();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  // Focus the email field once the popup mounts
  useEffect(() => {
    if (!open || status !== 'idle') return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, [open, status]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = email.trim();
      if (!EMAIL_RE.test(trimmed)) {
        setStatus('error');
        setErrorMessage('Please enter a valid email address.');
        return;
      }

      setStatus('submitting');
      setErrorMessage('');

      try {
        // Persist locally so the email isn't lost before the backend exists.
        // Wire up a real endpoint here when the beta API is ready.
        window.localStorage.setItem(STORAGE_KEY, trimmed);
        window.dispatchEvent(
          new CustomEvent('waitlistSignup', { detail: { email: trimmed } }),
        );
        await new Promise((resolve) => setTimeout(resolve, 450));
        setStatus('success');
      } catch {
        setStatus('error');
        setErrorMessage('Something went wrong. Please try again.');
      }
    },
    [email],
  );

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? setOpen(true) : handleClose())}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal keepMounted>
            <Dialog.Backdrop
              className="fixed inset-0 z-50"
              render={
                <motion.div
                  variants={backdropVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.2 }}
                />
              }
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            />
            <Dialog.Popup
              className="fixed z-50 top-0 left-0 w-screen h-screen flex items-center justify-center p-4"
              render={
                <motion.div
                  variants={popupVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                />
              }
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex flex-col gap-2 pr-6">
                    <Dialog.Title
                      render={() => (
                        <h4 className="text-charcoal">
                          Join the beta waitlist
                        </h4>
                      )}
                    />
                    <p className="text-sm md:text-base text-charcoal/80">
                      We'll email you when the paid beta launches, with a
                      first-100-customer discount included.
                    </p>
                  </div>
                  <Dialog.Close
                    aria-label="Close waitlist dialog"
                    className="text-charcoal/40 hover:text-charcoal/70 transition-colors cursor-pointer p-1 rounded-lg hover:bg-charcoal/5 shrink-0"
                  >
                    <X size={18} />
                  </Dialog.Close>
                </div>

                {status === 'success' ? (
                  <div className="flex flex-col items-start gap-3 py-2">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-forest-green-50 text-forest-green"
                      aria-hidden="true"
                    >
                      <Check className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <p className="text-base text-charcoal">
                      You're on the list. We'll be in touch.
                    </p>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="btn btn-secondary btn-sm mt-2"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4"
                    noValidate
                  >
                    <label
                      htmlFor="waitlist-email"
                      className="text-base text-charcoal font-medium"
                    >
                      Email address
                    </label>
                    <Input
                      id="waitlist-email"
                      ref={inputRef as React.Ref<HTMLElement>}
                      type="email"
                      size="compact"
                      autoComplete="email"
                      placeholder="you@studio.com"
                      value={email}
                      disabled={status === 'submitting'}
                      onChange={(e) => {
                        setEmail(e.currentTarget.value);
                        if (status === 'error') {
                          setStatus('idle');
                          setErrorMessage('');
                        }
                      }}
                      aria-invalid={status === 'error'}
                      aria-describedby={
                        status === 'error' ? 'waitlist-email-error' : undefined
                      }
                    />
                    {status === 'error' && (
                      <p
                        id="waitlist-email-error"
                        className="text-sm text-red-600"
                      >
                        {errorMessage}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="btn btn-primary btn-sm w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {status === 'submitting' ? 'Joining…' : 'Join waitlist'}
                    </button>
                    <p className="text-xs text-charcoal/80">
                      No spam. We'll only email you about the beta launch.
                    </p>
                  </form>
                )}
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default WaitlistModal;
