create or replace function logout(tk varchar(255))
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
begin
    if not exists(select * from tokens where token=tk)
    then
        return json_build_object(
                'status', 'token not found',
                'payload', ''
               );
        exit block;
    end if;
    delete from tokens where token = tk;
    return json_build_object(
            'status', 'success',
            'payload', ''
           );
end;
$$;
