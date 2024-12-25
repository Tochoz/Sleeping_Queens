create or replace function addPlayerToRoom(l varchar(255), roomid integer)
    returns integer
    language plpgsql
    external security invoker
as $$
<<block>>
    declare
    playerId integer;
begin
    if not exists(select * from players where login=l and roomid = id_room) then
        insert into players (id_room, login) values (roomid, l) returning id_player into playerId;
    else
        select id_player into playerId from players where login=l and roomid = id_room;
    end if;
    return playerId;
end;
$$;
