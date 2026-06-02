package com.upeu.reservas.service;

import com.upeu.reservas.evento.EventoReserva;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReservaProducer {

    private final KafkaTemplate<String, EventoReserva> kafkaTemplate;

    @Value("${app.kafka.topic.reservas}")
    private String topicReservas;

    public void publicarReservaCreada(EventoReserva evento) {
        kafkaTemplate.send(topicReservas, String.valueOf(evento.getReservaId()), evento)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error(
                                "service=reservas-ms component=producer topic={} eventType={} reservaId={} status=error error=\"{}\"",
                                topicReservas,
                                evento.getTipoEvento(),
                                evento.getReservaId(),
                                ex.getMessage()
                        );
                        return;
                    }

                    log.info(
                            "service=reservas-ms component=producer topic={} partition={} offset={} eventType={} reservaId={} status=published",
                            result.getRecordMetadata().topic(),
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset(),
                            evento.getTipoEvento(),
                            evento.getReservaId()
                    );
                });
    }
}
