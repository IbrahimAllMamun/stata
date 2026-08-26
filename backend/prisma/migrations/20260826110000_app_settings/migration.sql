-- Site-wide operator settings, keyed by name.
--
-- Added because the ASPL navigation toggle was never actually site-wide: the
-- admin panel wrote `{"visible":true}` into localStorage under `aspl_settings`,
-- so the ASPL link appeared only in the one browser where an admin flipped the
-- switch. Every other visitor — and the same admin on a second device — read the
-- `{"visible":false}` default and saw no link, while the admin UI reported
-- "Visible to all visitors".
--
-- `value` is a JSON-encoded string rather than a typed column so a setting can
-- grow from a boolean into an object without another migration.
--
-- No seed row is inserted: a missing key reads as the feature's default (ASPL
-- hidden), which matches the behaviour of every browser that never had the
-- localStorage entry. Toggling the switch once in the admin panel creates it.

-- CreateTable
CREATE TABLE "app_settings" (
    "key" VARCHAR(64) NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);
