package ru.tochoz.core

import org.koin.core.context.GlobalContext
import org.koin.core.parameter.ParametersDefinition
import org.koin.core.qualifier.Qualifier
import org.koin.mp.KoinPlatformTools

fun <T> Boolean.map(a: T, b: T) = if (this) a else b

fun <T> Boolean.map(a: T, b: () -> T) = if (this) a else b()

inline  fun <T> Boolean.map(a: () -> T, b: T) = if (this) a() else b

fun  Boolean.runIf(a: () -> Unit) = if (this) a() else Unit

inline fun <reified T: Any> DiInject(qualifier: Qualifier? = null,
     mode: LazyThreadSafetyMode = KoinPlatformTools.defaultLazyMode(),
     noinline parameters: ParametersDefinition? = null,
): Lazy<T> = GlobalContext.get().inject<T>(qualifier, mode, parameters)