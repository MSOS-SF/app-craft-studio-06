package com.greenquest.app.domain.mission

import com.greenquest.app.data.repository.MissionRepository
import com.greenquest.app.domain.model.Mission
import com.greenquest.app.domain.model.MissionEvent
import com.greenquest.app.domain.model.NetworkType
import com.greenquest.app.domain.telecom.SignalAnalyzer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MissionEngine(
    private val missionRepository: MissionRepository,
    private val missionGenerator: MissionGenerator,
    private val externalScope: CoroutineScope = CoroutineScope(Dispatchers.Default)
) {
    private val _events = MutableSharedFlow<MissionEvent>(extraBufferCapacity = 8)
    val events: SharedFlow<MissionEvent> = _events

    fun refreshMissions(
        latitude: Double,
        longitude: Double,
        signalDbm: Int,
        networkType: NetworkType,
        towerId: String?
    ) {
        externalScope.launch {
            val missions = missionGenerator.generateForLocation(latitude, longitude, signalDbm, networkType, towerId)
            val eligible = missions.filter { mission ->
                SignalAnalyzer.matchesCondition(signalDbm, networkType, mission.networkCondition)
            }
            missionRepository.saveGeneratedMissions(eligible)
            eligible.forEach { _events.tryEmit(MissionEvent.Appeared(it)) }
        }
    }

    fun completeMission(missionId: String) {
        externalScope.launch {
            val current = missionRepository.observeActiveMissions().first().find { it.id == missionId } ?: return@launch
            missionRepository.markCompleted(missionId)
            _events.emit(MissionEvent.Completed(current, current.reward))
        }
    }

    fun expireMission(missionId: String) {
        externalScope.launch {
            missionRepository.expireMission(missionId)
            _events.emit(MissionEvent.Expired(missionId))
        }
    }
}
