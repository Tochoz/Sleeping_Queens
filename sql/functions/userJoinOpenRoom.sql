create or replace function userJoinOpenRoom(tk varchar(255), roomid integer)
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
DECLARE
    l varchar;
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
