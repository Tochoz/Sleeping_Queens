create or replace function prepareRunningRoomInfo(playerId integer)
    returns json
    language plpgsql
    external security invoker
as $$
<<block>>
declare
    roomId integer;
    otherPlayers json;
    handCards json;
    handQueens json;
    tableQueensPositions json;
    turnPlayer integer;
    isAttack bool;
    duration integer;
    initPlayerId integer = null;
    targetPlayerId integer = null;
    targetQueenId integer = null;
    expiresIn time;
    attackCardId integer = null;
begin
    select id_room into roomId from players where id_player=playerId;

    select json_agg(row_to_json(t))
    into otherPlayers
    from (
        select p.id_player, u.login, COALESCE(json_agg(preparequeeninfo(id_queen)) FILTER (WHERE id_queen IS NOT NULL), '[]'::json) as queens from players p
        left join users u on p.login = u.login
        left join player_queens on p.id_player = player_queens.id_player
        where p.id_room=roomId and p.id_player!=playerId
        group by p.id_player, u.login
    ) t;

    select json_agg(preparecardinfo(id_card))
    into handCards
    from player_cards where id_player=playerId
    group by id_player;

    if handCards is null then
        handCards = '[]'::json;
    end if;

    select json_agg(preparequeeninfo(id_queen))
    into handQueens
    from player_queens where id_player=playerId
    group by id_player;

    if handQueens is null then
        handQueens = '[]'::json;
    end if;

    select json_agg(position)
    into tableQueensPositions
    from table_queens where id_room=roomId
    group by id_room;

    if tableQueensPositions is null then
        tableQueensPositions = '[]'::json;
    end if;

    select turn_duration into duration from rooms where id_room=roomid;
    -- Если есть атака защита которой истекла TODO check
    select p.id_player into targetPlayerId from turns t join players p on t.id_player = p.id_player where t.id_player in (select player_queens.id_player from attacks inner join player_queens on id_target_queen=id_queen) and t.begin_at<(now() at time zone 'UTC')-(duration * INTERVAL '1 second') and p.id_room=roomId;
    if targetPlayerId is not null then
        raise debug 'room had expired defend on attack';
        select id_init_player into initPlayerId from attacks where id_target_queen in (select id_queen from player_queens where id_player=targetPlayerId);
        perform changeturn(roomid);
        call finishAttack(initPlayerId, true);
    end if;
    turnPlayer = getturnplayer(roomId);
    select begin_at+(duration * INTERVAL '1 second')-(now() at time zone 'UTC') into expiresIn from turns where id_player in (select id_player from players where id_room=roomId);

    isAttack = exists(select * from attacks where id_init_player in (select id_player from players where id_room=roomId));
    if (isAttack) then
        select id_init_player, id_attack_card, id_target_queen into initPlayerId, attackCardId, targetQueenid from attacks where id_init_player in (select id_player from players where id_room=roomid) limit 1;
        select id_player into targetPlayerId from player_queens where id_queen=targetQueenid;
        return json_build_object(
                'turnPlayer', turnPlayer,
                'id_player', playerId,
                'expiresIn', expiresIn,
                'attack', json_build_object(
                        'id_init_player', initPlayerId,
                        'id_target_player', targetPlayerId,
                        'attack_card', preparecardinfo(attackCardId),
                        'target_queen', preparequeeninfo(targetQueenid)
                          ),
                'handCards', handCards,
                'handQueens', handQueens,
                'tableQueensPositions', tableQueensPositions,
                'otherPlayers', otherPlayers
               );
    end if;

    return json_build_object(
           'turnPlayer', turnPlayer,
           'id_player', playerId,
           'expiresIn', expiresIn,
           'attack', null,
           'handCards', handCards,
           'handQueens', handQueens,
           'tableQueensPositions', tableQueensPositions,
           'otherPlayers', otherPlayers
    );
end;
$$;
