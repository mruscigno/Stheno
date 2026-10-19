# Deep-link configuration

Development scheme: `stheno-dev`. Production scheme: `stheno`.

Native auth callback route: `/auth/callback`. Parser accepts only those custom schemes or HTTPS and only the `auth` or `www.sthenofitness.com` hosts. Recovery callbacks continue to `/auth/reset`; other successful verification callbacks return to root for state routing.

iOS associated domain and Android verified-link declarations target `www.sthenofitness.com/auth/mobile`. Universal-link hosting files are not claimed as complete in App 2. Supabase dashboard redirect URLs must be added before device authentication acceptance.
