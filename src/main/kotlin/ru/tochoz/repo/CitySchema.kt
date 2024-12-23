package ru.tochoz.repo

import kotlinx.coroutines.*
import kotlinx.serialization.Serializable
import ru.tochoz.core.runIf
import java.sql.Connection
import java.sql.Statement

@Serializable
data class City(val name: String, val population: Int)

class CityService(private val connection: Connection, private val embeded: Boolean) {
    companion object {
        private const val CREATE_TABLE_CITIES =
            "CREATE TABLE CITIES (ID SERIAL PRIMARY KEY, NAME VARCHAR(255), POPULATION INT);"
        private const val SELECT_CITY_BY_ID = "SELECT name, population FROM cities WHERE id = ?"
        private const val SELECT_CITIES = "SELECT name, population FROM cities"
        private const val INSERT_CITY = "INSERT INTO cities (name, population) VALUES (?, ?)"
        private const val UPDATE_CITY = "UPDATE cities SET name = ?, population = ? WHERE id = ?"
        private const val DELETE_CITY = "DELETE FROM cities WHERE id = ?"

    }

    init {
        embeded.runIf {
            val statement = connection.createStatement()
            statement.executeUpdate(CREATE_TABLE_CITIES)
        }
        // TODO fixtures
    }

    private var newCityId = 0

    // Create new city
    suspend fun create(city: City): Int = withContext(Dispatchers.IO) {
        val statement = connection.prepareStatement(INSERT_CITY, Statement.RETURN_GENERATED_KEYS)
        statement.setString(1, city.name)
        statement.setInt(2, city.population)
        statement.executeUpdate()

        val generatedKeys = statement.generatedKeys
        if (generatedKeys.next()) {
            return@withContext generatedKeys.getInt(1)
        } else {
            throw Exception("Unable to retrieve the id of the newly inserted city")
        }
    }

    // Read a city
    suspend fun read(id: Int): City = withContext(Dispatchers.IO) {
        val statement = connection.prepareStatement(SELECT_CITY_BY_ID)
        statement.setInt(1, id)
        val resultSet = statement.executeQuery()

        if (resultSet.next()) {
            val name = resultSet.getString("name")
            val population = resultSet.getInt("population")
            return@withContext City(name, population)
        } else {
            throw Exception("Record not found")
        }
    }

    suspend fun read(): List<City> = withContext(Dispatchers.IO) {
        val statementCr = connection.prepareStatement(INSERT_CITY, Statement.RETURN_GENERATED_KEYS)
        statementCr.setString(1, "Abba")
        statementCr.setInt(2, 11111)
        statementCr.executeUpdate()

        val statement = connection.prepareStatement(SELECT_CITIES)
        val resultSet = statement.executeQuery()

        var out: MutableList<City> = mutableListOf()
        while (resultSet.next()) {
            val name = resultSet.getString("name")
            val population = resultSet.getInt("population")
            out.add(City(name, population))
        }
        return@withContext out
    }

    // Update a city
    suspend fun update(id: Int, city: City) = withContext(Dispatchers.IO) {
        val statement = connection.prepareStatement(UPDATE_CITY)
        statement.setString(1, city.name)
        statement.setInt(2, city.population)
        statement.setInt(3, id)
        statement.executeUpdate()
    }

    // Delete a city
    suspend fun delete(id: Int) = withContext(Dispatchers.IO) {
        val statement = connection.prepareStatement(DELETE_CITY)
        statement.setInt(1, id)
        statement.executeUpdate()
    }
}

