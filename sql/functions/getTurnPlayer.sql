create or replace function getTurnPlayer(roomid integer)
    returns integer
    language plpgsql
    external security invoker
as $$
<<block>>
declare
    duration smallint;
    currentPlayer integer;
begin
    select turn_duration into duration from rooms where id_room=roomid;
    if exists(select * from turns where id_player in (select id_player from players where id_room=roomid) and begin_at<(now() at time zone 'UTC')-(duration * INTERVAL '1 second')) then
        raise debug 'getTurnPlayer: turn expired';
        currentPlayer = changeturn(roomid);
    else
        select id_player into currentPlayer from turns where id_player in (select id_player from players where id_room=roomid);
    end if;
    return currentPlayer;
end;
$$;