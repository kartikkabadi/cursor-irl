ALTER TABLE attendees ADD COLUMN avatar_mode TEXT NOT NULL DEFAULT 'ditherprint';
ALTER TABLE attendees ADD COLUMN avatar_variant INTEGER NOT NULL DEFAULT 0;
ALTER TABLE attendees ADD COLUMN avatar_algorithm_version TEXT NOT NULL DEFAULT 'ditherprint-v1';
ALTER TABLE attendees ADD COLUMN avatar_image_ref TEXT;
