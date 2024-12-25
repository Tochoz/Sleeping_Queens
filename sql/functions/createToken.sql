create or replace function createToken(l varchar(255))
    returns varchar
    language plpgsql
    external security invoker
as $$
<<block>>
DECLARE
    tk varchar = gen_random_uuid();
begin
    insert into tokens (login, token) VALUES (l,tk);
    return tk;
end;
$$;