import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { HomePage } from './pages/HomePage';
import { JoinPage } from './pages/JoinPage';
import { MePage } from './pages/MePage';
import { ProfilePage } from './pages/ProfilePage';

function NotFound() { return <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-8"><h1 className="text-5xl font-semibold tracking-[-0.08em]">404 / cursor lost</h1><p className="mt-4 text-sm text-[var(--muted)]">That route is not in this room.</p></div>; }

export default function App() { return <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}><Shell><Routes><Route path="/" element={<HomePage />} /><Route path="/join" element={<JoinPage />} /><Route path="/me" element={<MePage />} /><Route path="/p/:slug" element={<ProfilePage />} /><Route path="*" element={<NotFound />} /></Routes></Shell></BrowserRouter>; }
