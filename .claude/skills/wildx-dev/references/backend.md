# Backend standards (Spring Boot)

## Structure (clean architecture)
- Packages per architecture §4. Separate by domain and layer; controllers thin, logic in services.
- `service/XService` interface → `service/impl/XServiceImpl`.
- `repository/XRepository` interface: JPA derived methods only (`findByParkIdAndStatus`…).
- Custom queries: `repository/XCustomRepository` interface → `repository/impl/XCustomRepositoryImpl` using **Criteria API**. No raw SQL, no JPQL, no `@Query`.
- Reuse existing services/utils (`GeoUtil`, `SmsParser`, shared services) before writing new ones. Never call another module's repository; call its service.

## Entities
- Lombok (`@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder` as needed). No hand-written getters/setters/constructors. DTOs are `record`s.
- `@Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;` No UUIDs.
- All relations `fetch = FetchType.LAZY` (incl. `@ManyToOne`).
- Every multi-option string is an enum in `type/`, `@Enumerated(EnumType.STRING)`.

## Queries
- No N+1: use `@EntityGraph`, Criteria fetch joins, or batch loads. Never lazy-load inside a loop.
- `@Transactional(readOnly = true)` for reads, `@Transactional` for writes, on service impl methods.

## Controllers
- Prefix `/api/v1/...`.
- Pattern:
```java
@PostMapping(value = "/employee", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN','ROLE_PEOPLE_ADMIN')")
public ResponseEntity<ResponseEntityDto> addNewEmployee(
        @Valid @RequestBody CreateEmployeeRequestDto employeeDetailsDto) {
    ResponseEntityDto response = peopleService.createEmployee(employeeDetailsDto);
    return new ResponseEntity<>(response, HttpStatus.CREATED);
}
```

## Validation (fail fast)
- Every request DTO has Bean Validation annotations; controller uses `@Valid`.
- Business validations at the **top** of the service method, before any work/write.

## Errors
- Throw domain exceptions (`NotFoundException`, `BadRequestException`, …) with a meaningful message; `GlobalExceptionHandler` maps to the correct HTTP status. No try/catch that swallows or returns error bodies manually.

## Constants & config
- No inline magic values. File-local constant → `private static final` in that class; reused or likely reused → `constant/` file for that domain (e.g. `AlertConstants`), truly global → `AppConstants`.
- Secrets (DB password, JWT secret, API keys) only in `.env` (git-ignored), referenced as `${VAR}` in `application.properties`. Keep `.env.example` updated.

## Code quality
- Methods ≤ ~80 lines; extract helpers. Keep cognitive complexity low (early returns, small methods).
- Logging (`@Slf4j`): one `info` at start and one at end of each service method called by a controller (method + key ids). `warn`/`error` on failures. No payload dumps, no logs in loops.

## Tests
- JUnit 5 + Mockito unit tests for every service impl, util and custom repository; ≥80% line coverage on new code.
- Must compile and pass: `./mvnw verify`.
