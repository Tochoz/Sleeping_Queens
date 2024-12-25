create or replace function createRoom(tk varchar(255), turn_d int, isOpen boolean, plyrs int)
    returns json
    language plpgsql
    external security definer
as $$
<<block>>
DECLARE
    l varchar;
    invite varchar(6) = null;
    created_id integer;
    playerid integer;
begin
    l = checktoken(tk);
    if l is null
    then
        return json_build_object(
                'status', 'not authorized',
                'payload', ''
               );
        exit block;
    end if;
    if turn_d < 10 or plyrs < 2 or plyrs > 5
    then
        return json_build_object(
                'status', 'invalid turn duration or players count',
                'payload', ''
               );
        exit block;
    end if;
    if not isOpen then
        invite = generateinvitecode();
        while exists(select * from rooms where invite_code = invite and status = 'WAIT') loop
            invite = generateinvitecode();
        end loop;
        insert into rooms
        (turn_duration, invite_code, players) values
            (turn_d, invite, plyrs)
        returning id_room into created_id;
        playerid = addplayertoroom(l, created_id);
        return json_build_object(
                'status', 'success',
                'payload', preparewaitroominfo(playerid, created_id)
        );
    end if;
    insert into rooms
        (turn_duration, invite_code, players) values
        (turn_d, invite, plyrs)
        returning id_room into created_id;
    playerid = addplayertoroom(l, created_id);
    return json_build_object(
            'status', 'success',
            'payload', preparewaitroominfo(playerid, created_id)
   );
end;
$$;
