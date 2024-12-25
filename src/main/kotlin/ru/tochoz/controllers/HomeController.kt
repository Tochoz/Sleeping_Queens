package ru.tochoz.controllers

import org.koin.core.component.KoinComponent
import org.koin.core.component.get
import org.koin.java.KoinJavaComponent.inject
import ru.tochoz.app.DI
import ru.tochoz.app.mainModule
import ru.tochoz.repo.Repository

class HomeController: KoinComponent {
    private val repository: Repository = get<Repository>()
    companion object{

    }

    fun register(login: String, password: String){
        println("register call")
    }

    suspend fun get_users(): String = repository.execute("SELECT * FROM USERS")


}