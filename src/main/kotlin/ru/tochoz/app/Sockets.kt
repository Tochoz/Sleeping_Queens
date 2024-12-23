package ru.tochoz.app

import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import ru.tochoz.controllers.WsController
import kotlin.time.Duration.Companion.seconds
import org.koin.core.component.get
import org.koin.dsl.koinApplication
import org.koin.ktor.plugin.koin
import ru.tochoz.controllers.HomeController
import ru.tochoz.core.DiInject

private val wsController: WsController by lazy { DiInject<WsController>().value }

fun Application.configureSockets() {
    install(WebSockets) {
        pingPeriod = 15.seconds
        timeout = 15.seconds
        maxFrameSize = Long.MAX_VALUE
        masking = false
    }
    routing {
        webSocket("/ws") {
            for (frame in incoming) {
                if (frame is Frame.Text) wsController.handle(frame, this)
            }
        }
    }
}
