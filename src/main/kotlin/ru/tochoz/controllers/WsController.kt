package ru.tochoz.controllers

import com.google.gson.GsonBuilder
import io.ktor.websocket.*
import kotlinx.coroutines.isActive
import kotlinx.coroutines.runBlocking
import org.koin.core.component.KoinComponent
import org.koin.core.component.get
import org.slf4j.LoggerFactory
import ru.tochoz.repo.*

private val gson = GsonBuilder().create()

class WsController : KoinComponent {
    val logger = LoggerFactory.getLogger("Application")
    val players = mutableMapOf<Int, MutableSet<WebSocketSession>>() // WS sessions for player
    val rooms = mutableMapOf<Int, MutableSet<Int>>() // Players in rooms
    val inLobbySessions = mutableSetOf<WebSocketSession>()

    private val repository: Repository = get<Repository>()

    suspend fun handle(f: Frame.Text, session: WebSocketSession) {
        val text = f.readText()
        if (text.equals("bye", ignoreCase = true)) {
            logger.debug("got ws message: {}", text)
            session.close(CloseReason(CloseReason.Codes.NORMAL, "Client said BYE"))
            return
        }
        val request = gson.fromJson(text, FrontRequest::class.java)
        logger.debug("GOT REQUEST $request")

        when(request.method){
            "register", "login" -> {
                val response = repository.execute(request.toFunRequest(false))
                session.send(gson.toJson(response.toFront(request.method)))
            }
            "getOpenRooms" -> {
                inLobbySessions.add(session)
                val response = repository.execute(request.toFunRequest(true))
                session.send(gson.toJson(response.toFront(request.method)))
            }
            "createRoom" -> {
                val response = repository.execute(request.toFunRequest(true))
                session.send(gson.toJson(response.toFront(request.method)))

                if (response.status == "success") {
                    val playerId = response.payload?.asJsonObject?.get("id_player")?.asInt
                    val roomId = response.payload?.asJsonObject?.get("id_room")?.asInt
                    logger.debug(response.toString())
                    rooms.put(roomId!!, mutableSetOf(playerId!!))
                    players.putIfAbsent(playerId, mutableSetOf())
                    players[playerId]!!.add(session)
                    logger.debug("PLAYERS {}",players)
                    logger.debug("ROOMS {}",rooms)
                    val pollAns = gson.toJson(response.toFront("was createRoom"))


                    inLobbySessions.forEach { try{it.send(pollAns)} catch (e: Exception){} }
                }
            }
            "userJoinCloseRoom", "userJoinOpenRoom", "userLeaveRoom" -> {
                val response = repository.execute(request.toFunRequest(true))
                session.send(gson.toJson(response.toFront(request.method)))
                val pollAns = gson.toJson(response.toFront("was createRoom"))
                logger.debug("PLAYERS {}",players)
                logger.debug("ROOMS {}",rooms)

                inLobbySessions.forEach { try{it.send(pollAns)} catch (e: Exception){} }

            }
            "getRoomInfo" -> {
                val response = repository.execute(request.toFunRequest(true))
                session.send(gson.toJson(response.toFront(request.method)))
                logger.debug(response.toString())
                if (response.status == "waiting room success" || response.status == "running room success") {
                    val playerId = response.payload?.asJsonObject?.get("id_player")?.asInt
                    val roomId = request.args[0].toString().toDouble().toInt()
                    if (playerId != null){
                        players.putIfAbsent(playerId, mutableSetOf())
                        players[playerId]!!.add(session)
                        rooms.putIfAbsent(roomId, mutableSetOf())
                        rooms[roomId]!!.add(playerId)
                        logger.debug("PLAYERS {}",players)
                        logger.debug("ROOMS {}",rooms)
                    }
                }
            }
            "playDigits", "playKing", "playAttack", "playDefend" -> {
                val response = repository.execute(request.toFunRequest(true))
                session.send(gson.toJson(response.toFront(request.method)))
                logger.debug(response.toString())
                if (response.status.contains("success")) {
                    val playerId = response.payload?.asJsonObject?.get("id_player")?.asInt
                    val roomId = request.args[0].toString().toDouble().toInt()
                    logger.debug("extracted player $playerId in room $roomId")

                    if (playerId != null) {
                        val pollAns = gson.toJson(FrontResponce("was turn", "success", null))
                        logger.debug("PLAYERS {}",players)
                        logger.debug("ROOMS {}",rooms)
                        rooms[roomId]?.let { idRoom ->
                            idRoom.filterNot { it == playerId }.forEach { idPlayer ->
                                players[idPlayer]!!.forEach {
                                    if (it != null && it.isActive)
                                        try {
                                            it.send(pollAns)
                                        } catch (e: Exception){
//                                            players[idPlayer]!!.remove(it)
                                        }
//                                    else players[idPlayer]!!.remove(it)
                                }
                            }
                        }

                    }
                }
            }
            else -> {
                logger.error("got unhandled method {}", text)
            }
        }


    }
}