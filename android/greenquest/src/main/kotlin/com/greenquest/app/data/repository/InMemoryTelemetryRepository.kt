package com.greenquest.app.data.repository

import com.greenquest.app.domain.model.Telemetry
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

class InMemoryTelemetryRepository : TelemetryRepository {
    private val recorded = mutableListOf<Telemetry>()
    private val telemetryEvents = MutableSharedFlow<Telemetry>(extraBufferCapacity = 16)

    fun observeRecorded(): Flow<Telemetry> = telemetryEvents.asSharedFlow()

    override suspend fun recordTelemetry(telemetry: Telemetry) {
        recorded.add(telemetry)
        telemetryEvents.emit(telemetry)
    }
}
