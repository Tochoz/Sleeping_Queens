package ru.tochoz.app

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.io.InputStream

fun Application.configureRouting() {
    routing {
        staticResources("/static", "/front/static")
        get("/") {
            // Load the index.html file from resources
            val inputStream: InputStream? = this::class.java.classLoader.getResourceAsStream("front/index.html")

            // Check if the file was found
            if (inputStream != null) {
                // Read the content of the file
                val content = inputStream.bufferedReader().use { it.readText() }
                call.respondText(content, ContentType.Text.Html)
            } else {
                call.respondText("File not found", status = HttpStatusCode.NotFound)
            }
        }
    }
}
