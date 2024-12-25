create or replace function playDigits(tk varchar(255), roomid integer, card1 integer, card2 integer, card3 integer)
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
declare
    l varchar;
    playerId integer;
    value1 integer = null;
    value1str varchar;
    value2 integer = null;
    value3 integer = null;
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

    select value into value1str from player_cards join cards on player_cards.id_card = cards.id_card where id_player=playerId and cards.id_card = card1;
    select value into value2 from player_cards join cards on player_cards.id_card = cards.id_card where id_player=playerId and cards.id_card = card2 and cast(value as varchar) in (values ('1'),('2'),('3'),('4'),('5'),('6'),('7'),('8'),('9'),('10'));
    select value into value3 from player_cards join cards on player_cards.id_card = cards.id_card where id_player=playerId and cards.id_card = card3 and cast(value as varchar) in (values ('1'),('2'),('3'),('4'),('5'),('6'),('7'),('8'),('9'),('10'));


    if value1str is null then
        return json_build_object(
                'status', 'invalid card1',
                'payload', ''
               );
    end if;

    if (value2 is null and value3 is null ) then
        -- Сыграть одну любую карту
        delete from player_cards where id_player=playerId and id_card=card1;
        insert into used_cards values (card1, roomid);
        call getcardfromdeck(playerId);
        perform changeturn(roomid);
        return json_build_object(
                'status', 'success',
                'payload', preparerunningroominfo(playerId)
               );
    end if;
    value1 = cast(value1str as integer);

    if (value2 is null and card2 is not null) or (card1=card2) then
        return json_build_object(
                'status', 'invalid card2',
                'payload', ''
               );
    end if;

    if (value3 is null and card3 is not null) or (card3=card1 or card3=card2) then
        return json_build_object(
                'status', 'invalid card3',
                'payload', ''
               );
    end if;

    -- Сыграть три карты
    if value3 is not null then
        if not (value1+value2=value3 or value1-value2=value3 or value2=value3+value1) then
            return json_build_object(
                    'status', 'invalid expression',
                    'payload', ''
                   );
        end if;
        delete from player_cards where id_player=playerId and id_card=card1;
        insert into used_cards values (card1, roomid);
        delete from player_cards where id_player=playerId and id_card=card2;
        insert into used_cards values (card2, roomid);
        delete from player_cards where id_player=playerId and id_card=card3;
        insert into used_cards values (card3, roomid);
        call getcardfromdeck(playerId);
        call getcardfromdeck(playerId);
        call getcardfromdeck(playerId);
        perform changeturn(roomid);
        return json_build_object(
                'status', 'success',
                'payload', preparerunningroominfo(playerId)
               );
    end if;

    -- Сыграть две карты
    if value2 is not null then
        if value2!=value1 then
            return json_build_object(
                    'status', 'invalid pair',
                    'payload', ''
                   );
        end if;
        delete from player_cards where id_player=playerId and id_card=card1;
        insert into used_cards values (card1, roomid);
        delete from player_cards where id_player=playerId and id_card=card2;
        insert into used_cards values (card2, roomid);
        call getcardfromdeck(playerId);
        call getcardfromdeck(playerId);
        perform changeturn(roomid);
        return json_build_object(
                'status', 'success',
                'payload', preparerunningroominfo(playerId)
               );
    end if;
end;
$$;
