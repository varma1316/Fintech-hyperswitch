FROM public.ecr.aws/docker/library/rust:trixie as builder

ARG EXTRA_FEATURES=""
ARG VERSION_FEATURE_SET="v1"
ARG CARGO_BUILD_PROFILE=release

RUN apt-get update \
    && apt-get install -y libpq-dev libssl-dev pkg-config protobuf-compiler

WORKDIR /router
ENV CARGO_INCREMENTAL=0 CARGO_NET_RETRY=10 RUSTUP_MAX_RETRIES=10 RUST_BACKTRACE="short"

COPY . .

RUN cargo build \
    --profile ${CARGO_BUILD_PROFILE} \
    --no-default-features \
    --features release \
    --features ${VERSION_FEATURE_SET} \
    ${EXTRA_FEATURES}

RUN mkdir -p /router/out \
    && cp "/router/target/$([ \"${CARGO_BUILD_PROFILE}\" = \"dev\" ] && echo debug || echo \"${CARGO_BUILD_PROFILE}\")/router" "/router/out/router"

FROM public.ecr.aws/docker/library/debian:trixie

ARG CONFIG_DIR=/local/config
ARG BIN_DIR=/local/bin

COPY --from=builder /router/config/payment_required_fields_v2.toml ${CONFIG_DIR}/payment_required_fields_v2.toml

ARG RUN_ENV=sandbox

RUN apt-get update \
    && apt-get install -y ca-certificates tzdata libpq-dev curl procps

EXPOSE 8080

ENV TZ=Etc/UTC \
    RUN_ENV=${RUN_ENV} \
    CONFIG_DIR=${CONFIG_DIR} \
    BINARY=router \
    RUST_MIN_STACK=6291456

RUN mkdir -p ${BIN_DIR}
COPY --from=builder /router/out/router ${BIN_DIR}/router

RUN useradd --user-group --system --no-create-home --no-log-init app
USER app:app

WORKDIR ${BIN_DIR}

CMD ["./router"]
