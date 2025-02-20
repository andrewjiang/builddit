import { z } from 'zod';

const UserSchema = z.object({
    object: z.string(),
    fid: z.number(),
    username: z.string(),
    display_name: z.string().optional(),
    pfp_url: z.string().optional(),
    custody_address: z.string().optional(),
    profile: z.object({
        bio: z.object({
            text: z.string().optional(),
            mentioned_profiles: z.array(z.any()).optional(),
        }).optional(),
        location: z.object({
            description: z.string().optional(),
            coordinates: z.any().optional(),
        }).optional(),
    }).optional(),
    follower_count: z.number().optional(),
    following_count: z.number().optional(),
    verifications: z.array(z.string()).optional(),
    verified_addresses: z.object({
        eth_addresses: z.array(z.string()).optional(),
        sol_addresses: z.array(z.string()).optional(),
    }).optional(),
    power_badge: z.boolean().optional(),
});

const ChannelSchema = z.object({
    object: z.string(),
    id: z.string(),
    name: z.string(),
    image_url: z.string().optional(),
});

const ReactionSchema = z.object({
    fid: z.number(),
    fname: z.string().optional(),
});

const ReactionsSchema = z.object({
    likes_count: z.number(),
    recasts_count: z.number(),
    likes: z.array(ReactionSchema),
    recasts: z.array(ReactionSchema),
});

// Create a more lenient user schema for nested casts
const EmbeddedUserSchema = UserSchema.extend({
    username: z.string().optional(), // Make username optional for nested casts
});

// Forward declaration to handle circular references
const EmbeddedCastSchema: z.ZodType<any> = z.lazy(() => z.object({
    object: z.string().optional(),
    hash: z.string().optional(),
    thread_hash: z.string().optional(),
    parent_hash: z.string().nullable().optional(),
    parent_url: z.string().nullable().optional(),
    root_parent_url: z.string().nullable().optional(),
    parent_author: z.object({ fid: z.number().nullable() }).optional(),
    author: EmbeddedUserSchema.optional().nullable(),
    text: z.string().optional(),
    timestamp: z.string().optional(),
    embeds: z.array(z.object({
        url: z.string().optional(),
        cast_id: z.object({
            fid: z.number(),
            hash: z.string(),
        }).optional(),
        cast: z.lazy(() => EmbeddedCastSchema.optional().nullable()),
        metadata: z.object({
            html: z.object({
                ogTitle: z.string().optional(),
                ogDescription: z.string().optional(),
                ogImage: z.array(z.object({
                    url: z.string(),
                    width: z.string().optional(),
                    height: z.string().optional(),
                })).optional(),
                ogSiteName: z.string().optional(),
                favicon: z.string().optional(),
            }).optional(),
        }).optional(),
    })).optional().default([]),
    channel: ChannelSchema.nullable().optional(),
}));

export const BuildRequestSchema = z.object({
    object: z.string(),
    hash: z.string(),
    thread_hash: z.string(),
    parent_hash: z.string().nullable(),
    parent_url: z.string().nullable(),
    root_parent_url: z.string().nullable(),
    parent_author: z.object({ fid: z.number().nullable() }),
    author: UserSchema,
    text: z.string(),
    timestamp: z.string(),
    embeds: z.array(z.object({
        url: z.string().optional(),
        cast_id: z.object({
            fid: z.number(),
            hash: z.string(),
        }).optional(),
        cast: z.lazy(() => EmbeddedCastSchema.optional().nullable()),
        metadata: z.object({
            html: z.object({
                ogTitle: z.string().optional(),
                ogDescription: z.string().optional(),
                ogImage: z.array(z.object({
                    url: z.string(),
                    width: z.string().optional(),
                    height: z.string().optional(),
                })).optional(),
                ogSiteName: z.string().optional(),
                favicon: z.string().optional(),
            }).optional(),
        }).optional(),
    })),
    channel: ChannelSchema.nullable(),
    reactions: ReactionsSchema,
    replies: z.object({
        count: z.number(),
    }),
    mentioned_profiles: z.array(UserSchema),
    author_channel_context: z.object({
        role: z.string(),
        following: z.boolean(),
    }).optional(),
});

export type Embed = z.infer<typeof EmbeddedCastSchema>;
export type EmbeddedCast = z.infer<typeof EmbeddedCastSchema>;
export type BuildRequest = z.infer<typeof BuildRequestSchema>; 