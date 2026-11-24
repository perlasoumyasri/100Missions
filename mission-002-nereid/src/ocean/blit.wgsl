// Upscales the world (space or ice) from its own lower-resolution target into the scene.
@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  return vec4f(textureSample(source, linearSampler, uv).rgb, 1.0);
}
