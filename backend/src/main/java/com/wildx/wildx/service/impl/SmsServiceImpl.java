package com.wildx.wildx.service.impl;

import com.wildx.wildx.dto.SmsIngestRequest;
import com.wildx.wildx.dto.SmsIngestResponse;
import com.wildx.wildx.exception.NotFoundException;
import com.wildx.wildx.model.CommunityReport;
import com.wildx.wildx.model.Park;
import com.wildx.wildx.repository.ParkRepository;
import com.wildx.wildx.service.CommunityReportService;
import com.wildx.wildx.service.ParkService;
import com.wildx.wildx.service.SmsService;
import com.wildx.wildx.type.CommunityReportStatus;
import com.wildx.wildx.util.SmsParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmsServiceImpl implements SmsService {
    private final CommunityReportService communityReports;
    private final ParkService parks;
    private final ParkRepository parkRepository;

    @Value("${wildx.sms.textbee.api-key:}")
    private String textbeeApiKey;

    @Value("${wildx.sms.textbee.device-id:}")
    private String textbeeDeviceId;

    @Value("${wildx.sms.textbee.base-url:https://api.textbee.dev}")
    private String textbeeBaseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Override
    @Transactional
    public SmsIngestResponse processInbound(SmsIngestRequest request) {
        log.info("process inbound sms started from={}", request.from());
        String text = request.content();
        var parsedOpt = SmsParser.parse(text);

        if (parsedOpt.isEmpty()) {
            String helpReply = SmsParser.HELP_MESSAGE;
            sendSms(request.from(), helpReply);
            log.info("process inbound sms completed unparseable from={}", request.from());
            return new SmsIngestResponse(helpReply, null, false);
        }

        var parsed = parsedOpt.get();
        Park park = resolvePark(request.parkId());
        CommunityReport report = communityReports.createSmsReport(
                park.getId(),
                request.from(),
                parsed.type(),
                parsed.landmarkCode(),
                parsed.count(),
                text
        );

        String reply = buildReply(report, parsed.landmarkCode());
        sendSms(request.from(), reply);
        log.info("process inbound sms completed ref={} status={}", report.getReferenceCode(), report.getStatus());
        return new SmsIngestResponse(reply, report.getReferenceCode(), true);
    }

    @Override
    public void sendSms(String to, String message) {
        log.info("send sms started to={}", to);
        if (textbeeApiKey != null && !textbeeApiKey.isBlank()) {
            sendViaTextBee(to, message);
        } else {
            log.info("Simulated outbound SMS to={} body='{}'", to, message);
        }
        log.info("send sms completed to={}", to);
    }

    private Park resolvePark(Long parkId) {
        if (parkId != null) {
            return parks.require(parkId);
        }
        return parkRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new NotFoundException("No park found"));
    }

    private String buildReply(CommunityReport report, String landmarkCode) {
        if (report.getStatus() == CommunityReportStatus.DUPLICATE) {
            return "WildX: Report " + report.getReferenceCode() + " received (duplicate on " + landmarkCode + "). Linked to active case.";
        }
        if (report.getStatus() == CommunityReportStatus.NEEDS_LOCATION) {
            return "WildX: Report " + report.getReferenceCode() + " received. Landmark " + landmarkCode + " unrecognised - CLO notified.";
        }
        return "WildX: Report " + report.getReferenceCode() + " received. Rangers notified.";
    }

    private void sendViaTextBee(String to, String message) {
        try {
            String escapedMessage = escapeJson(message);
            String escapedTo = escapeJson(to);
            String payload;
            if (textbeeDeviceId != null && !textbeeDeviceId.isBlank()) {
                payload = String.format("{\"recipients\":[\"%s\"],\"message\":\"%s\",\"deviceId\":\"%s\"}",
                        escapedTo, escapedMessage, escapeJson(textbeeDeviceId));
            } else {
                payload = String.format("{\"recipients\":[\"%s\"],\"message\":\"%s\"}", escapedTo, escapedMessage);
            }

            String url = textbeeBaseUrl.replaceAll("/+$", "") + "/api/v1/gateway/send-sms";
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("x-api-key", textbeeApiKey)
                    .timeout(Duration.ofSeconds(5))
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("TextBee SMS dispatched status={} to={}", response.statusCode(), to);
            } else {
                log.warn("TextBee SMS dispatch error status={} body={}", response.statusCode(), response.body());
            }
        } catch (Exception ex) {
            log.warn("Failed to dispatch SMS via TextBee to={} error={}", to, ex.getMessage());
        }
    }

    private String escapeJson(String input) {
        if (input == null) {
            return "";
        }
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
