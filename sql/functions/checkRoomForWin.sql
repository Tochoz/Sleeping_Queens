create or replace function checkRoomForWin(roomid integer)
    returns integer
    language plpgsql
    external security invoker
as $$
declare
    playersCount integer;
    wonPlayer integer = -1;
begin
    select count(*) into playersCount from players where id_room=roomid group by id_room;

    if playersCount=1 then
        select id_player into wonPlayer from players where id_room=roomid;
    elsif playersCount=2 or playersCount=3 then
        select p.id_player into wonPlayer from player_queens p
            join public.queens q on p.id_queen = q.id_queen
            join public.queen_values qv on qv.type = q.type
            join players pp on p.id_player = pp.id_player
                                        where id_room=roomid
            group by p.id_player
            having sum(qv.value) >= 50 or count(q.id_queen) >= 5;
    else
        select p.id_player into wonPlayer from player_queens p
            join public.queens q on p.id_queen = q.id_queen
            join public.queen_values qv on qv.type = q.type
            join players pp on p.id_player = pp.id_player
        where id_room=roomid
            group by p.id_player
            having sum(qv.value) >= 40 or count(q.id_queen) >= 4;
    end if;
    if wonPlayer is not null then
        update rooms set status='ENDED' where id_room=roomid;
    end if;
    return wonPlayer;
end;
$$;