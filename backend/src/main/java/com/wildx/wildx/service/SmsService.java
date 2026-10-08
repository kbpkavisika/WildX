package com.wildx.wildx.service;

import com.wildx.wildx.dto.SmsIngestRequest;
import com.wildx.wildx.dto.SmsIngestResponse;

public interface SmsService {
    SmsIngestResponse processInbound(SmsIngestRequest request);

    void sendSms(String to, String message);
}
