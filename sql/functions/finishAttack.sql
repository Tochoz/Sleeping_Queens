create or replace procedure finishAttack(initplayer integer, result bool)
    language plpgsql
    external security invoker
as $$
<<block>>
declare
    targetPlayerId integer;
    attackValue card_value;
    queenId integer;
    freePosition integer;
    roomId integer;
begin
    select id_room into roomId from players where id_player=initplayer;
    raise debug 'finishAttack: roomId: %', roomId;
    if exists(select * from attacks where id_init_player=initplayer) then
        select c.value, id_target_queen into attackValue, queenId from attacks a join public.cards c on c.id_card = a.id_attack_card where id_init_player=initplayer;
        select id_player into targetPlayerId from player_queens where id_queen=queenId;
        raise debug 'finishAttack: attackValue: %, targetPlayerId: %, queenId: %', attackValue, targetPlayerId, queenId;
        if result=true then
            -- Получение случайной свободной позиции
            select val into freePosition from (values (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12)) as t(val) where val not in (select position from table_queens where id_room=roomId) order by random();
            case attackValue
                when 'Сонное Зелье' then
                    raise debug 'finishAttack: doing flusk attack';
                    delete from player_queens where id_player=targetPlayerId and id_queen=queenId;
                    insert into table_queens values (queenId, roomId, freePosition);
                when 'Рыцарь' then
                    raise debug 'finishAttack: doing knight attack';
                    if (exists(select * from queens where id_queen=queenId and type='Королева Собак') and
                        exists(select * from player_queens join queens on queens.id_queen=player_queens.id_queen where id_player=initplayer and type='Королева Кошек')) or
                       (exists(select * from queens where id_queen=queenId and type='Королева Кошек') and
                        exists(select * from player_queens join queens on queens.id_queen=player_queens.id_queen where id_player=initplayer and type='Королева Собак')) then
                        raise debug 'finishAttack: doing knight attack conflict';
                        delete from player_queens where id_player=targetPlayerId and id_queen=queenId;
                        insert into table_queens values (queenId, roomId, freePosition);
                    else
                        raise debug 'finishAttack: doing knight attack no conflict';
                        delete from player_queens where id_player=targetPlayerId and id_queen=queenId;
                        insert into player_queens values (queenId, initplayer);
                    end if;
            end case;
        end if;
        delete from attacks where id_init_player=initplayer;
    end if;
end;
$$;