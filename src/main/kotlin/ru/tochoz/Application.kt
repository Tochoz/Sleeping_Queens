package ru.tochoz

import io.ktor.server.application.*
import io.ktor.server.plugins.calllogging.*
import org.slf4j.LoggerFactory
import org.koin.core.context.GlobalContext.startKoin
import org.koin.dsl.module
import org.koin.ktor.ext.inject
import ru.tochoz.app.*
import ru.tochoz.controllers.HomeController
import ru.tochoz.controllers.WsController
import ru.tochoz.repo.Repository
import ru.tochoz.repo.connectToPostgres
import ru.tochoz.repo.DbConnection

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    startKoin {
        modules(
            module {
                single<DbConnection> { connectToPostgres() }
                single<Repository> { Repository(get()) }
                single<HomeController> { HomeController() }
                single<WsController> { WsController() }
            },
        )
    }
    configureSecurity()
    configureSerialization()
    configureSockets()
//    configureDatabases()
    configureRouting()
    install(CallLogging) {
        level = org.slf4j.event.Level.DEBUG // Set logging level to DEBUG
        logger = LoggerFactory.getLogger("Application") // Optional: specify a logger name
    }

}
