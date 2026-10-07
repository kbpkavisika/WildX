package com.wildx.wildx.service;

import com.wildx.wildx.dto.CollarFixRequest;
import com.wildx.wildx.dto.CollarFixResponse;

public interface CollarFixService {
    CollarFixResponse ingest(CollarFixRequest request);
}
