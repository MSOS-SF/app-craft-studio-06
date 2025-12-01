package com.greenquest.app.domain.mission

import com.greenquest.app.domain.model.Mission
import com.greenquest.app.domain.model.NetworkCondition
import com.greenquest.app.domain.model.NetworkType
import com.greenquest.app.domain.model.RequiredAction
import com.greenquest.app.domain.model.Reward
import kotlin.random.Random

class MissionGenerator {
    fun generateForLocation(
        latitude: Double,
        longitude: Double,
        signalDbm: Int,
        networkType: NetworkType,
        towerId: String?
    ): List<Mission> {
        val reward = Reward(
            id = "reward-${Random.nextInt(10_000)}",
            dataMb = if (networkType == NetworkType.FIVE_G) 500 else 200,
            minutes = 10,
            xp = 50
        )

        val cleanupMission = Mission(
            id = "cleanup-${Random.nextInt(10_000)}",
            title = "Cleanup Sweep",
            description = "Collect litter within the highlighted zone.",
            latitude = latitude,
            longitude = longitude,
            radiusMeters = 50.0,
            requiredActions = listOf(RequiredAction.Cleanup(itemsToCollect = 5)),
            reward = reward.copy(id = "reward-${Random.nextInt(10_000)}"),
            networkCondition = NetworkCondition(minDbm = -110, requiredNetworkType = networkType)
        )

        val hotspotScan = Mission(
            id = "scan-${Random.nextInt(10_000)}",
            title = "Hotspot Scan",
            description = "Walk the area to capture network quality data.",
            latitude = latitude,
            longitude = longitude,
            radiusMeters = 80.0,
            requiredActions = listOf(RequiredAction.HotspotScan(durationSeconds = 90)),
            reward = reward.copy(id = "reward-${Random.nextInt(10_000)}"),
            networkCondition = NetworkCondition(towerAffinityIds = towerId?.let { setOf(it) } ?: emptySet())
        )

        return listOf(cleanupMission, hotspotScan)
    }
}
