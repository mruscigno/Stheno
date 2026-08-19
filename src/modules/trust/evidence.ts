export type Testimonial = { firstName: string; quote: string; context: string; imageUrl?: string; published: boolean; permissionRecordedAt: string };
export const testimonials: Testimonial[] = [];
export const userCountProof = { published: false, count: null as number | null, source: null as string | null, verifiedAt: null as string | null };
