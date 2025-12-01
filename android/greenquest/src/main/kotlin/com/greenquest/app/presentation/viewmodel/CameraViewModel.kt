package com.greenquest.app.presentation.viewmodel

import com.greenquest.app.data.repository.MissionRepository
import com.greenquest.app.device.location.LocationProvider
import com.greenquest.app.device.telecom.TelecomManagerService
import com.greenquest.app.domain.model.Mission
import com.greenquest.app.domain.model.NetworkType
import com.greenquest.app.domain.usecase.RefreshMissionsUseCase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class CameraViewModel(
    private val missionRepository: MissionRepository,
    private val refreshMissionsUseCase: RefreshMissionsUseCase,
    private val telecomManagerService: TelecomManagerService,
    private val locationProvider: LocationProvider,
    private val externalScope: CoroutineScope = CoroutineScope(Dispatchers.Default)
) {

    val missions: StateFlow<List<Mission>> = missionRepository
        .observeActiveMissions()
        .stateIn(externalScope, SharingStarted.Eagerly, emptyList())

    private val _networkTypeLabel = MutableStateFlow(NetworkType.LTE.name)
    val networkTypeLabel: StateFlow<String> = _networkTypeLabel

    init {
        externalScope.launch {
            combine(
                telecomManagerService.observeSignalDbm(),
                telecomManagerService.observeNetworkType(),
                telecomManagerService.observeTowerId(),
                locationProvider.observeLocation()
            ) { dbm, type, towerId, location ->
                _networkTypeLabel.value = "${type.name} (${dbm}dBm)"
                refreshMissionsUseCase(
                    latitude = location.latitude,
                    longitude = location.longitude,
                    signalDbm = dbm,
                    networkType = type,
                    towerId = towerId
                )
            }.collect { }
        }
    }
}
