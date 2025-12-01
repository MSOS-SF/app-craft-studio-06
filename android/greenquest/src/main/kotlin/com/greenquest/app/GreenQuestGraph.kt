package com.greenquest.app

import com.greenquest.app.data.repository.InMemoryMissionRepository
import com.greenquest.app.data.repository.InMemoryRewardRepository
import com.greenquest.app.data.repository.InMemoryTelemetryRepository
import com.greenquest.app.data.repository.MissionRepository
import com.greenquest.app.data.repository.RewardRepository
import com.greenquest.app.data.repository.TelemetryRepository
import com.greenquest.app.device.location.LocationProvider
import com.greenquest.app.device.telecom.TelecomManagerService
import com.greenquest.app.domain.mission.MissionEngine
import com.greenquest.app.domain.mission.MissionGenerator
import com.greenquest.app.domain.usecase.CompleteMissionUseCase
import com.greenquest.app.domain.usecase.RecordTelemetryUseCase
import com.greenquest.app.domain.usecase.RedeemRewardUseCase
import com.greenquest.app.domain.usecase.RefreshMissionsUseCase
import com.greenquest.app.presentation.viewmodel.CameraViewModel

/**
 * Minimal dependency graph to exercise the Kotlin scaffolding without Android DI frameworks.
 */
object GreenQuestGraph {
    val missionRepository: MissionRepository = InMemoryMissionRepository()
    val rewardRepository: RewardRepository = InMemoryRewardRepository()
    val telemetryRepository: TelemetryRepository = InMemoryTelemetryRepository()

    val telecomManagerService = TelecomManagerService()
    val locationProvider = LocationProvider()
    private val missionGenerator = MissionGenerator()
    private val missionEngine = MissionEngine(
        missionRepository = missionRepository,
        rewardRepository = rewardRepository,
        telemetryRepository = telemetryRepository,
        missionGenerator = missionGenerator
    )

    val refreshMissionsUseCase = RefreshMissionsUseCase(missionEngine)
    val completeMissionUseCase = CompleteMissionUseCase(missionEngine)
    val redeemRewardUseCase = RedeemRewardUseCase(rewardRepository)
    val recordTelemetryUseCase = RecordTelemetryUseCase(telemetryRepository)

    val cameraViewModel = CameraViewModel(
        missionRepository = missionRepository,
        refreshMissionsUseCase = refreshMissionsUseCase,
        telecomManagerService = telecomManagerService,
        locationProvider = locationProvider
    )
}
