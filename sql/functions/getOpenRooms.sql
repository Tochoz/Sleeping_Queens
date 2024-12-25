create or replace function getOpenRooms(tk varchar(255))
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
DECLARE
    result json;
    l varchar;
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
    SELECT json_agg(row_to_json(t))
    INTO result
    FROM (
         select rooms.id_room, turn_duration, array_agg(login) as players_list, count(login) as players, players as max_players, (l=ANY(array_agg(login))) as joined
            from rooms
            left join players on rooms.id_room = players.id_room
            where rooms.invite_code is null and status = 'WAIT'
            group by rooms.id_room
            order by joined desc
     ) t;

    return json_build_object(
            'status', 'success',
            'payload', json_build_object('openRooms', COALESCE(result, '[]'::json))
   );
end;
$$;
