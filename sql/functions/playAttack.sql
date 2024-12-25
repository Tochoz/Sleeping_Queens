create or replace function playAttack(tk varchar(255), roomid integer, cardid integer, queenid integer)
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
    declare
    l varchar;
    playerId integer = null;
    targetPlayerId integer = null;
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

    select id_player into targetPlayerId from player_queens where id_queen=queenid;
    if targetPlayerId is null then
        return json_build_object(
                'status', 'invalid target',
                'payload', ''
               );
    end if;

    if not exists(select * from player_cards join cards on player_cards.id_card = cards.id_card where id_player=playerId and cards.id_card = cardId and (value='Сонное Зелье' or value='Рыцарь')) then
        return json_build_object(
                'status', 'invalid card',
                'payload', ''
               );
    end if;

    insert into attacks values (playerId, cardid, queenid);
    delete from player_cards where id_player=playerId and id_card=cardid;
    insert into used_cards values (cardid, roomid);
    call getcardfromdeck(playerId);
    update turns set id_player=targetPlayerId, begin_at=(now() at time zone 'UTC') where id_player=playerId;

    return json_build_object(
            'status', 'success',
            'payload', preparerunningroominfo(playerId)
           );
end;
$$;
