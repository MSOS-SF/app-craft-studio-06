package com.greenquest.app.domain.usecase

import com.greenquest.app.domain.mission.MissionEngine

class CompleteMissionUseCase(private val missionEngine: MissionEngine) {
    operator fun invoke(missionId: String) = missionEngine.completeMission(missionId)
}
