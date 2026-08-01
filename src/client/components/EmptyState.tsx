import { Link } from 'react-router-dom';
import { Cursor, MagnifyingGlass } from '@phosphor-icons/react';
import { buttonClass } from './ui';

export function EmptyState({ searched }: { searched: boolean }) {
  return <div className="col-span-full grid min-h-[330px] place-items-center border-t border-[var(--line-strong)] py-12 text-center"><div className="max-w-sm space-y-4"><div className="mx-auto grid h-14 w-14 place-items-center rounded-[16px] border border-[var(--line-strong)] bg-[var(--sand)]">{searched ? <MagnifyingGlass size={23} /> : <Cursor size={23} />}</div><div><h3 className="text-xl font-semibold tracking-[-0.035em]">{searched ? 'No cursor match yet.' : 'The room is waiting for its first real cursor.'}</h3><p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{searched ? 'Try a different handle, project, or venue zone.' : 'Nobody has joined yet. Add your identity, share your card, and be the first real person in the room.'}</p></div>{!searched ? <Link to="/join" className={buttonClass('primary')}>Join the room</Link> : null}</div></div>;
}
