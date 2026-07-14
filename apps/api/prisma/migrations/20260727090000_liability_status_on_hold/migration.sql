-- Additive: LiabilityStatus gains ON_HOLD alongside ACTIVE/CLOSED. No existing rows change value.
ALTER TYPE "public"."LiabilityStatus" ADD VALUE 'ON_HOLD';
