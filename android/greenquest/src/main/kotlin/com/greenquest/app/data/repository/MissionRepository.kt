package com.greenquest.app.data.repository

import com.greenquest.app.domain.model.Mission
import kotlinx.coroutines.flow.Flow

interface MissionRepository {
    fun observeActiveMissions(): Flow<List<Mission>>
    suspend fun saveGeneratedMissions(missions: List<Mission>)
    suspend fun markCompleted(missionId: String)
    suspend fun expireMission(missionId: String)
}
