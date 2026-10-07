package com.wildx.wildx.type;

public enum Severity {
    LOW, MEDIUM, HIGH, CRITICAL;

    public Severity raised() {
        return this == CRITICAL ? CRITICAL : values()[ordinal() + 1];
    }
}
