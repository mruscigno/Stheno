# Storage, CDN cost, and performance

The 103 reviewed candidates currently total 11,680,990 bytes of MP4 video and 1,554,338 bytes of WebP posters (about 13.2 MB combined). Assets are 720×720 H.264, 24 fps, CRF 23, fast-start, with audio removed. Posters are WebP.

No asset was uploaded and no paid storage/CDN was created. A production cost cannot be honestly stated until the existing Supabase/Vercel plan's included storage and egress are confirmed. The product avoids automatic preload: web videos use `preload="none"`; native playback loads only an opened exercise guide; alternate media is capped at six ranked items.

The safe activation sequence is: upload only reviewed derivatives to an existing private/restricted storage origin, verify cache headers and signed/public delivery policy, measure representative mobile playback and egress, then authorize a limited cohort. The remaining 1,308 pending assets must not be uploaded merely because they exist.
