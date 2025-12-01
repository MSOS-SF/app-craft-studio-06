package com.greenquest.app.data.repository

import com.greenquest.app.domain.model.Mission
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update

/** Simple in-memory mission store useful for previews, tests, or early wiring. */
class InMemoryMissionRepository : MissionRepository {
    private val missions = MutableStateFlow<List<Mission>>(emptyList())

    override fun observeActiveMissions(): Flow<List<Mission>> = missions

    override suspend fun saveGeneratedMissions(missions: List<Mission>) {
        this.missions.update { current ->
            val activeIds = missions.map { it.id }.toSet()
            val survivors = current.filterNot { it.id in activeIds && it.isCompleted }
            survivors.filterNot { it.id in activeIds } + missions
        }
    }

    override suspend fun markCompleted(missionId: String) {
        missions.update { current ->
            current.map { mission ->
                if (mission.id == missionId) mission.copy(isCompleted = true) else mission
            }
        }
    }

    override suspend fun expireMission(missionId: String) {
        missions.update { current -> current.filterNot { it.id == missionId } }
    }
}
