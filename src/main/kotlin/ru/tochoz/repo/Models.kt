package ru.tochoz.repo

import com.google.gson.*
import ru.tochoz.core.map
import java.lang.reflect.Type

data class Response(
    val status: String,
    val payload: JsonElement?
)

class StringOrObjectDeserializer : JsonDeserializer<String>, JsonSerializer<String> {
    override fun deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext): String {
        return when {
            json.isJsonPrimitive -> {
                val primitive = json.asJsonPrimitive
                if (primitive.isString) {
                    primitive.asString
                } else {
                    throw JsonParseException("Expected a string, but was $json")
                }
            }
            json.isJsonObject -> json.toString()
            else -> throw JsonParseException("Expected a string, but was $json")
        }
    }

    override fun serialize(src: String, typeOfSrc: Type, context: JsonSerializationContext): JsonElement {
        return JsonPrimitive(src)
    }
}

data class FrontRequest (
    val tk: String?,
    val method: String,
    val args: List<Any>
)

data class FrontResponce (
    val method: String?,
    val status: String,
    val payload: JsonElement?
)

fun Response.toFront(method: String) = FrontResponce(method, status, payload)



fun FrontRequest.toFunRequest(useToken: Boolean = false) =
    FunRequest(method, if (!tk.isNullOrEmpty() && useToken) (listOf(tk!!) + args) else args)
fun FrontRequest.toProcRequest(useToken: Boolean = false) =
    ProcRequest(method, if (!tk.isNullOrEmpty() && useToken) (listOf(tk!!) + args) else args)



data class FunRequest(
    val name: String,
    val args: List<Any?>
)

data class ProcRequest(
    val name: String,
    val args: List<Any>
)