package ru.tochoz.repo

import io.ktor.server.application.*
import java.sql.Connection
import java.sql.DriverManager

data class DbConnection(val connection: Connection, val embeded: Boolean)


/**
 * Makes a connection to a Postgres database.
 *
 * In order to connect to your running Postgres process,
 * please specify the following parameters in your configuration file:
 * - postgres.url -- Url of your running database process.
 * - postgres.user -- Username for database connection
 * - postgres.password -- Password for database connection
 *
 * If you don't have a database process running yet, you may need to [download]((https://www.postgresql.org/download/))
 * and install Postgres and follow the instructions [here](https://postgresapp.com/).
 * Then, you would be able to edit your url,  which is usually "jdbc:postgresql://host:port/database", as well as
 * user and password values.
 *
 * @return [Connection] that represent connection to the database. Please, don't forget to close this connection when
 * your application shuts down by calling [Connection.close]
 * */
fun Application.connectToPostgres(): DbConnection {
    Class.forName("org.postgresql.Driver")
    val isEmbeded = environment.config.property("postgres.embededMode").getString().toBoolean()
    if (isEmbeded) {
        log.info("Using embedded H2 database for testing; replace this flag to use postgres")
        return DbConnection(
            DriverManager.getConnection("jdbc:h2:mem:test;DB_CLOSE_DELAY=-1", "root", ""),
            true
        )
    } else {
        val url = "jdbc:postgresql://${environment.config.property("postgres.url").getString()}"
        log.info("Connecting to postgres database at $url")
        val user = environment.config.property("postgres.user").getString()
        val password = environment.config.property("postgres.password").getString()

        return DbConnection(
            DriverManager.getConnection(url, user, password),
            false
        )
    }
}
