create or replace function getAttackInfo(tk varchar(255), roomid integer)
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
    declare
    l varchar;
    playerId integer = null;
    initPlayerId integer = null;
    targetPlayerId integer = null;
    attackCardId integer = null;
    targetQueenid integer;
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

    if not exists(select * from attacks where id_init_player in (select id_player from players where id_room=roomid)) then
        return json_build_object(
                'status', 'attack not found',
                'payload', ''
               );
    end if;

    select id_init_player, id_attack_card, id_target_queen into initPlayerId, attackCardId, targetQueenid from attacks where id_init_player in (select id_player from players where id_room=roomid) limit 1;
    select id_player into targetPlayerId from player_queens where id_queen=targetQueenid;
    return json_build_object(
            'status', 'success',
            'payload', json_build_object(
            'id_init_player', initPlayerId,
            'id_target_player', targetPlayerId,
            'attack_card', preparecardinfo(attackCardId),
            'target_queen', preparequeeninfo(targetQueenid)
            )
    );
end;
$$;
