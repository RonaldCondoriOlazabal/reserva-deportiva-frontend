package com.upeu.pago.service;

import com.upeu.pago.entity.Pago;
import com.upeu.pago.evento.EventoPago;
import com.upeu.pago.evento.EventoReserva;
import com.upeu.pago.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReservaConsumer {

    private static final String TIPO_RESERVA_CREADA = "reserva.creada";
    private static final String TIPO_PAGO_APROBADO = "pago.aprobado";
    private static final String TIPO_PAGO_RECHAZADO = "pago.rechazado";
    private static final String ESTADO_APROBADO = "APROBADO";
    private static final String ESTADO_RECHAZADO = "RECHAZADO";
    private static final BigDecimal MONTO_DEFAULT = new BigDecimal("50.00");

    private final PagoRepository pagoRepository;
    private final PagoProducer pagoProducer;

    @Value("${spring.application.name}")
    private String applicationName;

    @Value("${app.kafka.topic.reservas}")
    private String topicReservas;

    @Value("${app.kafka.group-id.pagos}")
    private String groupIdPagos;

    @KafkaListener(
            topics = "${app.kafka.topic.reservas}",
            groupId = "${app.kafka.group-id.pagos}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumirEventoReserva(EventoReserva evento) {
        if (evento == null || !TIPO_RESERVA_CREADA.equals(evento.getTipoEvento())) {
            log.warn("service=pago-ms component=consumer eventType={} status=ignored",
                    evento != null ? evento.getTipoEvento() : null);
            return;
        }

        long processedAt = Instant.now().toEpochMilli();
        Long latencyMs = evento.getTimestamp() != null ? processedAt - evento.getTimestamp() : null;

        log.info(
                "service=pago-ms component=consumer topic={} groupId={} eventType={} reservaId={} latencyMs={} status=consumed",
                topicReservas,
                groupIdPagos,
                evento.getTipoEvento(),
                evento.getReservaId(),
                latencyMs
        );

        BigDecimal monto = evento.getMonto() != null ? evento.getMonto() : MONTO_DEFAULT;
        boolean aprobado = Math.random() > 0.3;
        String estadoPago = aprobado ? ESTADO_APROBADO : ESTADO_RECHAZADO;
        String tipoEventoPago = aprobado ? TIPO_PAGO_APROBADO : TIPO_PAGO_RECHAZADO;

        Pago pago = Pago.builder()
                .idReserva(evento.getReservaId())
                .monto(monto)
                .metodoPago("KAFKA")
                .estado(estadoPago)
                .fechaPago(LocalDate.now().toString())
                .referencia("PAY-" + evento.getReservaId())
                .build();

        pagoRepository.save(pago);

        EventoPago eventoPago = EventoPago.builder()
                .tipoEvento(tipoEventoPago)
                .reservaId(evento.getReservaId())
                .monto(monto)
                .estado(estadoPago)
                .origen(applicationName)
                .timestamp(Instant.now().toEpochMilli())
                .build();

        pagoProducer.publicarEventoPago(eventoPago);

        log.info(
                "service=pago-ms component=processor reservaId={} estadoPago={} status=processed",
                evento.getReservaId(),
                estadoPago
        );
    }
}
