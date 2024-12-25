create or replace function prepareWaitRoomInfo(playerId integer, roomid integer)
    returns json
    language plpgsql
    external security invoker
as $$
<<block>>
DECLARE
    result json;
begin
    if exists(select * from rooms where id_room=roomid and status='WAIT') then
        SELECT row_to_json(t)
        INTO result
        FROM (
             select rooms.id_room, playerId as id_player, turn_duration, array_agg(login) as players_list, array_agg(id_player) as players_id_list, count(login) as players, players as max_players, invite_code
                from rooms
                left join players on rooms.id_room = players.id_room
                where rooms.id_room = roomid
                group by rooms.id_room
         ) t;

        return result;
        exit block;
    end if;
    return null;

end;
$$;
