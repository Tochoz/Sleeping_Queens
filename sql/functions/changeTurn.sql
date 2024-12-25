create or replace function changeTurn(roomid integer)
    returns integer
    language plpgsql
    external security invoker
as $$
<<block>>
declare
    currentPlayer integer;
    nextPlayerId integer;
begin
    if exists(select * from attacks join players on attacks.id_init_player = players.id_player where id_room=roomid) then
        select id_init_player into currentPlayer from attacks join players on attacks.id_init_player = players.id_player where id_room=roomid limit 1;
    else
        select players.id_player into currentPlayer from turns join players on players.id_player = turns.id_player where id_room = roomid;
    end if;
    select id_player into nextPlayerId from (
        select id_player from players where roomid = id_room and id_player>currentPlayer
        union all
        select id_player from players where roomid = id_room and id_player<currentPlayer
    ) p limit 1;
    raise debug 'changeTurn: turn changed from % to %', currentPlayer, nextPlayerId;
    delete from turns where id_player in (select id_player from players where id_room=roomid);
    insert into turns values (nextPlayerId, (now() at time zone 'UTC'));
    return nextPlayerId;
end;
$$;
