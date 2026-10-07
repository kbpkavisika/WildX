package com.wildx.wildx.dto;

import com.wildx.wildx.model.Animal;

public record AnimalResponse(Long id, Long parkId, String name, String species) {
    public static AnimalResponse from(Animal animal) {
        return new AnimalResponse(animal.getId(), animal.getPark().getId(), animal.getName(), animal.getSpecies());
    }
}
