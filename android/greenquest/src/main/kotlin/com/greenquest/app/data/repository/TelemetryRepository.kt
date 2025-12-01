package com.greenquest.app.data.repository

import com.greenquest.app.domain.model.Telemetry

interface TelemetryRepository {
    suspend fun recordTelemetry(telemetry: Telemetry)
}
