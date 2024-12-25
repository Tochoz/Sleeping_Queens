create or replace function playKing(tk varchar(255), roomid integer, cardId integer, pos integer)
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
    declare
    l varchar;
    playerId integer = null;
    queenId integer;
begin
    l = checktoken(tk);
    if l is null
    then
        return json_build_object(
                'status', 'not authorized',
                'payload', ''
               );

    end if;

    if not exists(select * from rooms where id_room=roomid and status='RUNNING') then
        return json_build_object(
                'status', 'running room not found',
                'payload', ''
               );
    end if;

    select id_player into playerId from players where id_room=roomid and login=l;
    if playerId is null then
        return json_build_object(
                'status', 'player not found',
                'payload', ''
               );
    end if;

    if playerId!=getturnplayer(roomid) then
        return json_build_object(
                'status', 'not player turn',
                'payload', ''
               );
    end if;

    if exists(select * from attacks join players on attacks.id_init_player = players.id_player where id_room=roomid) then
        return json_build_object(
                'status', 'attack happening',
                'payload', ''
               );
    end if;


    if not exists(select * from player_cards join cards on player_cards.id_card = cards.id_card where id_player=playerId and cards.id_card = cardId and value='Король') then
        return json_build_object(
                'status', 'invalid card',
                'payload', ''
               );
    end if;

    if not exists(select * from table_queens where id_room=roomid and position=pos) then
        return json_build_object(
                'status', 'invalid position',
                'payload', ''
               );
    end if;
    select id_queen into queenId from table_queens where id_room=roomid and position=pos;
    delete from player_cards where id_card=cardId;
    insert into used_cards values (cardId, roomid);

    if (exists(select * from queens where id_queen=queenId and type='Королева Собак') and
       exists(select * from player_queens join queens on queens.id_queen=player_queens.id_queen where id_player=playerId and type='Королева Кошек')) or
       (exists(select * from queens where id_queen=queenId and type='Королева Кошек') and
        exists(select * from player_queens join queens on queens.id_queen=player_queens.id_queen where id_player=playerId and type='Королева Собак')) then
        perform changeturn(roomid);
        return json_build_object(
                'status', 'success got unsuitable queen',
                'payload', preparerunningroominfo(playerId)
               );
    end if;

    delete from table_queens where id_queen=queenId;
    insert into player_queens values (queenId, playerId);
    call getcardfromdeck(playerId);

    -- Если королева роз то берём доп случайную королеву
    if exists(select type from queens where id_queen=queenId and type='Королева Роз') then
        select id_queen into queenId from table_queens where id_room=roomid order by random();
        if (exists(select * from queens where id_queen=queenId and type='Королева Собак') and
            exists(select * from player_queens join queens on queens.id_queen=player_queens.id_queen where id_player=playerId and type='Королева Кошек')) or
           (exists(select * from queens where id_queen=queenId and type='Королева Кошек') and
            exists(select * from player_queens join queens on queens.id_queen=player_queens.id_queen where id_player=playerId and type='Королева Собак')) then
            perform changeturn(roomid);
            return json_build_object(
                    'status', 'success got unsuitable queen',
                    'payload', preparerunningroominfo(playerId)
                   );
        end if;
        delete from table_queens where id_queen=queenId;
        insert into player_queens values (queenId, playerId);
    end if;

    perform changeturn(roomid);
    if playerId = checkroomforwin(roomid) then
        return json_build_object(
                'status', 'won',
                'payload', preparerunningroominfo(playerId)
               );
    end if;
    return json_build_object(
            'status', 'success',
            'payload', preparerunningroominfo(playerId)
           );

end;
$$;