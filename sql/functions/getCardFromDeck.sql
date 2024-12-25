create or replace procedure getCardFromDeck(playerId integer)
    language plpgsql
    external security invoker
as $$
<<block>>
declare
    cardId integer;
    roomId integer;
begin
    select id_room into roomId from players where id_player = playerId;

    -- Если карт нет, перемешиваем сброс
    if not exists(select * from deck_cards where id_room=roomId) then
        INSERT INTO deck_cards (id_card, id_room)
            SELECT id_card, id_room from used_cards where id_room=roomId
            ORDER BY RANDOM();
        delete from used_cards where id_room=roomId;
    end if;

    select id_card into cardId from deck_cards where id_room=roomId limit 1;
    insert into player_cards (id_card, id_player) VALUES (cardId, playerId);
    delete from deck_cards where id_room=roomId and id_card=cardId;

end;
$$;