create or replace function userLeaveRoom(tk varchar(255), roomId integer)
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
DECLARE
    l varchar;
    playerId integer = null;
begin
    l = checktoken(tk);
    if l is null
    then
        return json_build_object(
                'status', 'not authorized',
                'payload', ''
               );
        exit block;
    end if;
    select id_player into playerId from players where id_room=roomid and login=l;
    if playerId is null then
        return json_build_object(
                'status', 'player not found',
                'payload', ''
               );
    end if;

    call removeplayerfromroom(playerId, roomid);

    return json_build_object(
            'status', 'success',
            'payload', ''
           );
end;
$$;
