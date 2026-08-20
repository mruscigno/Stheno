const accounts = [
  { name: "Instagram", href: "https://www.instagram.com/sthenofitness8/", path: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.25"/><circle cx="17.4" cy="6.6" r="1" className="fill"/></> },
  { name: "X", href: "https://x.com/SthenoFitness8", path: <path d="M5 4l14 16M19 4 5 20M8.2 4H5l10.8 16H19L8.2 4Z"/> },
  { name: "TikTok", href: "https://www.tiktok.com/@sthenofitness?lang=en", path: <path d="M14.5 3c.4 2.6 1.9 4.1 4.5 4.3v3.1a9 9 0 0 1-4.5-1.3v6.2a6.3 6.3 0 1 1-5.4-6.2v3.2a3.2 3.2 0 1 0 2.2 3V3h3.2Z"/> },
  { name: "Reddit", href: "https://www.reddit.com/user/SthenoFitness/", path: <><circle cx="12" cy="13" r="7"/><circle cx="9" cy="12" r="1" className="fill"/><circle cx="15" cy="12" r="1" className="fill"/><path d="M9 16c1.7 1 4.3 1 6 0M16.5 7.5l1-4 3 1"/><circle cx="20.5" cy="4.5" r="1.5"/></> },
  { name: "YouTube", href: "https://www.youtube.com/channel/UC737ojNjs_dTf-mc6ytZvtw", path: <><path d="M21 8.2a3 3 0 0 0-2.1-2.1C17 5.6 12 5.6 12 5.6s-5 0-6.9.5A3 3 0 0 0 3 8.2 31 31 0 0 0 2.6 12 31 31 0 0 0 3 15.8a3 3 0 0 0 2.1 2.1c1.9.5 6.9.5 6.9.5s5 0 6.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8Z"/><path d="m10 9 5 3-5 3Z" className="fill"/></> },
] as const;

export function SocialLinks({ compact = false }: { compact?: boolean }) {
  return <div className={`social-links${compact ? " compact" : ""}`} aria-label="Follow STHENO Fitness">
    {accounts.map((account) => <a key={account.name} href={account.href} target="_blank" rel="noopener noreferrer" aria-label={`STHENO Fitness on ${account.name}`} title={account.name}>
      <svg viewBox="0 0 24 24" aria-hidden="true">{account.path}</svg>
    </a>)}
  </div>;
}
