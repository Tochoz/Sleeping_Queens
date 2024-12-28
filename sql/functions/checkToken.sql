create or replace function checkToken(tk varchar(255))
    returns varchar
    language plpgsql
    external security definer
as $$
<<block>>
begin
    if exists(select * from tokens where token=tk)
    then
        update tokens SET "lastUse" = current_timestamp where token=tk;
        return (select login from tokens where token=tk limit 1);
        exit block;
    end if;
    return NULL;

end;
$$;