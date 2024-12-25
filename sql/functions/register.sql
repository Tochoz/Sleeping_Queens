create or replace function register(l varchar(255), p varchar(255))
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
begin
    if exists(select * from users where users.login = l)
    then
         return json_build_object(
            'status', 'already in use',
            'payload', ''
        );
        exit block;
    end if;

    insert into users (login, password) values (l, p);
    return json_build_object(
        'status', 'success',
        'payload', json_build_object('token', createtoken(l))
   );
end;
$$;
