package com.upeu.pago.service;

import com.upeu.pago.evento.EventoPago;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PagoProducer {

    private final KafkaTemplate<String, EventoPago> kafkaTemplate;

    @Value("${app.kafka.topic.pagos}")
    private String topicPagos;

    public void publicarEventoPago(EventoPago evento) {
        kafkaTemplate.send(topicPagos, String.valueOf(evento.getReservaId()), evento)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error(
                                "service=pago-ms component=producer topic={} eventType={} reservaId={} status=error error=\"{}\"",
                                topicPagos,
                                evento.getTipoEvento(),
                                evento.getReservaId(),
                                ex.getMessage()
                        );
                        return;
                    }

                    log.info(
                            "service=pago-ms component=producer topic={} partition={} offset={} eventType={} reservaId={} status=published",
                            result.getRecordMetadata().topic(),
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset(),
                            evento.getTipoEvento(),
                            evento.getReservaId()
                    );
                });
    }
}
