package com.greenquest.app.domain.usecase

import com.greenquest.app.data.repository.TelemetryRepository
import com.greenquest.app.domain.model.Telemetry

class RecordTelemetryUseCase(private val telemetryRepository: TelemetryRepository) {
    suspend operator fun invoke(telemetry: Telemetry) = telemetryRepository.recordTelemetry(telemetry)
}
