create or replace function getRoomInfo(tk varchar(255), roomid integer)
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
declare
    l varchar;
    roominfo json;
    playerId integer = null;
    wonPlayer integer;
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

    if exists(select * from rooms where id_room=roomid and status='WAIT') then
        roominfo = preparewaitroominfo(playerid, roomid);
        return json_build_object(
                'status', 'waiting room success',
                'payload', roominfo
               );
    end if;

    if exists(select * from rooms where id_room=roomid and status='RUNNING') then
        wonPlayer = checkroomforwin(roomid);
        if wonPlayer != -1 then
            return json_build_object(
                    'status', 'game finished',
                    'payload', json_build_object('wonPlayer', wonPlayer)
                   );
        end if;
        roominfo = preparerunningroominfo(playerId);

        return json_build_object(
                'status', 'running room success',
                'payload', roominfo
               );
    end if;

    if exists(select * from rooms where id_room=roomid and status='ENDED') then
        raise debug 'idroom %', roomid;
        wonPlayer = checkroomforwin(roomid);
        return json_build_object(
                'status', 'game finished',
                'payload', json_build_object('wonPlayer', wonPlayer)
               );
    end if;

    return json_build_object(
            'status', 'room not found',
            'payload', ''
           );
end;
$$;
