package com.greenquest.app.domain.usecase

import com.greenquest.app.domain.mission.MissionEngine
import com.greenquest.app.domain.model.NetworkType

class RefreshMissionsUseCase(private val missionEngine: MissionEngine) {
    operator fun invoke(
        latitude: Double,
        longitude: Double,
        signalDbm: Int,
        networkType: NetworkType,
        towerId: String?
    ) {
        missionEngine.refreshMissions(latitude, longitude, signalDbm, networkType, towerId)
    }
}
