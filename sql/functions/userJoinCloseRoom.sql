create or replace function userJoinCloseRoom(tk varchar(255), invite varchar(6))
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
DECLARE
    l varchar;
    roomid integer = null;
    roominfo json;
    playerid integer;
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
    select rooms.id_room into roomid from rooms
         where status='WAIT' and invite_code is not null and invite_code = upper(invite);
    if roomid is null then
        return json_build_object(
                'status', 'not found',
                'payload', ''
               );
        exit block;
    end if;

    playerid = addplayertoroom(l, roomid);
    roominfo = preparewaitroominfo(playerid,roomid);
    if  (select count(players) from players where id_room=roomid group by id_room) !=
        (select rooms.players from rooms where id_room = roomid) then
        return json_build_object(
            'status', 'joined',
            'payload', roominfo
        );
        exit block;
    end if;
    call startgame(roomid);
    return json_build_object(
        'status', 'joined last',
        'payload', roominfo
   );
end;
$$;
