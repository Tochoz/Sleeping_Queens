CREATE OR REPLACE FUNCTION generateInviteCode()
    RETURNS varchar(6)
    LANGUAGE plpgsql
    external security invoker
as $$
<<block>>
DECLARE
    chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
BEGIN
    RETURN
        substring(chars, cast(1 + floor(random() * length(chars)) as int), 1) ||
        substring(chars, cast(1 + floor(random() * length(chars)) as int), 1) ||
        substring(chars, cast(1 + floor(random() * length(chars)) as int), 1) ||
        substring(chars, cast(1 + floor(random() * length(chars)) as int), 1) ||
        substring(chars, cast(1 + floor(random() * length(chars)) as int), 1) ||
        substring(chars, cast(1 + floor(random() * length(chars)) as int), 1)
    ;
END;
$$
