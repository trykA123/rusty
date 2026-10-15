# Vendored crates

`gpui-pre-windows` 0.3.9 from crates.io (Apache-2.0, `LICENSE-APACHE`), patched in through `[patch.crates-io]`.

The only change is in `src/directx_devices.rs`: `get_adapter` enumerates adapters with `EnumAdapterByGpuPreference` and prefers the low-power GPU. Set `FERRITE_GPU=default` for GPUI's original order or `FERRITE_GPU=high-performance` for the discrete GPU.
