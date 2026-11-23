-- One place for who the astrologer is: copy what was entered on the booking page into the practice profile
-- (Settings › Your Profile), keeping anything already set there. The booking page reads the profile from now on.
UPDATE "practice_settings" AS ps
SET "practitioner" = ps."practitioner" || jsonb_strip_nulls(jsonb_build_object(
  'bio', CASE WHEN coalesce(ps."practitioner"->>'bio', '') = '' AND coalesce(bp."data"->>'about', '') <> '' THEN bp."data"->>'about' END,
  'title', CASE WHEN coalesce(bp."data"->>'headline', '') <> '' THEN bp."data"->>'headline' END,
  'photo', CASE WHEN ps."practitioner"->>'photo' IS NULL THEN bp."data"->>'photo' END,
  'links', CASE WHEN ps."practitioner"->'links' IS NULL AND jsonb_typeof(bp."data"->'links') = 'array' THEN bp."data"->'links' END
))
FROM "booking_profiles" AS bp
WHERE bp."practice_id" = ps."practice_id";
