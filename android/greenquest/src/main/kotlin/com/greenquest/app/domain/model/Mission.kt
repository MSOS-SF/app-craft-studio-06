package com.greenquest.app.domain.model

data class Mission(
    val id: String,
    val title: String,
    val description: String,
    val latitude: Double,
    val longitude: Double,
    val radiusMeters: Double,
    val requiredActions: List<RequiredAction>,
    val reward: Reward,
    val networkCondition: NetworkCondition? = null,
    val timeLimitSeconds: Long? = null,
    val isCompleted: Boolean = false
)

data class Reward(
    val id: String,
    val dataMb: Int? = null,
    val minutes: Int? = null,
    val sms: Int? = null,
    val couponText: String? = null,
    val xp: Int = 0
)

data class Telemetry(
    val telemetryId: String,
    val signalDbm: Int,
    val networkType: NetworkType,
    val cellTowerId: String?,
    val latitude: Double,
    val longitude: Double,
    val timestampMillis: Long
)

enum class NetworkType { LTE, NR, FIVE_G, THREE_G }

data class NetworkCondition(
    val minDbm: Int? = null,
    val maxDbm: Int? = null,
    val requiredNetworkType: NetworkType? = null,
    val allowedOffline: Boolean = true,
    val towerAffinityIds: Set<String> = emptySet()
)

sealed interface RequiredAction {
    data class Cleanup(val itemsToCollect: Int) : RequiredAction
    data class ReportDump(val photoNeeded: Boolean = true) : RequiredAction
    data class PollutionCapture(val sampleType: String) : RequiredAction
    data class HotspotScan(val durationSeconds: Long) : RequiredAction
}

sealed interface MissionEvent {
    data class Appeared(val mission: Mission) : MissionEvent
    data class Completed(val mission: Mission, val reward: Reward) : MissionEvent
    data class Expired(val missionId: String) : MissionEvent
}
