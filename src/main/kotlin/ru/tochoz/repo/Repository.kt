package ru.tochoz.repo

import com.google.gson.GsonBuilder
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.h2.util.json.JSONObject
import org.jooq.impl.DSL
import org.koin.core.component.KoinComponent
import org.slf4j.LoggerFactory
import java.sql.Connection

private val gson = GsonBuilder()
    .registerTypeAdapter(String::class.java, StringOrObjectDeserializer())
    .create()

private val logger = LoggerFactory.getLogger("Main")

class Repository: KoinComponent {
    val connection: Connection

    constructor(dbConnection: DbConnection) {
        this.connection = dbConnection.connection
    }

    suspend fun execute(query: String): String = withContext(Dispatchers.IO){
        val statement = connection.prepareStatement(query)
        val resultSet = statement.executeQuery()

        return@withContext DSL.using(connection).fetch(resultSet).formatJSON()
    }

    suspend fun execute(request: ProcRequest): Boolean = withContext(Dispatchers.IO){
        logger.debug("Repository: procedure call - {}", request)
        val query = "CALL ${request.name}(${
            request.args.map { element ->
                when (element) {
                    is String -> "'$element'"
                    else -> element.toString()
                }
            }.joinToString(", ")
        }) as ans"
        val call = connection.prepareCall(query)
        return@withContext call.execute().also { logger.debug("Repository: procedure call ans - '$query' :  $it") }
    }

    suspend fun execute(request: FunRequest): Response = withContext(Dispatchers.IO) {
        logger.debug("Repository: function call - {}", request)
        val query = "SELECT  ${request.name}(${
            request.args.map { element ->
                when (element) {
                    is String -> "'$element'"
                    is Boolean -> "$element"
                    null -> "null"
                    else -> element.toString().toDouble().toInt()
                }
            }.joinToString(", ")
        }) as ans"
        logger.debug("Repository: function query - {}", query)
        val statement = connection.prepareStatement(query)
        val resultSet = statement.executeQuery()

        if (resultSet.next()) {
            val ans = resultSet.getString("ans")
            val response = gson.fromJson(ans, Response::class.java)

            return@withContext response.also { logger.debug("Repository: function call ans - '$query' ====== $response") }
        } else
            return@withContext Response("Repository error", null).also { logger.error("Repository: function call - '$query'", resultSet) }
    }

}