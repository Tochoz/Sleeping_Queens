create or replace procedure removePlayerFromRoom(playerId integer, roomid integer)
    language plpgsql
    external security invoker
as $$
<<block>>
declare
begin
    insert into table_queens (id_queen, id_room, position)
        select id_queen, roomid, val from (
            (select id_queen, (row_number() over (order by random())) as n from player_queens where id_player=playerId) as q
            inner join
            (select val, (row_number() over (order by random())) as m from (values (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12)) as t(val) where val not in (select position from table_queens where id_room=roomId) order by random()) as t
            on m=n
        );

    insert into used_cards select id_card, roomid from player_cards where id_player=playerId;
    delete from player_queens where id_player=playerId;
    delete from player_cards where id_player=playerId;
    delete from players where id_player=playerId;
    if (not exists(select id_player from players where id_room=roomid)) then
        delete from cards where id_card in (select id_card from used_cards where id_room=roomid) or id_card in (select id_card from deck_cards where id_room=roomid);
        delete from queens where id_queen in (select id_queen from table_queens where id_room=roomid);
        delete from rooms where id_room=roomid;
    end if;
    if (exists(select p.id_room from players p join rooms r on p.id_room = r.id_room where status='RUNNING' and p.id_room=roomid group by p.id_room having count(*)<=1)) then
        update rooms set status='ENDED' where id_room=roomid;
    end if;
end;
$$;
