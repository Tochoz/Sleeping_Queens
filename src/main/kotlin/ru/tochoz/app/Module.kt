package ru.tochoz.app

import org.koin.core.context.startKoin
import org.koin.dsl.koinApplication
import org.koin.dsl.module

val mainModule = module {}

val DI = koinApplication {
    modules(mainModule)
}

