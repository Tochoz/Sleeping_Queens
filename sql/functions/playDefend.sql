create or replace function playDefend(tk varchar(255), roomid integer, cardId integer)
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
    declare
    l varchar;
    playerId integer;
    initPlayerId integer;
    targetPlayerId integer;
    targetQueenId integer;
    attackCardId integer;
    attackCardValue card_value;
    defendCardValue card_value;
    duration integer;
begin
    l = checktoken(tk);
    if l is null then
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

    if not exists(select * from attacks a left join player_queens pq on a.id_target_queen=pq.id_queen where pq.id_player=playerId) then
        return json_build_object(
                'status', 'attack not found',
                'payload', ''
               );
    end if;

    select id_init_player, id_target_queen, id_attack_card into initPlayerId, targetQueenId, attackCardId from attacks where id_target_queen in (select id_queen from player_queens where id_player=playerId) limit 1;

    if (cardId is null) then
        perform changeturn(roomid);
        raise debug 'turn changed';
        call finishAttack(initPlayerId, true);
        return json_build_object(
                'status', 'success skip defend',
                'payload', preparerunningroominfo(playerId)
               );
    end if;

    -- Если кинули не существующую или не защитную карту
    if not exists(select * from player_cards join cards on player_cards.id_card = cards.id_card where id_player=playerId and player_cards.id_card = cardId and (value='Дракон' or value='Волшебная Палочка')) then
        perform changeturn(roomid);
        call finishAttack(initPlayerId, true);
        return json_build_object(
                'status', 'invalid card',
                'payload', ''
               );
    end if;


    select turn_duration into duration from rooms where id_room=roomid;
    select id_player into targetPlayerId from player_queens where id_queen=targetQueenId;

    select value into attackCardValue from cards where id_card=attackCardId;
    select value into defendCardValue from cards where id_card=cardId;

    -- Если ход уже закончился
    if exists(select * from turns where id_player=playerId and begin_at<(now() at time zone 'UTC')-(duration * INTERVAL '1 second')) then
        perform changeturn(roomid);
        call finishAttack(initPlayerId, true);
        return json_build_object(
                'status', 'late defend attack success',
                'payload', preparerunningroominfo(playerId)
               );
    end if;

    if (defendCardValue='Волшебная Палочка' and attackCardValue='Сонное Зелье') or (defendCardValue='Дракон' and attackCardValue='Рыцарь') then
        perform changeturn(roomid);
        call finishAttack(initPlayerId, false);
        delete from player_cards where id_player=playerId and id_card=cardid;
        insert into used_cards values (cardid, roomid);
        call getcardfromdeck(playerId);
        return json_build_object(
                'status', 'success defend',
                'payload', preparerunningroominfo(playerId)
               );
    else
        perform changeturn(roomid);
        call finishAttack(initPlayerId, true);
        return json_build_object(
                'status', 'invalid defend',
                'payload', preparerunningroominfo(playerId)
               );
    end if;
end;
$$;