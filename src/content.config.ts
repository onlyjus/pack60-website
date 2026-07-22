import { defineCollection, z } from 'astro:content';

const publicSafeBase = {
  title: z.string(),
  description: z.string(),
  public: z.boolean().default(true),
  lastUpdated: z.string(),
};

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    ...publicSafeBase,
    navTitle: z.string().optional(),
    order: z.number().optional(),
    heroImage: z.string().optional(),
  }),
});

const activities = defineCollection({
  type: 'content',
  schema: z.object({
    ...publicSafeBase,
    season: z.string(),
    category: z.string(),
    image: z.string(),
    order: z.number().optional(),
  }),
});

const dens = defineCollection({
  type: 'content',
  schema: z.object({
    ...publicSafeBase,
    grade: z.string(),
    rank: z.string(),
    order: z.number(),
  }),
});

const roles = defineCollection({
  type: 'content',
  schema: z.object({
    ...publicSafeBase,
    roleType: z.string(),
    timeCommitment: z.string(),
    order: z.number().optional(),
  }),
});

const resources = defineCollection({
  type: 'content',
  schema: z.object({
    ...publicSafeBase,
    category: z.string(),
    order: z.number().optional(),
  }),
});

const faq = defineCollection({
  type: 'content',
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    category: z.string().optional(),
    order: z.number(),
    public: z.boolean().default(true),
    lastUpdated: z.string(),
  }),
});

const memberEvents = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.boolean().default(true),
    startDate: z.string(),
    endDate: z.string().optional(),
    locationName: z.string().optional(),
    locationNotes: z.string().optional(),
    arrivalTime: z.string().optional(),
    status: z
      .enum(['planned', 'tentative', 'updated', 'canceled'])
      .default('planned'),
    rsvpUrl: z.string().url().optional(),
    signupUrl: z.string().url().optional(),
    contactAlias: z.string().optional(),
    relatedAlbum: z.string().optional(),
    lastUpdated: z.string(),
  }),
});

const photoAlbums = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.boolean().default(true),
    eventDate: z.string(),
    coverImage: z.string().optional(),
    eventSlug: z.string().optional(),
    images: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          caption: z.string().optional(),
          credit: z.string().optional(),
        }),
      )
      .default([]),
    lastUpdated: z.string(),
  }),
});

export const collections = {
  pages,
  activities,
  dens,
  roles,
  resources,
  faq,
  'member-events': memberEvents,
  'photo-albums': photoAlbums,
};
