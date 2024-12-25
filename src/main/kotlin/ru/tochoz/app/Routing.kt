package ru.tochoz.app

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.koin.core.context.GlobalContext
import ru.tochoz.controllers.HomeController
import ru.tochoz.core.DiInject
import ru.tochoz.repo.Repository
import java.io.File

private val repository: Repository by lazy { DiInject<Repository>().value }
private val homeController: HomeController by lazy { DiInject<HomeController>().value }

fun Application.configureRouting() {
    routing {
        staticResources("/static", "/front/static")
        get("/") {
            call.respondFile(File("src/main/resources/front/index.html"))
        }
    }
}
