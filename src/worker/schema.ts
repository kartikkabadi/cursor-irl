import { z } from 'zod';
import { AVATAR_MODES, VENUE_ZONES } from '../shared/attendee';
import { DITHERPRINT_CANDIDATE_COUNT } from '../shared/ditherprint';

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));

export const createAttendeeSchema = z.object({
  name: z.string().trim().min(2, 'Add your name.').max(80),
  x_handle: optionalText(50),
  cursor_handle: optionalText(50),
  github_handle: optionalText(50),
  avatar_mode: z.enum(AVATAR_MODES).optional().default('ditherprint'),
  avatar_url: z.string().trim().url('Use a full image URL.').max(500).optional().or(z.literal('')),
  project: z.string().trim().max(180),
  looking_for: optionalText(180),
  outfit_clue: optionalText(160),
  venue_zone: z.enum(VENUE_ZONES).optional(),
  open_to_meet: z.boolean().default(true),
  profile_id: z.string().uuid('That identity draft is not valid.'),
  variant: z.number().int().min(0, 'Pick one of the identity options.').max(DITHERPRINT_CANDIDATE_COUNT - 1, 'Pick one of the identity options.'),
});

export const updateAttendeeSchema = createAttendeeSchema.partial().strict();

export const connectionSchema = z.object({
  target_id: z.string().uuid('That profile is not valid.'),
});
