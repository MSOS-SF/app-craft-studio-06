package com.greenquest.app.device.telecom

import com.greenquest.app.domain.model.NetworkType
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow

class TelecomManagerService {
    private val signalDbm = MutableStateFlow(-120)
    private val networkType = MutableStateFlow(NetworkType.LTE)
    private val towerId = MutableStateFlow<String?>(null)

    fun observeSignalDbm(): Flow<Int> = signalDbm
    fun observeNetworkType(): Flow<NetworkType> = networkType
    fun observeTowerId(): Flow<String?> = towerId

    fun updateSignal(reading: Int, type: NetworkType, tower: String?) {
        signalDbm.value = reading
        networkType.value = type
        towerId.value = tower
    }
}
