create or replace function login(l varchar(255), p varchar(255))
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
begin
    if not exists(select * from users where users.login = l)
    then
        return json_build_object(
                'status', 'login not found',
                'payload', ''
               );
        exit block;
    end if;
    if not exists(select * from users where users.login = l and users.password = p) then
        return json_build_object(
                'status', 'wrong password',
                'payload', ''
               );
        exit block;
    end if;
    return json_build_object(
            'status', 'success',
            'payload', json_build_object('token', createtoken(l), l, )
           );
end;
$$;
